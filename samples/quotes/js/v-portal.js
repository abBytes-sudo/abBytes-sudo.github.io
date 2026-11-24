/* Studio OS: client portal (quote review, line comments, change requests, e-sign) and change-order approval. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {}; MR.live = MR.live || {};

  var TERMS = [
    'Prices are valid for 30 days from the date of this version. Materials are specified by brand and grade in the attached finish schedule.',
    'Quantities are measured on site and finalised at the design sign-off; billing follows actual measured quantities within ±5%.',
    'Work starts within 10 working days of the booking advance. Carpentry is factory-made and installed on site.',
    'Anything outside this scope is quoted as a change order and needs your approval before work starts.',
    'GST is charged at 18% as applicable to works contracts. Furniture lines carry HSN 9403.',
    'Warranty: 10 years on BWP/BWR ply carcasses, 1 year on hardware and workmanship, manufacturer warranty on fittings.',
    'Society permissions, lift bookings and NOCs are arranged by the client; we coordinate the schedule.'
  ];
  MR.TERMS = TERMS;

  function companyBlock() {
    var co = MR.S.company;
    return '<div class="co"><span class="mark" aria-hidden="true">M<i>&amp;</i>R</span><div><b>' + esc(co.name) + '</b><span>' + esc(co.addr[0]) + '<br>' + esc(co.addr[1]) + '</span><span>GSTIN ' + esc(co.gstin) + ' · ' + esc(co.email) + '</span></div></div>';
  }
  MR.companyBlock = companyBlock;

  function portalVer(q, preview) { return preview ? MR.ver(q) : (q.sig ? q.versions[q.sig.v - 1] : MR.sentVer(q)); }

  MR.views.q = function (r) {
    MR.loadHand();
    var token = r.p[1], q = MR.S.quotes.filter(function (x) { return x.token === token; })[0], preview = r.qs.preview === '1';
    if (!q) return { html: notFoundPortal('This quote link is not valid. It may have been replaced by a newer version; ask your project manager for the latest link.'), title: 'Quote not found', crumbs: [] };
    var v = portalVer(q, preview), cl = MR.client(q.clientId);
    if (!v) return { html: notFoundPortal('This quote is still being prepared. You will get a link as soon as it is ready.'), title: 'Quote in preparation', crumbs: [] };
    if (!preview && q.status === 'sent' && v === MR.ver(q)) {
      q.status = 'viewed'; v.viewedAt = new Date().toISOString();
      MR.audit('quote', q.no, 'viewed', cl.contact + ' opened v' + v.n, 'client');
      MR.notify(['owner', 'pm'], cl.contact.split(' (')[0] + ' just opened ' + q.no + ' v' + v.n, '#/quote/' + q.id, 'info');
      MR.save();
    }
    var c = MR.calc(q, v), pm = MR.userById(q.owner), signed = q.sig && q.sig.v === v.n, canAct = !preview || true;
    var open = ['sent', 'viewed', 'changes'].indexOf(q.status) > -1 && v === MR.ver(q);
    var h = '';
    if (preview) h += '<div class="preview-bar noprint">You are previewing ' + esc(q.no) + ' v' + v.n + ' as ' + esc(cl.contact.split(' (')[0]) + ' would see it. Comments and signatures you make here are recorded on the quote. <a href="#/quote/' + q.id + '">Back to Studio OS</a></div>';
    h += '<div class="portal-top"><div class="in"><span class="mark" aria-hidden="true">M<i>&amp;</i>R</span><div class="who"><b>Marlow &amp; Reed</b><span>' + esc(q.no) + ' v' + v.n + ' · prepared by ' + esc(pm.name) + '</span></div>' + MR.btn('print', 'Download PDF', { icon: 'download', cls: 'sm' }) + '</div></div>';
    h += '<div class="page narrow" style="padding-top:28px">';
    if (signed) h += '<div class="banner ok noprint">' + ic('sign') + '<div class="bt"><b>Signed by ' + esc(q.sig.name) + ' on ' + u.fdate(q.sig.at.slice(0, 10)) + '</b>Thank you. ' + esc(pm.name.split(' ')[0]) + ' will call within one working day to fix the site kick-off and share the project plan.</div></div>';
    else if (q.status === 'changes' && v === MR.ver(q)) h += '<div class="banner warn noprint">' + ic('edit') + '<div class="bt"><b>Changes requested</b>' + esc(pm.name.split(' ')[0]) + ' is preparing v' + (v.n + 1) + '. You will get the same link updated.</div></div>';
    else if (v !== MR.ver(q) && !preview && !q.sig) h += '<div class="banner info noprint">' + ic('clock') + '<div class="bt"><b>A new version is being prepared</b>This is v' + v.n + '. ' + esc(pm.name.split(' ')[0]) + ' is working on v' + MR.ver(q).n + ' and will share it shortly.</div></div>';
    else if (q.status === 'lost') h += '<div class="banner noprint">' + ic('x') + '<div class="bt"><b>This quote is closed</b>Get in touch if you would like us to revisit it.</div></div>';
    else if (open) h += '<p class="callout noprint" style="margin-bottom:14px">' + ic('comment') + 'Tap <b>Comment</b> on any line to ask a question. Your project manager replies here.</p>';
    h += '<article class="doc" aria-label="Quotation">';
    h += '<header class="doc-hd">' + companyBlock() + '<div class="dt"><h1>Quotation</h1><span>' + esc(q.no) + ' · version ' + v.n + '</span><span>Dated ' + u.fdate((v.sentAt || v.created).slice(0, 10)) + '</span><span>Valid till ' + u.fdate(u.addD((v.sentAt || v.created).slice(0, 10), q.validDays)) + '</span></div></header>';
    h += '<div class="doc-parties"><div><h4>Prepared for</h4><b>' + esc(cl.name) + '</b><br>' + esc(cl.contact) + (cl.gstin ? '<br>GSTIN ' + esc(cl.gstin) : '') + '</div><div><h4>Site</h4>' + esc(q.site) + '<br>' + esc(q.city) + ', ' + esc(MR.STATE[q.state].name) + '<br><span class="muted">Place of supply: ' + esc(MR.STATE[q.state].name) + ' (' + MR.STATE[q.state].code + ')</span></div><div><h4>Your team</h4>' + esc(pm.name) + ', project manager<br>Tanvi Joshi, lead designer<br><span class="muted">' + esc(MR.S.company.email) + '</span></div></div>';
    h += '<table><thead><tr><th style="width:28px">#</th><th>Item</th><th class="num">Qty</th><th class="hide-sm">Unit</th><th class="num hide-sm">Rate</th><th class="num">Amount</th></tr></thead><tbody>';
    var n = 0;
    v.sections.forEach(function (s) {
      h += '<tr class="dsec"><td></td><td colspan="4">' + esc(s.title) + '</td><td class="num">' + u.inr(MR.secTotal(s)) + '</td></tr>';
      s.items.forEach(function (it) {
        n++;
        var cms = q.comments.filter(function (cc) { return cc.key === it.key && cc.v === v.n; });
        var openC = MR._pcOpen === it.key;
        h += '<tr class="pline"><td class="faint">' + n + '</td><td>' + esc(it.name) + (open || cms.length ? '<button type="button" class="cbtn noprint' + (cms.length ? ' has' : '') + '" data-act="pc-toggle" data-id="' + it.key + '" aria-expanded="' + openC + '">' + ic('comment') + (cms.length ? cms.length : 'Comment') + '</button>' : '') + ((it.wst || it.disc) ? '<br><span class="faint" style="font-size:11px">' + (it.wst ? 'incl. ' + it.wst + '% wastage' : '') + (it.disc ? (it.wst ? ' · ' : '') + it.disc + '% off' : '') + '</span>' : '') + '</td><td class="num">' + u.fnum(MR.lineQty(it), 1) + '</td><td class="hide-sm">' + esc(it.unit) + '</td><td class="num hide-sm">' + u.fnum(it.rate) + '</td><td class="num">' + u.inr(MR.lineAmt(it)) + '</td></tr>';
        if (openC) {
          h += '<tr class="pcomment"><td></td><td colspan="5"><div class="thread" style="margin-bottom:10px">' + cms.map(function (m) { return '<div class="msg ' + (m.by === 'client' ? 'client' : '') + '">' + (m.by === 'client' ? '<span class="av" style="--h:200">' + esc(u.initials(m.who)) + '</span>' : MR.avatar(m.by)) + '<div class="mb"><div class="mh"><b>' + esc(m.by === 'client' ? 'You' : m.who) + '</b><span>' + u.rel(m.at) + '</span></div>' + esc(m.text) + '</div></div>'; }).join('') + '</div>' + (open ? '<label class="vh" for="pcT">Your comment</label><textarea class="ta" id="pcT" rows="2" placeholder="Ask about this line: finish, size, brand, alternatives…"></textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' + MR.btn('pc-toggle', 'Cancel', { cls: 'sm ghost', id: it.key }) + MR.btn('pc-send', 'Post comment', { cls: 'sm pri', id: it.key }) + '</div>' : '') + '</td></tr>';
        }
      });
    });
    h += '</tbody></table>';
    h += '<div class="doc-tot"><dl><div class="r"><dt>Subtotal</dt><dd>' + u.inr(c.sub) + '</dd></div>' + (c.disc ? '<div class="r"><dt>Discount (' + v.discPct + '%)</dt><dd>− ' + u.inr(c.disc) + '</dd></div>' : '') + '<div class="r"><dt>Taxable value</dt><dd>' + u.inr(c.taxable) + '</dd></div>' + (c.intra ? '<div class="r"><dt>CGST 9%</dt><dd>' + u.inr(c.cgst) + '</dd></div><div class="r"><dt>SGST 9%</dt><dd>' + u.inr(c.sgst) + '</dd></div>' : '<div class="r"><dt>IGST 18%</dt><dd>' + u.inr(c.igst) + '</dd></div>') + '<div class="r g"><dt>Total payable</dt><dd>' + u.inr(c.total) + '</dd></div></dl></div>';
    h += '<p class="doc-words">' + esc(u.words(Math.round(c.total))) + '</p>';
    var sch = MR.SCHEDULES[q.terms || '40/30/25/5'];
    h += '<h4 style="font:600 11px/1 var(--f);text-transform:uppercase;letter-spacing:.06em;color:var(--ink-4);margin-top:28px">Payment schedule · ' + esc(q.terms) + '</h4><div class="sched">' + sch.map(function (s) { return '<div><b>' + s[1] + '%</b><span>' + esc(s[0]) + '</span><br><span>' + u.inr(c.total * s[1] / 100) + '</span></div>'; }).join('') + '</div>';
    h += '<div class="doc-terms"><div><h4>Terms</h4><ol>' + TERMS.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol></div><div><h4>Bank details</h4><div class="bankbox">' + esc(MR.S.company.name) + '<br>' + esc(MR.S.company.bank.name) + '<br>A/c ' + esc(MR.S.company.bank.ac) + ' · IFSC ' + esc(MR.S.company.bank.ifsc) + '<br><span class="muted">Portfolio project: no payment is taken.</span></div></div></div>';
    h += '<div class="doc-sign"><div class="sigbox"><div class="sg"><span class="typed" style="font-size:26px;color:var(--ink-2)">Ira Mehta</span></div><small>For Marlow &amp; Reed Interiors LLP · authorised signatory</small></div><div class="sigbox">' + (signed ? '<div class="sg">' + (q.sig.data ? '<img src="' + q.sig.data + '" alt="Signature of ' + esc(q.sig.name) + '">' : '<span class="typed">' + esc(q.sig.name) + '</span>') + '</div><small>Accepted by ' + esc(q.sig.name) + ' · ' + u.fdate(q.sig.at.slice(0, 10)) + ' ' + u.ftime(q.sig.at) + ' · e-signed (' + esc(q.sig.mode) + ')</small>' : '<div class="sg"></div><small>Client acceptance</small>') + '</div></div>';
    if (signed) h += '<div style="text-align:right;margin-top:14px"><span class="stamp" id="stamp">' + ic('check') + 'Accepted</span></div>';
    h += '</article></div>';
    if (open) h += '<div class="signdock noprint"><div class="in"><div class="tt"><b>' + u.inr(c.total) + '</b><span>incl. GST · v' + v.n + ' · ' + esc(q.terms) + ' schedule</span></div>' + MR.btn('pc-changes', 'Request changes', {}) + MR.btn('pc-sign', 'Accept and sign', { cls: 'pri', icon: 'sign' }) + '</div></div>';
    return { html: h, title: q.no + ' · ' + cl.name, crumbs: [], after: function (root, ch) {
      if (r.qs.print === '1' && ch) setTimeout(function () { window.print(); }, 400);
      var t = document.getElementById('pcT'); if (t) t.focus();
      var st = document.getElementById('stamp'); if (st && MR._justSigned && !MR.still()) { MR._justSigned = false; window.gsap.from(st, { scale: 2.2, opacity: 0, rotate: -18, duration: .7, ease: 'expo.out' }); }
    } };
  };
  function notFoundPortal(msg) { return '<div class="portal-top"><div class="in"><span class="mark" aria-hidden="true">M<i>&amp;</i>R</span><div class="who"><b>Marlow &amp; Reed</b></div></div></div><div class="page narrow">' + MR.empty('link', 'Link not available', esc(msg)) + '</div>'; }
  function pq() { var t = MR.route().p[1]; return MR.S.quotes.filter(function (x) { return x.token === t; })[0]; }

  MR.act['pc-toggle'] = function (el) { MR._pcOpen = MR._pcOpen === el.dataset.id ? null : el.dataset.id; MR.render(); };
  MR.act['pc-send'] = function (el) {
    var t = document.getElementById('pcT'), txt = t.value.trim();
    if (txt.length < 3) { t.setAttribute('aria-invalid', 'true'); t.placeholder = 'Write a question or note first'; t.focus(); return; }
    var q = pq(), cl = MR.client(q.clientId), v = MR.ver(q), line = MR.findLine(q, el.dataset.id);
    q.comments.push({ id: u.uid('cm'), v: v.n, key: el.dataset.id, by: 'client', who: cl.contact.split(' (')[0], at: new Date().toISOString(), text: txt });
    MR.audit('quote', q.no, 'commented', (line.code || 'line') + ': ' + txt.slice(0, 80), 'client');
    MR.notify(['owner', 'pm'], cl.contact.split(' (')[0] + ' commented on ' + (line.code || 'a line') + ' in ' + q.no + ': “' + txt.slice(0, 60) + '”', '#/quote/' + q.id, 'comment');
    MR.save(); MR.render(); MR.toast('Comment sent to ' + MR.userById(q.owner).name.split(' ')[0]);
  };
  MR.act['pc-changes'] = function () {
    var q = pq();
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Request changes</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><p class="muted">Tell ' + esc(MR.userById(q.owner).name.split(' ')[0]) + ' what you would like changed. You will get a new version on this same link, with the changes highlighted.</p><label class="field"><span>Your changes</span><textarea class="ta" id="rcT" rows="5" placeholder="e.g. Remove the dining set, we have one. Can the TV wall be walnut? Budget around ₹13 L." autofocus></textarea><span class="err" id="rcErr"></span></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('pc-changes-ok', 'Send request', { cls: 'pri' }) + '</div>');
  };
  MR.act['pc-changes-ok'] = function () {
    var t = document.getElementById('rcT').value.trim();
    if (t.length < 10) { document.getElementById('rcErr').textContent = 'A sentence or two helps us get the next version right.'; document.getElementById('rcT').setAttribute('aria-invalid', 'true'); return; }
    var q = pq(), cl = MR.client(q.clientId), v = MR.ver(q);
    q.comments.push({ id: u.uid('cm'), v: v.n, key: null, by: 'client', who: cl.contact.split(' (')[0], at: new Date().toISOString(), text: t, kind: 'changes' });
    q.status = 'changes'; MR.audit('quote', q.no, 'changes requested', t.slice(0, 120), 'client');
    MR.notify(['owner', 'pm'], cl.contact.split(' (')[0] + ' asked for changes on ' + q.no + ' v' + v.n, '#/quote/' + q.id, 'warn');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast('Request sent. You will get v' + (v.n + 1) + ' on this link.');
  };

  /* ---------------- e-sign ---------------- */
  var SIG = { mode: 'type', drawn: false };
  MR.act['pc-sign'] = function () { openSign(pq(), null); };
  function openSign(q, co) {
    var cl = MR.client(q ? q.clientId : MR.project(co.projectId).clientId), name = cl.contact.split(' (')[0];
    var what = co ? co.no + ': ' + co.title : 'the scope in ' + q.no + ' v' + MR.ver(q).n + ', the ' + q.terms + ' payment schedule and the terms above';
    SIG = { mode: 'type', drawn: false, co: co };
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">' + (co ? 'Approve ' + esc(co.no) : 'Accept and sign') + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Full name</span><input class="inp" id="sgName" value="' + esc(name) + '" autocomplete="name"></label><div class="seg" role="group" aria-label="Signature method"><button type="button" data-act="sg-mode" data-v="type" aria-pressed="true">Type</button><button type="button" data-act="sg-mode" data-v="draw" aria-pressed="false">Draw</button></div><div id="sgType" class="typedsig" aria-live="polite">' + esc(name) + '</div><div id="sgDraw" class="sigpad" hidden><canvas id="sgCanvas" aria-label="Draw your signature with a finger or mouse" role="img"></canvas><span class="base"></span><span class="hint">Sign above the line</span><button type="button" class="btn ghost sm" style="position:absolute;right:8px;top:8px" data-act="sg-clear">Clear</button></div><label class="chk"><input type="checkbox" id="sgOk"><span>I accept ' + esc(what) + '. I understand this electronic signature is binding.</span></label><span class="err" id="sgErr"></span><p class="faint" style="font-size:11px">Recorded with the date, time and this device.</p></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('sg-ok', co ? 'Approve change order' : 'Sign and accept', { cls: 'pri', icon: 'sign' }) + '</div>');
    var nm = document.getElementById('sgName'); nm.addEventListener('input', function () { document.getElementById('sgType').textContent = nm.value || ' '; });
    setupPad();
  }
  MR.openSign = openSign;
  function setupPad() {
    var c = document.getElementById('sgCanvas'), ctx, drawing = false, last = null;
    function size() { var r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1; if (!r.width) return; c.width = r.width * d; c.height = r.height * d; ctx = c.getContext('2d'); ctx.scale(d, d); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1C2A55'; }
    c._size = size;
    function pt(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    c.addEventListener('pointerdown', function (e) { if (!ctx) size(); drawing = true; last = pt(e); c.setPointerCapture(e.pointerId); e.preventDefault(); });
    c.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); var mx = (last.x + p.x) / 2, my = (last.y + p.y) / 2; ctx.quadraticCurveTo(last.x, last.y, mx, my); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; SIG.drawn = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { c.addEventListener(k, function () { drawing = false; }); });
  }
  MR.act['sg-mode'] = function (el) {
    SIG.mode = el.dataset.v; document.querySelectorAll('[data-act=sg-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); });
    document.getElementById('sgType').hidden = SIG.mode !== 'type'; document.getElementById('sgDraw').hidden = SIG.mode !== 'draw';
    if (SIG.mode === 'draw') { var c = document.getElementById('sgCanvas'); c._size(); }
  };
  MR.act['sg-clear'] = function () { var c = document.getElementById('sgCanvas'); c._size(); SIG.drawn = false; };
  MR.act['sg-ok'] = function () {
    var name = document.getElementById('sgName').value.trim(), err = document.getElementById('sgErr');
    if (name.length < 3) { err.textContent = 'Type your full name as it should appear on the agreement.'; document.getElementById('sgName').focus(); return; }
    if (SIG.mode === 'draw' && !SIG.drawn) { err.textContent = 'Draw your signature in the box, or switch to Type.'; return; }
    if (!document.getElementById('sgOk').checked) { err.textContent = 'Tick the box to confirm you accept.'; document.getElementById('sgOk').focus(); return; }
    function finish(data) {
      var at = new Date().toISOString();
      if (SIG.co) { approveCO(SIG.co, name, data, at); return; }
      var q = pq(), v = MR.ver(q), cl = MR.client(q.clientId);
      q.sig = { v: v.n, name: name, mode: SIG.mode === 'draw' ? 'drawn' : 'typed', data: data, at: at, ip: 'client device', ua: navigator.userAgent.slice(0, 60) };
      v.signedAt = at; q.status = 'signed';
      MR.audit('quote', q.no, 'signed', 'e-signed v' + v.n + ' by ' + name + ' (' + q.sig.mode + ')', 'client');
      MR.notify(['owner', 'pm', 'accounts'], name + ' signed ' + q.no + ' v' + v.n + ' · ' + u.lakh(MR.calc(q).taxable) + ' + GST. Convert it to a project.', '#/quote/' + q.id, 'ok');
      MR.save(); MR.closeDlg(); MR._justSigned = true; MR.render(); window.scrollTo({ top: document.body.scrollHeight, behavior: MR.still() ? 'auto' : 'smooth' });
      MR.toast('Signed. A copy is on this page any time.');
    }
    if (SIG.mode === 'draw') { finish(trimCanvas(document.getElementById('sgCanvas'))); return; }
    var go = function () {
      var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 560; c.height = 120;
      x.font = '600 64px Caveat, cursive'; x.fillStyle = '#1C2A55'; x.textBaseline = 'middle';
      var w = Math.min(540, x.measureText(name).width); x.fillText(name, (560 - w) / 2, 64, 540);
      finish(c.toDataURL('image/png'));
    };
    if (document.fonts && document.fonts.load) document.fonts.load('600 64px Caveat').then(go, go); else go();
  };
  function trimCanvas(c) {
    var x = c.getContext('2d'), w = c.width, h = c.height, d = x.getImageData(0, 0, w, h).data, minX = w, minY = h, maxX = 0, maxY = 0;
    for (var y = 0; y < h; y += 2) for (var xx = 0; xx < w; xx += 2) { if (d[(y * w + xx) * 4 + 3] > 0) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
    if (maxX <= minX) return c.toDataURL('image/png');
    var pad = 10, o = document.createElement('canvas'); o.width = maxX - minX + pad * 2; o.height = maxY - minY + pad * 2;
    o.getContext('2d').drawImage(c, minX - pad, minY - pad, o.width, o.height, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  }

  /* ---------------- change order approval portal ---------------- */
  function findCO(token) { var out = null; MR.S.projects.forEach(function (p) { (p.cos || []).forEach(function (c) { if (c.token === token) out = { p: p, co: c }; }); }); return out; }
  MR.views.c = function (r) {
    MR.loadHand();
    var f = findCO(r.p[1]), preview = r.qs.preview === '1';
    if (!f) return { html: notFoundPortal('This change-order link is not valid.'), title: 'Change order', crumbs: [] };
    var p = f.p, co = f.co, cl = MR.client(p.clientId), pm = MR.userById(p.pm), intra = p.state === 'HR', gst = co.amount * 0.18;
    var before = MR.projValue(p) - (co.status === 'approved' ? co.amount : 0);
    var h = (preview ? '<div class="preview-bar noprint">Previewing ' + esc(co.no) + ' as the client. <a href="#/project/' + p.id + '?tab=cos">Back to Studio OS</a></div>' : '') + '<div class="portal-top"><div class="in"><span class="mark" aria-hidden="true">M<i>&amp;</i>R</span><div class="who"><b>Marlow &amp; Reed</b><span>' + esc(p.code) + ' · ' + esc(co.no) + '</span></div>' + MR.btn('print', 'Download PDF', { icon: 'download', cls: 'sm' }) + '</div></div><div class="page narrow" style="padding-top:28px">';
    if (co.status === 'approved') h += '<div class="banner ok noprint">' + ic('check') + '<div class="bt"><b>Approved by ' + esc(co.signedBy) + ' on ' + u.fdate(co.decidedAt.slice(0, 10)) + '</b>Work on this change is scheduled. It is billed 100% on approval.</div></div>';
    if (co.status === 'rejected') h += '<div class="banner noprint">' + ic('x') + '<div class="bt"><b>Declined</b>' + esc(co.clientNote || '') + '</div></div>';
    h += '<article class="doc"><header class="doc-hd">' + companyBlock() + '<div class="dt"><h1>Change order</h1><span>' + esc(co.no) + ' · ' + esc(p.code) + '</span><span>Raised ' + u.fdate(co.created.slice(0, 10)) + '</span></div></header>';
    h += '<div class="doc-parties"><div><h4>Project</h4><b>' + esc(p.name) + '</b><br>' + esc(p.site) + '</div><div><h4>Client</h4><b>' + esc(cl.name) + '</b><br>' + esc(cl.contact) + '</div><div><h4>Why this change</h4>' + esc(co.reason) + '</div></div>';
    h += '<h2 style="font:500 22px/1.2 var(--serif);margin:20px 0 6px">' + esc(co.title) + '</h2>';
    h += '<table><thead><tr><th>Item</th><th class="num">Qty</th><th class="hide-sm">Unit</th><th class="num hide-sm">Rate</th><th class="num">Amount</th></tr></thead><tbody>' + co.items.map(function (it) { return '<tr><td>' + esc(it.name) + '</td><td class="num">' + u.fnum(MR.lineQty(it), 1) + '</td><td class="hide-sm">' + esc(it.unit) + '</td><td class="num hide-sm">' + u.fnum(it.rate) + '</td><td class="num">' + u.inr(MR.lineAmt(it)) + '</td></tr>'; }).join('') + '</tbody></table>';
    h += '<div class="doc-tot"><dl><div class="r"><dt>Change value</dt><dd>' + u.inr(co.amount) + '</dd></div>' + (intra ? '<div class="r"><dt>CGST 9%</dt><dd>' + u.inr(gst / 2) + '</dd></div><div class="r"><dt>SGST 9%</dt><dd>' + u.inr(gst / 2) + '</dd></div>' : '<div class="r"><dt>IGST 18%</dt><dd>' + u.inr(gst) + '</dd></div>') + '<div class="r g"><dt>Total</dt><dd>' + u.inr(co.amount + gst) + '</dd></div></dl></div>';
    h += '<div class="sched" style="grid-template-columns:repeat(3,1fr)"><div><span>Contract value now</span><b>' + u.lakh(before) + '</b></div><div><span>This change</span><b>+' + u.lakh(co.amount) + '</b></div><div><span>Revised contract value</span><b>' + u.lakh(before + co.amount) + '</b></div></div>';
    h += '<p class="muted" style="margin-top:16px;font-size:12px">Billing: 100% on approval, invoiced separately. Schedule impact: absorbed in the current carpentry window, no change to handover date.</p>';
    if (co.status === 'approved') h += '<div class="doc-sign"><div></div><div class="sigbox"><div class="sg">' + (co.sig ? '<img src="' + co.sig + '" alt="Signature of ' + esc(co.signedBy) + '">' : '<span class="typed">' + esc(co.signedBy) + '</span>') + '</div><small>Approved by ' + esc(co.signedBy) + ' · ' + u.fdate(co.decidedAt.slice(0, 10)) + '</small></div></div>';
    h += '</article></div>';
    if (co.status === 'sent') h += '<div class="signdock noprint"><div class="in"><div class="tt"><b>+' + u.inr(co.amount + gst) + '</b><span>incl. GST · ' + esc(pm.name) + ' is your contact</span></div>' + MR.btn('co-decline', 'Decline', { id: co.id }) + MR.btn('co-sign', 'Approve change', { cls: 'pri', icon: 'sign', id: co.id }) + '</div></div>';
    return { html: h, title: co.no + ' · ' + p.name, crumbs: [] };
  };
  function coById(id) { var out = null; MR.S.projects.forEach(function (p) { (p.cos || []).forEach(function (c) { if (c.id === id) out = c; }); }); return out; }
  MR.act['co-sign'] = function (el) { openSign(null, coById(el.dataset.id)); };
  function approveCO(co, name, data, at) {
    var p = MR.project(co.projectId);
    co.status = 'approved'; co.decidedAt = at; co.signedBy = name; co.sig = data;
    var ps = { id: u.uid('ps'), label: co.no + ': ' + co.title + ' (100% on approval)', pct: null, msId: null, amount: co.amount, invoiceId: null, coId: co.id };
    p.schedule.push(ps);
    MR.audit('change order', p.code + ' ' + co.no, 'approved', 'Approved by ' + name + ' · +' + u.lakh(co.amount), 'client');
    MR.notify(['owner', 'pm', 'accounts'], name + ' approved ' + co.no + ' on ' + p.name.split(',')[0] + ' · +' + u.lakh(co.amount) + '. Ready to bill.', '#/project/' + p.id + '?tab=billing', 'ok');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast('Change approved. Contract value is now ' + u.lakh(MR.projValue(p)));
  }
  MR.act['co-decline'] = function (el) {
    MR.openDlg('<div class="dlg-hd"><h2 id="dlgT">Decline this change?</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><label class="field"><span>Note for your project manager <span class="faint">(optional)</span></span><textarea class="ta" id="cdT" placeholder="e.g. Let us revisit after Diwali."></textarea></label></div><div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('co-decline-ok', 'Decline', { cls: 'pri danger', id: el.dataset.id }) + '</div>', 'sm');
  };
  MR.act['co-decline-ok'] = function (el) {
    var co = coById(el.dataset.id), p = MR.project(co.projectId), note = document.getElementById('cdT').value.trim();
    co.status = 'rejected'; co.decidedAt = new Date().toISOString(); co.signedBy = MR.client(p.clientId).contact.split(' (')[0]; co.clientNote = note;
    MR.audit('change order', p.code + ' ' + co.no, 'rejected', 'Declined' + (note ? ': ' + note : ''), 'client');
    MR.notify(['owner', 'pm'], co.no + ' on ' + p.name.split(',')[0] + ' was declined', '#/project/' + p.id + '?tab=cos', 'warn');
    MR.save(); MR.closeDlg(); MR.render(); MR.toast('Declined. Your project manager has been told.');
  };
})();
