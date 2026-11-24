/* Sthira back office · Pipeline (board with drag, table with sort, saved views, column choice, previewed bulk actions),
   the lead slide-over (context first, the stage's next step, inline edits with Undo, notes, timeline) and the
   survey-scheduling queue in focus mode. */
(function () {
  'use strict';
  var BO = window.BO, D = BO.D, A = BO.A, $ = BO.$, $$ = BO.$$, esc = BO.esc, inr = BO.inr, NOW = BO.NOW, ic = BO.ic, DAY = 864e5;
  var crm = function () { return BO.crm; };
  var ENG = { Farah: 'Farah Siddiqui', Nikhil: 'Nikhil Menon', Rhea: 'Rhea Fernandes', Karthik: 'Karthik Gowda' };
  var short = function (full) { return String(full || '').split(' ')[0]; };
  var SLOTS = ['09:00', '10:30', '12:00', '15:00', '16:30'];
  function tag(l) { return l.source === 'Chat' ? '<span class="tg blue">' + ic('chat') + 'from chat</span>' : ''; }
  function spec(l) { return [l.type, l.area ? BO.num(l.area) + ' sq ft' : '', l.loc || l.city].filter(Boolean).join(' · '); }
  function stageTag(s) { return '<span class="tg st-' + s + '">' + BO.SN[s] + '</span>'; }

  /* ───────── moving and scheduling ───────── */
  function snap(l) { return JSON.stringify(l); }
  function restore(l, s, logLen) { var o = JSON.parse(s); Object.keys(l).forEach(function (k) { delete l[k]; }); Object.assign(l, o); var lg = BO.crm.log[l.id] || []; while (lg.length > logLen) lg.shift(); BO.save(); BO.refresh(); if (BO.so.isOpen() && cur === l.id) openLead(l.id); }
  BO.moveLead = function (id, stage) {
    var l = BO.lead(id); if (!l || l.stage === stage) return;
    if (stage === 'survey' && !l.survey) return openLead(id, 'schedule');
    if (stage === 'quote' && !l.quote) return openLead(id, 'quote');
    if (stage === 'project' && !l.project) return openLead(id, 'win');
    var s = snap(l), n = (BO.crm.log[id] || []).length, from = l.stage; l.stage = stage; l.fresh = false; if (stage !== 'lost') l.lost = '';
    BO.log(id, 'Moved from ' + BO.SN[from] + ' to ' + BO.SN[stage], 'move'); BO.save(); BO.refresh(); if (BO.so.isOpen() && cur === id) openLead(id);
    BO.toast(esc(l.name) + ' moved to <b>' + BO.SN[stage] + '</b>.', { undo: function () { restore(l, s, n); } });
  };
  function engLoad(k) { return BO.crm.leads.filter(function (l) { return l.survey && l.survey.who === ENG[k] && new Date(l.survey.when) >= NOW && new Date(l.survey.when) < NOW.getTime() + 7 * DAY; }).length; }
  function busy(day, slot, eng, except) { var w = day + 'T' + slot; return BO.crm.leads.filter(function (l) { return l.id !== except && l.survey && l.survey.who === ENG[eng] && String(l.survey.when).slice(0, 16) === w; })[0]; }
  function suggestEng(l) { var pref = { Pune: 'Rhea', Hyderabad: 'Nikhil' }[BO.studioOf(l)] || 'Karthik'; return pref; }
  function days7() { var out = []; for (var i = 1; i <= 7; i++) { var d = new Date(NOW.getTime() + i * DAY); out.push(d); } return out; }
  function pick(l, st) {
    st.eng = st.eng || suggestEng(l);
    if (!st.day) { var d = days7().filter(function (x) { return x.getDay() !== 0; })[0]; st.day = BO.ymd(d); }
    if (!st.slot || busy(st.day, st.slot, st.eng, l.id)) st.slot = SLOTS.filter(function (s) { return !busy(st.day, s, st.eng, l.id); })[0] || '';
    var dd = days7().map(function (d) { var k = BO.ymd(d), sun = d.getDay() === 0; return '<button type="button" class="chip-d' + (st.day === k ? ' on' : '') + '" data-act="pDay" data-v="' + k + '"' + (sun ? ' disabled title="No surveys on Sundays: sites are closed"' : '') + ' aria-pressed="' + (st.day === k) + '"><small>' + BO.dayName(d) + '</small><b>' + d.getDate() + '</b></button>'; }).join('');
    var ss = SLOTS.map(function (s) { var b = busy(st.day, s, st.eng, l.id), t = BO.hm(st.day + 'T' + s); return '<button type="button" class="chip-s' + (st.slot === s ? ' on' : '') + '" data-act="pSlot" data-v="' + s + '"' + (b ? ' disabled title="' + esc(short(ENG[st.eng]) + ' is at ' + b.name + '’s survey then') + '"' : '') + ' aria-pressed="' + (st.slot === s) + '">' + t + (b ? '<small>' + esc(short(b.name)) + '</small>' : '') + '</button>'; }).join('');
    var ee = Object.keys(ENG).map(function (k) { var n = engLoad(k); return '<button type="button" class="chip-e' + (st.eng === k ? ' on' : '') + '" data-act="pEng" data-v="' + k + '" aria-pressed="' + (st.eng === k) + '">' + BO.av(ENG[k], 'sm') + '<span><b>' + k + '</b><small>' + BO.plural(n, 'survey') + ' this week</small></span></button>'; }).join('');
    return '<div class="pick"><p class="pick-l">Day</p><div class="pick-r days">' + dd + '</div><p class="pick-l">Slot</p><div class="pick-r">' + ss + '</div><p class="pick-l">Engineer</p><div class="pick-r engs">' + ee + '</div>' +
      '<p class="pick-l"><label for="pNote">Note for ' + esc(st.eng) + '</label></p><input class="in" id="pNote" data-in="pNote" value="' + esc(st.note || '') + '" placeholder="Gate code, soil auger, who will be there"></div>';
  }
  function book(l, st, quiet) {
    if (!st.day || !st.slot) { BO.toast('Pick a day and a free slot first.', { bad: true }); return false; }
    var s = snap(l), n = (BO.crm.log[l.id] || []).length, when = st.day + 'T' + st.slot;
    l.survey = { when: when, who: ENG[st.eng], note: (st.note || '').trim() }; l.stage = 'survey'; l.next = 'Site survey with ' + st.eng; l.due = when; l.fresh = false; l.schedToday = true;
    BO.log(l.id, 'Site survey booked for ' + BO.dayName(when) + ' ' + A.date(when) + ', ' + BO.hm(when) + ' with ' + ENG[st.eng] + (l.survey.note ? '. Note: ' + l.survey.note : ''), 'move'); BO.save();
    if (!quiet) BO.toast('Survey booked: <b>' + esc(l.name) + '</b>, ' + BO.dayName(when) + ' ' + BO.hm(when) + ' with ' + st.eng + '.', { icon: 'cal', undo: function () { restore(l, s, n); } });
    return { undo: function () { restore(l, s, n); } };
  }

  /* ───────── the survey queue (focus mode) ───────── */
  var skipped = A.store.get('bo-skip', []), sess = { done: 0, skip: 0 }, fst = {};
  BO.surveyQueue = function () { return BO.crm.leads.filter(function (l) { return l.stage === 'enquiry' && BO.inStudio(l) && skipped.indexOf(l.id) < 0; }).sort(function (a, b) { return (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15) || new Date(a.at) - new Date(b.at); }); };
  function bookedList() {
    var B = BO.crm.leads.filter(function (l) { return l.stage === 'survey' && l.survey && BO.inStudio(l) && new Date(l.survey.when) >= NOW - 12 * 3600e3; }).sort(function (a, b) { return new Date(a.survey.when) - new Date(b.survey.when); });
    var W = BO.crm.leads.filter(function (l) { return l.stage === 'survey' && l.survey && BO.inStudio(l) && new Date(l.survey.when) < NOW && !l.findings; });
    var g = {}, order = []; B.forEach(function (l) { var k = BO.ymd(l.survey.when); if (!g[k]) { g[k] = []; order.push(k); } g[k].push(l); });
    return '<section class="cd" aria-labelledby="bkH"><div class="cd-h"><h2 id="bkH">Booked · next 7 days</h2><span class="meta">' + B.length + '</span></div>' + (B.length ? order.map(function (k) { return '<p class="grp-d">' + BO.dayName(k) + ' ' + A.date(k) + '</p><ul class="mini">' + g[k].map(function (l) { return '<li><button type="button" class="mini-r" data-act="lead" data-id="' + l.id + '"><span class="mini-t">' + BO.hm(l.survey.when) + '</span><span class="mini-b"><b>' + esc(l.name) + '</b><small>' + esc((l.loc || l.city) + ' · ' + l.survey.who) + '</small></span>' + BO.av(l.survey.who, 'sm') + '</button></li>'; }).join('') + '</ul>'; }).join('') : '<p class="none">Nothing booked yet this week.</p>') + '</section>' +
      (W.length ? '<section class="cd" aria-labelledby="wuH"><div class="cd-h"><h2 id="wuH">Write-ups due</h2><span class="meta red">' + W.length + '</span></div><ul class="mini">' + W.map(function (l) { return '<li><button type="button" class="mini-r" data-act="writeup" data-id="' + l.id + '"><span class="mini-t red">' + BO.dur(NOW - new Date(l.survey.when)) + '</span><span class="mini-b"><b>' + esc(l.name) + '</b><small>Surveyed ' + A.date(l.survey.when) + ' by ' + esc(short(l.survey.who)) + '</small></span><span class="b sm">Log findings</span></button></li>'; }).join('') + '</ul></section>' : '');
  }
  function focusCard() {
    var Q = BO.surveyQueue(), total = Q.length + sess.done + sess.skip, pos = sess.done + sess.skip + 1;
    if (!Q.length) return '<section class="focus done"><div class="fc-h"><span class="k">Survey queue</span><span class="k">' + (sess.done + sess.skip ? sess.done + ' scheduled · ' + sess.skip + ' skipped' : 'Nothing to schedule') + '</span></div><div class="fc-b">' + BO.empty('Queue clear', sess.done ? 'Every enquiry has a survey date. The engineers can see them in Booked.' : 'No enquiries are waiting for a survey' + (BO.studio !== 'All' ? ' in ' + BO.studio : '') + '. New ones from the website and chat land here automatically.', (skipped.length ? '<button type="button" class="b" data-act="unskip">Bring back ' + BO.plural(skipped.length, 'skipped lead') + '</button> ' : '') + '<a class="b" href="#/pipeline">Open the pipeline</a>') + '</div></section>';
    var l = Q[0], st = fst[l.id] = fst[l.id] || {}, last = BO.timeline(l)[0];
    var seg = ''; for (var i = 0; i < Math.min(total, 12); i++) seg += '<i class="' + (i < pos - 1 ? 'd' : i === pos - 1 ? 'c' : '') + '"></i>';
    return '<section class="focus" aria-live="polite" aria-labelledby="fcN"><div class="fc-h"><span class="k">Ready to schedule · ' + pos + ' of ' + total + '</span><span class="segs" aria-hidden="true">' + seg + '</span><span class="k">≈ ' + Q.length * 2 + ' m left · aim ≈ 2 m</span></div><div class="fc-b">' +
      '<div class="fc-t"><div><h2 id="fcN">' + esc(l.name) + '</h2><p>' + esc(spec(l)) + (l.loc ? ', ' + esc(l.city) : '') + ' · ' + esc(l.source) + ' · in ' + BO.rel(l.at).replace(' ago', '') + ' ago</p></div>' + tag(l) + '</div>' +
      (l.note ? '<blockquote class="remark"><p>' + esc(l.note) + '</p><footer>Last remark · ' + esc(last ? last.by : l.owner) + ', ' + esc(BO.rel(last ? last.at : l.at)) + '</footer></blockquote>' : '<p class="remark none">No remark yet. Ask what they want to build when you call.</p>') +
      '<div class="fc-c">' + (l.phone ? '<a class="b" href="tel:' + esc(l.phone.replace(/[^\d+]/g, '')) + '">' + ic('phone') + 'Call ' + esc(short(l.name)) + '</a>' : '<button type="button" class="add" data-act="addPhone">+ Add mobile</button>') + (l.email ? '<span class="mono">' + esc(l.email) + '</span>' : '') + '<span class="mono">' + esc(l.budget || 'Budget not given') + '</span>' + BO.dueChip(l.due) + '</div>' +
      pick(l, st) +
      '<div class="fc-f"><button type="button" class="b pri lg" data-act="saveNext">' + ic('check') + 'Save &amp; next<kbd>↵</kbd></button><button type="button" class="b" data-act="skip">' + ic('skip') + 'Skip<kbd>S</kbd></button><span class="grow"></span><button type="button" class="b ghost" data-act="open" data-id="' + l.id + '">Open record</button></div>' +
      '<div class="fc-o"><span>Couldn’t book?</span><button type="button" class="b sm" data-act="out" data-v="na">No answer · retry 4 pm</button><button type="button" class="b sm" data-act="out" data-v="later">Call back tomorrow</button><button type="button" class="b sm" data-act="out" data-v="lost">Not going ahead</button></div></div></section>';
  }
  function curQ() { return BO.surveyQueue()[0]; }
  BO.view('surveys', {
    title: 'Survey queue', skeleton: 'focus',
    render: function () {
      var Q = BO.surveyQueue();
      return '<div class="vh-row"><h1>Survey queue</h1><p class="meta">' + BO.plural(Q.length, 'enquiry', 'enquiries') + ' to schedule' + (BO.studio !== 'All' ? ' · ' + BO.studio : '') + ' · one at a time, last remark first</p></div><div class="fq-g"><div>' + focusCard() + '</div><div class="fq-r">' + bookedList() + '</div></div>';
    },
    keys: { enter: function (e) { if (curQ() && !e.target.closest('button,a')) { e.preventDefault(); this.acts.saveNext(); } }, s: function () { if (curQ()) this.acts.skip(); } },
    acts: {
      pDay: function (b) { var l = curQ(); fst[l.id].day = b.getAttribute('data-v'); BO.refresh(); },
      pSlot: function (b) { var l = curQ(); fst[l.id].slot = b.getAttribute('data-v'); BO.refresh(); },
      pEng: function (b) { var l = curQ(); fst[l.id].eng = b.getAttribute('data-v'); BO.refresh(); },
      pNote: function (i) { var l = curQ(); fst[l.id].note = i.value; },
      saveNext: function () { var l = curQ(); if (!l) return; var r = book(l, fst[l.id], true); if (!r) return; sess.done++; var nx = curQ(); BO.refresh(); BO.toast('Booked <b>' + esc(l.name) + '</b> · ' + BO.dayName(l.survey.when) + ' ' + BO.hm(l.survey.when) + ' with ' + short(l.survey.who) + '.' + (nx ? ' Next: ' + esc(nx.name) + '.' : ' Queue clear.'), { icon: 'cal', undo: function () { sess.done--; r.undo(); } }); },
      skip: function () { var l = curQ(); if (!l) return; skipped.push(l.id); A.store.set('bo-skip', skipped); sess.skip++; BO.refresh(); BO.toast('Skipped ' + esc(l.name) + ' for now.', { icon: 'skip', undo: function () { skipped = skipped.filter(function (x) { return x !== l.id; }); A.store.set('bo-skip', skipped); sess.skip--; BO.refresh(); } }); },
      unskip: function () { skipped = []; A.store.set('bo-skip', skipped); sess.skip = 0; BO.refresh(); },
      out: function (b) {
        var l = curQ(), v = b.getAttribute('data-v'), s = snap(l), n = (BO.crm.log[l.id] || []).length;
        if (v === 'lost') return lostModal(l, function () { sess.skip++; BO.refresh(); });
        var t = v === 'na' ? new Date('2026-11-24T16:00') : new Date('2026-11-25T11:00');
        BO.log(l.id, v === 'na' ? 'Call: no answer. Trying again at 4 pm' : 'Call: asked to call back tomorrow', 'call'); l.due = t.toISOString(); skipped.push(l.id); A.store.set('bo-skip', skipped); sess.skip++; BO.save(); BO.refresh();
        BO.toast('Logged. ' + esc(short(l.name)) + ' is due again ' + BO.due(l.due).t.toLowerCase() + '.', { icon: 'phone', undo: function () { skipped = skipped.filter(function (x) { return x !== l.id; }); A.store.set('bo-skip', skipped); sess.skip--; restore(l, s, n); } });
      },
      addPhone: function () { var l = curQ(); openLead(l.id, null, 'phone'); },
      open: function (b) { openLead(b.getAttribute('data-id')); },
      lead: function (b) { openLead(b.getAttribute('data-id')); },
      writeup: function (b) { openLead(b.getAttribute('data-id'), 'survey'); }
    }
  });

  /* ───────── pipeline ───────── */
  var PS = A.store.get('bo-pipe', null) || {}; PS.layout = PS.layout || 'board'; PS.cols = PS.cols || ['lead', 'stage', 'type', 'city', 'owner', 'source', 'next', 'due', 'value']; PS.sort = PS.sort || { k: 'due', d: 1 };
  function savePS() { A.store.set('bo-pipe', PS); }
  var FLAGS = { overdue: 'Overdue', new7: 'New this week', today: 'Due today', crore: 'Above ₹1 Cr' };
  function filt(r) { return { q: r.q.get('q') || '', owner: r.q.get('owner') || '', source: r.q.get('source') || '', stage: r.q.get('stage') || '', flag: r.q.get('flag') || '' }; }
  function match(l, f) {
    if (!BO.inStudio(l)) return false;
    if (f.owner && l.owner !== f.owner) return false;
    if (f.source && (l.source || '') !== f.source) return false;
    if (f.stage && l.stage !== f.stage) return false;
    if (f.flag === 'overdue' && !BO.isOver(l)) return false;
    if (f.flag === 'new7' && new Date(l.at) < NOW - 7 * DAY) return false;
    if (f.flag === 'today') { var e = new Date(NOW); e.setHours(23, 59, 59); if (!(l.due && new Date(l.due) <= e && l.stage !== 'lost' && l.stage !== 'project')) return false; }
    if (f.flag === 'crore' && !(l.quote && l.quote.total >= 1e7)) return false;
    if (f.q && (l.name + ' ' + l.id + ' ' + l.city + ' ' + (l.loc || '') + ' ' + l.type + ' ' + (l.note || '') + ' ' + (l.project ? l.project.code : '')).toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
    return true;
  }
  var COLS = [
    { k: 'lead', l: 'Lead', fixed: 1, v: function (l) { return l.name.toLowerCase(); }, c: function (l) { return '<b class="nm">' + esc(l.name) + '</b><small>' + l.id + (l.source === 'Chat' ? ' · <span class="tg blue sm">from chat</span>' : '') + '</small>'; } },
    { k: 'stage', l: 'Stage', v: function (l) { return ['enquiry', 'survey', 'quote', 'project', 'lost'].indexOf(l.stage); }, c: function (l) { return stageTag(l.stage); } },
    { k: 'type', l: 'Type', v: function (l) { return l.type; }, c: function (l) { return esc(l.type); } },
    { k: 'city', l: 'City · plot', v: function (l) { return l.city; }, c: function (l) { return esc(l.city) + (l.loc ? '<small>' + esc(l.loc) + '</small>' : ''); } },
    { k: 'area', l: 'Area', num: 1, v: function (l) { return +l.area || 0; }, c: function (l) { return l.area ? BO.num(l.area) : '<span class="faint">—</span>'; } },
    { k: 'budget', l: 'Budget', v: function (l) { return l.budget || ''; }, c: function (l) { return esc(l.budget || '—'); } },
    { k: 'owner', l: 'Owner', v: function (l) { return l.owner; }, c: function (l) { return BO.av(ENG[l.owner] || l.owner, 'sm') + esc(l.owner); } },
    { k: 'source', l: 'Source', v: function (l) { return l.source; }, c: function (l) { return esc(l.source || ''); } },
    { k: 'next', l: 'Next step', v: function (l) { return l.next || ''; }, c: function (l) { return '<span class="clip">' + esc(l.next || '—') + '</span>'; } },
    { k: 'due', l: 'Due', v: function (l) { return l.due ? new Date(l.due).getTime() : 9e15; }, c: function (l) { return BO.dueChip(l.due) || '<span class="faint">—</span>'; } },
    { k: 'value', l: 'Quote', num: 1, v: function (l) { return l.quote ? l.quote.total : 0; }, c: function (l) { return l.quote ? inr(l.quote.total) : '<span class="faint">—</span>'; } },
    { k: 'at', l: 'Received', num: 1, v: function (l) { return new Date(l.at).getTime(); }, c: function (l) { return A.date(l.at); } }
  ];
  function colDef(k) { return COLS.filter(function (c) { return c.k === k; })[0]; }
  var sel = {}, bulkPrev = null, curList = [];
  function card(l) {
    var extra = '';
    if (l.stage === 'survey' && l.survey) extra = '<p class="lc-x">' + ic('cal') + BO.dayName(l.survey.when) + ' ' + A.date(l.survey.when) + ', ' + BO.hm(l.survey.when) + ' · ' + esc(short(l.survey.who)) + (new Date(l.survey.when) < NOW && !l.findings ? ' <span class="tg red sm">write-up due</span>' : '') + '</p>';
    if (l.stage === 'quote' && l.quote) extra = '<p class="lc-x">' + ic('rupee') + '<b>' + inr(l.quote.total) + '</b> · v' + l.quote.version + ' · valid to ' + A.date(l.quote.valid) + '</p>';
    if (l.stage === 'project' && l.project) extra = '<p class="lc-x">' + ic('project') + '<b>' + esc(l.project.code) + '</b> · day ' + l.project.day + ' of ' + l.project.total + '</p><span class="meter"><i style="width:' + Math.round(l.project.day / l.project.total * 100) + '%"></i></span>';
    var d = BO.due(l.due);
    return '<article class="lc' + (l.fresh ? ' fresh' : '') + (d && d.c === 'over' && l.stage !== 'project' ? ' over' : '') + '" draggable="true" data-id="' + l.id + '" tabindex="0" aria-label="' + esc(l.name + ', ' + BO.SN[l.stage] + (d ? ', ' + d.t : '')) + '">' +
      '<div class="lc-t"><b>' + esc(l.name) + '</b>' + BO.av(ENG[l.owner] || l.owner, 'sm') + '</div><p class="lc-m">' + l.id + ' · ' + esc(l.source || '') + (l.fresh ? ' · <span class="new">new</span>' : '') + tag(l) + '</p><p class="lc-s">' + esc(spec(l)) + '</p>' + extra +
      (l.next && l.stage !== 'project' ? '<div class="lc-n"><span>' + esc(l.next) + '</span>' + (d ? '<span class="due ' + d.c + '">' + esc(d.t) + '</span>' : '') + '</div>' : '') +
      '<button type="button" class="ib lc-more" data-act="cardMenu" data-id="' + l.id + '" aria-label="Actions for ' + esc(l.name) + '" aria-haspopup="menu">' + ic('more') + '</button></article>';
  }
  function board(V, f) {
    var lost = V.filter(function (l) { return l.stage === 'lost'; });
    return '<div class="board" role="list">' + BO.ST.map(function (s) {
      var ls = V.filter(function (l) { return l.stage === s.k; }).sort(function (a, b) { return (a.due ? new Date(a.due) : 9e15) - (b.due ? new Date(b.due) : 9e15); });
      var sum = s.k === 'quote' ? inr(ls.reduce(function (a, l) { return a + (l.quote ? l.quote.total : 0); }, 0)) : s.k === 'enquiry' ? ls.filter(BO.isOver).length ? '<span class="red">' + ls.filter(BO.isOver).length + ' overdue</span>' : '' : '';
      return '<section class="col" role="listitem" aria-label="' + s.l + '"><header class="col-h"><span class="bub">' + s.g + '</span><h2>' + s.l + '</h2><span class="ct">' + ls.length + '</span><span class="sum">' + sum + '</span></header><div class="col-b" data-drop="' + s.k + '">' + (ls.map(card).join('') || '<p class="col-none">' + (f.q || f.owner || f.flag || f.source ? 'Nothing with these filters.' : 'Empty. Drag a card here.') + '</p>') + '</div></section>';
    }).join('') + '</div>' + (lost.length ? '<p class="lost-s">' + ic('x') + 'Lost: ' + lost.map(function (l) { return '<button type="button" class="lnk" data-act="lead" data-id="' + l.id + '">' + esc(l.name) + '</button> <span class="faint">(' + esc(l.lost || '') + ')</span>'; }).join(', ') + '</p>' : '');
  }
  function table(V) {
    var cols = PS.cols.map(colDef).filter(Boolean), s = PS.sort, sd = colDef(s.k) || colDef('due');
    V = V.slice().sort(function (a, b) { var x = sd.v(a), y = sd.v(b); return (x > y ? 1 : x < y ? -1 : 0) * s.d; });
    curList = V.map(function (l) { return l.id; });
    var all = V.length && V.every(function (l) { return sel[l.id]; }), some = V.some(function (l) { return sel[l.id]; });
    return '<div class="tw"><table class="tbl"><thead><tr><th class="cb"><input type="checkbox" data-ch="all" aria-label="Select all"' + (all ? ' checked' : '') + (some && !all ? ' data-ind="1"' : '') + '></th>' + cols.map(function (c) { var on = s.k === c.k; return '<th' + (c.num ? ' class="num"' : '') + ' aria-sort="' + (on ? (s.d > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-act="sort" data-k="' + c.k + '">' + c.l + (on ? '<span class="so-a">' + (s.d > 0 ? '↑' : '↓') + '</span>' : '') + '</button></th>'; }).join('') + '<th class="act"><span class="sr">Actions</span></th></tr></thead><tbody>' +
      (V.map(function (l) { return '<tr data-id="' + l.id + '" class="' + (sel[l.id] ? 'sel' : '') + (l.fresh ? ' fresh' : '') + '"><td class="cb"><input type="checkbox" data-ch="sel" data-id="' + l.id + '" aria-label="Select ' + esc(l.name) + '"' + (sel[l.id] ? ' checked' : '') + '></td>' + cols.map(function (c) { return '<td class="c-' + c.k + (c.num ? ' num' : '') + '">' + c.c(l) + '</td>'; }).join('') + '<td class="act"><button type="button" class="ib" data-act="cardMenu" data-id="' + l.id + '" aria-label="Actions for ' + esc(l.name) + '">' + ic('more') + '</button></td></tr>'; }).join('') || '<tr><td colspan="' + (cols.length + 2) + '">' + BO.empty('No leads match', 'Try clearing a filter, or switch the studio to All.', '<button type="button" class="b" data-act="clear">Clear filters</button>') + '</td></tr>') + '</tbody></table></div>';
  }
  function bulkBar() {
    var ids = Object.keys(sel).filter(function (k) { return sel[k]; });
    if (!ids.length) return '';
    return '<div class="bulk" role="region" aria-label="Bulk actions">' + (bulkPrev ? bulkPrev.html : '') + '<div class="bulk-r"><b>' + ids.length + ' selected</b><label class="sr" for="bAct">Action</label><select class="in sm" id="bAct" data-ch="bAct"><option value="">Choose an action…</option><optgroup label="Assign to">' + Object.keys(ENG).map(function (k) { return '<option value="o:' + k + '"' + (bulkPrev && bulkPrev.v === 'o:' + k ? ' selected' : '') + '>' + ENG[k] + '</option>'; }).join('') + '</optgroup><optgroup label="Follow-up">' + [['d:1', 'Push one day'], ['d:3', 'Push three days']].map(function (o) { return '<option value="' + o[0] + '"' + (bulkPrev && bulkPrev.v === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</optgroup><optgroup label="Stage"><option value="s:enquiry"' + (bulkPrev && bulkPrev.v === 's:enquiry' ? ' selected' : '') + '>Back to Enquiry</option><option value="s:lost"' + (bulkPrev && bulkPrev.v === 's:lost' ? ' selected' : '') + '>Mark lost</option></optgroup></select><button type="button" class="b pri sm" data-act="bPrev"' + (bulkPrev ? '' : ' disabled title="Choose what to do first"') + '>Preview</button><button type="button" class="b ghost sm" data-act="bClear">Clear</button></div></div>';
  }
  function preview(v) {
    var ids = Object.keys(sel).filter(function (k) { return sel[k]; }), k = v[0], arg = v.slice(2), ch = [], same = [];
    ids.forEach(function (id) { var l = BO.lead(id); if (!l) return; var c = k === 'o' ? l.owner !== arg : k === 's' ? l.stage !== arg && !(arg === 'enquiry' && l.stage === 'project') : l.stage !== 'lost' && l.stage !== 'project'; (c ? ch : same).push(l); });
    var what = k === 'o' ? 'reassigned to ' + ENG[arg] : k === 's' ? (arg === 'lost' ? 'marked lost' : 'moved back to Enquiry') : 'follow-up pushed by ' + BO.plural(+arg, 'day');
    var why = k === 'o' ? 'already with ' + short(ENG[arg]) : k === 's' ? (arg === 'lost' ? 'already lost' : 'already there or a live project') : 'live projects or lost, no follow-up';
    return { v: v, ch: ch, k: k, arg: arg, html: '<div class="bulk-p"><p><b>What this does:</b> ' + BO.plural(ch.length, 'lead') + ' ' + what + (same.length ? '; ' + same.length + ' ' + why + ', left as ' + (same.length === 1 ? 'it is' : 'they are') : '') + '.</p><p class="bulk-n">' + ch.map(function (l) { return '<span class="tg">' + esc(l.name) + '</span>'; }).join('') + (same.length ? same.map(function (l) { return '<span class="tg faint" title="Not changed">' + esc(l.name) + '</span>'; }).join('') : '') + '</p><div class="bulk-a"><button type="button" class="b pri sm" data-act="bApply"' + (ch.length ? '' : ' disabled title="Nothing would change"') + '>Apply to ' + BO.plural(ch.length, 'lead') + '</button><button type="button" class="b ghost sm" data-act="bCancel">Cancel</button></div></div>' };
  }
  function filterBar(f) {
    var R = BO.route(), owners = Object.keys(ENG), dirty = f.q || f.owner || f.source || f.stage || f.flag;
    var vs = BO.crm.views.map(function (v) { var on = sameF(v.f, f); return '<button type="button" class="vw' + (on ? ' on' : '') + '" data-act="view" data-id="' + v.id + '" aria-pressed="' + on + '">' + ic('star') + esc(v.name) + '</button>'; }).join('');
    return '<div class="fbar"><div class="srch">' + ic('search') + '<label class="sr" for="pq">Filter leads</label><input class="in sm" id="pq" type="search" placeholder="Filter by name, city, ID" value="' + esc(f.q) + '" data-in="q"></div>' +
      '<button type="button" class="fchip' + (f.owner ? ' on' : '') + '" data-act="owner" aria-haspopup="menu">' + (f.owner ? BO.av(ENG[f.owner], 'sm') + f.owner : ic('user') + 'Owner') + ic('chev-d') + '</button>' +
      '<button type="button" class="fchip' + (f.source ? ' on' : '') + '" data-act="source" aria-haspopup="menu">' + ic('filter') + (f.source || 'Source') + ic('chev-d') + '</button>' +
      (PS.layout === 'table' ? '<button type="button" class="fchip' + (f.stage ? ' on' : '') + '" data-act="stage" aria-haspopup="menu">' + ic('layers') + (f.stage ? BO.SN[f.stage] : 'Stage') + ic('chev-d') + '</button>' : '') +
      (f.flag ? '<button type="button" class="fchip on red" data-act="unflag">' + esc(FLAGS[f.flag] || f.flag) + ic('x') + '</button>' : '') +
      (dirty ? '<button type="button" class="lnk" data-act="clear">Clear</button>' : '') +
      '<span class="fb-sep" aria-hidden="true"></span><div class="vws" role="group" aria-label="Saved views">' + vs + (dirty && !BO.crm.views.some(function (v) { return sameF(v.f, f); }) ? '<button type="button" class="vw add" data-act="saveView">' + ic('plus') + 'Save view</button>' : '') + '</div>' +
      '<span class="grow"></span>' + (PS.layout === 'table' ? '<button type="button" class="fchip" data-act="cols" aria-haspopup="menu">' + ic('cols') + 'Columns</button>' : '') + '</div>';
  }
  function sameF(a, b) { var k = ['q', 'owner', 'source', 'stage', 'flag']; return k.every(function (x) { return (a[x] || '') === (b[x] || ''); }); }
  function setF(patch) { var r = BO.route(), f = filt(r); Object.assign(f, patch); var q = new URLSearchParams(); Object.keys(f).forEach(function (k) { if (f[k]) q.set(k, f[k]); }); sel = {}; bulkPrev = null; BO.go('pipeline' + (q.toString() ? '?' + q : '')); }
  function dnd(root) {
    var drag = null;
    $$('.lc', root).forEach(function (c) {
      c.addEventListener('dragstart', function (e) { drag = c.getAttribute('data-id'); c.classList.add('dragging'); e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move'; root.classList.add('dragging'); });
      c.addEventListener('dragend', function () { c.classList.remove('dragging'); root.classList.remove('dragging'); $$('.col-b.over', root).forEach(function (x) { x.classList.remove('over'); }); setTimeout(function () { drag = null; }, 30); });
    });
    $$('.col-b', root).forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', function (e) { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('over'); var id = e.dataTransfer.getData('text/plain') || drag; if (id) BO.moveLead(id, col.getAttribute('data-drop')); });
    });
    root.addEventListener('click', function (e) { var c = e.target.closest('.lc'); if (!c || e.target.closest('button,a')) return; openLead(c.getAttribute('data-id')); });
    root.addEventListener('keydown', function (e) { var c = e.target.closest('.lc'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLead(c.getAttribute('data-id')); } });
  }
  BO.view('pipeline', {
    title: 'Pipeline', skeleton: 'board',
    render: function (r) {
      if (r.q.get('layout') && r.q.get('layout') !== PS.layout) { PS.layout = r.q.get('layout'); savePS(); }
      var f = filt(r), L = BO.crm.leads.filter(function (l) { return match(l, f); }), V = PS.layout === 'board' || f.stage === 'lost' ? L : L.filter(function (l) { return l.stage !== 'lost'; });
      var open = L.filter(function (l) { return l.stage !== 'lost' && l.stage !== 'project'; }), qv = L.filter(function (l) { return l.stage === 'quote' && l.quote; }).reduce(function (a, l) { return a + l.quote.total; }, 0);
      if (PS.layout === 'board') curList = BO.ST.reduce(function (a, s) { return a.concat(V.filter(function (l) { return l.stage === s.k; }).map(function (l) { return l.id; })); }, []);
      return '<div class="vh-row"><h1>Pipeline</h1><p class="meta">' + BO.plural(open.length, 'open lead') + ' · ' + inr(qv) + ' in quotes' + (BO.studio !== 'All' ? ' · ' + BO.studio : '') + '</p><span class="grow"></span>' + '<div class="sg" role="group" aria-label="Layout"><button type="button" data-act="layout" data-v="board" aria-pressed="' + (PS.layout === 'board') + '">' + ic('board') + '<span>Board</span></button><button type="button" data-act="layout" data-v="table" aria-pressed="' + (PS.layout === 'table') + '">' + ic('table') + '<span>Table</span></button></div>' + '</div>' + filterBar(f) +
        '<div id="pv">' + (PS.layout === 'board' ? board(V, f) : table(V)) + '</div><div id="bulk">' + (PS.layout === 'table' ? bulkBar() : '') + '</div>';
    },
    mount: function (r, el) { var b = $('.board', el); if (b) dnd(b); var all = $('[data-ind]', el); if (all) all.indeterminate = true; $$('.tbl tbody tr[data-id]', el).forEach(function (tr) { tr.addEventListener('click', function (e) { if (e.target.closest('input,button,a,label')) return; openLead(tr.getAttribute('data-id')); }); }); },
    keys: { j: function () { var r = $('.lc,.tbl tbody tr[data-id]'); if (r) openLead(r.getAttribute('data-id')); } },
    acts: {
      q: function (i) { clearTimeout(i._t); i._t = setTimeout(function () { BO.setQ({ q: i.value }); var y = scrollY, pos = i.selectionStart; BO.refresh(); var n = $('#pq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } scrollTo(0, y); }, 160); },
      layout: function (b) { PS.layout = b.getAttribute('data-v'); savePS(); sel = {}; bulkPrev = null; BO.setQ({ layout: '' }); BO.refresh(); },
      owner: function (b) { var f = filt(BO.route()); BO.menu(b, [{ label: 'Everyone', on: !f.owner, run: function () { setF({ owner: '' }); } }].concat(Object.keys(ENG).map(function (k) { return { label: ENG[k], av: ENG[k], on: f.owner === k, meta: BO.crm.leads.filter(function (l) { return l.owner === k && l.stage !== 'lost' && BO.inStudio(l); }).length, run: function () { setF({ owner: k }); } }; }))); },
      source: function (b) { var f = filt(BO.route()), c = {}; BO.crm.leads.forEach(function (l) { if (BO.inStudio(l)) c[l.source] = (c[l.source] || 0) + 1; }); BO.menu(b, [{ label: 'Any source', on: !f.source, run: function () { setF({ source: '' }); } }].concat(Object.keys(c).sort().map(function (s) { return { label: s === 'Chat' ? 'Chat (site assistant)' : s, on: f.source === s, meta: c[s], run: function () { setF({ source: s }); } }; }))); },
      stage: function (b) { var f = filt(BO.route()); BO.menu(b, [{ label: 'Any open stage', on: !f.stage, run: function () { setF({ stage: '' }); } }].concat(['enquiry', 'survey', 'quote', 'project', 'lost'].map(function (s) { return { label: BO.SN[s], on: f.stage === s, run: function () { setF({ stage: s }); } }; }))); },
      unflag: function () { setF({ flag: '' }); },
      clear: function () { sel = {}; bulkPrev = null; BO.go('pipeline'); },
      view: function (b) { var v = BO.crm.views.filter(function (x) { return x.id === b.getAttribute('data-id'); })[0]; if (!v) return; if (v.layout) { PS.layout = v.layout; savePS(); } if (sameF(v.f, filt(BO.route()))) return BO.go('pipeline'); setF(Object.assign({ q: '', owner: '', source: '', stage: '', flag: '' }, v.f)); },
      saveView: function () { var f = filt(BO.route()); var def = f.owner ? short(ENG[f.owner]) + '’s leads' : f.flag ? FLAGS[f.flag] : f.source ? 'From ' + f.source.toLowerCase() : f.stage ? BO.SN[f.stage] : 'My view';
        BO.modal({ title: 'Save this view', sub: 'It appears as a chip above the pipeline, for everyone in the studio.', size: 'sm', body: '<label class="fl"><span>Name</span><input class="in" id="vwN" maxlength="28" value="' + esc(def) + '"></label>', foot: [{ label: 'Cancel' }, { label: 'Save view', cls: 'pri', run: function (api) { var n = $('#vwN', api.el).value.trim(); if (!n) return $('#vwN', api.el).focus(); var v = { id: 'v' + Date.now().toString(36), name: n, f: f, layout: PS.layout }; BO.crm.views.push(v); BO.save(); api.close(); BO.refresh(); BO.toast('View “' + esc(n) + '” saved.', { icon: 'star', undo: function () { BO.crm.views = BO.crm.views.filter(function (x) { return x !== v; }); BO.save(); BO.refresh(); } }); } }], onOpen: function (api) { var i = $('#vwN', api.el); setTimeout(function () { i.select(); }, 30); i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('[data-f="1"]', api.el).click(); } }); } }); },
      cols: function (b) { BO.menu(b, [{ head: 'Show columns' }].concat(COLS.filter(function (c) { return !c.fixed; }).map(function (c) { var on = PS.cols.indexOf(c.k) >= 0; return { label: c.l, on: on, run: function () { if (on) PS.cols = PS.cols.filter(function (x) { return x !== c.k; }); else { PS.cols.push(c.k); PS.cols = COLS.map(function (x) { return x.k; }).filter(function (x) { return PS.cols.indexOf(x) >= 0; }); } savePS(); BO.refresh(); } }; })).concat([{ sep: 1 }, { label: 'Reset to default', icon: 'reset', run: function () { PS.cols = ['lead', 'stage', 'type', 'city', 'owner', 'source', 'next', 'due', 'value']; savePS(); BO.refresh(); } }]), { right: true }); },
      sort: function (b) { var k = b.getAttribute('data-k'); PS.sort = { k: k, d: PS.sort.k === k ? -PS.sort.d : 1 }; savePS(); BO.refresh(); },
      all: function (i) { var f = filt(BO.route()); BO.crm.leads.filter(function (l) { return match(l, f) && (l.stage !== 'lost' || f.stage === 'lost'); }).forEach(function (l) { if (i.checked) sel[l.id] = true; else delete sel[l.id]; }); bulkPrev = null; BO.refresh(); },
      sel: function (i) { var id = i.getAttribute('data-id'); if (i.checked) sel[id] = true; else delete sel[id]; bulkPrev = null; BO.refresh(); },
      bAct: function (s) { bulkPrev = s.value ? { v: s.value, html: '' } : null; $('#bulk').innerHTML = bulkBar(); var n = $('#bAct'); if (n) n.focus(); },
      bPrev: function () { if (!bulkPrev) return; bulkPrev = preview(bulkPrev.v); $('#bulk').innerHTML = bulkBar(); var a = $('[data-act="bApply"]'); if (a && !a.disabled) a.focus(); },
      bCancel: function () { bulkPrev = bulkPrev ? { v: bulkPrev.v, html: '' } : null; $('#bulk').innerHTML = bulkBar(); },
      bClear: function () { sel = {}; bulkPrev = null; BO.refresh(); },
      bApply: function () {
        var p = bulkPrev; if (!p || !p.ch) return; var before = BO.clone(BO.crm.leads), logs = BO.clone(BO.crm.log);
        p.ch.forEach(function (l) { if (p.k === 'o') { l.owner = p.arg; BO.log(l.id, 'Reassigned to ' + ENG[p.arg] + ' (bulk)', 'move'); } else if (p.k === 's') { l.stage = p.arg; if (p.arg === 'lost') { l.lost = 'Closed in a bulk clean-up'; l.next = ''; l.due = ''; } BO.log(l.id, (p.arg === 'lost' ? 'Marked lost' : 'Moved back to Enquiry') + ' (bulk)', 'move'); } else { l.due = new Date(new Date(l.due && new Date(l.due) > NOW ? l.due : NOW).getTime() + (+p.arg) * DAY).toISOString(); BO.log(l.id, 'Follow-up pushed ' + BO.plural(+p.arg, 'day') + ' (bulk)', 'move'); } });
        BO.save(); sel = {}; bulkPrev = null; BO.refresh();
        BO.toast(BO.plural(p.ch.length, 'lead') + ' updated.', { undo: function () { BO.crm.leads.length = 0; before.forEach(function (x) { BO.crm.leads.push(x); }); BO.crm.log = logs; BO.save(); BO.refresh(); } });
      },
      cardMenu: function (b) { cardMenu(b, BO.lead(b.getAttribute('data-id'))); },
      lead: function (b) { openLead(b.getAttribute('data-id')); }
    }
  });
  function cardMenu(b, l) {
    if (!l) return;
    var nx = { enquiry: ['Schedule site survey', 'schedule'], survey: ['Log survey findings', 'survey'], quote: ['Mark won, create project', 'win'], project: null }[l.stage];
    BO.menu(b, [{ label: 'Open record', icon: 'arrow-r', kbd: '↵', run: function () { openLead(l.id); } }].concat(nx ? [{ label: nx[0], icon: 'bolt', run: function () { openLead(l.id, nx[1]); } }] : []).concat([{ sep: 1 }, { head: 'Move to' }]).concat(BO.ST.filter(function (s) { return s.k !== l.stage; }).map(function (s) { return { label: s.l, icon: 'chev-r', run: function () { BO.moveLead(l.id, s.k); } }; })).concat([{ head: 'Assign to' }]).concat(Object.keys(ENG).map(function (k) { return { label: ENG[k], av: ENG[k], on: l.owner === k, run: function () { setProp(l, 'owner', k); } }; })).concat(l.stage !== 'lost' && l.stage !== 'project' ? [{ sep: 1 }, { label: 'Mark lost…', icon: 'x', danger: 1, run: function () { lostModal(l); } }] : []), { right: true });
  }

  /* ───────── lead slide-over ───────── */
  var cur = null, step = null, ost = {}, qst = {};
  BO.openLead = openLead;
  function setProp(l, k, v) {
    var old = l[k], s = snap(l), n = (BO.crm.log[l.id] || []).length; if (String(old == null ? '' : old) === String(v)) return;
    l[k] = v; var lbl = { owner: 'Owner', type: 'Type', city: 'City', loc: 'Plot', area: 'Built-up area', floors: 'Floors', budget: 'Budget', phone: 'Mobile', email: 'Email' }[k] || k;
    BO.log(l.id, lbl + (old ? ' changed from ' + (k === 'owner' ? ENG[old] : old) + ' to ' : ' added: ') + (k === 'owner' ? ENG[v] : k === 'area' ? BO.num(v) + ' sq ft' : v), 'edit'); BO.save();
    if (BO.so.isOpen() && cur === l.id) openLead(l.id, step); BO.refresh();
    BO.toast(lbl + ' saved.', { undo: function () { restore(l, s, n); } });
  }
  var PROPS = [['owner', 'Owner'], ['type', 'Type'], ['city', 'City'], ['loc', 'Plot'], ['area', 'Built-up'], ['floors', 'Floors'], ['budget', 'Budget'], ['phone', 'Mobile'], ['email', 'Email']];
  function propRow(l, p) {
    var k = p[0], v = l[k], disp = k === 'owner' ? BO.av(ENG[v] || v, 'sm') + esc(ENG[v] || v) : k === 'area' ? BO.num(v) + ' sq ft' : esc(v);
    return '<div class="pr"><dt>' + p[1] + '</dt><dd>' + (v == null || v === '' ? '<button type="button" class="add" data-act="edit" data-k="' + k + '">+ Add ' + p[1].toLowerCase() + '</button>' : '<button type="button" class="ed" data-act="edit" data-k="' + k + '" aria-label="Edit ' + p[1] + '">' + disp + '</button>') + '</dd></div>';
  }
  function stepper(l) {
    var si = ['enquiry', 'survey', 'quote', 'project'].indexOf(l.stage);
    return '<ol class="stp" aria-label="Stage">' + BO.ST.map(function (s, i) { var c = l.stage === 'lost' ? '' : i < si ? 'done' : i === si ? 'cur' : ''; return '<li class="' + c + '"><button type="button" data-act="stage" data-v="' + s.k + '"' + (i === si ? ' aria-current="step"' : '') + '><span class="bub">' + (c === 'done' ? '✓' : s.g) + '</span>' + s.l + '</button></li>'; }).join('') + '</ol>';
  }
  function nextStep(l, want) {
    var s = want || ({ enquiry: 'schedule', survey: (l.survey && new Date(l.survey.when) < NOW) || l.findings ? (l.findings ? 'quote' : 'survey') : 'booked', quote: 'quoted', project: 'project', lost: 'lost' }[l.stage]);
    step = s;
    if (s === 'schedule') { var st = ost[l.id] = ost[l.id] || {}; return box('Schedule the site survey', 'B', pick(l, st) + '<div class="nx-f"><button type="button" class="b pri" data-act="book">' + ic('cal') + 'Book survey</button><span class="hint">Owner and engineer get it in their calendar.</span></div>'); }
    if (s === 'booked') return box('Survey ' + BO.dayName(l.survey.when) + ' ' + A.date(l.survey.when) + ', ' + BO.hm(l.survey.when), 'B', '<p class="nx-p">' + BO.av(l.survey.who, 'sm') + esc(l.survey.who) + (l.survey.note ? ' · “' + esc(l.survey.note) + '”' : '') + '</p><ul class="chk">' + ['Soil report or nearby borewell log', 'Plot sketch and sanctioned plan, if any', 'Tape, laser and soil auger'].map(function (t) { return '<li>' + ic('check') + t + '</li>'; }).join('') + '</ul><div class="nx-f"><button type="button" class="b" data-act="findings">' + ic('doc') + 'Log findings now</button><button type="button" class="b ghost" data-act="resched">Reschedule</button><span class="hint">Findings unlock the quote builder.</span></div>');
    if (s === 'survey') {
      var f = l.findings || {}, items = [['soil', 'Soil test needed'], ['truck', 'Truck access to the gate'], ['setback', 'Setbacks verified'], ['demol', 'Existing structure to demolish'], ['util', 'Water and power on site'], ['photos', 'Neighbour walls photographed']];
      return box('Log the survey findings', 'B', (l.survey ? '<p class="nx-p">' + BO.av(l.survey.who, 'sm') + 'Surveyed ' + A.date(l.survey.when) + ' by ' + esc(l.survey.who) + '</p>' : '') + '<div class="chk-g">' + items.map(function (i) { return '<label class="ck"><input type="checkbox" data-fd="' + i[0] + '"' + (f[i[0]] ? ' checked' : '') + '><span>' + i[1] + '</span></label>'; }).join('') + '</div><label class="fl"><span>Findings</span><textarea class="in" id="fdN" rows="3" placeholder="Plot 60 × 90, corner. Black cotton soil to 1.8 m. Old house to come down.">' + esc(f.note || '') + '</textarea></label><div class="nx-f"><button type="button" class="b pri" data-act="saveFind">' + ic('check') + 'Save and start the quote</button></div>');
    }
    if (s === 'quote' || s === 'revise') {
      var e = l.estimate || {}, q = l.quote || {}, st2 = qst[l.id] = qst[l.id] || {}, city = D.CITIES.filter(function (c) { return c.name === l.city; })[0] || D.CITIES[0];
      st2.tier = st2.tier || q.tier || e.tier || 'signature'; var tier = D.TIERS.filter(function (t) { return t.id === st2.tier; })[0];
      st2.area = st2.area != null ? st2.area : (q.area || l.area || e.area || '');
      if (st2.rate == null || st2._tier !== st2.tier) { st2.rate = q.rate && q.tier === st2.tier ? q.rate : Math.round(tier.rate * city.k / 10) * 10; st2._tier = st2.tier; }
      return box(q.version ? 'Revise the quote · v' + (q.version + 1) : 'Build the quote', 'C', '<div class="sg sm" role="group" aria-label="Specification">' + D.TIERS.map(function (t) { return '<button type="button" data-act="tier" data-v="' + t.id + '" aria-pressed="' + (st2.tier === t.id) + '">' + t.name + '</button>'; }).join('') + '</div><p class="hint">' + esc(tier.note) + '</p>' +
        '<div class="q-in"><label class="fl"><span>Built-up area, sq ft</span><input class="in" type="number" min="300" step="50" id="qA" data-in="qA" value="' + esc(st2.area) + '" inputmode="numeric"></label><label class="fl"><span>Rate, ₹ per sq ft · ' + esc(city.name) + '</span><input class="in" type="number" step="10" id="qR" data-in="qR" value="' + esc(st2.rate) + '" inputmode="numeric"></label></div><div id="qLines">' + qLines(st2) + '</div>');
    }
    if (s === 'quoted') { var qq = l.quote; return box('Quote v' + qq.version + ' · ' + inr(qq.total), 'C', '<dl class="kvg"><div><dt>Sent</dt><dd>' + A.date(qq.sent) + '</dd></div><div><dt>Valid until</dt><dd>' + A.date(qq.valid) + '</dd></div><div><dt>Rate</dt><dd>' + (qq.rate ? '₹' + BO.num(qq.rate) + ' / sq ft' : 'Lump sum') + '</dd></div><div><dt>Area</dt><dd>' + (qq.area || l.area ? BO.num(qq.area || l.area) + ' sq ft' : '—') + '</dd></div></dl><div class="nx-f"><button type="button" class="b pri" data-act="goWin">' + ic('stamp') + 'Mark won</button><button type="button" class="b" data-act="revise">' + ic('reset') + 'Revise quote</button><span class="hint">' + (new Date(qq.valid) < NOW ? '<span class="red">Expired ' + A.date(qq.valid) + '</span>' : 'Expires in ' + BO.dur(new Date(qq.valid) - NOW)) + '</span></div>'); }
    if (s === 'win') return box('Create the project', 'D', '<p class="nx-p">Creates a project code, a 320-day programme from the quote and a client-portal sign-in for ' + esc(short(l.name)) + '.</p><div class="q-in"><label class="fl"><span>Mobilisation date</span><input class="in" type="date" id="wS" value="' + BO.ymd(new Date(NOW.getTime() + 14 * DAY)) + '" min="' + BO.ymd(NOW) + '"></label><label class="fl"><span>Project manager</span><select class="in" id="wP">' + Object.keys(ENG).map(function (k) { return '<option value="' + k + '"' + (k === l.owner ? ' selected' : '') + '>' + ENG[k] + '</option>'; }).join('') + '</select></label></div><div class="nx-f"><button type="button" class="b pri" data-act="win">' + ic('project') + 'Create project</button><span class="hint">' + (l.quote ? 'Contract value ' + inr(l.quote.total) : 'No quote yet: the value is filled in later') + '</span></div>');
    if (s === 'project') { var pr = l.project; return box('Project ' + pr.code, 'D', '<div class="site-r"><span>Day <b>' + pr.day + '</b> of ' + pr.total + '</span><span>' + esc(pr.stage) + (pr.pct ? ' · ' + pr.pct + '%' : '') + '</span></div><div class="meter big"><i style="width:' + Math.round(pr.day / pr.total * 100) + '%"></i></div><div class="nx-f"><a class="b pri" href="#/projects/' + esc(pr.code) + '/update">' + ic('photo') + 'Post site update</a><a class="b" href="#/projects/' + esc(pr.code) + '">Open project</a>' + (pr.code === 'STH-2611' ? '<a class="b ghost" href="portal.html" target="_blank" rel="noopener">' + ic('ext') + 'Client portal</a>' : '') + '</div>'); }
    if (s === 'lost') return box('Lost', '×', '<p class="nx-p">' + esc(l.lost || 'No reason recorded') + '</p><div class="nx-f"><button type="button" class="b" data-act="reopen">' + ic('reset') + 'Reopen as enquiry</button></div>');
    return '';
  }
  function box(t, g, html) { return '<section class="nx" aria-labelledby="nxH"><h3 id="nxH"><span class="bub">' + g + '</span>Next step · ' + t + '</h3>' + html + '</section>'; }
  function qLines(st) {
    var a = +st.area || 0, r = +st.rate || 0, b = a * r, rows = [['Civil and structure', b * 0.47], ['MEP, finishes and joinery', b * 0.48], ['Prelims and supervision', b * 0.05], ['Design and approvals', b * 0.045], ['GST at 18% on works', b * 1.045 * 0.18]], tot = rows.reduce(function (s, x) { return s + x[1]; }, 0);
    var why = a < 300 ? 'Add the built-up area first (300 sq ft or more).' : r < 1000 ? 'The rate looks too low. Check it against the tier.' : '';
    st.total = Math.round(tot);
    return '<table class="ql"><tbody>' + rows.map(function (x) { return '<tr><td>' + x[0] + '</td><td class="num">' + inr(x[1], 'full') + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total, incl. GST</td><td class="num">' + inr(tot, 'full') + '</td></tr></tbody></table><div class="nx-f"><button type="button" class="b pri" data-act="sendQ"' + (why ? ' disabled' : '') + '>' + ic('send') + 'Send quote · ' + (tot ? inr(tot) : '₹0') + '</button><span class="hint' + (why ? ' red' : '') + '">' + (why || 'The client gets a PDF and a portal link to accept it.') + '</span></div>';
  }
  function timeline(l) {
    var KIC = { in: 'bolt', move: 'arrow-r', call: 'phone', note: 'doc', edit: 'reset' };
    return '<ol class="tl">' + BO.timeline(l).map(function (e) { return '<li class="tl-' + (e.kind || 'note') + '"><span class="tl-i">' + ic(KIC[e.kind] || 'doc') + '</span><p>' + esc(e.text) + '</p><small>' + esc(e.by) + ' · ' + A.date(e.at, true) + '</small></li>'; }).join('') + '</ol>';
  }
  function related(l) {
    var R = [];
    if (l.source === 'Chat' && l.convo) R.push('<a class="rel" href="#/chats/' + esc(l.convo) + '">' + ic('chat') + '<span><b>Chat transcript</b><small>The conversation with the site assistant</small></span>' + ic('chev-r') + '</a>');
    if (l.estimate) R.push('<div class="rel">' + ic('rupee') + '<span><b>Estimator · ' + esc(String(l.estimate.tier || '').replace(/^./, function (c) { return c.toUpperCase(); })) + ', ' + BO.num(l.estimate.area) + ' sq ft</b><small>' + inr(l.estimate.lo) + ' to ' + inr(l.estimate.hi) + ' · the quote starts from these numbers</small></span></div>');
    if (l.project) R.push('<a class="rel" href="#/projects/' + esc(l.project.code) + '">' + ic('project') + '<span><b>Project ' + esc(l.project.code) + '</b><small>Day ' + l.project.day + ' of ' + l.project.total + ' · ' + esc(l.project.stage) + '</small></span>' + ic('chev-r') + '</a>');
    if (l.quote) R.push('<div class="rel">' + ic('doc') + '<span><b>Quote v' + l.quote.version + '.pdf</b><small>' + inr(l.quote.total, 'full') + ' · sent ' + A.date(l.quote.sent) + '</small></span></div>');
    return R.length ? '<section class="so-s"><h3>Related</h3>' + R.join('') + '</section>' : '';
  }
  function openLead(id, want, focusK) {
    var l = BO.lead(id); if (!l) return; cur = id;
    if (l.fresh) { l.fresh = false; BO.save(); setTimeout(BO.refresh, 0); }
    var list = curList.indexOf(id) >= 0 ? curList : BO.crm.leads.filter(BO.inStudio).map(function (x) { return x.id; }), pos = list.indexOf(id);
    var last = BO.timeline(l).filter(function (e) { return e.kind !== 'in' || !l.note; })[0];
    var html = '<header class="so-h"><div class="so-hr"><span class="mono">' + l.id + '</span>' + stageTag(l.stage) + tag(l) + '<span class="grow"></span><button type="button" class="ib" data-act="prev" aria-label="Previous record"' + (pos > 0 ? '' : ' disabled') + '>' + ic('chev-l') + '</button><span class="mono faint">' + (pos + 1) + ' / ' + list.length + '</span><button type="button" class="ib" data-act="next" aria-label="Next record"' + (pos < list.length - 1 ? '' : ' disabled') + '>' + ic('chev-r') + '</button><button type="button" class="ib" data-act="more" aria-label="More actions" aria-haspopup="menu">' + ic('more') + '</button><button type="button" class="ib so-x" data-act="close" aria-label="Close">' + ic('x') + '</button></div>' +
      '<h2 id="soT">' + esc(l.name) + '</h2><p class="so-sub">' + esc(spec(l)) + (l.loc ? ', ' + esc(l.city) : '') + ' · received ' + A.date(l.at, true) + '</p>' + stepper(l) + '</header><div class="so-b">' +
      (l.note ? '<blockquote class="remark"><p>' + esc(l.note) + '</p><footer>Last remark · ' + esc(last ? last.by : l.owner) + ', ' + esc(BO.rel(last ? last.at : l.at)) + '</footer></blockquote>' : '') +
      (l.next && l.stage !== 'lost' ? '<p class="nx-line">' + ic('arrow-r') + '<span>' + esc(l.next) + '</span>' + BO.dueChip(l.due) + '</p>' : '') +
      nextStep(l, want) +
      '<section class="so-s"><h3>Details</h3><dl class="props">' + PROPS.map(function (p) { return propRow(l, p); }).join('') + '<div class="pr"><dt>Source</dt><dd class="ro">' + esc(l.source || '') + '</dd></div></dl></section>' +
      related(l) +
      '<section class="so-s"><h3>Add a note</h3><textarea class="in" id="noteT" rows="2" placeholder="What happened? What’s next?"></textarea><div class="fu" role="group" aria-label="Follow up">' + [['', 'No change'], ['3h', 'In 3 hours'], ['t11', 'Tomorrow 11 am'], ['3d', 'In 3 days'], ['mon', 'Monday']].map(function (o, i) { return '<label class="fu-o"><input type="radio" name="fu" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div><div class="nx-f"><button type="button" class="b" data-act="note">Save note</button><span class="hint"><kbd>' + (BO.mac ? '⌘' : 'Ctrl ') + '↵</kbd></span></div></section>' +
      '<section class="so-s"><h3>Timeline</h3>' + timeline(l) + '</section></div>';
    BO.so.open(html, { acts: soActs, key: function (e) { var k = e.key.toLowerCase(); if (k === 'j') { soActs.next(); return true; } if (k === 'k') { soActs.prev(); return true; } return false; }, onClose: function () { cur = null; step = null; } });
    BO.so.el().setAttribute('aria-labelledby', 'soT');
    var nt = $('#noteT'); if (nt) nt.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); soActs.note(); } });
    if (focusK) setTimeout(function () { var b = $('.so [data-act="edit"][data-k="' + focusK + '"]'); if (b) b.click(); }, 80);
    else if (want && want !== 'project') setTimeout(function () { var n = $('.so .nx'); if (n) n.scrollIntoView({ block: 'start', behavior: BO.reduce ? 'auto' : 'smooth' }); }, 120);
  }
  function L() { return BO.lead(cur); }
  function reopen(want) { openLead(cur, want); BO.refresh(); }
  function lostModal(l, after) {
    var R = ['Went with a cheaper contractor', 'Postponed the build', 'Couldn’t reach them after 5 tries', 'Plot or approval problem', 'Chose to build it themselves'];
    BO.modal({ title: 'Mark ' + esc(l.name) + ' as lost', sub: 'The reason feeds the monthly win-loss review.', size: 'sm', body: '<div class="rad">' + R.map(function (r, i) { return '<label class="ck"><input type="radio" name="lr" value="' + esc(r) + '"' + (i ? '' : ' checked') + '><span>' + r + '</span></label>'; }).join('') + '</div><label class="fl"><span>Anything else</span><input class="in" id="lrX" placeholder="Optional"></label>', foot: [{ label: 'Cancel' }, { label: 'Mark lost', cls: 'pri', run: function (api) {
      var r = ($('input[name=lr]:checked', api.el) || {}).value, x = $('#lrX', api.el).value.trim(), s = snap(l), n = (BO.crm.log[l.id] || []).length; l.stage = 'lost'; l.lost = r + (x ? '. ' + x : ''); l.next = ''; l.due = ''; BO.log(l.id, 'Marked lost: ' + l.lost, 'move'); BO.save(); api.close(); if (BO.so.isOpen() && cur === l.id) openLead(l.id); BO.refresh(); if (after) after();
      BO.toast(esc(l.name) + ' marked lost.', { undo: function () { restore(l, s, n); } });
    } }] });
  }
  var soActs = {
    close: function () { BO.so.close(); },
    prev: function () { var list = curList.indexOf(cur) >= 0 ? curList : BO.crm.leads.filter(BO.inStudio).map(function (x) { return x.id; }), i = list.indexOf(cur); if (i > 0) openLead(list[i - 1]); },
    next: function () { var list = curList.indexOf(cur) >= 0 ? curList : BO.crm.leads.filter(BO.inStudio).map(function (x) { return x.id; }), i = list.indexOf(cur); if (i >= 0 && i < list.length - 1) openLead(list[i + 1]); },
    more: function (b) { var l = L(); BO.menu(b, [{ label: 'Copy lead ID', icon: 'copy', run: function () { try { navigator.clipboard.writeText(l.id).then(function () { BO.toast(l.id + ' copied.'); }, function () { BO.toast('Copy isn’t allowed here.', { bad: true }); }); } catch (e) { BO.toast('Copy isn’t allowed here.', { bad: true }); } } }].concat(l.stage === 'lost' ? [{ label: 'Reopen as enquiry', icon: 'reset', run: soActs.reopen }] : l.stage !== 'project' ? [{ label: 'Mark lost…', icon: 'x', danger: 1, run: function () { lostModal(l); } }] : []), { right: true }); },
    stage: function (b) { var v = b.getAttribute('data-v'), l = L(); if (v === l.stage) return; BO.moveLead(l.id, v); },
    edit: function (b) {
      var l = L(), k = b.getAttribute('data-k'), dd = b.closest('dd'), old = l[k], done = false;
      if (k === 'owner' || k === 'type' || k === 'city') {
        var opts = k === 'owner' ? Object.keys(ENG) : k === 'type' ? ['Residential', 'Commercial', 'Interiors', 'Turnkey'] : ['Bengaluru', 'Pune', 'Hyderabad', 'Mysuru', 'Chennai'];
        return BO.menu(b, opts.map(function (o) { return { label: k === 'owner' ? ENG[o] : o, av: k === 'owner' ? ENG[o] : null, on: old === o, run: function () { setProp(l, k, o); } }; }));
      }
      dd.innerHTML = '<input class="in sm" type="' + (k === 'area' ? 'number' : k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text') + '" aria-label="' + k + '" value="' + esc(old == null ? '' : old) + '"' + (k === 'phone' ? ' inputmode="tel" placeholder="10-digit mobile"' : '') + '><span class="ed-h">↵ save · esc cancel</span>';
      var inp = $('input', dd); inp.focus(); if (inp.select) inp.select();
      function commit() {
        if (done) return; done = true; var v = inp.value.trim();
        if (k === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { BO.toast('That email is missing something, so it wasn’t saved.', { bad: true }); return openLead(l.id, step); }
        if (k === 'phone' && v && v.replace(/\D/g, '').replace(/^91/, '').length !== 10) { BO.toast('A mobile number has 10 digits; not saved.', { bad: true }); return openLead(l.id, step); }
        if (k === 'area') v = v ? +v : null;
        if ((v == null || v === '') && (old == null || old === '')) return openLead(l.id, step);
        setProp(l, k, v);
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done = true; openLead(l.id, step); } });
      inp.addEventListener('blur', commit);
    },
    pDay: function (b) { ost[cur].day = b.getAttribute('data-v'); openLead(cur, 'schedule'); },
    pSlot: function (b) { ost[cur].slot = b.getAttribute('data-v'); openLead(cur, 'schedule'); },
    pEng: function (b) { ost[cur].eng = b.getAttribute('data-v'); openLead(cur, 'schedule'); },
    pNote: function (i) { ost[cur].note = i.value; },
    book: function () { var l = L(); if (book(l, ost[l.id])) { delete ost[l.id]; reopen(); } },
    resched: function () { var l = L(); ost[l.id] = { day: BO.ymd(l.survey.when), slot: String(l.survey.when).slice(11, 16), eng: short(l.survey.who) }; openLead(l.id, 'schedule'); },
    findings: function () { openLead(cur, 'survey'); },
    saveFind: function () {
      var l = L(), f = { note: $('#fdN').value.trim() }; $$('[data-fd]').forEach(function (c) { f[c.getAttribute('data-fd')] = c.checked; });
      if (!f.note && !$$('[data-fd]').some(function (c) { return c.checked; })) { BO.toast('Tick what you found or write a line first.', { bad: true }); return $('#fdN').focus(); }
      var s = snap(l), n = (BO.crm.log[l.id] || []).length; l.findings = f; if (f.note) l.note = f.note; l.next = 'Prepare and send the quote'; l.due = new Date(NOW.getTime() + 2 * DAY).toISOString(); BO.log(l.id, 'Survey findings logged' + (f.note ? ': ' + f.note : ''), 'note'); BO.save(); reopen('quote');
      BO.toast('Findings saved. The quote builder is open.', { undo: function () { restore(l, s, n); } });
    },
    tier: function (b) { qst[cur].tier = b.getAttribute('data-v'); openLead(cur, step === 'revise' ? 'revise' : 'quote'); },
    qA: function (i) { qst[cur].area = i.value; $('#qLines').innerHTML = qLines(qst[cur]); },
    qR: function (i) { qst[cur].rate = i.value; $('#qLines').innerHTML = qLines(qst[cur]); },
    sendQ: function () {
      var l = L(), st = qst[l.id], s = snap(l), n = (BO.crm.log[l.id] || []).length, v = (l.quote ? l.quote.version : 0) + 1;
      l.quote = { total: st.total, rate: +st.rate, area: +st.area, tier: st.tier, sent: BO.stamp(), valid: new Date(NOW.getTime() + 30 * DAY).toISOString(), version: v }; l.area = +st.area; l.stage = 'quote'; l.next = 'Quote follow-up call'; l.due = new Date(NOW.getTime() + 3 * DAY).toISOString();
      BO.log(l.id, 'Quote v' + v + ' sent: ' + inr(l.quote.total, 'full'), 'move'); BO.save(); delete qst[l.id]; reopen();
      BO.toast('Quote v' + v + ' sent to ' + esc(short(l.name)) + ': <b>' + inr(l.quote.total) + '</b>.', { icon: 'send', undo: function () { restore(l, s, n); } });
    },
    revise: function () { openLead(cur, 'revise'); },
    goWin: function () { openLead(cur, 'win'); },
    win: function () {
      var l = L(), s = snap(l), n = (BO.crm.log[l.id] || []).length, used = BO.crm.leads.filter(function (x) { return x.project; }).map(function (x) { return x.project.code; }), k = 2612; while (used.indexOf('STH-' + k) >= 0) k++;
      var start = $('#wS').value || BO.ymd(new Date(NOW.getTime() + 14 * DAY)), pm = $('#wP').value;
      l.project = { code: 'STH-' + k, day: 0, total: 320, stage: 'Mobilisation', pct: 0, start: start, pm: pm, value: l.quote ? l.quote.total : 0 }; l.stage = 'project'; l.owner = pm; l.next = 'Kick-off meeting and site mobilisation'; l.due = start + 'T10:00';
      BO.log(l.id, 'Won. Project ' + l.project.code + ' created, mobilising ' + A.date(start), 'move'); BO.save(); reopen();
      BO.toast('Won. Project <b>' + l.project.code + '</b> created for ' + esc(l.name) + '.', { icon: 'stamp', action: ['Open project', function () { BO.so.close(); BO.go('projects/' + l.project.code); }], undo: function () { restore(l, s, n); } });
    },
    reopen: function () { var l = L(), s = snap(l), n = (BO.crm.log[l.id] || []).length; l.stage = 'enquiry'; l.lost = ''; l.next = 'Call back: reopened'; l.due = new Date(NOW.getTime() + DAY).toISOString(); BO.log(l.id, 'Reopened as an enquiry', 'move'); BO.save(); reopen(); BO.toast(esc(l.name) + ' reopened.', { undo: function () { restore(l, s, n); } }); },
    note: function () {
      var l = L(), t = $('#noteT').value.trim(), fu = ($('input[name=fu]:checked') || {}).value || '';
      if (!t && !fu) { BO.toast('Write a note or pick a follow-up time.', { bad: true }); return $('#noteT').focus(); }
      var s = snap(l), n = (BO.crm.log[l.id] || []).length;
      if (t) { l.note = t; BO.log(l.id, t, 'note'); }
      if (fu) { var d = fu === '3h' ? new Date(NOW.getTime() + 3 * 3600e3) : fu === 't11' ? new Date('2026-11-25T11:00') : fu === '3d' ? new Date(NOW.getTime() + 3 * DAY) : new Date('2026-11-30T10:00'); l.due = d.toISOString(); BO.log(l.id, 'Follow-up set for ' + BO.dayName(d) + ' ' + A.date(d) + ', ' + BO.hm(d), 'note'); }
      BO.save(); openLead(l.id); BO.refresh(); BO.toast('Note saved' + (fu ? ' and follow-up set' : '') + '.', { undo: function () { restore(l, s, n); } });
    }
  };
})();
