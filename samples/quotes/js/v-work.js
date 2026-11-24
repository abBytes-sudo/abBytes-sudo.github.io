/* Studio OS: focus modes and safe previews. Collections mode, approvals queue, client peek, inline "+ Add", price-list import. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u, esc = u.esc, ic = MR.ic;
  MR.views = MR.views || {}; MR.act = MR.act || {}; MR.bind = MR.bind || {};
  function S() { return MR.S; }
  var OUT = MR.OUTCOMES;
  var OGRID = [['promised', 'Promised to pay', 'check', 'ok'], ['paid', 'Paid', 'pay', 'ok'], ['callback', 'Call back', 'clock', 'info'], ['noanswer', 'No answer', 'phone', 'warn'], ['dispute', 'Dispute', 'flag', 'bad'], ['wrong', 'Wrong person', 'user', 'bad']];
  var NEXT = { promised: 0, paid: null, callback: 1, noanswer: 1, dispute: 3, wrong: 1 };

  /* =============================== COLLECTIONS MODE =============================== */
  var COL = { i: null, out: null, onCall: false, t0: 0, timer: 0 };
  MR.views.collect = function (r) {
    if (!MR.can('finance.view')) return { html: '<div class="page narrow">' + MR.empty('lock', 'Collections is for accounts and the owner', 'Switch role from the sidebar to see it.') + '</div>', title: 'Collections', crumbs: [['Collections']], nav: 'collect' };
    var q = MR.collectQueue();
    if (!q.length) return { html: '<div class="page narrow"><section class="panel">' + MR.empty('check', 'Nothing to collect', 'Every invoice is paid. Rare, and lovely.') + '</section></div>', title: 'Collections', crumbs: [['Collections']], nav: 'collect' };
    var idx = 0; q.forEach(function (x, j) { if (x.iv.id === (r.qs.i || COL.i)) idx = j; });
    if (!r.qs.i && !COL.i) { var firstTodo = q.map(function (x) { return x.done; }).indexOf(false); if (firstTodo > -1) idx = firstTodo; }
    var x = q[idx], iv = x.iv, c = MR.client(iv.clientId), p = MR.project(iv.projectId), b = MR.billedOf(p);
    if (COL.i !== iv.id) { COL.i = iv.id; COL.out = null; COL.onCall = false; clearInterval(COL.timer); }
    var done = q.filter(function (y) { return y.done; }).length, left = q.length - done;
    var h = '<div class="page wide" style="max-width:1480px">';
    h += '<div class="fbar"><a class="btn ghost sm" href="#/receivables">' + ic('chevl') + '<span>Receivables</span></a><h1 class="ft" style="font:600 15px var(--f)">Collections</h1><span class="tchip t-info">Invoice ' + (idx + 1) + ' of ' + q.length + '</span><span class="fp">' + done + ' of ' + q.length + ' followed up today · ' + q.filter(function (y) { return y.st.key === 'overdue'; }).length + ' overdue</span>' + MR.tchip('≈ ' + Math.max(1, left * 4) + ' m left', '', 'clock') + '<span class="grow"></span><a class="btn sm" href="#/collect?i=' + q[(idx - 1 + q.length) % q.length].iv.id + '" aria-label="Previous invoice">' + ic('chevl') + '<span>Prev</span></a><a class="btn sm" href="#/collect?i=' + q[(idx + 1) % q.length].iv.id + '" aria-label="Next invoice"><span>Next</span>' + ic('chevr') + '</a></div>';
    h += '<div class="focus">';
    // left: the queue
    h += '<nav class="fq" aria-label="Collection queue"><div class="fq-hd"><b>In this queue <span class="muted" style="font-weight:400">' + q.length + '</span></b><span class="tchip t-ok">' + done + ' done</span></div><div class="fq-list">' + q.map(function (y, j) { var cl = MR.client(y.iv.clientId); return '<a class="fq-it' + (y.done ? ' done' : '') + '" href="#/collect?i=' + y.iv.id + '" aria-current="' + (j === idx) + '"><b>' + esc(cl.name) + '</b><span class="fs"><span>' + esc(y.iv.no.split('/').pop()) + ' · ' + u.lakh(y.st.balance) + '</span>' + (y.done ? MR.tchip('done', 'ok', 'check') : y.st.key === 'overdue' ? MR.tchip(y.st.overdue + 'd', 'bad') : MR.tchip('due ' + u.fshort(y.iv.due), 'info')) + '</span></a>'; }).join('') + '</div></nav>';
    // centre: the work card
    h += '<section class="fcard" aria-labelledby="colT"><div class="fcard-hd"><span class="av av-xl" style="--h:' + (c.kind === 'Commercial' ? 212 : MR.hueOf(c.name)) + '">' + esc(u.initials(c.name)) + '</span><div class="who"><b id="colT">' + esc(c.name) + '</b><span>' + esc(c.contact) + ' · ' + esc(c.city) + '</span></div>' + MR.chipProject(p) + MR.chipInvoice(iv) + '</div><div class="fcard-bd">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><div><div class="wc-k">Outstanding on ' + esc(iv.no) + '</div><div class="big-amt">' + u.inr(x.st.balance) + '</div></div><div style="text-align:right">' + (x.st.key === 'overdue' ? MR.tchip('overdue ' + x.st.overdue + ' days · due ' + u.fshort(iv.due), 'bad', 'clock') : MR.dueChip(iv.due)) + '</div></div>';
    h += x.last ? '<div class="remark"><span class="lb">Last remark · ' + esc(OUT[x.last.outcome]) + ' <span>· ' + esc(MR.userById(x.last.by).name.split(' ')[0]) + ', ' + u.rel(x.last.at) + '</span></span>' + esc(x.last.note) + (x.last.promise ? '<br><b>Promised for ' + u.fdate(x.last.promise) + '</b>' : '') + '</div>' : '<div class="remark"><span class="lb">Last remark <span>· none on file</span></span>No remark yet. The note you add on this call lands here for the next person.</div>';
    h += MR.meter(b.stages + ' of ' + b.of + ' payment stages billed', u.lakh(b.recv) + ' received of ' + u.lakh(b.contract) + ' incl. GST', [[b.recv / b.contract * 100, 'var(--ok)'], [(b.billed - b.recv) / b.contract * 100, '#D08A16']]);
    h += '<dl class="pgrid">' + [['Invoice', esc(iv.no)], ['Raised', u.fdate(iv.date)], ['Stage', esc(iv.lines[0].desc.split(' (')[0])], ['Invoice total', u.inr(iv.total)], ['Contact', MR.val('client', c, 'contact', 'contact', 'Who to call')], ['Phone', MR.val('client', c, 'phone', 'phone', '+91 98xxx xxxxx')], ['Email', MR.val('client', c, 'email', 'email', 'name@example.com')], ['GSTIN', c.kind === 'Commercial' ? MR.val('client', c, 'gstin', 'GSTIN', '07AAKFS4417M1Z3') : '<span class="muted">Unregistered (homeowner)</span>'], ['Site contact', MR.val('project', p, 'siteContact', 'site contact', 'Name and role')], ['PM', MR.userById(p.pm).name]].map(function (r2) { return '<div><dt>' + r2[0] + '</dt><dd>' + r2[1] + '</dd></div>'; }).join('') + '</dl>';
    var hist = (iv.remarks || []).slice().reverse();
    if (hist.length > 1) h += '<div><div class="wc-k" style="margin-bottom:6px">Earlier follow-ups</div><ul class="timeline">' + hist.slice(1).map(function (m) { return '<li><span class="dot ' + (m.outcome === 'dispute' ? 'bad' : m.outcome === 'promised' ? 'ok' : 'info') + '"></span><span><b>' + esc(OUT[m.outcome]) + '</b> · ' + esc(m.note) + '</span><span class="when">' + u.fshort(m.at.slice(0, 10)) + '</span></li>'; }).join('') + '</ul></div>';
    h += '</div></section>';
    // right: dial + outcome + next step
    var phone = c.phone || '';
    h += '<aside class="stack" style="gap:12px"><div class="dial"><span class="dk">' + (COL.onCall ? 'On the call' : 'Ready to call') + '</span><span class="dn">' + esc(c.contact.split(' (')[0]) + '</span><span class="dp">' + (phone ? esc(phone.replace(/(\d{5}) (\d{2})(\d{3})$/, '$1 $2$3')) : '<span style="font-size:14px;color:#A9A397">No phone on file</span>') + '</span>' + (COL.onCall ? '<span class="live" aria-live="polite"><i></i><span id="colTimer">0:00</span> on this call · aim ≈ 4 m</span>' + MR.btn('col-call', 'End call', { cls: 'go' }) : MR.btn('col-call', 'Call ' + esc(c.contact.replace(/^Dr\s+/, '').split(' ')[0]), { cls: 'go', icon: 'phone', disabled: !phone })) + '<div class="drow">' + MR.btn('col-wa', 'WhatsApp', { icon: 'comment' }) + '<a class="btn" href="#/collect?i=' + q[(idx + 1) % q.length].iv.id + '">Skip</a></div><span class="dh">Dial from your phone, then pick how it went.</span></div>';
    h += '<div class="side-card"><h3>How did it go?</h3><div class="outcomes" role="group" aria-label="Call outcome">' + OGRID.map(function (o) { return '<button type="button" class="outcome o-' + o[3] + '" data-act="col-out" data-v="' + o[0] + '" aria-pressed="' + (COL.out === o[0]) + '">' + ic(o[2]) + '<span>' + o[1] + '</span></button>'; }).join('') + '</div>';
    var nd = COL.out && NEXT[COL.out] != null ? u.addD(u.today(), NEXT[COL.out]) : u.addD(u.today(), 2);
    h += '<div id="colMore">' + (COL.out === 'promised' ? '<label class="field"><span>Promised date</span><input class="inp" type="date" id="colPromise" value="' + u.addD(u.today(), 5) + '" min="' + u.today() + '"></label>' : '') + (COL.out === 'dispute' ? '<label class="field"><span>What is the dispute?</span><select class="sel" id="colDisp"><option>Waiting for a snag to be fixed</option><option>Amount or rate questioned</option><option>Scope not as agreed</option><option>Holding retention till defect period ends</option></select></label>' : '') + (COL.out === 'paid' ? '<p class="muted" style="font-size:13px">Saving opens <b>Record payment</b> with this invoice filled in, so you can add the UTR.</p>' : '') + '</div>';
    h += (COL.out !== 'paid' ? '<label class="field"><span>Next follow-up</span><input class="inp" type="date" id="colNext" value="' + nd + '" min="' + u.today() + '"></label>' : '') + '<label class="field"><span>Note for the next person</span><textarea class="ta" id="colNote" rows="3" placeholder="What was said, who said it, what happens next">' + '</textarea></label><span class="err" id="colErr" role="alert"></span><div style="display:flex;gap:8px">' + MR.btn('col-save', 'Save', { cls: '', attrs: ' data-next="0"' }) + MR.btn('col-save', 'Save & next', { cls: 'pri', icon: 'arrow', attrs: ' data-next="1" style="flex:1"' }) + '</div></div></aside>';
    h += '</div></div>';
    return { html: h, title: 'Collections · ' + c.name, crumbs: [['Receivables', '#/receivables'], ['Collections']], nav: 'collect', primary: false, after: function () { if (COL.onCall) tick(); } };
  };
  function tick() { clearInterval(COL.timer); var el = document.getElementById('colTimer'); COL.timer = setInterval(function () { el = document.getElementById('colTimer'); if (!el) { clearInterval(COL.timer); return; } var s = Math.floor((Date.now() - COL.t0) / 1000); el.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }, 1000); }
  MR.act['col-call'] = function () { COL.onCall = !COL.onCall; if (COL.onCall) COL.t0 = Date.now(); else clearInterval(COL.timer); MR.render(); };
  MR.act['col-wa'] = function () {
    var iv = MR.invoice(COL.i), c = MR.client(iv.clientId), st = MR.invState(iv), first = c.contact.split(' (')[0].replace(/^Dr\s+/, 'Dr ').split(' ')[0];
    MR.copy('Hi ' + first + ', a gentle reminder about invoice ' + iv.no + ' (' + u.inr(st.balance) + ') for ' + MR.project(iv.projectId).name.split(',')[0] + '. If it is already paid, please share the UTR and we will reconcile it today. · Rakesh, Marlow & Reed', 'Reminder copied. Paste it into WhatsApp.');
  };
  MR.act['col-out'] = function (el) { COL.out = COL.out === el.dataset.v ? null : el.dataset.v; var y = window.scrollY; MR.render(); window.scrollTo(0, y); var n = document.getElementById('colNote'); if (n) n.focus({ preventScroll: true }); };
  MR.act['col-save'] = function (el) {
    var iv = MR.invoice(COL.i), err = document.getElementById('colErr'), note = document.getElementById('colNote').value.trim();
    if (!COL.out) { err.textContent = 'Pick how it went first.'; return; }
    if (note.length < 4 && COL.out !== 'paid') { err.textContent = 'Add a line for the next person: what was said and by whom.'; document.getElementById('colNote').focus(); return; }
    var nx = document.getElementById('colNext'), pr = document.getElementById('colPromise'), dsp = document.getElementById('colDisp');
    var rem = { id: u.uid('rm'), at: new Date().toISOString(), by: MR.me().id, outcome: COL.out, note: (dsp ? dsp.value + '. ' : '') + (note || 'Client confirmed payment.'), next: nx ? nx.value : null, promise: pr ? pr.value : null };
    (iv.remarks = iv.remarks || []).push(rem);
    MR.audit('invoice', iv.no, 'follow-up logged', OUT[COL.out] + ': ' + rem.note.slice(0, 90));
    if (COL.out === 'dispute') MR.notify(['owner', 'pm'], 'Dispute on ' + iv.no + ' (' + MR.client(iv.clientId).name + '): ' + rem.note.slice(0, 70), '#/collect?i=' + iv.id, 'bad');
    if (COL.out === 'promised') MR.notify(['owner'], MR.client(iv.clientId).name + ' promised ' + u.inr(MR.invState(iv).balance) + ' by ' + u.fdate(rem.promise), '#/collect?i=' + iv.id, 'ok');
    MR.save();
    var q = MR.collectQueue(), cur = q.map(function (y) { return y.iv.id; }).indexOf(iv.id), nxt = null;
    for (var k = 1; k <= q.length; k++) { var y = q[(cur + k) % q.length]; if (!y.done) { nxt = y; break; } }
    var wasPaid = COL.out === 'paid';
    MR.undoable('Follow-up saved on ' + iv.no.split('/').pop(), function () { iv.remarks.pop(); });
    COL.out = null; COL.onCall = false; clearInterval(COL.timer);
    if (wasPaid) { MR.act['record-payment']({ dataset: { id: iv.id } }); return; }
    if (el.dataset.next === '1') { if (nxt) MR.go('#/collect?i=' + nxt.iv.id); else { MR.render(); MR.toast('Queue done. Every invoice has a follow-up today.'); } } else MR.render();
  };

  /* =============================== APPROVALS QUEUE =============================== */
  MR.views.approvals = function () {
    var A = MR.approvalItems(), h = '<div class="page narrow" style="max-width:1100px">';
    h += '<div class="ph"><div><h1>Approvals</h1><p class="sub">Every quote, discount and change order passes you before a client sees it. Policy: margin at least 22%, discount at most 7.5%.</p></div></div>';
    h += '<div class="fbar"><b class="ft">' + A.done + ' of ' + A.total + ' reviewed this week</b><div class="bar ok" style="flex:1;min-width:120px;height:8px"><i style="width:' + (A.total ? A.done / A.total * 100 : 0) + '%"></i></div>' + MR.tchip(A.pend.length + ' waiting', A.pend.length ? 'violet' : 'ok') + '</div>';
    if (!A.pend.length) h += '<section class="panel">' + MR.empty('approve', 'Nothing waiting for you', 'When a project manager submits a quote, a discount or a change order, it lands here as a card.') + '</section>';
    h += '<div class="wlist">' + A.pend.map(apCard).join('') + '</div>';
    var dec = []; S().quotes.forEach(function (q) { q.approvals.forEach(function (a) { dec.push({ at: a.at, by: a.by, ok: a.decision === 'approved', t: q.no + ' v' + a.v + ' · ' + q.name, c: a.comment, href: '#/quote/' + q.id }); }); });
    (S().discReqs || []).forEach(function (d) { if (d.status !== 'pending') dec.push({ at: d.decidedAt, by: 'u-ira', ok: d.status === 'approved', t: d.pct + '% discount · ' + MR.quote(d.quoteId).no, c: d.note, href: '#/quote/' + d.quoteId }); });
    dec.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    h += '<h2 style="font-size:15px;font-weight:600;margin:28px 0 10px">Recently decided</h2><section class="panel"><div class="panel-bd" style="padding-top:0;padding-bottom:0"><ul class="feed">' + dec.slice(0, 10).map(function (d) { return '<li>' + MR.avatar(d.by) + '<span>' + MR.tchip(d.ok ? 'Approved' : 'Returned', d.ok ? 'ok' : 'bad') + ' <a href="' + d.href + '"><b>' + esc(d.t) + '</b></a>' + (d.c ? '<br><span class="muted">“' + esc(d.c) + '”</span>' : '') + '</span><span class="t">' + u.rel(d.at) + '</span></li>'; }).join('') + '</ul></div></section></div>';
    return { html: h, title: 'Approvals', crumbs: [['Approvals']], nav: 'approvals' };
  };
  function diffCounts(q, a, b) {
    var ka = {}, out = { add: 0, rem: 0, chg: 0 };
    a.sections.forEach(function (s) { s.items.forEach(function (i) { ka[i.key] = i; }); });
    b.sections.forEach(function (s) { s.items.forEach(function (i) { var o = ka[i.key]; if (!o) out.add++; else { if (o.qty !== i.qty || o.rate !== i.rate || o.code !== i.code) out.chg++; delete ka[i.key]; } }); });
    out.rem = Object.keys(ka).length; return out;
  }
  function rejectBox(id) { return '<div id="rjw-' + id + '" hidden><label class="field"><span>What needs to change?</span><textarea class="ta" id="rj-' + id + '" rows="2" placeholder="Be specific: which lines, what margin, what to add."></textarea></label></div>'; }
  function apCard(a) {
    if (a.type === 'quote') {
      var q = a.q, v = MR.ver(q), c = MR.calc(q, v), pol = MR.policy(q), prev = q.versions[v.n - 2], pc = prev && MR.calc(q, prev), dc = prev && diffCounts(q, prev, v);
      var cr = q.comments.filter(function (x) { return x.kind === 'changes'; }).pop();
      return MR.wcard({ id: a.id, g: 'approve', icon: 'quotes', tone: 'violet', k: 'Quote · v' + v.n, title: q.name, href: '#/quote/' + q.id, chips: MR.chipClient(MR.client(q.clientId)) + MR.chipQuote(q) + MR.chipUser(q.owner),
        time: MR.agoChip(v.submittedAt, 'submitted', 'violet') + (pol.fails ? MR.tchip(pol.fails + ' policy flag' + (pol.fails > 1 ? 's' : ''), 'bad', 'flag') : MR.tchip('passes policy', 'ok', 'check')),
        remark: v.submitNote ? { lb: 'From ' + MR.userById(q.owner).name.split(' ')[0], text: v.submitNote } : cr ? { lb: 'Client asked', who: cr.who + ', ' + u.rel(cr.at), text: cr.text } : { lb: 'Version note', text: v.note, quiet: true },
        meta: MR.meter('Margin · floor 22%', u.pct(c.margin * 100, 1) + (pc ? ' (' + (c.margin >= pc.margin ? '+' : '−') + Math.abs((c.margin - pc.margin) * 100).toFixed(1) + ' pts)' : ''), [[c.margin / 0.4 * 100, c.margin < 0.22 ? 'var(--bad)' : 'var(--ok)']]) + MR.meter('Discount · limit 7.5%', (v.discPct || 0) + '%', [[(v.discPct || 0) / 15 * 100, (v.discPct || 0) > 7.5 ? 'var(--bad)' : 'var(--ok)']]),
        extra: (dc ? '<div class="preview"><div class="preview-hd">What changed since v' + prev.n + '</div><div class="pv-grid"><div><span>Value</span><b>' + (c.taxable >= pc.taxable ? '+' : '−') + u.lakh(Math.abs(c.taxable - pc.taxable)) + '</b><small>' + u.lakh(pc.taxable) + ' → ' + u.lakh(c.taxable) + '</small></div><div><span>Added</span><b class="ok">+' + dc.add + '</b><small>lines</small></div><div><span>Changed</span><b class="warn">~' + dc.chg + '</b><small>lines</small></div><div><span>Removed</span><b class="bad">−' + dc.rem + '</b><small>lines</small></div></div></div>' : '') + '<ul class="policy" style="display:flex;flex-wrap:wrap;gap:4px 16px">' + pol.checks.map(function (x) { return '<li style="display:flex;gap:6px;align-items:center;font-size:12.5px" class="' + (x[0] ? 'ok' : 'bad') + '">' + ic(x[0] ? 'check' : 'flag') + '<span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>' + rejectBox(a.id),
        sec: (prev ? '<a class="btn ghost" href="#/quote/' + q.id + '/diff?a=' + prev.n + '&b=' + v.n + '">' + ic('diff') + '<span>Full diff</span></a>' : '<a class="btn ghost" href="#/quote/' + q.id + '">Open quote</a>') + MR.btn('ap-reject', 'Return with note', { attrs: ' data-a="' + a.id + '"' }),
        pri: MR.btn('ap-ok', 'Approve', { cls: 'pri', icon: 'check', attrs: ' data-a="' + a.id + '"' }) });
    }
    if (a.type === 'disc') {
      var q2 = a.q, c2 = MR.calc(q2), nt = c2.taxable * (1 - a.d.pct / 100), nm = (nt - c2.cost) / nt;
      return MR.wcard({ id: a.id, g: 'approve', icon: 'pay', tone: 'violet', k: 'Discount request · ' + a.d.pct + '% extra', title: q2.name, href: '#/quote/' + q2.id, chips: MR.chipClient(MR.client(q2.clientId)) + MR.chipQuote(q2) + MR.chipUser(a.d.by), time: MR.agoChip(a.at, 'asked', 'violet'),
        remark: { lb: 'Why', who: MR.userById(a.d.by).name.split(' ')[0], text: a.d.reason },
        meta: MR.meter('Margin after discount', u.pct(c2.margin * 100, 1) + ' → ' + u.pct(nm * 100, 1), [[nm / 0.4 * 100, nm < 0.22 ? 'var(--bad)' : 'var(--ok)']]) + '<span>Value <b>' + u.lakh(c2.taxable) + ' → ' + u.lakh(nt) + '</b></span><span>Total discount <b>' + ((MR.ver(q2).discPct || 0) + a.d.pct) + '%</b>' + ((MR.ver(q2).discPct || 0) + a.d.pct > 7.5 ? ' ' + MR.tchip('above limit', 'bad') : '') + '</span>',
        extra: rejectBox(a.id), sec: MR.btn('ap-reject', 'Decline with note', { attrs: ' data-a="' + a.id + '"' }), pri: MR.btn('ap-ok', 'Approve ' + a.d.pct + '%', { cls: 'pri', icon: 'check', attrs: ' data-a="' + a.id + '"' }) });
    }
    var co = a.co, p = a.p;
    return MR.wcard({ id: a.id, g: 'approve', icon: 'edit', tone: 'violet', k: 'Change order · before it goes to the client', title: co.no + ' · ' + co.title, href: '#/project/' + p.id + '?tab=cos', chips: MR.chipProject(p) + MR.chipClient(MR.client(p.clientId), { short: true }) + MR.chipUser(co.by), time: MR.agoChip(a.at, 'raised', 'violet'),
      remark: { lb: 'Reason', text: co.reason }, extra: MR.coPreview ? MR.coPreview(p, co.items) + rejectBox(a.id) : rejectBox(a.id),
      sec: MR.btn('ap-reject', 'Return with note', { attrs: ' data-a="' + a.id + '"' }), pri: MR.btn('ap-ok', 'Approve', { cls: 'pri', icon: 'check', attrs: ' data-a="' + a.id + '"' }) });
  }
  function findA(id) { return MR.approvalItems().pend.filter(function (x) { return x.id === id; })[0]; }
  function fade(id, then) { var c = document.getElementById('wc-' + id); if (c && !MR.still()) { c.style.transition = 'opacity .2s, transform .2s'; c.style.opacity = '0'; c.style.transform = 'translateX(12px)'; setTimeout(then, 200); } else then(); }
  MR.act['ap-ok'] = function (el) {
    var a = findA(el.dataset.a); if (!a) return;
    var undo;
    if (a.type === 'quote') { var prev = a.q.status; MR.approveQuote(a.q, ''); undo = function () { a.q.status = prev; a.q.approvals.pop(); }; }
    else if (a.type === 'disc') { MR.decideDisc(a.d, true); undo = function () { a.d.status = 'pending'; }; }
    else { a.co.internal = 'approved'; a.co.internalAt = new Date().toISOString(); MR.audit('change order', a.p.code + ' ' + a.co.no, 'approved internally', 'Ready to send to client'); MR.notify(['pm'], 'Ira approved ' + a.co.no + ' on ' + a.p.name.split(',')[0] + '. Send it to the client.', '#/project/' + a.p.id + '?tab=cos', 'ok'); undo = function () { a.co.internal = 'pending'; }; }
    MR.save(); fade(a.id, MR.render); MR.undoable('Approved · ' + (a.q ? a.q.no : a.co.no), undo);
  };
  MR.act['ap-reject'] = function (el) {
    var id = el.dataset.a, box = document.getElementById('rjw-' + id), ta = document.getElementById('rj-' + id);
    if (box.hidden) { box.hidden = false; el.querySelector('span').textContent = 'Send back'; el.classList.add('danger'); ta.focus(); return; }
    var note = ta.value.trim(); if (note.length < 8) { ta.setAttribute('aria-invalid', 'true'); ta.placeholder = 'Tell them what to change, so the next version is right first time.'; ta.focus(); return; }
    var a = findA(id); if (!a) return;
    if (a.type === 'quote') { var v = MR.ver(a.q); a.q.approvals.push({ v: v.n, by: MR.me().id, at: new Date().toISOString(), decision: 'rejected', comment: note }); a.q.status = 'rejected'; MR.audit('quote', a.q.no, 'rejected', note.slice(0, 120)); MR.notify(['pm'], 'Ira returned ' + a.q.no + ' v' + v.n + ' with comments', '#/quote/' + a.q.id, 'bad'); }
    else if (a.type === 'disc') MR.decideDisc(a.d, false, note);
    else { a.co.internal = 'returned'; a.co.internalAt = new Date().toISOString(); a.co.internalNote = note; MR.audit('change order', a.p.code + ' ' + a.co.no, 'returned', note.slice(0, 100)); MR.notify(['pm'], 'Ira returned ' + a.co.no + ': ' + note.slice(0, 60), '#/project/' + a.p.id + '?tab=cos', 'warn'); }
    MR.save(); fade(id, MR.render); MR.toast('Sent back with your note');
  };

  /* =============================== CLIENT PEEK (slide-over) =============================== */
  MR.act['peek-client'] = function (el, e) {
    if (e && (e.metaKey || e.ctrlKey)) { MR.go('#/client/' + el.dataset.id); return; }
    var c = MR.client(el.dataset.id); if (!c) return;
    var qs = S().quotes.filter(function (q) { return q.clientId === c.id; }), ps = S().projects.filter(function (p) { return p.clientId === c.id; }), due = 0;
    S().invoices.forEach(function (iv) { if (iv.clientId === c.id) due += MR.invState(iv).balance; });
    var h = '<div class="dlg-hd"><h2 id="drT" style="display:flex;gap:10px;align-items:center"><span class="av av-lg" style="--h:' + (c.kind === 'Commercial' ? 212 : MR.hueOf(c.name)) + '">' + esc(u.initials(c.name)) + '</span>' + esc(c.name) + '</h2>' + MR.xBtn() + '</div><div class="dlg-bd">';
    h += '<div class="chips">' + MR.tchip(c.kind, 'info') + MR.tchip(c.city + ' · ' + c.state, '') + (due && MR.can('money.view') ? MR.tchip(u.lakh(due) + ' outstanding', 'warn') : '') + '</div>';
    if (c.note) h += '<div class="remark quiet"><span class="lb">Note</span>' + esc(c.note) + '</div>';
    h += '<dl class="pgrid" style="grid-template-columns:1fr">' + [['Contact', MR.val('client', c, 'contact', 'contact')], ['Phone', MR.val('client', c, 'phone', 'phone', '+91 98xxx xxxxx')], ['Email', MR.val('client', c, 'email', 'email', 'name@example.com')], ['GSTIN', c.kind === 'Commercial' ? MR.val('client', c, 'gstin', 'GSTIN', '07AAKFS4417M1Z3') : '<span class="muted">Unregistered (homeowner)</span>'], ['Site', esc(c.addr)], ['Owner', MR.chipUser(c.owner)]].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>';
    if (ps.length) h += '<div><div class="wc-k" style="margin-bottom:6px">Projects</div><div class="chips">' + ps.map(function (p) { return MR.chipProject(p); }).join('') + '</div></div>';
    if (qs.length && MR.S.role !== 'site') h += '<div><div class="wc-k" style="margin-bottom:6px">Quotes</div><div class="chips">' + qs.map(function (q) { return MR.chipQuote(q) + ' ' + MR.pill(q.status); }).join(' ') + '</div></div>';
    h += '<div style="display:flex;gap:8px"><a class="btn pri" href="#/client/' + c.id + '" style="flex:1">Open client record</a>' + (MR.S.role !== 'site' ? MR.btn('new-quote', 'New quote', { icon: 'plus', id: c.id }) : '') + '</div></div>';
    MR.openDrawer(h);
  };

  /* =============================== INLINE "+ ADD" =============================== */
  MR.act['add-in'] = function (el) {
    var span = document.createElement('span'); span.className = 'add-in';
    span.innerHTML = '<input aria-label="' + esc(el.textContent.replace('+ ', '')) + '" placeholder="' + esc(el.dataset.ph || '') + '">';
    el.replaceWith(span);
    var inp = span.querySelector('input'); inp.focus();
    function commit() {
      var v = inp.value.trim(); if (!v) { MR.render(); return; }
      var k = el.dataset.k, ent = el.dataset.e, obj = ent === 'client' ? MR.client(el.dataset.id) : (ent === 'lead' || ent === 'leadf') ? MR.lead(el.dataset.id) : MR.project(el.dataset.id);
      if (ent === 'leadf') { var fd = MR.S.config.fields.filter(function (x) { return x.k === k; })[0]; if (fd && fd.type === 'number') v = u.num(v); var prevF = obj.f[k]; obj.f[k] = v; MR.audit('lead', obj.no, 'edited', (fd ? fd.n : k) + ': ' + v); MR.save(); MR.undoable('Updated ' + (fd ? fd.n.toLowerCase() : k), function () { obj.f[k] = prevF; }); MR.render(); if (MR.openLead && document.getElementById('drawer').open) MR.openLead(obj); return; }
      if (k === 'gstin') { v = v.toUpperCase(); if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v)) { MR.toast('A GSTIN has 15 characters, like 07AAKFS4417M1Z3.', { kind: 'bad' }); inp.focus(); return; } }
      if (k === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { MR.toast('That email looks incomplete.', { kind: 'bad' }); inp.focus(); return; }
      MR.setField(obj, k, v, el.textContent.replace('+ Add ', ''), ent === 'lead' ? 'lead' : ent, obj.name || obj.code); MR.render(); if (ent === 'lead' && MR.openLead && document.getElementById('drawer').open) MR.openLead(obj);
    }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') MR.render(); });
    inp.addEventListener('blur', function () { setTimeout(function () { if (document.body.contains(inp)) commit(); }, 120); });
  };

  /* =============================== CHANGE ORDER: what this change does =============================== */
  MR.coPreview = function (p, items) {
    var amt = items.reduce(function (a, i) { return a + MR.lineAmt(i); }, 0), cost = items.reduce(function (a, i) { return a + MR.lineCost(i); }, 0), cv = MR.projValue(p);
    var rooms = {}, ms = {};
    items.forEach(function (i) {
      var ph = MR.PHASES.map(function (x) { return x[1].indexOf(i.cat) > -1; }).indexOf(true), m = p.milestones.filter(function (x) { return x.ph === ph; })[0];
      if (m) { var days = Math.max(1, Math.round(MR.lineAmt(i) / Math.max(1, m.value) * u.diffD(m.start, m.end))); ms[m.name] = (ms[m.name] || 0) + days; }
    });
    var mg = amt ? (amt - cost) / amt : 0;
    return '<div class="preview"><div class="preview-hd">What this change does</div><div class="pv-grid"><div><span>Scope</span><b>+' + items.length + '</b><small>line' + (items.length === 1 ? '' : 's') + '</small></div><div><span>Value</span><b>+' + u.lakh(amt) + '</b><small>+ GST ' + u.lakh(amt * 0.18) + '</small></div><div><span>Contract</span><b>' + u.lakh(cv + amt) + '</b><small>from ' + u.lakh(cv) + '</small></div><div><span>Margin</span><b class="' + (mg < 0.22 ? 'bad' : 'ok') + '">' + u.pct(mg * 100, 1) + '</b><small>on this change</small></div></div><ul class="pv-list">' +
      items.map(function (i) { return '<li><span class="mk p">+</span><span>' + esc(i.name) + ' · ' + u.fnum(i.qty) + ' ' + esc(i.unit) + '</span><span class="v">' + u.inr(MR.lineAmt(i)) + '</span></li>'; }).join('') +
      Object.keys(ms).map(function (k) { return '<li><span class="mk c">~</span><span>Milestone <b>' + esc(k) + '</b> takes about ' + ms[k] + ' more day' + (ms[k] === 1 ? '' : 's') + '</span></li>'; }).join('') +
      '<li><span class="mk c">~</span><span>Billing: a new line, 100% on approval, invoiced separately</span><span class="v">' + u.inr(amt * 1.18) + '</span></li></ul></div>';
  };

  /* =============================== PRICE-LIST IMPORT: preview before apply =============================== */
  var CIRC = [['CP-401', 1.04, 'BWP ply'], ['CP-402', 1.045, 'BWR ply'], ['CP-403', 1.03, 'Lacquered glass'], ['CP-404', 1.04, 'Ply + veneer'], ['CP-406', 1.06, 'Oak veneer'], ['CP-413', 1.03, 'Fluted glass'], ['CP-410', 1.05, 'Marine ply'], ['CP-414', 1.04, 'BWR ply'], ['CP-407', 1, 'Unchanged'], ['CP-408', 0.98, 'Flush door, volume rebate'], ['CP-499', null, 'Charcoal louvre panel 8 mm (new)'], ['CP-498', null, 'Laminate, 1 mm suede finish (new)'], ['XX-12', 0, 'Edge banding 2 mm, 22 mm wide (no match)']];
  function plan() {
    var out = { upd: [], same: [], add: [], rev: [] };
    CIRC.forEach(function (c) {
      var r = S().rates.filter(function (x) { return x.code === c[0]; })[0];
      if (c[1] === 0) out.rev.push({ c: c }); else if (!r) out.add.push({ c: c }); else if (c[1] === 1) out.same.push({ c: c, r: r }); else out.upd.push({ c: c, r: r, mat: Math.round(r.mat * c[1]) });
    });
    var codes = out.upd.map(function (x) { return x.r.id; }), qs = 0;
    S().quotes.forEach(function (q) { if (['draft', 'review', 'rejected'].indexOf(q.status) < 0) return; if (MR.ver(q).sections.some(function (s) { return s.items.some(function (i) { return codes.indexOf(i.rateId) > -1; }); })) qs++; });
    out.quotes = qs; return out;
  }
  MR.act['rates-import'] = function () {
    var P = plan(), avg = P.upd.reduce(function (a, x) { return a + (x.c[1] - 1); }, 0) / Math.max(1, P.upd.length) * 100;
    var h = '<div class="dlg-hd"><h2 id="dlgT">Import a supplier price list</h2>' + MR.xBtn() + '</div><div class="dlg-bd"><div class="remark quiet"><span class="lb">File</span>Shree Balaji Ply &amp; Laminates · price circular, December · 13 rows</div>';
    h += '<div class="preview"><div class="preview-hd">What this import does to the rate library</div><div class="pv-grid"><div><span>Updated</span><b>' + P.upd.length + '</b><small>avg +' + avg.toFixed(1) + '%</small></div><div><span>New</span><b>' + P.add.length + '</b><small>added as v1</small></div><div><span>To review</span><b class="warn">' + P.rev.length + '</b><small>no match</small></div><div><span>Unchanged</span><b>' + P.same.length + '</b><small>skipped</small></div></div><ul class="pv-list">' +
      P.upd.map(function (x) { var d = (x.c[1] - 1) * 100; return '<li><span class="mk ' + (d > 0 ? 'm' : 'p') + '">' + (d > 0 ? '↑' : '↓') + '</span><span><span class="mono faint">' + esc(x.r.code) + '</span> ' + esc(x.r.name) + '</span><span class="v">' + u.inr(x.r.mat) + ' → ' + u.inr(x.mat) + ' (' + (d > 0 ? '+' : '') + d.toFixed(1) + '%)</span></li>'; }).join('') +
      P.add.map(function (x) { return '<li><span class="mk p">+</span><span><span class="mono faint">' + esc(x.c[0]) + '</span> ' + esc(x.c[2]) + '</span><span class="v">new rate</span></li>'; }).join('') +
      P.rev.map(function (x) { return '<li><span class="mk c">?</span><span><span class="mono faint">' + esc(x.c[0]) + '</span> ' + esc(x.c[2]) + '</span><span class="v">needs a code</span></li>'; }).join('') + '</ul></div>';
    h += '<p class="callout">' + ic('flag') + P.quotes + ' open draft' + (P.quotes === 1 ? '' : 's') + ' use these rates; their lines will show a “newer rate” badge to refresh. Sent and signed quotes keep the version they were priced on.</p></div>';
    h += '<div class="dlg-ft"><button type="button" class="btn" data-act="dlg-close">Cancel</button>' + MR.btn('rates-import-ok', 'Apply including review', { attrs: ' data-rev="1"' }) + MR.btn('rates-import-ok', 'Apply ' + (P.upd.length + P.add.length) + ' changes', { cls: 'pri' }) + '</div>';
    MR.openDlg(h, 'lg');
  };
  MR.act['rates-import-ok'] = function (el) {
    var P = plan(), today = u.today(), me = MR.me().id, added = [];
    P.upd.forEach(function (x) { x.r.mat = x.mat; x.r.hist.push({ v: x.r.hist.length + 1, at: today, mat: x.r.mat, lab: x.r.lab, margin: x.r.margin, by: me, note: 'Supplier circular (Shree Balaji, Dec) ' + ((x.c[1] - 1) * 100 > 0 ? '+' : '') + ((x.c[1] - 1) * 100).toFixed(1) + '% material' }); });
    var adds = P.add.concat(el.dataset.rev ? P.rev : []);
    adds.forEach(function (x, j) { var code = x.c[0].indexOf('XX') === 0 ? 'CP-49' + (7 - j) : x.c[0]; var r = { id: 'r' + u.uid(''), code: code, cat: 'Carpentry', name: x.c[2].replace(/ \((new|no match)\)/, ''), unit: 'sqft', mat: 180 + j * 40, lab: 40, margin: 36, sac: '995472', hist: [{ v: 1, at: today, mat: 180 + j * 40, lab: 40, margin: 36, by: me, note: 'Added from supplier circular' + (x.c[0].indexOf('XX') === 0 ? ' (reviewed)' : '') }], active: true }; S().rates.push(r); added.push(r); });
    MR.audit('rate', 'Price list', 'imported', P.upd.length + ' updated, ' + adds.length + ' added from Shree Balaji circular');
    MR.notify(['pm'], 'Rate library updated from the Shree Balaji circular: ' + P.upd.length + ' carpentry rates changed. Drafts show a newer-rate badge.', '#/rates?cat=Carpentry', 'info');
    MR.save(); MR.closeDlg(); MR.go('#/rates?cat=Carpentry');
    MR.undoable('Imported ' + (P.upd.length + adds.length) + ' rate changes', function () { P.upd.forEach(function (x) { x.r.hist.pop(); x.r.mat = x.r.hist[x.r.hist.length - 1].mat; }); added.forEach(function (r) { S().rates.splice(S().rates.indexOf(r), 1); }); });
  };
})();
