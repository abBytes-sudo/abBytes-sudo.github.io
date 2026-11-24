/* Ordwell assistants (samples/work). Rule-based, no LLM, no network calls. Registers two agents:
   - 'work'       (staff)    the in-app assistant. Reads and writes the live workspace through window.OW (store, selectors,
                             actions) so every answer is built from real tasks, and every change is an undoable commit.
   - 'work-sales' (customer) the sales assistant on product/pricing/templates: plan picker, template fit, price quote,
                             walkthrough booking (lands in work/staff.html as "from chat"), request status, FAQ.
   Loaded lazily by work/js/assistant.js (in the app) and work/concierge.js (marketing pages). */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.work) return;
  var N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  function W() { return window.OW && window.OW.Q ? window.OW : null; }
  function first(n) { return String(n || '').split(' ')[0]; }
  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
  function plural(n, w, p) { return n + ' ' + (n === 1 ? w : (p || w + 's')); }
  function lev(a, b) { a = a.toLowerCase(); b = b.toLowerCase(); var m = [], i, j; for (i = 0; i <= b.length; i++) m[i] = [i]; for (j = 0; j <= a.length; j++) m[0][j] = j; for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = b[i - 1] === a[j - 1] ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1); return m[b.length][a.length]; }

  /* ======================================================================================================
     STAFF: the in-app assistant
     ====================================================================================================== */
  function S() { return W().store.S; }
  function me() { return W().Q.me(); }
  function rel(t) { return t.due ? W().D.rel(t.due) : 'no due date'; }
  function names(ids) { return ids.map(function (u) { return first(W().Q.user(u).name); }).join(', ') || 'Unassigned'; }
  function curProject(bot) { var w = W(), p = bot.ctx && bot.ctx.project; return p && p !== '*' && w.Q.project(p) ? w.Q.project(p) : null; }
  function taskCard(t, extra) {
    var w = W(), Q = w.Q, D = w.D, st = Q.status(t), over = Q.overdue(t), p = Q.project(t.project), n = t.due ? D.diff(D.today(), t.due) : null;
    var btns = [B('Open', 'act:open:' + t.id)];
    if (!Q.isDone(t)) { if (over || n === 0) btns.push(B('Move to tomorrow', 'act:tomorrow:' + t.id)); btns.push(B('Mark done', 'act:done:' + t.id)); }
    return { title: t.title, sub: t.num + ' · ' + p.name, badge: over ? (Math.abs(n) === 1 ? 'Overdue 1 day' : 'Overdue ' + Math.abs(n) + ' days') : n === 0 && !Q.isDone(t) ? 'Due today' : '',
      meta: [st.name, cap(rel(t)), names(t.assignees)].concat(extra || []), buttons: btns };
  }
  function findUser(word) {
    if (!word) return null; var w = W(), best = null, bs = 9; word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!word || word.length < 3) return null;
    w.store.S.users.forEach(function (u) { if (u.role === 'guest') return; var f = first(u.name).toLowerCase(), d = f === word ? 0 : f.indexOf(word) === 0 ? 0.5 : lev(f, word); if (d < bs) { bs = d; best = u; } });
    return bs <= 1 ? best : null;
  }
  function findProject(text) {
    var w = W(), t = ' ' + String(text).toLowerCase() + ' ', best = null, bs = 0;
    w.Q.projectsVisible().forEach(function (p) {
      var words = (p.name + ' ' + p.client + ' ' + p.key).toLowerCase().replace(/[—–-]/g, ' ').split(/\s+/).filter(function (x) { return x.length > 3 && ['internal', 'website', 'project'].indexOf(x) < 0; }), s = 0;
      words.forEach(function (x) { if (t.indexOf(' ' + x) >= 0) s += x.length; }); if (t.indexOf(' ' + p.key.toLowerCase() + ' ') >= 0) s += 10;
      if (s > bs) { bs = s; best = p; }
    });
    return bs >= 5 ? best : null;
  }
  function findTasks(text, opts) {
    var w = W(), q = String(text).toLowerCase().replace(/\b(find|search|show|open|task|tasks|the|for|me|on|about|called|named|log|hours?|h|mins?|minutes?|start|timer|stop|\d+(\.\d+)?)\b/g, ' ').replace(/[^a-z0-9 -]/g, ' ').trim();
    var words = q.split(/\s+/).filter(function (x) { return x.length > 2; }); if (!words.length) return [];
    var num = (String(text).match(/\b([a-z]{3})-(\d{3})\b/i) || [])[0];
    return w.Q.tasks('*', true).map(function (t) {
      var h = (t.title + ' ' + t.num + ' ' + t.tags.join(' ')).toLowerCase(), s = 0;
      if (num && t.num.toLowerCase() === num.toLowerCase()) s += 50;
      words.forEach(function (x) { if (h.indexOf(x) >= 0) s += x.length; });
      if (opts && opts.open && w.Q.isDone(t)) s -= 3; return { t: t, s: s };
    }).filter(function (x) { return x.s >= 4; }).sort(function (a, b) { return b.s - a.s; }).slice(0, (opts && opts.n) || 4).map(function (x) { return x.t; });
  }
  function commit(label, fn) { return W().store.commit(label, fn); }
  function myOpen() { var w = W(); return w.Q.tasks('*', true).filter(function (t) { return t.assignees.indexOf(me()) > -1 && !w.Q.isDone(t); }); }
  function offline(bot) { bot.say('I can only see the workspace from inside the app. Open Ordwell and ask me again.'); return true; }

  // create-task parsing: "create a task for Riya due Friday to send the rate card"
  function parseCreate(text, bot) {
    var w = W(), o = {}, raw = String(text), low = raw.toLowerCase(), m;
    var q = raw.match(/["“']([^"”']{3,140})["”']/); if (q) o.title = q[1];
    if ((m = low.match(/\b(?:for|assign(?:ed)? to|to|@)\s+([a-z]+)\b/))) { var u = findUser(m[1]); if (u) o.who = u.id; }
    if (!o.who) low.split(/\s+/).some(function (x) { var u = /^[a-z]{3,}$/.test(x) && ['task', 'tasks', 'friday', 'monday', 'today', 'create', 'remind', 'please'].indexOf(x) < 0 ? findUser(x) : null; if (u && lev(first(u.name), x) === 0) { o.who = u.id; return true; } });
    var when = N.when(low.replace(/\bkal tak\b/, 'tomorrow').replace(/\bkal\b/, 'tomorrow').replace(/\baaj\b/, 'today')); if (when && when.iso) o.due = when.iso;
    var p = findProject(low); if (p) o.project = p.id;
    if (!o.title) {
      var t = raw.replace(/^\s*(please\s+)?(can you\s+)?(create|add|make|new|set up|remind)\s+(a\s+|an\s+|new\s+)?(task|todo|to-do|reminder)?\s*/i, '')
        .replace(/\b(for|assign(ed)? to|@)\s+[A-Za-z]+\b/i, ' ').replace(/\b(due|by|on|before|till|until)\s+(today|tonight|tomorrow|kal|aaj|(next |this )?(mon|tues|wednes|thurs|fri|satur|sun)day|\d{1,2}\s+[a-z]{3,9}|[a-z]{3,9}\s+\d{1,2})\b/ig, ' ')
        .replace(/\b(today|tomorrow|kal tak|kal|aaj|(next |this )?(mon|tues|wednes|thurs|fri|satur|sun)day)\b/ig, ' ').replace(/\bin\s+(the\s+)?[A-Z][\w-]*( [\w—-]+)?\s*(project)?$/i, ' ')
        .replace(/^\s*(to|:|-|that|which)\s+/i, '').replace(/\s+/g, ' ').trim().replace(/^[:\-–]\s*/, '');
      if (t.length >= 3 && !/^(task|a task|it)$/i.test(t)) o.title = cap(t);
    }
    return o;
  }

  O.registerAgent({
    id: 'work', name: 'Ordwell assistant', business: 'Ordwell', role: 'Answers from your workspace', industry: 'Work management', initials: 'O', accent: '#C2461C', kind: 'staff',
    blurb: 'Asks your workspace in plain words: what is overdue, what is blocked, who is overloaded; creates tasks, logs time and tidies up with a preview first.',
    helloLine: 'Ask about your work in plain words. I answer from the live workspace and show a preview before I change anything.',
    samples: ['what’s overdue for me?', 'create a task for Riya due Friday to send the rate card', 'summarise this project', 'move all Done tasks to Archive'],
    menu: [B('What’s overdue for me?', 'intent:overdue'), B('Plan my day', 'intent:today'), B('Summarise this project', 'intent:summary'), B('Create a task', 'flow:create'), B('Who’s overloaded?', 'intent:load'), B('Tidy up Done tasks', 'intent:archive')],
    synonyms: {
      'overdue': ['late', 'past due', 'behind', 'missed deadline', 'kya overdue hai', 'pending hai', 'delayed'],
      'today': ['aaj', 'aaj ka', 'right now'], 'tomorrow': ['kal'],
      'summarise': ['summarize', 'summary', 'status of', 'how is', "how's", 'update on', 'recap', 'overview', 'kaisa chal raha'],
      'overloaded': ['too much work', 'over capacity', 'busy', 'swamped', 'bandwidth', 'free this week', 'capacity'],
      'blocked': ['stuck', 'waiting on', 'blockers', 'atka hua'],
      'create task': ['add a task', 'new task', 'make a task', 'add task', 'create a task', 'remind', 'task banao', 'task bana do'],
      'archive': ['clean up', 'tidy up', 'tidy', 'clear done', 'move done']
    },
    greeting: function (bot) {
      var w = W(); if (!w) { bot.say('Hi. Open the workspace and I can answer from your tasks.'); return; }
      var u = w.Q.user(me()), mine = myOpen(), over = mine.filter(w.Q.overdue).length, today = mine.filter(function (t) { return t.due === w.D.today(); }).length, p = curProject(bot);
      var hr = new Date().getHours();
      bot.say((hr < 12 ? 'Morning' : hr < 17 ? 'Afternoon' : 'Evening') + ', ' + first(u.name) + '. ' + (over || today ? 'You have **' + (today ? plural(today, 'task') + ' due today' : '') + (today && over ? '** and **' : '') + (over ? over + ' overdue' : '') + '**.' : 'Nothing of yours is due today.') + (p ? ' You’re in **' + p.name + '**.' : ''),
        { buttons: [B(over ? 'Show what’s overdue' : 'Plan my day', over ? 'intent:overdue' : 'intent:today'), B(p ? 'Summarise ' + p.key : 'Summarise a project', 'intent:summary'), B('Create a task', 'flow:create'), B('More I can do', 'menu')] });
    },
    intents: [
      { id: 'overdue', label: 'What’s overdue', kw: ['overdue', 'what is overdue', 'overdue for me', 'my overdue'], re: [/\b(overdue|late)\b/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        var all = /\b(team|everyone|all|project|whole)\b/i.test(m.text), p = all ? curProject(bot) : null;
        var L = (p ? w.Q.tasks(p.id, true) : all ? w.Q.tasks('*', true) : myOpen()).filter(w.Q.overdue).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
        if (!L.length) { bot.say((all ? 'Nothing is overdue' + (p ? ' in ' + p.name : '') : 'Nothing of yours is overdue') + '. Clean slate.', { buttons: [B('Plan my day', 'intent:today'), B('What’s due this week?', 'say:what is due this week')] }); return; }
        bot.say((all ? plural(L.length, 'task is', 'tasks are') + ' overdue' + (p ? ' in ' + p.name : ' across the workspace') : 'You have **' + plural(L.length, 'overdue task') + '**') + '. Oldest first:', { cards: L.slice(0, 5).map(function (t) { return taskCard(t); }),
          buttons: L.length > 1 ? [B('Move all ' + L.length + ' to tomorrow', 'act:bulktomorrow:' + (all ? (p ? p.id : 'all') : 'mine')), B('Start focus mode', 'act:focus:1')] : [B('Start focus mode', 'act:focus:1')] });
      } },
      { id: 'today', label: 'Plan my day', kw: ['plan my day', 'my day', 'due today', 'what should i do', 'my tasks', 'what is on my plate', 'mera kaam', 'today'], re: [/\b(plan|my) (day|tasks)\b/i, /\bon my plate\b/i], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var q = w.pages.todayQueue(), mins = q.reduce(function (s, t) { return s + Math.max(0, (t.est || 0) * 60 - w.Q.logged(t)); }, 0);
        if (!q.length) { bot.say('Your queue for today is empty. Want to see what’s due this week?', { buttons: [B('Due this week', 'say:what is due this week'), B('Waiting on clients', 'intent:waiting')] }); return; }
        bot.say('Here’s today, in the order I’d do it: **' + plural(q.length, 'task') + '**, about **' + w.UI.hm(mins) + '** of estimated work left.', { cards: q.slice(0, 5).map(function (t) { return taskCard(t); }), buttons: [B('Start focus mode', 'act:focus:1'), B('What’s blocked?', 'intent:blocked')] });
      } },
      { id: 'week', label: 'Due this week', kw: ['due this week', 'this week', 'next 7 days', 'upcoming'], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var L = myOpen().filter(function (t) { var n = t.due ? w.D.diff(w.D.today(), t.due) : -1; return n >= 0 && n <= 7; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
        if (!L.length) { bot.say('Nothing of yours is due in the next 7 days.'); return; }
        bot.say(plural(L.length, 'task') + ' due in the next 7 days:', { cards: L.slice(0, 5).map(function (t) { return taskCard(t); }) });
      } },
      { id: 'summary', label: 'Summarise a project', kw: ['summarise', 'summarise this project', 'project status', 'how is the project', 'where are we'], re: [/\bsummar/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        var p = findProject(m.text) || curProject(bot);
        if (!p) { bot.say('Which project?', { buttons: w.Q.projectsVisible().slice(0, 6).map(function (x) { return B(x.name, 'act:summary:' + x.id); }) }); return; }
        summary(bot, p);
      } },
      { id: 'archive', label: 'Tidy up Done tasks', kw: ['archive', 'move all done tasks to archive', 'archive done', 'move done tasks'], re: [/\b(move|archive|clear|tidy)\b.*\b(done|approved|completed|finished)\b/i, /\bdone\b.*\barchive\b/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        var p = findProject(m.text.replace(/\b(delivered\s+)?archive\b/ig, ' ')) || curProject(bot);
        if (!p) { bot.say('Tidy which project? I’ll show what would move before anything changes.', { buttons: w.Q.projectsVisible().filter(function (x) { return x.id !== 'p7'; }).slice(0, 6).map(function (x) { return B(x.name, 'act:archprev:' + x.id); }) }); return; }
        archivePreview(bot, p);
      } },
      { id: 'blocked', label: 'What’s blocked', kw: ['blocked', 'what is blocked', 'blockers', 'what is stuck'], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var L = w.Q.tasks('*', true).filter(function (t) { return !w.Q.isDone(t) && (w.Q.blockedOpen(t) || w.Q.cat(t) === 'blocked'); });
        if (!L.length) { bot.say('Nothing is blocked right now.'); return; }
        bot.say(plural(L.length, 'task is', 'tasks are') + ' waiting on something else:', { cards: L.slice(0, 5).map(function (t) { var b = w.Q.blockers(t).filter(function (x) { return !w.Q.isDone(x); })[0]; return taskCard(t, b ? ['Blocked by ' + b.num + ' · ' + w.Q.status(b).name] : ['Marked as a snag']); }) });
      } },
      { id: 'waiting', label: 'Waiting on clients', kw: ['waiting on client', 'client review', 'waiting on clients', 'with the client', 'client approval'], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var L = w.Q.tasks('*').filter(function (t) { return w.Q.cat(t) === 'review2'; });
        if (!L.length) { bot.say('Nothing is sitting with a client right now.'); return; }
        bot.say(plural(L.length, 'task is', 'tasks are') + ' with clients. The latest client note is on each card:', { cards: L.slice(0, 5).map(function (t) { var c = S().comments.filter(function (x) { return x.task === t.id; }).sort(function (a, b) { return b.at - a.at; })[0]; return taskCard(t, c ? ['“' + c.text.slice(0, 70) + (c.text.length > 70 ? '…”' : '”')] : []); }) });
      } },
      { id: 'load', label: 'Who’s overloaded', kw: ['overloaded', 'who is overloaded', 'workload', 'who has capacity', 'who is free'], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var D = w.D, today = D.today(), mon = D.add(today, -((D.dow(today) + 6) % 7)), days = [0, 1, 2, 3, 4].map(function (i) { return D.add(mon, i); }), ts = w.Q.tasks('*', true);
        var rows = S().users.filter(function (u) { return u.role !== 'guest' && u.cap; }).map(function (u) { var h = 0; days.forEach(function (d) { ts.forEach(function (t) { h += w.workload.load(t, u.id, d); }); }); return { u: u, h: h, r: h / u.cap }; }).sort(function (a, b) { return b.r - a.r; });
        var over = rows.filter(function (r) { return r.r > 1; }), free = rows.slice().reverse().slice(0, 2);
        bot.say(over.length ? '**' + over.map(function (r) { return first(r.u.name); }).join(' and ') + '** ' + (over.length === 1 ? 'is' : 'are') + ' over capacity this week. Most room: ' + free.map(function (r) { return first(r.u.name) + ' (' + Math.round(r.r * 100) + '%)'; }).join(', ') + '.' : 'Nobody is over capacity this week.', {
          cards: rows.slice(0, 4).map(function (r) { return { title: r.u.name, sub: r.u.title, badge: r.r > 1 ? 'Over capacity' : r.r > .8 ? 'Near capacity' : '', meta: [Math.round(r.h) + 'h planned of ' + r.u.cap + 'h', Math.round(r.r * 100) + '% of the week'], buttons: [B('Their open tasks', 'act:person:' + r.u.id)] }; }),
          buttons: [B('Open the workload view', 'act:goto:#/p/*/workload')] });
      } },
      { id: 'find', label: 'Find a task', kw: ['find', 'search', 'where is', 'show me the task', 'look up'], re: [/^(find|search|where is|show)\b/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        var L = findTasks(m.text); if (!L.length) { bot.say('I couldn’t find a task matching that. Try a word from its title or its number, like CEW-110.'); return; }
        bot.say(L.length === 1 ? 'Found it:' : 'Closest matches:', { cards: L.map(function (t) { return taskCard(t); }) });
      } },
      { id: 'log', label: 'Log time', kw: ['log time', 'log hours', 'track time', 'spent hours'], re: [/\blog\s+\d/i, /\b\d+(\.\d+)?\s*(h|hr|hrs|hours?|m|mins?|minutes?)\s+(on|for)\b/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        var mm = 0, x; if ((x = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b/i.exec(m.text))) mm += parseFloat(x[1]) * 60; if ((x = /(\d+)\s*(?:m|mins?|minutes?)\b/i.exec(m.text))) mm += +x[1];
        var L = findTasks(m.text, { open: true, n: 3 });
        if (!mm) { bot.say('How long? Say it like “log 1h 30m on subscription flow”.'); return; }
        if (!L.length) { bot.say('Which task was it? Give me a word from the title.'); return; }
        var t = L[0];
        commit('Logged ' + w.UI.hm(mm) + ' on ' + t.num, function () { t.time.push({ id: w.store.uid('l'), uid: me(), mins: Math.round(mm), at: Date.now(), note: 'From the assistant' }); w.store.log(t, 'logged ' + w.UI.hm(mm)); });
        bot.say('Logged **' + w.UI.hm(mm) + '** on ' + t.num + '. Total now ' + w.UI.hm(w.Q.logged(t)) + (t.est ? ' of ' + t.est + 'h' : '') + '.', { cards: [taskCard(t)] });
      } },
      { id: 'timer', label: 'Start a timer', kw: ['start timer', 'start a timer', 'start tracking', 'timer on'], re: [/\b(start|stop)\b.*\btimer\b/i], run: function (bot, m) {
        var w = W(); if (!w) return offline(bot);
        if (/\bstop\b/i.test(m.text)) { if (!S().timer) { bot.say('No timer is running.'); return; } w.app.stopTimer(); bot.say('Stopped and logged.'); return; }
        var L = findTasks(m.text, { open: true, n: 1 }); if (!L.length) { bot.say('Which task? Say “start timer on” and a word from its title.'); return; }
        w.app.startTimer(L[0]); bot.say('Timer running on **' + L[0].title + '**. It’s in the top bar; say “stop timer” when you’re done.');
      } },
      { id: 'mentions', label: 'Mentions', kw: ['mentions', 'any mentions', 'who mentioned me', 'inbox', 'notifications', 'unread'], run: function (bot) {
        var w = W(); if (!w) return offline(bot);
        var L = S().notifs.filter(function (n) { return n.to === me() && !n.read; }).sort(function (a, b) { return b.at - a.at; });
        if (!L.length) { bot.say('Inbox zero. Nothing unread.'); return; }
        bot.say(plural(L.length, 'unread item') + ' in your inbox. The newest:', { cards: L.slice(0, 4).map(function (n) { var t = n.task && w.Q.task(n.task), u = n.from && w.Q.user(n.from); return { title: (u ? first(u.name) + ' ' : '') + n.text.slice(0, 80), sub: t ? t.num + ' · ' + t.title : 'Form submission', meta: [w.D.ago(n.at)], buttons: t ? [B('Open task', 'act:open:' + t.id)] : [B('Open inbox', 'act:goto:#/inbox')] }; }), buttons: [B('Open the inbox', 'act:goto:#/inbox')] });
      } },
      { id: 'create', label: 'Create a task', kw: ['create task', 'create a task', 'add a task', 'new task'], re: [/^(please\s+)?(create|add|make|remind)\b/i], flow: 'create' }
    ],
    extract: function (text, bot) { if (!W() || !/\b(create|add|make|new|remind|task|for|due|by)\b/i.test(text) || (bot.flow !== 'create' && !/^(please\s+)?(can you\s+)?(create|add|make|new|remind)/i.test(text))) return {}; var o = parseCreate(text, bot), r = {}; if (o.title) r.title = o.title; if (o.who) r.who = o.who; if (o.due) r.due = o.due; if (o.project) r.project = o.project; return r; },
    flows: {
      create: {
        intent: 'create',
        slots: [
          { name: 'title', ask: function (bot) { bot.say('What’s the task? One line is enough.'); }, parse: function (t) { t = String(t).trim(); return t.length >= 3 ? cap(t.replace(/^(to|:)\s+/i, '')) : undefined; } },
          { name: 'who', ask: function (bot) { var w = W(), p = W().Q.project(bot.slots.project || (curProject(bot) || {}).id || 'p1'); bot.say('Who should do it?', { buttons: [B('Me', 'slot:who=' + me())].concat(p.members.filter(function (u) { return u !== me() && w.Q.user(u).role !== 'guest'; }).slice(0, 5).map(function (u) { return B(first(w.Q.user(u).name), 'slot:who=' + u); })) }); },
            parse: function (t) { if (/\b(me|myself|mujhe)\b/i.test(t)) return me(); var u = null; String(t).split(/\s+/).some(function (x) { u = findUser(x); return !!u; }); return u ? u.id : (/^u\d+$/.test(t) ? t : undefined); } },
          { name: 'due', ask: function (bot) { var D = W().D; bot.say('When is it due?', { buttons: [B('Today', 'slot:due=' + D.today()), B('Tomorrow', 'slot:due=' + D.add(D.today(), 1)), B('Friday', 'say:friday'), B('Next week', 'slot:due=' + D.add(D.today(), 7)), B('No date', 'slot:due=none')] }); },
            parse: function (t) { if (/^\d{4}-\d{2}-\d{2}$/.test(t) || t === 'none') return t; if (/\b(no date|none|whenever|someday)\b/i.test(t)) return 'none'; var x = N.when(String(t).replace(/\bkal\b/i, 'tomorrow').replace(/\baaj\b/i, 'today')); return x && x.iso ? x.iso : undefined; } },
          { name: 'ok', ask: function (bot, s) {
            var w = W(), p = w.Q.project(s.project || (curProject(bot) || {}).id || 'p1'); s.project = p.id;
            bot.say('Here’s the task. Create it?', { cards: [{ title: s.title, sub: p.key + ' · ' + p.name, badge: 'Preview', meta: ['Assignee: ' + w.Q.user(s.who).name, 'Due: ' + (s.due && s.due !== 'none' ? w.D.fmt(s.due, 'long') : 'no date'), 'Status: ' + p.statuses[Math.min(1, p.statuses.length - 1)].name] }],
              buttons: [B('Create task', 'slot:ok=yes'), B('Change the project', 'act:pickproj:1'), B('Cancel', 'slot:ok=no')] });
          }, parse: function (t) { var y = N.yesno(t); return y === undefined ? undefined : (y ? 'yes' : 'no'); } }
        ],
        done: function (bot, s) {
          var w = W(); if (!w) return offline(bot);
          if (s.ok !== 'yes') { bot.say('Okay, nothing created.'); return; }
          var p = w.Q.project(s.project), due = s.due && s.due !== 'none' ? s.due : null, t;
          commit('Created ' + s.title, function () { t = w.A.create({ project: p.id, title: s.title, assignees: [s.who], due: due, start: due ? (w.D.add(due, -1) < w.D.today() ? w.D.today() : w.D.add(due, -1)) : null, status: p.statuses[Math.min(1, p.statuses.length - 1)].id }); return t; });
          bot.say('Created **' + t.num + '**' + (s.who !== me() ? ' and let ' + first(w.Q.user(s.who).name) + ' know' : '') + '. ⌘Z undoes it.', { cards: [taskCard(t)], buttons: [B('Create another', 'flow:create'), B('Done', 'say:thanks')] });
        }
      }
    },
    actions: {
      open: function (bot, id) { var w = W(); if (!w || !w.Q.task(id)) return; w.app.openTask(id); bot.say('Opened ' + w.Q.task(id).num + ' beside this chat.', { delay: 120 }); },
      goto: function (bot, h) { var w = W(); if (w) w.app.go(h); bot.say('Done — it’s open behind this panel.', { delay: 120 }); },
      focus: function (bot) { var w = W(); if (w) { w.pages.focus(); if (window.OrdwellAssistant) window.OrdwellAssistant.close(); } },
      person: function (bot, uid) { var w = W(); if (!w) return; var L = w.Q.tasks('*', true).filter(function (t) { return t.assignees.indexOf(uid) > -1 && !w.Q.isDone(t); }).sort(function (a, b) { return (a.due || '9') < (b.due || '9') ? -1 : 1; }); bot.say(first(w.Q.user(uid).name) + ' has ' + plural(L.length, 'open task') + ':', { cards: L.slice(0, 5).map(function (t) { return taskCard(t); }) }); },
      summary: function (bot, pid) { var w = W(); if (w && w.Q.project(pid)) summary(bot, w.Q.project(pid)); },
      archprev: function (bot, pid) { var w = W(); if (w && w.Q.project(pid)) archivePreview(bot, w.Q.project(pid)); },
      archive: function (bot, pid) {
        var w = W(); if (!w) return; var p = w.Q.project(pid), dest = w.Q.project('p7'), L = w.Q.tasks(p.id).filter(w.Q.isDone);
        if (!L.length) { bot.say('Those were already moved.'); return; }
        commit('Moved ' + L.length + ' done tasks to ' + dest.name, function () { L.forEach(function (t) { t.project = dest.id; t.status = w.Q.doneStatus(dest); w.Q.subs(t.id).forEach(function (s) { s.project = dest.id; s.status = t.status; }); w.store.log(t, 'moved this to ' + dest.name + ' (assistant)'); }); });
        bot.say('Moved **' + plural(L.length, 'task') + '** to ' + dest.name + '. Press ⌘Z or Undo in the toast to put them back.', { buttons: [B('Summarise ' + p.key, 'act:summary:' + p.id)] });
      },
      done: function (bot, id) { var w = W(); if (!w) return; var t = w.Q.task(id); if (!t || w.Q.isDone(t)) return; commit('Done: ' + t.title, function () { w.A.setStatus(t, w.Q.doneStatus(w.Q.project(t.project))); }); bot.say('Marked **' + t.num + '** done. ' + (S().runs.length ? 'Any automations on it have run.' : ''), { delay: 120 }); },
      tomorrow: function (bot, id) { var w = W(); if (!w) return; var t = w.Q.task(id); if (!t) return; var n = w.D.add(w.D.today(), 1); commit(t.num + ' due tomorrow', function () { t.due = n; if (t.start && t.start > n) t.start = n; w.store.log(t, 'moved the due date to tomorrow (assistant)'); }); bot.say(t.num + ' is now due **tomorrow**.', { delay: 120 }); },
      bulktomorrow: function (bot, scope) {
        var w = W(); if (!w) return; var n = w.D.add(w.D.today(), 1), L = (scope === 'mine' ? myOpen() : scope === 'all' ? w.Q.tasks('*', true) : w.Q.tasks(scope, true)).filter(w.Q.overdue);
        commit('Moved ' + L.length + ' overdue tasks to tomorrow', function () { L.forEach(function (t) { t.due = n; if (t.start && t.start > n) t.start = n; w.store.log(t, 'moved the due date to tomorrow (assistant)'); }); });
        bot.say('Moved **' + plural(L.length, 'task') + '** to tomorrow. Undo is in the toast if that was too much.');
      },
      pickproj: function (bot) { var w = W(); bot.say('Which project?', { buttons: w.Q.projectsVisible().slice(0, 7).map(function (p) { return B(p.name, 'act:setproj:' + p.id); }) }); },
      setproj: function (bot, pid) { bot.slots.project = pid; var f = O.agents.work.flows.create; f.slots[3].ask(bot, bot.slots); }
    },
    kb: [
      { id: 'formula', q: 'How do formula columns work?', a: 'In the Table view, click + at the end of the header, pick **Formula** and write it with field names in braces: `{Budget} - {Spent}`. You get + − × ÷, & to join text, and IF(), ROUND(), DAYS(a, b), PCT(part, whole), MIN(), MAX() and TODAY(). The preview shows results on real rows before you save.', keys: ['formula', 'calculated column', 'formula column', 'budget minus spent'] },
      { id: 'auto', q: 'How do I set up an automation?', a: 'Automations → New automation. Pick a trigger (status changes, task created, assigned, comment, all subtasks done, due tomorrow), add conditions if you need them, then steps. **Test on a task** runs it without changing anything; the run log shows every real run.', keys: ['automation', 'automate', 'rule', 'workflow', 'when status changes'] },
      { id: 'views', q: 'How do saved views work?', a: 'Set filters, grouping and the view type, then **Save view**. It becomes a tab in the project and appears in the sidebar. Tick “Make it a queue” and it gets a Play button for focus mode.', keys: ['saved view', 'save view', 'save filter', 'queue'] },
      { id: 'guests', q: 'What can client guests see?', a: 'Guests see only tasks tagged **client-visible** in the projects they’re invited to. They can comment and approve. They never see internal comments, money fields or other projects. Try **View as** from your account menu to check.', keys: ['guest', 'client access', 'client see', 'share with client'] },
      { id: 'brand', q: 'How do I change the logo or colours?', a: 'Settings → Branding. Name, logo and accent apply live to the sidebar, forms, emails and the client login. Domain and login has your custom domain and the sender name.', keys: ['logo', 'brand', 'white label', 'colour', 'color', 'custom domain'] },
      { id: 'undo', q: 'Can I undo something?', a: 'Yes — ⌘Z (Ctrl+Z) undoes the last change, ⌘⇧Z redoes it. Every toast also has an Undo button. Bulk changes show a preview before they apply.', keys: ['undo', 'revert', 'go back', 'mistake'] },
      { id: 'keys', q: 'What are the keyboard shortcuts?', a: '⌘K opens the command palette, C creates a task, F starts focus mode, G then I opens the inbox, 1–6 switch views, J/K move, X selects, T starts a timer on the open task. Press ? for the full sheet.', keys: ['shortcut', 'keyboard', 'hotkey', 'cmd k'] },
      { id: 'deps', q: 'How do dependencies work?', a: 'On the Timeline, drag the dot at the end of a bar onto the task it blocks. Arrows turn red when a task starts before its blocker ends. With “Move dependent tasks” on, dragging a blocker pushes the tasks after it.', keys: ['dependency', 'dependencies', 'blocked by', 'gantt', 'link tasks'] },
      { id: 'bulk', q: 'How do I edit many tasks at once?', a: 'In List or Table, tick rows (Shift-click for a range, X on the keyboard). The bar at the bottom changes status, assignee, priority, dates, tags or project — with a preview of exactly what changes first.', keys: ['bulk', 'many tasks', 'multiple tasks', 'select all'] },
      { id: 'time', q: 'How does time tracking work?', a: 'Start a timer from any task (or press T with it open); it shows in the top bar. You can also log time manually, or tell me “log 1h 30m on subscription flow”. Logged time counts against the estimate.', keys: ['time tracking', 'timer', 'timesheet', 'hours logged'] },
      { id: 'focus', q: 'What is focus mode?', a: 'Press F. It lines up what’s overdue and due today, one task at a time, with the latest note on top. One tap logs how it went (approved, changes, no reply, blocked) and moves you to the next.', keys: ['focus mode', 'one task at a time', 'my day'] },
      { id: 'forms', q: 'How do forms create tasks?', a: 'Forms → pick or create a form, map each question to a task field (title, due date, priority, any custom field) and share the link. Each submission becomes a task and can trigger an automation.', keys: ['form', 'intake', 'request form', 'brief form'] },
      { id: 'docs', q: 'Can I put tasks inside a doc?', a: 'Yes. In a doc, type / and pick **Task embed** or **Task list embed**. They stay live: tick one in the doc and it’s done on the board. You can also turn any line into a task from its block menu.', keys: ['doc', 'docs', 'embed', 'brief', 'wiki'] },
      { id: 'templates', q: 'Which templates are there?', a: 'Agency client delivery, construction site, product sprint, marketing calendar, client onboarding and event production. Each comes with statuses, fields, dated tasks with dependencies and automations.', keys: ['template', 'templates', 'start a project'] },
      { id: 'workload', q: 'How is workload calculated?', a: 'Each task’s estimate is spread across its working days and split between its assignees, then compared with each person’s weekly capacity. Drag a task chip onto another person to reassign it.', keys: ['workload', 'capacity', 'hours per week'] },
      { id: 'export', q: 'Can I export my data?', a: 'Settings → Data has a JSON export of the whole workspace. **Start fresh** there restores the original projects.', keys: ['export', 'download data', 'backup', 'start fresh'] }
    ],
    freeText: function (bot, m) {
      var w = W(); if (!w) return false;
      if (/^(please\s+)?(can you\s+)?(create|add|make|remind)\b/i.test(m.text)) { bot.startFlow('create', (function () { var o = parseCreate(m.text, bot), r = {}; if (o.title) r.title = o.title; if (o.who) r.who = o.who; if (o.due) r.due = o.due; if (o.project) r.project = o.project; return r; })()); return true; }
      var p = findProject(m.text); if (p) { summary(bot, p); return true; }
      var L = findTasks(m.text); if (L.length) { bot.say('Is it one of these?', { cards: L.slice(0, 3).map(function (t) { return taskCard(t); }) }); return true; }
      return false;
    }
  });

  function summary(bot, p) {
    var w = W(), Q = w.Q, D = w.D, ts = Q.tasks(p.id), done = ts.filter(Q.isDone).length, over = ts.filter(Q.overdue), waiting = ts.filter(function (t) { return Q.cat(t) === 'review2'; }), blocked = ts.filter(function (t) { return !Q.isDone(t) && Q.blockedOpen(t); });
    var ms = ts.filter(function (t) { return t.tags.indexOf('milestone') > -1 && !Q.isDone(t); }).sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0];
    var fs = Q.fieldsFor(p.id), fb = fs.filter(function (f) { return /budget|contract value/i.test(f.name); })[0], fsp = fs.filter(function (f) { return /spent|paid/i.test(f.name); })[0], money = '';
    if (fb && fsp) { var b = 0, s = 0; ts.forEach(function (t) { b += +t.fields[fb.id] || 0; s += +t.fields[fsp.id] || 0; }); if (b) money = ' Budget: **' + w.UI.inrS(s) + '** spent of ' + w.UI.inrS(b) + ' (' + Math.round(s / b * 100) + '%).'; }
    var lines = '**' + p.name + '** is ' + { on: 'on track', risk: 'at risk', off: 'off track' }[p.health] + ': **' + done + ' of ' + ts.length + '** tasks done' + (ms ? ', next milestone **' + ms.title + '** on ' + D.fmt(ms.due) + (D.rel(ms.due) !== D.fmt(ms.due) ? ' (' + D.rel(ms.due).toLowerCase() + ')' : '') : '') + '.' + money +
      (over.length ? '\n' + plural(over.length, 'task is', 'tasks are') + ' overdue' : '\nNothing overdue') + (waiting.length ? ', ' + waiting.length + ' waiting on the client' : '') + (blocked.length ? ', ' + blocked.length + ' blocked' : '') + '.';
    var risk = over.concat(blocked.filter(function (t) { return over.indexOf(t) < 0; })).slice(0, 3);
    bot.say(lines, { cards: risk.map(function (t) { return taskCard(t); }), buttons: [B('Open the timeline', 'act:goto:#/p/' + p.id + '/timeline'), B('Tidy up Done tasks', 'act:archprev:' + p.id), B('Who’s overloaded?', 'intent:load')] });
  }
  function archivePreview(bot, p) {
    var w = W(), L = w.Q.tasks(p.id).filter(w.Q.isDone);
    if (p.id === 'p7') { bot.say('That’s already the archive.'); return; }
    if (!L.length) { bot.say('There are no done tasks in ' + p.name + ' to move.'); return; }
    bot.say('Here’s what would change. **' + plural(L.length, 'done task') + '** move from ' + p.name + ' to Delivered archive; nothing else is touched.', {
      cards: [{ title: 'Move ' + plural(L.length, 'task') + ' to Delivered archive', sub: 'Preview — nothing has changed yet', badge: 'Preview', meta: L.slice(0, 6).map(function (t) { return t.num + ' · ' + t.title; }).concat(L.length > 6 ? ['+ ' + (L.length - 6) + ' more'] : []) }],
      buttons: [B('Move ' + L.length + ' tasks', 'act:archive:' + p.id), B('Not now', 'say:never mind')] });
  }

  /* ======================================================================================================
     CUSTOMER: the sales assistant on the marketing site
     ====================================================================================================== */
  var PLANS = [
    { id: 'team', name: 'Team', m: 399, for: 'Studios up to 10 people', feats: ['All six views and docs', '3 forms, 250 automation runs a month', 'Unlimited client guests'] },
    { id: 'business', name: 'Business', m: 799, for: 'Growing agencies with several teams', feats: ['Formula columns and saved views', 'Dashboards, time tracking', '5,000 automation runs a month'] },
    { id: 'agency', name: 'Agency', m: 1499, for: 'Resell it under your own brand', feats: ['Your domain, logo, colours, emails', 'Workspace per client', 'Unlimited automations, partner margin'] }
  ];
  var LEADS = 'ordwell-site-leads';
  function lget() { try { return JSON.parse(localStorage.getItem(LEADS)) || null; } catch (e) { return null; } }
  function lset(v) { try { localStorage.setItem(LEADS, JSON.stringify(v)); } catch (e) { } }
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function planFor(size, white) { if (white) return PLANS[2]; if (size <= 10) return PLANS[0]; return PLANS[1]; }
  function planCard(p, size, why) {
    var seats = Math.max(1, size || 5), mo = p.m * seats;
    return { title: p.name + ' plan', sub: p.for, badge: why || '', price: inr(p.m) + ' / seat a month', meta: p.feats.concat([seats + ' seats ≈ ' + inr(mo) + '/month, or ' + inr(mo * 10) + '/year (2 months free) + GST']),
      buttons: [B('Book a walkthrough', 'flow:book'), B('Open the live app', 'act:go:index.html')] };
  }
  function tplList() { return (window.OW && window.OW.TEMPLATES) || []; }
  function tplCard(t) { return { title: t.name, sub: t.cat + ' · ' + t.tasks.length + ' tasks · ' + t.statuses.length + ' statuses', meta: [t.blurb.slice(0, 110) + (t.blurb.length > 110 ? '…' : ''), '⚡ ' + t.autos[0]], buttons: [B('Use it in the live app', 'act:go:index.html#/templates?use=' + t.id), B('Another template', 'flow:fit')] }; }
  var TEAM = { agency: ['agency', 'studio', 'clients', 'retainer', 'design', 'website', 'branding'], construction: ['construction', 'site', 'contractor', 'builder', 'fit-out', 'fitout', 'interior', 'civil', 'renovation'], product: ['product', 'software', 'engineering', 'sprint', 'dev', 'startup', 'app', 'saas'], marketing: ['marketing', 'social', 'content', 'campaign', 'instagram', 'newsletter'], events: ['event', 'events', 'wedding', 'offsite', 'launch party', 'conference'] };
  var TPLOF = { agency: 'tp-agency', construction: 'tp-site', product: 'tp-sprint', marketing: 'tp-mkt', events: 'tp-event' };
  function teamType(t) { t = ' ' + String(t).toLowerCase() + ' '; for (var k in TEAM) if (TEAM[k].some(function (w) { return t.indexOf(w) > -1; })) return k; return undefined; }
  function teamSize(t) { var m = String(t).match(/\b(\d{1,4})\s*(?:people|persons?|members?|seats?|log|logon|ppl|staff|employees|users)?\b/i); return m ? +m[1] : (N.wordNum((String(t).match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i) || [])[1] || '') || undefined); }
  function go(bot, url) { bot.say('Opening it…', { delay: 200 }); try { sessionStorage.setItem('cg-reopen-work-sales', '1'); } catch (e) { } setTimeout(function () { location.href = O.samples('work/' + url); }, 700); }
  function slotDays() { var out = [], d = new Date(); d.setHours(12, 0, 0, 0); while (out.length < 4) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d)); } return out; }
  function hing(t) { return String(t).toLowerCase().replace(/\bparso\b/g, 'day after tomorrow').replace(/\bkal\b/g, 'tomorrow').replace(/\baaj\b/g, 'today').replace(/\bsubah\b/g, 'morning').replace(/\b(shaam|sham)\b/g, 'evening').replace(/\bdopahar\b/g, 'afternoon').replace(/\bbaje\b/g, ''); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  O.registerAgent({
    id: 'work-sales', name: 'Ordwell', business: 'Ordwell', role: 'Plans, templates and walkthroughs', industry: 'SaaS', initials: 'O', accent: '#C2461C', kind: 'customer',
    blurb: 'Ordwell’s own sales desk: picks a plan from a sentence, matches a template to your team, quotes in rupees and books a walkthrough straight into the team’s request board.',
    helloLine: 'I can pick a plan, match a template to your team, quote it in rupees or book a walkthrough.',
    samples: ['which plan for 18 people', 'kitne ka hai for 12 log', 'we are a construction company', 'walkthrough kal subah'],
    menu: [B('Pick a plan for us', 'flow:plan'), B('Which template fits my team?', 'flow:fit'), B('Price for my team', 'flow:quote'), B('Book a walkthrough', 'flow:book'), B('Check my request', 'intent:status')],
    contexts: [{ label: 'Product page', context: { page: 'product' } }, { label: 'Pricing', context: { page: 'pricing' } }, { label: 'Templates', context: { page: 'templates' } }],
    synonyms: {
      'how much': ['kitne ka hai', 'kitna hai', 'kitne ka', 'price kya hai', 'cost kya hai', 'rate kya hai', 'pricing', 'charges', 'how much does it cost'],
      'walkthrough': ['demo call', 'a demo', 'book a demo', 'product tour', 'call with sales', 'meeting', 'presentation', 'walk through', 'call back'],
      'tomorrow': ['kal'], 'morning': ['subah'], 'evening': ['shaam', 'sham'],
      'white label': ['white-label', 'whitelabel', 'my own brand', 'our own brand', 'our logo', 'my logo', 'resell', 'rebrand'],
      'template': ['templates', 'starter', 'ready made', 'readymade']
    },
    greeting: function (bot) {
      var pg = (bot.ctx && bot.ctx.page) || 'product', sec = bot.ctx && bot.ctx.section;
      var line = pg === 'pricing' ? 'Working out the price? Tell me your team size and whether clients should see your brand, and I’ll pick the plan and total it.'
        : pg === 'templates' ? 'Looking for a starting point? Tell me what your team does and I’ll match a template you can open in the live app.'
        : sec === 'white-label' ? 'Thinking about white-label? That’s the Agency plan: your domain, logo and emails. Want a quote for your team?'
        : 'Hi, I’m Ordwell’s sales desk. I can pick a plan, match a template to your team, quote it in rupees or book a 30-minute walkthrough.';
      bot.say(line, { buttons: pg === 'pricing' ? [B('Pick a plan for us', 'flow:plan'), B('Price for my team', 'flow:quote'), B('Book a walkthrough', 'flow:book')] : pg === 'templates' ? [B('Which template fits my team?', 'flow:fit'), B('Book a walkthrough', 'flow:book'), B('Pick a plan for us', 'flow:plan')] : bot.agent.menu.slice(0, 4) });
    },
    nudge: function (c) {
      if (c.page === 'pricing') return { text: 'Not sure between Business and Agency? I can work it out from your team size in two questions.', cta: 'Pick a plan', button: B('Pick a plan for us', 'flow:plan') };
      if (c.page === 'templates') return { text: 'Tell me what your team does and I’ll match a template you can open in the live app.', cta: 'Match a template', button: B('Which template fits my team?', 'flow:fit') };
      return { text: 'Want to see Ordwell with your own projects in it? I can book a 30-minute walkthrough.', cta: 'Book a walkthrough', button: B('Book a walkthrough', 'flow:book') };
    },
    intents: [
      { id: 'plan', label: 'Pick a plan', kw: ['which plan', 'pick a plan', 'what plan', 'right plan', 'recommend a plan'], re: [/\bwhich plan\b/i], flow: 'plan' },
      { id: 'quote', label: 'Price', kw: ['how much', 'price', 'cost', 'quote', 'per seat', 'total for'], flow: 'quote' },
      { id: 'fit', label: 'Template fit', kw: ['template', 'which template', 'template fits', 'starting point', 'we are a', 'we run a'], flow: 'fit' },
      { id: 'book', label: 'Walkthrough', kw: ['walkthrough', 'book a walkthrough', 'talk to sales', 'schedule a call'], flow: 'book' },
      { id: 'status', label: 'Request status', kw: ['my request', 'status of my', 'did you get my', 'reference', 'my booking'], re: [/\bL-\d{4}\b/i], run: function (bot, m) {
        var id = (m.text.match(/\bL-\d{4}\b/i) || [])[0], em = N.email(m.text), L = lget() || [];
        var l = L.filter(function (x) { return (id && x.id.toLowerCase() === id.toLowerCase()) || (em && x.email === em); })[0];
        if (!id && !em) { bot.say('Give me your reference (like L-2405) or the email you used, and I’ll look it up.'); return; }
        if (!l) { bot.say('I can’t find a request with that reference in this browser. Want me to book one now?', { buttons: [B('Book a walkthrough', 'flow:book')] }); return; }
        var stg = { new: 'Received — the team replies within one working day', contacted: 'We’ve been in touch', demo: 'Walkthrough booked', won: 'Signed up — welcome aboard', lost: 'Closed for now' }[l.stage] || l.stage;
        bot.say('Found it:', { cards: [{ title: l.company, sub: l.id + ' · ' + l.plan + ' plan · ' + l.team + ' people', badge: stg.split(' —')[0], meta: [stg, l.slot ? 'Slot: ' + l.slot : 'No slot picked yet'].concat(l.log && l.log.length ? ['Last note: ' + l.log[l.log.length - 1].text] : []) }] });
      } },
      { id: 'whitelabel', label: 'White-label', kw: ['white label', 'own brand', 'custom domain'], run: function (bot) { bot.say('White-label is the **Agency** plan: your domain, logo, colours, email sender and login page, a workspace per client, and you can hide “Powered by Ordwell”. You set your own price to clients and keep the margin.', { cards: [planCard(PLANS[2], 10, 'White-label')], buttons: [B('Price it for my team', 'flow:quote'), B('Try the brand switcher', 'act:go:product.html#white-label')] }); } }
    ],
    extract: function (text) { var r = {}, s = teamSize(text), t = teamType(text); if (s && s < 5000 && !/\bL-\d{4}\b/i.test(text)) r.size = s; if (t) r.team = t; if (/\bwhite label\b|\bresell\b|\bown brand\b/i.test(N.norm(text))) r.white = 'yes'; var e = N.email(text); if (e) r.email = e; var w = N.when(hing(text)); if (w && w.iso) r.day = w.iso; if (w && w.time) r.time = w.time; return r; },
    flows: {
      plan: { intent: 'plan', slots: [
        { name: 'size', ask: function (bot) { bot.say('How many people will plan and do the work? (Clients join free.)', { buttons: [B('1–10', 'slot:size=8'), B('11–25', 'slot:size=18'), B('26–60', 'slot:size=40'), B('60+', 'slot:size=80')] }); }, parse: function (t) { return teamSize(t); } },
        { name: 'white', ask: function (bot) { bot.say('Should clients see **your** brand — your domain, logo and emails?', { buttons: [B('Yes, our brand', 'slot:white=yes'), B('No, Ordwell is fine', 'slot:white=no')] }); }, parse: function (t) { var y = N.yesno(t); return /brand|white|resell/i.test(t) ? 'yes' : y === undefined ? undefined : (y ? 'yes' : 'no'); } }
      ], done: function (bot, s) {
        var p = planFor(s.size, s.white === 'yes'), why = s.white === 'yes' ? 'Fits: your brand' : s.size <= 10 ? 'Fits: small studio' : 'Fits: ' + s.size + ' people';
        bot.say('For **' + s.size + ' people**' + (s.white === 'yes' ? ' under your own brand' : '') + ', I’d go with **' + p.name + '**.' + (p.id === 'business' && s.size > 40 ? ' At this size, ask about volume pricing on the call.' : ''), { cards: [planCard(p, s.size, why)] });
        bot.event('action', { action: 'plan_pick', plan: p.id });
      } },
      quote: { intent: 'quote', slots: [
        { name: 'size', ask: function (bot) { bot.say('For how many people?', { buttons: [B('5', 'slot:size=5'), B('12', 'slot:size=12'), B('25', 'slot:size=25'), B('50', 'slot:size=50')] }); }, parse: function (t) { return teamSize(t); } }
      ], done: function (bot, s) {
        var n = s.size, cards = PLANS.map(function (p) { var mo = p.m * n; return { title: p.name, sub: inr(p.m) + ' a seat each month', price: inr(mo) + ' / month', meta: ['Yearly: ' + inr(mo * 10) + ' (2 months free)', 'GST at 18% adds ' + inr(mo * .18) + ' a month'], badge: planFor(n, false).id === p.id ? 'Best fit' : '', buttons: [B('Book a walkthrough', 'flow:book')] }; });
        bot.say('For **' + n + ' people**, before GST. Client guests are always free:', { cards: cards });
      } },
      fit: { intent: 'fit', slots: [
        { name: 'team', ask: function (bot) { bot.say('What does your team mostly do?', { buttons: [B('Agency / studio', 'slot:team=agency'), B('Construction', 'slot:team=construction'), B('Product / software', 'slot:team=product'), B('Marketing', 'slot:team=marketing'), B('Events', 'slot:team=events')] }); }, parse: function (t) { return TPLOF[t] ? t : teamType(t); } }
      ], done: function (bot, s) {
        var all = tplList(), t = all.filter(function (x) { return x.id === TPLOF[s.team]; })[0];
        if (!t) { bot.say('Our templates are on the templates page.', { buttons: [B('Open templates', 'act:go:templates.html')] }); return; }
        var extra = s.team === 'agency' ? all.filter(function (x) { return x.id === 'tp-onboard'; }) : [];
        bot.say('Start with **' + t.name + '**. It comes with ' + t.tasks.length + ' dated tasks, ' + t.statuses.length + ' statuses' + (t.fields.some(function (f) { return f[1] === 'formula'; }) ? ', a formula column' : '') + ' and its automations switched on.', { cards: [tplCard(t)].concat(extra.map(tplCard)) });
      } },
      book: { intent: 'book', slots: [
        { name: 'company', ask: function (bot) { bot.say('Happy to set that up. Which agency or company is it for?'); }, parse: function (t) { t = String(t).trim(); return t.length > 1 && !/^(yes|no|ok)$/i.test(t) ? t.replace(/^(it'?s|we are|we're|for)\s+/i, '').slice(0, 60) : undefined; } },
        { name: 'name', ask: function (bot) { bot.say('And your name?'); }, parse: function (t) { return N.name(t); } },
        { name: 'email', ask: function (bot) { bot.say('Your work email, for the invite?'); }, parse: function (t) { return N.email(t); }, validate: function (v) { return /@/.test(v) ? '' : 'That email looks incomplete — check the part after @.'; } },
        { name: 'size', ask: function (bot) { bot.say('Roughly how many people on the team?', { buttons: [B('1–10', 'slot:size=8'), B('11–25', 'slot:size=18'), B('26–60', 'slot:size=40'), B('60+', 'slot:size=80')] }); }, parse: function (t) { return teamSize(t); } },
        { name: 'day', ask: function (bot) { bot.say('Pick a day for the 30-minute call:', { buttons: slotDays().map(function (d) { return B(O.fmtDay(d), 'slot:day=' + iso(d)); }) }); }, parse: function (t, bot, s) { if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t; var w = N.when(hing(t)); if (w && w.part) s.part = w.part; if (w && w.time) s.time0 = w.time; return w && w.iso ? w.iso : undefined; } },
        { name: 'time', ask: function (bot, s) { bot.say('Which time on ' + O.fmtDay(new Date(s.day + 'T12:00')) + '? (IST)', { buttons: (s.part === 'evening' ? ['16:30', '17:30', '18:30'] : s.part === 'morning' ? ['10:00', '11:00', '11:30'] : ['10:30', '12:00', '15:00', '17:00']).map(function (h) { return B(O.fmtTime(h), 'slot:time=' + h); }) }); },
          parse: function (t) { if (/^\d{2}:\d{2}$/.test(t)) return t; var w = N.when(hing(t)); return w && w.time ? w.time : (w && w.timeAmbiguous ? ('0' + (w.timeAmbiguous < 8 ? w.timeAmbiguous + 12 : w.timeAmbiguous)).slice(-2) + ':00' : undefined); } }
      ], done: function (bot, s) {
        var L = lget() || (window.OW && window.OW.site && window.OW.site.seedLeads ? window.OW.site.seedLeads() : []);
        var id = 'L-' + (L.reduce(function (m, l) { return Math.max(m, +String(l.id).slice(2) || 0); }, 2400) + 1), size = s.size || 10;
        var slot = O.fmtDay(new Date(s.day + 'T12:00')) + ', ' + O.fmtTime(s.time) + ' IST';
        L.unshift({ id: id, name: s.name, email: s.email, company: s.company, team: size <= 10 ? '1–10' : size <= 25 ? '11–25' : size <= 60 ? '26–60' : '60+', plan: planFor(size, false).name, note: 'Booked in chat for ' + slot + '.', at: Date.now(), stage: 'demo', slot: slot, source: 'Chat', convo: bot.id, log: [] });
        lset(L);
        bot.user.name = s.name; bot.user.email = s.email;
        var lead = bot.lead({ name: s.name, intent: 'walkthrough', payload: { company: s.company, email: s.email, team: size, slot: slot, ref: id } });
        bot.event('booking', { kind: 'walkthrough' });
        try { var c = O.convos.get(bot.id); if (c) O.convos.setStatus(bot.id, c.status, { leadId: lead && lead.id, topic: 'walkthrough' }); } catch (e) { }
        bot.say('Booked. **' + slot + '** with ' + first(s.name) + ' from ' + s.company + '.', { cards: [{ title: '30-minute walkthrough', sub: s.company + ' · ' + size + ' people', badge: id, meta: [slot, 'Invite to ' + s.email, 'We’ll load one of your projects as a template'] }], buttons: [B('Pick a plan meanwhile', 'flow:plan'), B('Open the live app', 'act:go:index.html')] });
      } }
    },
    actions: { go: function (bot, url) { go(bot, url); } },
    kb: [
      { id: 'guests', q: 'Do client guests cost extra?', a: 'No. Client guests are free and unlimited on every plan. They see tasks you tag client-visible, can comment and approve, and never see internal notes or money fields.', keys: ['guest', 'guests', 'clients free', 'client access', 'client login'] },
      { id: 'gst', q: 'Do you give GST invoices?', a: 'Yes — every invoice carries GSTIN, HSN code and place of supply. Prices on the site exclude 18% GST.', keys: ['gst', 'invoice', 'tax', 'gstin'] },
      { id: 'pay', q: 'How can we pay?', a: 'UPI, net banking or card monthly; annual plans can also pay by bank transfer against a PO. Annual billing gives you two months free.', keys: ['pay', 'payment', 'upi', 'card', 'bank transfer', 'billing'] },
      { id: 'data', q: 'Where is our data stored?', a: 'Indian workspaces are hosted in India, encrypted in transit and at rest, in line with the DPDP Act 2023. You can export everything as JSON at any time.', keys: ['data', 'where hosted', 'india', 'privacy', 'dpdp', 'security'] },
      { id: 'trial', q: 'Is there a free trial?', a: 'The live app on this site is the full product with sample projects — no sign-up. For your own workspace we run a 14-day trial after a short walkthrough.', keys: ['trial', 'free trial', 'try it', 'test it'] },
      { id: 'import', q: 'Can we import from spreadsheets or another tool?', a: 'Yes. CSV import maps columns to fields (status, assignee, dates, any custom field). On the call we can import one of your projects for you.', keys: ['import', 'migrate', 'migration', 'spreadsheet', 'excel', 'csv', 'move from'] },
      { id: 'mobile', q: 'Does it work on phones?', a: 'Yes. Every screen is designed for phones too — My work, the inbox, task pages and focus mode work one-handed.', keys: ['mobile', 'phone', 'android', 'iphone', 'app'] },
      { id: 'sso', q: 'Do you support SSO?', a: 'Single sign-on with Google Workspace and Microsoft is on Business and Agency.', keys: ['sso', 'single sign on', 'google login', 'microsoft login', 'saml'] },
      { id: 'cancel', q: 'Can we cancel any time?', a: 'Monthly plans cancel at the end of the month. Annual plans can downgrade at renewal. You keep a full export either way.', keys: ['cancel', 'refund', 'stop subscription', 'contract'] },
      { id: 'ngo', q: 'Discounts for NGOs or education?', a: 'Registered non-profits and schools get 50% off Team and Business. Mention it on the walkthrough.', keys: ['ngo', 'nonprofit', 'non profit', 'education', 'school', 'discount'] },
      { id: 'resell', q: 'How does reselling work?', a: 'On Agency you set your own price per seat for your clients. We bill you at the Agency rate and you keep the difference; each client gets their own branded workspace.', keys: ['resell', 'partner', 'margin', 'reseller'] },
      { id: 'domain', q: 'Can we use our own domain?', a: 'Yes, on Agency: point a subdomain like work.youragency.com at your workspace; HTTPS is issued automatically and the login page shows your logo.', keys: ['domain', 'subdomain', 'own url', 'custom url'] },
      { id: 'auto', q: 'What can automations do?', a: 'Move tasks, assign people, set priority or dates, add tags, post comments and notify people — triggered by status changes, new tasks, form submissions, assignments, comments or due dates. Each run is logged.', keys: ['automation', 'automate', 'workflow', 'rules'] },
      { id: 'views', q: 'What views are there?', a: 'Board, list, table (with formula columns), timeline with dependencies, calendar and workload — all on the same tasks. Plus docs, dashboards and forms.', keys: ['views', 'gantt', 'timeline', 'kanban', 'board', 'table', 'calendar'] },
      { id: 'support', q: 'What support do we get?', a: 'Chat and email 9 am to 9 pm IST on weekdays, and onboarding help for your first project on Business and Agency.', keys: ['support', 'help', 'onboarding', 'customer success'] },
      { id: 'api', q: 'Is there an API?', a: 'Yes, a REST API and webhooks on Business and Agency, so you can sync with your CRM or accounting tools.', keys: ['api', 'webhook', 'integration', 'integrations', 'zapier'] }
    ],
    freeText: function (bot, m) {
      var t = teamType(m.text), s = teamSize(m.text);
      if (t) { bot.startFlow('fit', { team: t }); return true; }
      if (s && s < 5000) { bot.startFlow('quote', { size: s }); return true; }
      return false;
    }
  });
})();
