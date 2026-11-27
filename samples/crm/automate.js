/* Lumen CRM Pro — workflow builder (When → If → Then) with run history and a dry-run tester,
   stage gates, email + WhatsApp sequences (simulated sends), lead scoring, round-robin and SLA timers. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views, page = C.page;
  var P = function () { return C.P(); };
  function wfById(id) { return P().wf.filter(function (w) { return w.id === id; })[0]; }
  function seqById(id) { return P().seqs.filter(function (s) { return s.id === id; })[0]; }
  function sw(act, id, on, label) { return '<button type="button" class="switch" role="switch" aria-checked="' + !!on + '" data-act="' + act + '" data-id="' + id + '" aria-label="' + esc(label) + '"><i></i></button>'; }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function saved(msg) { C.save(); C.toast(msg || 'Saved', { icon: 'check' }); }
  function keep(sel) { return function () { C.rerender(); var x = $(sel); if (x) x.focus({ preventScroll: true }); }; }

  // ===== Workflows =============================================================
  function WS() { return C.ui.wf || (C.ui.wf = { tab: 'rules', test: '' }); }
  V.workflows = {
    title: function () { var w = C.cur && C.cur.arg && wfById(C.cur.arg); return w ? w.name : 'Workflows'; },
    render: function () { var w = C.cur.arg && wfById(C.cur.arg); return w ? editor(w) : wfHome(); },
    mount: function () {
      var w = C.cur.arg && wfById(C.cur.arg), u = C.ui;
      if (w && u.wfPulse && u.wfPulse.indexOf(w.id) > -1 && Date.now() - u.wfPulseAt < 8000) pulse();
      if (!C.cur.arg && C.motion() && !C.noFx) gsap.from('.wf-row', { opacity: 0, y: 8, duration: .35, stagger: .04, ease: 'power2.out', clearProps: 'all' });
    }
  };
  function tabs(cur) { return '<div class="tabs" role="tablist" aria-label="Automation">' + [['rules', 'Rules'], ['gates', 'Stage gates'], ['runs', 'Run history']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (cur === t[0]) + '" tabindex="' + (cur === t[0] ? 0 : -1) + '" data-act="tab" data-k="wft" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>'; }
  function wfHome() {
    var t = C.ui.wft || 'rules', body;
    if (t === 'gates') body = gatesView(); else if (t === 'runs') body = runsView(P().runs); else body = rulesView();
    return page('Workflows', 'Rules run themselves when something happens. Stage gates stop deals skipping steps.', '<button type="button" class="btn pri" data-act="wf-new">' + C.ic('plus', 14) + 'New workflow</button>') + tabs(t) + '<div id="panel">' + body + '</div>';
  }
  function rulesView() {
    return '<section class="card flush"><ul class="wf-list">' + P().wf.map(function (w) {
      var ev = C.EVENTS[w.when.ev], obj = ev.obj, last = P().runs.filter(function (r) { return r.wf === w.id; })[0];
      return '<li class="wf-row' + (w.on ? '' : ' off') + '">' + sw('wf-toggle', w.id, w.on, (w.on ? 'Turn off ' : 'Turn on ') + w.name) + '<a class="wf-main" href="#/workflows/' + w.id + '"><b>' + esc(w.name) + '</b><span class="wf-sent"><span class="wtag when">' + C.ic(ev.ic, 12) + esc(ev.label) + (w.when.stage ? ': ' + esc(stageName(w.when.stage)) : '') + '</span>' + (w.conds.length ? '<span class="wtag if">If ' + esc(w.conds.map(function (c) { return C.condText(obj, c); }).join(' and ')) + '</span>' : '') + w.acts.map(function (a) { return '<span class="wtag then">' + C.ic(C.ACTIONS[a.type][1], 12) + esc(C.actText(a)) + '</span>'; }).join('') + '</span></a><span class="wf-stat"><b>' + (w.runs || 0) + '</b><span class="muted sm">runs' + (last ? ' · last ' + C.rel(last.t) : '') + '</span></span></li>';
    }).join('') + '</ul></section><p class="hint">Order matters: rules run top to bottom for each event, the same way every time.</p>';
  }
  function stageName(id) { var s = C.pstage('sales', id) || C.pstage('partner', id); return s ? s.label : id; }
  C.acts['wf-toggle'] = function (el) { var w = wfById(el.dataset.id); w.on = !w.on; saved(w.name + (w.on ? ' is on' : ' is off')); C.rerender(); var b = $('[data-act="wf-toggle"][data-id="' + w.id + '"]'); if (b) b.focus(); };
  C.acts['wf-new'] = function () {
    var w = { id: C.nextId(P().wf, 'WF-', 0), name: 'Untitled workflow', on: false, when: { ev: 'lead.created' }, conds: [], acts: [{ type: 'notify', v: 'Aarav Khanna' }], runs: 0 };
    P().wf.push(w); C.save(); location.hash = '#/workflows/' + w.id;
  };

  function runsView(R) {
    if (!R.length) return '<p class="empty">No runs yet. Turn the workflow on, then add a lead or move a deal.</p>';
    return '<section class="card flush"><ol class="runlist">' + R.slice(0, 40).map(function (r) {
      var w = wfById(r.wf);
      return '<li class="' + (r.skip ? 'skipped' : 'ok') + '"><details><summary><span class="rdot" aria-hidden="true"></span><span class="grow"><b>' + esc(w ? w.name : r.wf) + '</b> <span class="muted">on</span> <a href="' + C.refHref(r.rec) + '">' + esc(r.rec.name) + '</a></span><span class="rres">' + (r.skip ? 'Skipped' : 'Ran ' + r.steps.length + ' step' + (r.steps.length === 1 ? '' : 's')) + '</span><time class="muted sm nw">' + C.dt(r.t) + '</time></summary><ol class="rsteps">' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></details></li>';
    }).join('') + '</ol></section>';
  }

  // ---- editor ----------------------------------------------------------------
  function stageOpts() { var o = [['', 'Any stage']]; Object.keys(C.PIPES).forEach(function (k) { C.PIPES[k].stages.forEach(function (s) { if (!o.some(function (x) { return x[0] === s.id; })) o.push([s.id, C.PIPES[k].label + ' · ' + s.label]); }); }); return o; }
  function valInput(obj, c, i) {
    var F = (C.CFIELDS[obj] || {})[c.f];
    if (F && F[1] === 'sel') return '<select id="wc-v' + i + '" class="sel sm" data-ch="wc" data-k="v" data-i="' + i + '">' + opts(F[2], c.v) + '</select>';
    return '<input id="wc-v' + i + '" class="inp sm" ' + (F && F[1] === 'num' ? 'type="number" step="any"' : '') + ' value="' + esc(c.v) + '" data-ch="wc" data-k="v" data-i="' + i + '" autocomplete="off">';
  }
  function actParams(a, i) {
    var id = 'wa-v' + i;
    if (a.type === 'assign') return '<label class="sr" for="' + id + '">Owner</label><select id="' + id + '" class="sel sm" data-ch="wa" data-k="v" data-i="' + i + '">' + opts([['round-robin', 'Round-robin (scoring and routing pool)']].concat(C.TEAM.map(function (t) { return [t, t]; })), a.v) + '</select>';
    if (a.type === 'task') return '<label class="sr" for="' + id + '">Task</label><input id="' + id + '" class="inp sm grow" value="' + esc(a.v) + '" data-ch="wa" data-k="v" data-i="' + i + '" autocomplete="off"><label class="sr" for="wa-d' + i + '">Due in</label><select id="wa-d' + i + '" class="sel sm" data-ch="wa" data-k="due" data-i="' + i + '">' + opts([[15, 'due in 15 min'], [60, 'in 1 hour'], [240, 'in 4 hours'], [1440, 'in 1 day'], [2880, 'in 2 days']], a.due || 60) + '</select>';
    if (a.type === 'template') return '<label class="sr" for="' + id + '">Template</label><select id="' + id + '" class="sel sm" data-ch="wa" data-k="v" data-i="' + i + '">' + opts(P().tpls.map(function (t) { return [t.id, (t.ch === 'wa' ? 'WhatsApp · ' : 'Email · ') + t.name]; }), a.v) + '</select>';
    if (a.type === 'field') return '<label class="sr" for="wa-f' + i + '">Field</label><select id="wa-f' + i + '" class="sel sm" data-ch="wa" data-k="f" data-i="' + i + '">' + opts([['priority', 'Priority'], ['handover', 'Handover status']], a.f) + '</select><span class="muted sm">to</span><label class="sr" for="' + id + '">Value</label><select id="' + id + '" class="sel sm" data-ch="wa" data-k="v" data-i="' + i + '">' + opts(C.DFIELDS[a.f || 'priority'].opts.map(function (o) { return [o, o]; }), a.v) + '</select>';
    if (a.type === 'notify') return '<label class="sr" for="' + id + '">Who</label><select id="' + id + '" class="sel sm" data-ch="wa" data-k="v" data-i="' + i + '">' + opts(C.TEAM.map(function (t) { return [t, t]; }).concat([['Operations', 'Operations channel'], ['Owner', 'The record owner']]), a.v) + '</select>';
    if (a.type === 'sequence') return '<label class="sr" for="' + id + '">Sequence</label><select id="' + id + '" class="sel sm" data-ch="wa" data-k="v" data-i="' + i + '">' + opts(P().seqs.map(function (s) { return [s.id, s.name]; }), a.v) + '</select>';
    if (a.type === 'reserve') return '<span class="muted sm">Writes the Halden Supply line items to <span class="mono">the Stockroom order feed</span></span>';
    return '';
  }
  function editor(w) {
    var ev = C.EVENTS[w.when.ev], obj = ev.obj, F = C.CFIELDS[obj] || {}, myRuns = P().runs.filter(function (r) { return r.wf === w.id; });
    var trig = '<div class="wn-b"><label class="sr" for="we-ev">Trigger</label><select id="we-ev" class="sel" data-ch="we" data-k="ev">' + opts(Object.keys(C.EVENTS).map(function (k) { return [k, C.EVENTS[k].label]; }), w.when.ev) + '</select>' + (w.when.ev === 'deal.stage' ? '<label class="sr" for="we-st">Stage</label><select id="we-st" class="sel" data-ch="we" data-k="stage">' + opts(stageOpts(), w.when.stage || '') + '</select>' : '') + '</div>';
    var conds = w.conds.map(function (c, i) {
      return '<li class="wc-row"><span class="wc-and">' + (i ? 'and' : 'if') + '</span><label class="sr" for="wc-f' + i + '">Field</label><select id="wc-f' + i + '" class="sel sm" data-ch="wc" data-k="f" data-i="' + i + '">' + opts(Object.keys(F).map(function (k) { return [k, F[k][0]]; }), c.f) + '</select><label class="sr" for="wc-o' + i + '">Operator</label><select id="wc-o' + i + '" class="sel sm" data-ch="wc" data-k="op" data-i="' + i + '">' + opts(Object.keys(C.OPS).map(function (k) { return [k, C.OPS[k]]; }), c.op) + '</select><label class="sr" for="wc-v' + i + '">Value</label>' + valInput(obj, c, i) + '<button type="button" class="ibtn" data-act="wc-del" data-i="' + i + '" aria-label="Remove condition">' + C.ic('x', 14) + '</button></li>';
    }).join('');
    var acts = w.acts.map(function (a, i) {
      return '<li class="wnode then" data-i="' + i + '"><span class="wdot" aria-hidden="true">' + C.ic(C.ACTIONS[a.type][1], 13) + '</span><div class="wn-c"><div class="wn-h"><span class="wn-k">Then</span><label class="sr" for="wa-t' + i + '">Action</label><select id="wa-t' + i + '" class="sel sm" data-ch="wa" data-k="type" data-i="' + i + '">' + opts(Object.keys(C.ACTIONS).map(function (k) { return [k, C.ACTIONS[k][0]]; }), a.type) + '</select><span class="grow"></span><button type="button" class="ibtn" data-act="wa-mv" data-d="-1" data-i="' + i + '" aria-label="Move action up"' + (i ? '' : ' disabled') + '>' + C.ic('arr-u', 14) + '</button><button type="button" class="ibtn" data-act="wa-mv" data-d="1" data-i="' + i + '" aria-label="Move action down"' + (i < w.acts.length - 1 ? '' : ' disabled') + '>' + C.ic('arr-d', 14) + '</button><button type="button" class="ibtn" data-act="wa-del" data-i="' + i + '" aria-label="Remove action">' + C.ic('trash', 14) + '</button></div><div class="wn-p">' + actParams(a, i) + '</div></div></li>';
    }).join('');
    var samples = obj === 'lead' ? C.S().leads.slice(0, 14).map(function (l) { return ['lead:' + l.id, l.name + ' · ' + C.SOURCES[l.source].label + ' · ₹' + l.budget + ' L']; }) : obj === 'deal' ? P().deals.slice(0, 16).map(function (d) { return ['deal:' + d.id, d.name.split(' — ').pop() + ' · ' + C.rs(C.dealVal(d))]; }) : P().contacts.slice(0, 12).map(function (c) { return ['contact:' + c.id, c.name]; });
    var u = WS(); if (!u.test || u.test.split(':')[0] !== obj) u.test = samples[0] ? samples[0][0] : '';
    return C.recBack('#/workflows', 'Workflows') +
      '<header class="rec-h wf-h"><div class="rec-id"><span class="deal-ic">' + C.ic('bolt', 20) + '</span><div><h1 class="sr">Workflow: ' + esc(w.name) + '</h1><label class="sr" for="we-n">Workflow name</label><input id="we-n" class="title-in" value="' + esc(w.name) + '" data-ch="we" data-k="name" autocomplete="off"><p class="muted">' + C.idChip(w.id) + ' · ' + (w.runs || 0) + ' runs · changes save as you go</p></div></div><div class="rec-act"><span class="sw-l">' + sw('wf-toggle', w.id, w.on, w.on ? 'Turn off' : 'Turn on') + (w.on ? 'On' : 'Off') + '</span><button type="button" class="btn sm ghost" data-act="wf-del">' + C.ic('trash', 13) + 'Delete</button></div></header>' +
      '<div class="wf-grid"><ol class="canvas" aria-label="Workflow steps">' +
      '<li class="wnode when"><span class="wdot" aria-hidden="true">' + C.ic(ev.ic, 13) + '</span><div class="wn-c"><div class="wn-h"><span class="wn-k">When</span></div>' + trig + '</div></li>' +
      '<li class="wnode if"><span class="wdot" aria-hidden="true">' + C.ic('filter', 13) + '</span><div class="wn-c"><div class="wn-h"><span class="wn-k">If</span>' + (w.conds.length ? '<span class="muted sm">all must match</span>' : '<span class="muted sm">no conditions — every ' + obj + ' qualifies</span>') + '</div>' + (conds ? '<ul class="wc">' + conds + '</ul>' : '') + '<button type="button" class="lnk" data-act="wc-add">' + C.ic('plus', 12) + ' Add condition</button></div></li>' +
      acts + '<li class="wnode add"><span class="wdot" aria-hidden="true">' + C.ic('plus', 13) + '</span><div class="wn-c"><button type="button" class="btn sm" data-act="wa-add">' + C.ic('plus', 13) + 'Add action</button></div></li><i class="spark" aria-hidden="true"></i></ol>' +
      '<aside class="wf-side"><section class="card"><div class="card-h"><div><h2>Test this rule</h2><p class="sub">A dry run: checks the conditions and lists what would happen. Nothing changes.</p></div></div><div class="field"><label for="wt-r">Test with this ' + obj + '</label><select id="wt-r" class="sel" data-ch="wt">' + opts(samples, u.test) + '</select></div><button type="button" class="btn pri sm" data-act="wt-run">' + C.ic('play', 13) + 'Run test</button><div id="wt-out" role="status" aria-live="polite"></div></section>' +
      '<section class="card"><div class="card-h"><div><h2>Recent runs</h2><p class="sub">' + myRuns.length + ' logged</p></div></div>' + (myRuns.length ? '<ol class="runmini">' + myRuns.slice(0, 6).map(function (r) { return '<li class="' + (r.skip ? 'skipped' : 'ok') + '"><a href="' + C.refHref(r.rec) + '">' + esc(r.rec.name) + '</a><span class="muted sm">' + (r.skip ? 'Skipped' : r.steps.length + ' steps') + ' · ' + C.rel(r.t) + '</span></li>'; }).join('') + '</ol>' : '<p class="empty sm">No runs yet.</p>') + '</section></aside></div>';
  }
  function cur() { return wfById(C.cur.arg); }
  C.chs.we = function (el) {
    var w = cur(), k = el.dataset.k;
    if (k === 'name') { w.name = el.value.trim() || 'Untitled workflow'; saved('Renamed'); $('#crumb').textContent = w.name; return; }
    if (k === 'ev') { w.when = { ev: el.value }; w.conds = []; if (el.value === 'deal.stage') w.when.stage = 'design'; }
    if (k === 'stage') w.when.stage = el.value;
    saved(); keep('#we-' + (k === 'stage' ? 'st' : 'ev'))();
  };
  C.chs.wc = function (el) {
    var w = cur(), c = w.conds[+el.dataset.i], k = el.dataset.k; c[k] = el.value;
    if (k === 'f') { var F = C.CFIELDS[C.EVENTS[w.when.ev].obj][c.f]; c.v = F[1] === 'sel' ? F[2][0][0] : F[1] === 'num' ? '5' : ''; c.op = F[1] === 'num' ? 'gte' : 'is'; }
    saved(); keep('#wc-' + (k === 'v' ? 'v' : k === 'op' ? 'o' : 'f') + el.dataset.i)();
  };
  C.acts['wc-add'] = function () { var w = cur(), obj = C.EVENTS[w.when.ev].obj, k = Object.keys(C.CFIELDS[obj])[0], F = C.CFIELDS[obj][k]; w.conds.push({ f: k, op: F[1] === 'num' ? 'gte' : 'is', v: F[1] === 'sel' ? F[2][0][0] : '' }); saved('Condition added'); keep('#wc-f' + (w.conds.length - 1))(); };
  C.acts['wc-del'] = function (el) { cur().conds.splice(+el.dataset.i, 1); saved('Condition removed'); keep('[data-act="wc-add"]')(); };
  var DEF = { assign: { v: 'round-robin' }, task: { v: 'Follow up', due: 60 }, template: { v: 'intro' }, field: { f: 'priority', v: 'High' }, notify: { v: 'Aarav Khanna' }, sequence: { v: 'SQ-1' }, reserve: { v: 'stockroom' } };
  C.chs.wa = function (el) {
    var w = cur(), i = +el.dataset.i, k = el.dataset.k, a = w.acts[i];
    if (k === 'type') { w.acts[i] = Object.assign({ type: el.value }, DEF[el.value]); }
    else if (k === 'due') a.due = +el.value; else if (k === 'f') { a.f = el.value; a.v = C.DFIELDS[a.f].opts[0]; } else a.v = el.value;
    saved(); keep('#wa-' + ({ type: 't', due: 'd', f: 'f' }[k] || 'v') + i)();
  };
  C.acts['wa-add'] = function () { var w = cur(); w.acts.push({ type: 'task', v: 'Follow up', due: 60 }); saved('Action added'); keep('#wa-t' + (w.acts.length - 1))(); };
  C.acts['wa-del'] = function (el) { var w = cur(); if (w.acts.length === 1) { C.toast('A workflow needs at least one action', { icon: 'x' }); return; } w.acts.splice(+el.dataset.i, 1); saved('Action removed'); keep('[data-act="wa-add"]')(); };
  C.acts['wa-mv'] = function (el) { var w = cur(), i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= w.acts.length) return; var t = w.acts[i]; w.acts[i] = w.acts[j]; w.acts[j] = t; saved('Reordered'); keep('#wa-t' + j)(); };
  C.acts['wf-del'] = function () { var w = cur(); C.dialog('Delete workflow', '<p>Delete “' + esc(w.name) + '”? Its run history stays for reference.</p>', 'Delete', function () { P().wf = P().wf.filter(function (x) { return x.id !== w.id; }); C.save(); location.hash = '#/workflows'; C.toast('Workflow deleted', { icon: 'trash' }); }); };
  C.chs.wt = function (el) { WS().test = el.value; };
  C.acts['wt-run'] = function () {
    var w = cur(), u = WS(), p = u.test.split(':'), obj = p[0], rec = obj === 'lead' ? C.lead(p[1]) : obj === 'deal' ? C.deal(p[1]) : C.contact(p[1]);
    if (!rec) return;
    var getv = function (f) { return obj === 'lead' ? (f === 'score' ? C.score(rec).pts : rec[f]) : obj === 'deal' ? (f === 'value' ? C.dealVal(rec) : f === 'pipeline' ? rec.pipe : f === 'owner' ? rec.owner : rec.fields[f]) : rec[f]; };
    var pass = true, lines = w.conds.map(function (c) {
      var v = getv(c.f), ok = (function () { var n = parseFloat(c.v); if (v == null) return c.op === 'not'; switch (c.op) { case 'is': return String(v).toLowerCase() === String(c.v).toLowerCase(); case 'not': return String(v).toLowerCase() !== String(c.v).toLowerCase(); case 'gte': return +v >= n; case 'lte': return +v <= n; case 'in': return String(c.v).toLowerCase().split(',').map(function (s) { return s.trim(); }).indexOf(String(v).toLowerCase()) > -1; case 'contains': return String(v).toLowerCase().indexOf(String(c.v).toLowerCase()) > -1; } return false; })();
      if (!ok) pass = false; return '<li class="' + (ok ? 'ok' : 'no') + '">' + C.ic(ok ? 'check' : 'x', 12) + esc(C.condText(obj, c)) + ' <span class="muted">(is ' + esc(c.f === 'value' ? C.rs(+v) : c.f === 'source' ? (C.SOURCES[v] || {}).label : v) + ')</span></li>';
    });
    var stageOk = w.when.ev !== 'deal.stage' || !w.when.stage || true;
    $('#wt-out').innerHTML = '<ul class="wt">' + (lines.join('') || '<li class="ok">' + C.ic('check', 12) + 'No conditions</li>') + '</ul>' + (pass && stageOk ? '<p class="wt-r ok"><b>Would run ' + w.acts.length + ' action' + (w.acts.length > 1 ? 's' : '') + ':</b></p><ol class="wt-a">' + w.acts.map(function (a) { return '<li>' + esc(C.actText(a)) + '</li>'; }).join('') + '</ol>' : '<p class="wt-r no"><b>Would skip.</b> A condition does not match.</p>') + (w.on ? '' : '<p class="hint">This workflow is off, so it will not run on real events until you turn it on.</p>');
    if (C.motion() && pass) pulse();
  };
  function pulse() {
    var sp = $('.canvas .spark'), nodes = $$('.canvas .wnode:not(.add)'); if (!sp || !nodes.length || !C.motion()) return;
    var base = $('.canvas').getBoundingClientRect(), last = nodes[nodes.length - 1].getBoundingClientRect();
    gsap.killTweensOf(sp); gsap.set(sp, { opacity: 1, y: 0 });
    gsap.to(sp, { y: last.top - base.top + 4, duration: .3 * nodes.length + .3, ease: 'power1.inOut', onComplete: function () { gsap.to(sp, { opacity: 0, duration: .3 }); } });
    nodes.forEach(function (n, i) { var d = n.querySelector('.wdot'); gsap.fromTo(d, { boxShadow: '0 0 0 0 rgba(79,70,229,.5)' }, { boxShadow: '0 0 0 8px rgba(79,70,229,0)', duration: .6, delay: .3 * i + .1, clearProps: 'boxShadow' }); });
  }

  // ---- stage gates --------------------------------------------------------------
  function gatesView() {
    var L = P().gates, log = P().gateLog;
    var flow = Object.keys(C.PIPES).map(function (k) {
      return '<div class="gflow"><h3 class="h3">' + C.PIPES[k].label + '</h3><ol>' + C.PIPES[k].stages.filter(function (s) { return !s.lost; }).map(function (s) { var g = L.filter(function (x) { return x.pipe === k && x.stage === s.id && x.on; })[0]; return '<li class="' + (g ? 'g' : '') + '"><span>' + (g ? C.ic('lock', 11) : '') + esc(s.label) + '</span>' + (g ? '<small>needs ' + esc(C.DFIELDS[g.field].label.toLowerCase()) + '</small>' : '') + '</li>'; }).join('') + '</ol></div>';
    }).join('');
    var blocked = log.filter(function (x) { return x.res === 'blocked'; }).length, passed = log.filter(function (x) { return x.res === 'passed'; }).length;
    return '<section class="card"><div class="card-h"><div><h2>How deals must move</h2><p class="sub">A gate stops a deal entering a stage (or skipping past it) until a field is filled. The deal page shows the reason and an inline form to satisfy it.</p></div></div>' + flow + '</section>' +
      '<section class="card flush"><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">On</th><th scope="col">Pipeline</th><th scope="col">Before entering</th><th scope="col">Required field</th><th scope="col">Why (shown to the rep)</th><th scope="col"><span class="sr">Remove</span></th></tr></thead><tbody>' + L.map(function (g, i) {
        return '<tr><td>' + sw('gate-toggle', g.id, g.on, (g.on ? 'Turn off gate ' : 'Turn on gate ') + C.gateText(g)) + '</td><td>' + C.PIPES[g.pipe].label + '</td><td><b>' + esc(C.pstage(g.pipe, g.stage).label) + '</b></td><td>' + esc(C.DFIELDS[g.field].label) + '</td><td class="muted">' + esc(g.why) + '</td><td><button type="button" class="ibtn" data-act="gate-del" data-i="' + i + '" aria-label="Remove gate">' + C.ic('trash', 14) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<form class="gate-add" data-form="gate-add"><b class="sm">Add a gate</b><label class="sr" for="ga-p">Pipeline</label><select id="ga-p" name="pipe" class="sel sm">' + opts(Object.keys(C.PIPES).map(function (k) { return [k, C.PIPES[k].label]; }), 'sales') + '</select><label class="sr" for="ga-s">Stage</label><select id="ga-s" name="stage" class="sel sm">' + opts(stageOpts().slice(1), 'negotiation') + '</select><label class="sr" for="ga-f">Field</label><select id="ga-f" name="field" class="sel sm">' + opts(Object.keys(C.DFIELDS).map(function (k) { return [k, C.DFIELDS[k].label]; }), 'priority') + '</select><label class="sr" for="ga-w">Why</label><input id="ga-w" name="why" class="inp sm grow" placeholder="Explain it in one line for the team" autocomplete="off"><button class="btn sm">Add gate</button></form></section>' +
      '<section class="card"><div class="card-h"><div><h2>Gate activity</h2><p class="sub">' + blocked + ' blocked · ' + passed + ' satisfied and moved on</p></div></div><ul class="mlist">' + log.slice(0, 8).map(function (x) { return '<li><span class="' + (x.res === 'passed' ? 'ok-t' : 'late') + '">' + (x.res === 'passed' ? 'Passed' : 'Blocked') + '</span><span class="tr grow">' + esc(x.d) + '</span><span class="muted sm nw">' + esc(x.by.split(' ')[0]) + ' · ' + C.rel(x.t) + '</span></li>'; }).join('') + '</ul></section>';
  }
  C.acts['gate-toggle'] = function (el) { var g = P().gates.filter(function (x) { return x.id === el.dataset.id; })[0]; g.on = !g.on; saved('Gate ' + (g.on ? 'on' : 'off') + ': ' + C.gateText(g)); keep('[data-act="gate-toggle"][data-id="' + g.id + '"]')(); };
  C.acts['gate-del'] = function (el) { var g = P().gates.splice(+el.dataset.i, 1)[0]; saved('Gate removed'); C.rerender(); C.toast('Removed: ' + C.gateText(g), { icon: 'trash', undo: function () { P().gates.splice(+el.dataset.i, 0, g); C.save(); C.rerender(); } }); };
  C.forms['gate-add'] = function (f) {
    var pipe = f.elements.pipe.value, st = f.elements.stage.value;
    if (!C.pstage(pipe, st)) { C.toast('That stage is not in the ' + C.PIPES[pipe].label + ' pipeline', { icon: 'x' }); return; }
    P().gates.push({ id: C.nextId(P().gates, 'G-', 0), pipe: pipe, stage: st, field: f.elements.field.value, on: true, why: f.elements.why.value.trim() || 'Required by the team’s process.' });
    saved('Gate added'); C.rerender();
  };

  // ===== Sequences ===============================================================
  function stats(s) {
    var sent = 0, op = 0, rp = 0, cl = 0; s.enr.forEach(function (e) { e.log.forEach(function (x) { sent++; if (x.opened) op++; if (x.replied) rp++; if (x.clicked) cl++; }); });
    return { n: s.enr.length, active: s.enr.filter(function (e) { return e.status === 'active'; }).length, sent: sent, open: sent ? op / sent * 100 : 0, reply: sent ? rp / sent * 100 : 0, click: sent ? cl / sent * 100 : 0 };
  }
  V.sequences = {
    title: function () { var s = C.cur && C.cur.arg && seqById(C.cur.arg); return s ? s.name : 'Sequences'; },
    render: function () { var s = C.cur.arg && seqById(C.cur.arg); return s ? seqPage(s) : seqList(); }
  };
  function chIc(ch) { return '<span class="chb ' + ch + '">' + C.ic(ch === 'wa' ? 'wa' : 'mail', 12) + '</span>'; }
  function seqList() {
    return page('Sequences', 'Multi-step email and WhatsApp follow-ups that stop when someone replies', '<button type="button" class="btn pri" data-act="seq-new">' + C.ic('plus', 14) + 'New sequence</button>') +
      '<div class="seq-grid">' + P().seqs.map(function (s) {
        var st = stats(s);
        return '<a class="card seqc' + (s.on ? '' : ' off') + '" href="#/sequences/' + s.id + '"><div class="seqc-h"><b>' + esc(s.name) + '</b><span class="pill ' + (s.on ? 'st-won' : '') + '">' + (s.on ? 'Live' : 'Paused') + '</span></div><div class="seqc-steps">' + s.steps.map(function (x, i) { return (i ? '<i>' + (x.wait ? '+' + x.wait + 'd' : '') + '</i>' : '') + chIc(x.ch); }).join('') + '</div><dl class="seqc-k"><div><dt>Enrolled</dt><dd>' + st.n + '</dd></div><div><dt>Active</dt><dd>' + st.active + '</dd></div><div><dt>Opened</dt><dd>' + Math.round(st.open) + '%</dd></div><div><dt>Replied</dt><dd>' + Math.round(st.reply) + '%</dd></div></dl></a>';
      }).join('') + '</div><p class="hint">Opens, clicks and replies update as the sequence runs.</p>';
  }
  C.acts['seq-new'] = function () { var s = { id: C.nextId(P().seqs, 'SQ-', 0), name: 'Untitled sequence', on: false, exitOnReply: true, steps: [{ ch: 'wa', wait: 0, tpl: 'intro' }], enr: [] }; P().seqs.push(s); C.save(); location.hash = '#/sequences/' + s.id; };
  function seqPage(s) {
    var st = stats(s), sample = C.contact((s.enr[0] || {}).c) || P().contacts[0];
    var steps = s.steps.map(function (x, i) {
      var t = C.tpl(x.tpl) || P().tpls[0], sentN = s.enr.filter(function (e) { return e.log.some(function (l) { return l.step === i; }); }).length, opN = s.enr.filter(function (e) { return e.log.some(function (l) { return l.step === i && l.opened; }); }).length;
      return (i ? '<li class="sq-wait"><label for="sq-w' + i + '">Wait</label><select id="sq-w' + i + '" class="sel sm" data-ch="sq" data-k="wait" data-i="' + i + '">' + opts([[1, '1 day'], [2, '2 days'], [3, '3 days'], [4, '4 days'], [7, '1 week']], x.wait) + '</select><span class="muted sm">then</span></li>' : '') +
        '<li class="sq-step"><span class="sq-n">' + (i + 1) + '</span><div class="sq-b"><div class="sq-h">' + chIc(x.ch) + '<label class="sr" for="sq-c' + i + '">Channel</label><select id="sq-c' + i + '" class="sel sm" data-ch="sq" data-k="ch" data-i="' + i + '">' + opts([['wa', 'WhatsApp'], ['email', 'Email']], x.ch) + '</select><label class="sr" for="sq-t' + i + '">Template</label><select id="sq-t' + i + '" class="sel sm grow" data-ch="sq" data-k="tpl" data-i="' + i + '">' + opts(P().tpls.filter(function (t) { return t.ch === x.ch; }).map(function (t) { return [t.id, t.name]; }), x.tpl) + '</select><span class="muted sm nw">' + sentN + ' sent · ' + (sentN ? Math.round(opN / sentN * 100) : 0) + '% opened</span><button type="button" class="ibtn" data-act="sq-del" data-i="' + i + '" aria-label="Remove step ' + (i + 1) + '">' + C.ic('trash', 14) + '</button></div>' +
        '<div class="msg-prev ' + x.ch + '">' + (t.subject ? '<b>' + esc(C.fill(t.subject, sample)) + '</b>' : '') + '<p>' + esc(C.fill(t.body, { name: sample.name, owner: sample.owner, city: sample.city })).replace(/\n/g, '<br>') + '</p></div></div></li>';
    }).join('');
    var rows = s.enr.map(function (e, i) {
      var last = e.log[e.log.length - 1];
      return '<tr><td>' + (e.c ? '<a href="#/contacts/' + e.c + '">' : '<a href="#/sequences/' + e.lead + '">') + esc(C.enrolName(e)) + '</a></td><td><span class="st-' + e.status + '">' + e.status + '</span></td><td class="num">' + Math.min(e.step + (e.status === 'active' ? 1 : 0), s.steps.length) + ' / ' + s.steps.length + '</td><td>' + (last ? (last.replied ? '<span class="ok-t">' + C.ic('reply', 12) + 'Replied</span>' : last.opened ? C.ic('eye', 12) + ' Opened' : '<span class="muted">Sent</span>') : '<span class="muted">Not started</span>') + '</td><td class="muted nw">' + (e.status === 'active' && e.next ? C.rel(e.next).replace('ago', 'overdue') : '—') + '</td><td>' + (e.status === 'active' || e.status === 'paused' ? '<button type="button" class="btn sm ghost" data-act="sq-pause" data-i="' + i + '">' + (e.status === 'paused' ? 'Resume' : 'Pause') + '</button>' : '') + '</td></tr>';
    }).join('');
    return C.recBack('#/sequences', 'Sequences') +
      '<header class="rec-h"><div class="rec-id"><span class="deal-ic">' + C.ic('flow', 20) + '</span><div><h1 class="sr">Sequence: ' + esc(s.name) + '</h1><label class="sr" for="sq-name">Sequence name</label><input id="sq-name" class="title-in" value="' + esc(s.name) + '" data-ch="sq" data-k="name" autocomplete="off"><p class="muted">' + C.idChip(s.id) + ' · ' + s.steps.length + ' steps over ' + s.steps.reduce(function (a, x) { return a + (x.wait || 0); }, 0) + ' days · ' + C.simTag + '</p></div></div><div class="rec-act"><span class="sw-l">' + sw('sq-toggle', s.id, s.on, s.on ? 'Pause sequence' : 'Turn sequence on') + (s.on ? 'Live' : 'Paused') + '</span><button type="button" class="btn sm" data-act="sq-enrol">' + C.ic('user', 13) + 'Enrol contacts</button><button type="button" class="btn sm pri" data-act="sq-sim">' + C.ic('play', 13) + 'Run one day</button></div></header>' +
      '<div class="kpis"><div><span>Enrolled</span><b>' + st.n + '</b><small>' + st.active + ' active</small></div><div><span>Messages sent</span><b>' + st.sent + '</b><small>last 30 days</small></div><div><span>Open rate</span><b>' + Math.round(st.open) + '%</b><small>' + Math.round(st.click) + '% clicked</small></div><div><span>Reply rate</span><b>' + Math.round(st.reply) + '%</b><small>' + (s.exitOnReply ? 'replies exit the sequence' : 'replies stay enrolled') + '</small></div></div>' +
      '<div class="sq-grid"><section class="card"><div class="card-h"><div><h2>Steps</h2><p class="sub">Preview uses ' + esc(sample.name) + '’s details for the merge fields</p></div></div><ol class="sq">' + steps + '</ol><div class="sq-foot"><button type="button" class="btn sm" data-act="sq-add" data-v="wa">' + C.ic('wa', 13) + 'Add WhatsApp step</button><button type="button" class="btn sm" data-act="sq-add" data-v="email">' + C.ic('mail', 13) + 'Add email step</button><label class="chk"><input type="checkbox" data-ch="sq" data-k="exit"' + (s.exitOnReply ? ' checked' : '') + '> Stop when they reply</label></div></section>' +
      '<section class="card flush"><div class="card-h pad"><div><h2>Enrolled</h2><p class="sub">' + st.n + ' people</p></div></div>' + (rows ? '<div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">Person</th><th scope="col">Status</th><th scope="col" class="num">Step</th><th scope="col">Last message</th><th scope="col">Next send</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="empty">Nobody enrolled yet.</p>') + '</section></div>';
  }
  function curSeq() { return seqById(C.cur.arg); }
  C.chs.sq = function (el) {
    var s = curSeq(), k = el.dataset.k, i = +el.dataset.i;
    if (k === 'name') { s.name = el.value.trim() || 'Untitled sequence'; saved('Renamed'); return; }
    if (k === 'exit') { s.exitOnReply = el.checked; saved(); C.rerender(); return; }
    var x = s.steps[i]; if (k === 'wait') x.wait = +el.value; else if (k === 'ch') { x.ch = el.value; x.tpl = P().tpls.filter(function (t) { return t.ch === x.ch; })[0].id; } else x[k] = el.value;
    saved(); keep('#sq-' + ({ wait: 'w', ch: 'c', tpl: 't' }[k]) + i)();
  };
  C.acts['sq-add'] = function (el) { var s = curSeq(), ch = el.dataset.v; s.steps.push({ ch: ch, wait: 2, tpl: P().tpls.filter(function (t) { return t.ch === ch; })[0].id }); saved('Step added'); keep('#sq-t' + (s.steps.length - 1))(); };
  C.acts['sq-del'] = function (el) { var s = curSeq(); if (s.steps.length === 1) { C.toast('A sequence needs at least one step', { icon: 'x' }); return; } s.steps.splice(+el.dataset.i, 1); s.steps[0].wait = 0; saved('Step removed'); C.rerender(); };
  C.acts['sq-toggle'] = function () { var s = curSeq(); s.on = !s.on; saved(s.name + (s.on ? ' is live' : ' is paused')); C.rerender(); };
  C.acts['sq-pause'] = function (el) { var e = curSeq().enr[+el.dataset.i]; e.status = e.status === 'paused' ? 'active' : 'paused'; saved(); C.rerender(); };
  C.acts['sq-enrol'] = function () {
    var s = curSeq(), inS = {}; s.enr.forEach(function (e) { if (e.c) inS[e.c] = 1; });
    var L = P().contacts.filter(function (c) { return !inS[c.id]; }).slice(0, 40);
    C.dialog('Enrol in “' + esc(s.name) + '”', L.length ? '<fieldset class="pick"><legend class="sr">Contacts</legend>' + L.map(function (c) { return '<label class="chk">' + '<input type="checkbox" name="c" value="' + c.id + '"> ' + C.avatar(c.name, 20) + esc(c.name) + ' <span class="muted sm">' + esc(c.co ? C.company(c.co).name : c.role) + '</span></label>'; }).join('') + '</fieldset>' : '<p>Everyone is already enrolled.</p>', 'Enrol selected', function (fd) {
      var ids = fd.getAll('c'); if (!ids.length) return false;
      ids.forEach(function (id) { C.enrol(s.id, { c: id }); C.pact('seq', 'Enrolled in sequence “' + s.name + '”', { c: id, co: C.contact(id).co }, 'Aarav Khanna'); });
      C.save(); C.toast(ids.length + ' enrolled in ' + s.name, { icon: 'flow' }); setTimeout(C.rerender, 20);
    });
  };
  C.acts['sq-sim'] = function () {
    var s = curSeq(); if (!s.on) { C.toast('Turn the sequence on first', { icon: 'x' }); return; }
    var n = 0, op = 0, rp = 0, R = Math.random;
    s.enr.forEach(function (e) {
      if (e.status !== 'active' || e.step >= s.steps.length) return;
      var x = s.steps[e.step], o = R() < .66, r = o && R() < .2, t = C.tpl(x.tpl);
      e.log.push({ step: e.step, t: Date.now(), opened: o, clicked: o && R() < .3, replied: r }); e.step++; n++; if (o) op++; if (r) rp++;
      if (e.c) C.pact(x.ch === 'wa' ? 'wa' : 'email', (x.ch === 'wa' ? 'WhatsApp' : 'Email') + ' “' + t.name + '” sent by sequence “' + s.name + '”' + (r ? ' · replied' : o ? ' · opened' : ''), { c: e.c, co: (C.contact(e.c) || {}).co }, 'Lumen');
      if (r && s.exitOnReply) { e.status = 'replied'; e.next = null; } else if (e.step >= s.steps.length) { e.status = 'finished'; e.next = null; } else e.next = Date.now() + (s.steps[e.step].wait || 1) * 864e5;
    });
    C.save(); C.rerender();
    C.toast(n ? 'One day run: ' + n + ' sent · ' + op + ' opened · ' + rp + ' replied' : 'No active enrolments left to send to', { icon: 'send' });
  };

  // ===== Scoring and routing ======================================================
  V.routing = {
    title: function () { return 'Scoring and routing'; },
    render: function () {
      var R = P().route, L = C.S().leads, open = L.filter(function (l) { return l.status !== 'won' && l.status !== 'lost'; });
      var sc = open.map(function (l) { return { l: l, s: C.score(l) }; }).sort(function (a, b) { return b.s.pts - a.s.pts; });
      var band = { hot: 0, warm: 0, cold: 0 }; sc.forEach(function (x) { band[x.s.band]++; });
      var waiting = L.filter(function (l) { return l.resp == null && l.status === 'new'; }).sort(function (a, b) { return b.created - a.created; });
      var recent = L.filter(function (l) { return l.resp != null && Date.now() - l.created < 30 * 864e5; }), met = recent.filter(function (l) { return l.resp <= R.sla; }).length;
      var resp = recent.map(function (l) { return l.resp; }).sort(function (a, b) { return a - b; }), med = resp.length ? resp[Math.floor(resp.length / 2)] : null, next = C.rrNext(true);
      return page('Scoring and routing', 'Who gets each new lead, how hot it is, and how fast someone replies', '<button type="button" class="btn" data-act="sim-lead" data-src="web">' + C.ic('form', 14) + 'New form lead</button><button type="button" class="btn pri" data-act="sim-lead" data-src="whatsapp">' + C.ic('wa', 14) + 'New WhatsApp lead</button>') +
        '<div class="kpis"><div><span>Reply target</span><b>' + R.sla + ' min</b><small>first response</small></div><div><span>Met target</span><b>' + (recent.length ? Math.round(met / recent.length * 100) : 0) + '%</b><small>last 30 days · ' + met + ' of ' + recent.length + '</small></div><div><span>Median first reply</span><b>' + C.fmtMin(med) + '</b><small>last 30 days</small></div><div><span>Hot · warm · cold</span><b>' + band.hot + ' · ' + band.warm + ' · ' + band.cold + '</b><small>open leads</small></div></div>' +
        '<div class="rt-grid">' +
        '<section class="card sla"><div class="card-h"><div><h2>Waiting for a first reply</h2><p class="sub">Timers turn amber at half the target and red when it is missed</p></div><label class="sr" for="sla-t">Target</label><select id="sla-t" class="sel sm" data-ch="sla">' + opts([[5, '5 min'], [15, '15 min'], [30, '30 min'], [60, '1 hour']], R.sla) + '</select></div>' +
        (waiting.length ? '<ul class="slal">' + waiting.slice(0, 9).map(function (l) { var s = C.sla(l); return '<li><a href="#/routing/' + l.id + '" class="grow"><span class="lc">' + C.avatar(l.name, 26) + '<span><b>' + esc(l.name) + '</b><small class="muted">' + C.SOURCES[l.source].label + ' · ' + esc(l.owner.split(' ')[0]) + ' · score ' + C.score(l).pts + '</small></span></span></a><span class="slaw"><b class="slat ' + s.state + '" data-sla="' + l.id + '">' + C.clock(s.min) + '</b><span class="slab"><i style="width:' + Math.min(100, s.min / s.tgt * 100) + '%"></i></span></span><button type="button" class="btn sm" data-act="sla-reply" data-id="' + l.id + '">Mark replied</button></li>'; }).join('') + '</ul>' : '<p class="empty">Everyone has had a reply. Add a lead to watch the timer.</p>') + '</section>' +
        '<section class="card"><div class="card-h"><div><h2>Round-robin</h2><p class="sub">New leads rotate through the people switched on, skipping anyone at capacity</p></div></div><ul class="rr">' + R.pool.map(function (p, i) {
          var load = L.filter(function (l) { return l.owner === p.name && l.status === 'new'; }).length;
          return '<li class="' + (p.on ? '' : 'off') + (p.name === next && p.on ? ' next' : '') + '">' + sw('rr-toggle', String(i), p.on, (p.on ? 'Take ' : 'Put ') + p.name + (p.on ? ' out of' : ' into') + ' the rotation') + C.avatar(p.name, 26) + '<span class="grow"><b>' + esc(p.name) + '</b><small class="muted">' + load + ' new leads waiting' + (p.name === next && p.on ? ' · <b class="acc">next up</b>' : '') + '</small></span><span class="rr-cap"><label for="rr-c' + i + '" class="muted sm">Cap</label><input id="rr-c' + i + '" class="inp sm qty" type="number" min="1" max="50" value="' + p.cap + '" data-ch="rr-cap" data-i="' + i + '"></span><span class="rr-bar" aria-hidden="true"><i style="width:' + Math.min(100, load / p.cap * 100) + '%"></i></span></li>';
        }).join('') + '</ul><p class="hint">Workflow “First reply for every new lead” uses this pool.</p></section>' +
        '<section class="card span2"><div class="card-h"><div><h2>Lead scoring rules</h2><p class="sub">Points add up to a score from 0 to 100 · 60+ is hot, 35+ is warm · changes rescore every lead instantly</p></div></div><div class="sc-grid"><div class="tablewrap"><table class="tbl dense"><thead><tr><th scope="col">On</th><th scope="col">Rule</th><th scope="col" class="num">Points</th><th scope="col" class="num">Leads hit</th></tr></thead><tbody>' + P().score.map(function (r, i) {
          var hits = open.filter(function (l) { return C.score(l).hits.indexOf(r) > -1; }).length;
          return '<tr class="' + (r.on ? '' : 'off') + '"><td>' + sw('sc-toggle', String(i), r.on, (r.on ? 'Turn off ' : 'Turn on ') + r.label) + '</td><td>' + esc(r.label) + '</td><td class="num"><label class="sr" for="sc-p' + i + '">Points for ' + esc(r.label) + '</label><input id="sc-p' + i + '" class="inp sm qty ' + (r.pts < 0 ? 'neg' : '') + '" type="number" min="-50" max="50" value="' + r.pts + '" data-ch="sc-pts" data-i="' + i + '"></td><td class="num muted">' + hits + '</td></tr>';
        }).join('') + '</tbody></table></div><div><h3 class="h3">Top open leads</h3><ol class="toplead">' + sc.slice(0, 8).map(function (x) { return '<li><a href="#/routing/' + x.l.id + '"><span class="tr">' + esc(x.l.name) + '</span><span class="score ' + x.s.band + '">' + x.s.pts + '</span></a><span class="tlb" aria-hidden="true"><i class="' + x.s.band + '" style="width:' + x.s.pts + '%"></i></span><small class="muted">' + esc(x.s.hits.slice(0, 3).map(function (h) { return h.label.toLowerCase(); }).join(' · ') || 'no rules matched') + '</small></li>'; }).join('') + '</ol></div></div></section></div>';
    }
  };
  C.chs.sla = function (el) { P().route.sla = +el.value; saved('Reply target set to ' + el.value + ' min'); keep('#sla-t')(); };
  C.acts['sla-reply'] = function (el) { var l = C.lead(el.dataset.id); C.log(l, 'call', 'First reply logged from Scoring and routing'); C.setStatus(l, 'contacted'); C.rerender(); C.toast('First reply for ' + l.name + ' in ' + C.fmtMin(l.resp), { icon: 'check' }); };
  C.acts['rr-toggle'] = function (el) { var p = P().route.pool[+el.dataset.id]; p.on = !p.on; if (!P().route.pool.some(function (x) { return x.on; })) { p.on = true; C.toast('Keep at least one person in the rotation', { icon: 'x' }); return; } saved(p.name + (p.on ? ' is in the rotation' : ' is out of the rotation')); keep('[data-act="rr-toggle"][data-id="' + el.dataset.id + '"]')(); };
  C.chs['rr-cap'] = function (el) { P().route.pool[+el.dataset.i].cap = Math.max(1, +el.value || 1); saved(); keep('#rr-c' + el.dataset.i)(); };
  C.acts['sc-toggle'] = function (el) { var r = P().score[+el.dataset.id]; r.on = !r.on; saved('Rescored all leads'); keep('[data-act="sc-toggle"][data-id="' + el.dataset.id + '"]')(); };
  C.chs['sc-pts'] = function (el) { P().score[+el.dataset.i].pts = Math.max(-50, Math.min(50, Math.round(+el.value || 0))); saved('Rescored all leads'); keep('#sc-p' + el.dataset.i)(); };
})();
