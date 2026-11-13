/* ORBIT ASSISTANTS engine: a scripted, rule-based conversation engine. No LLM, no network calls. Everything runs in the browser.
   Fictional demo. Data lives in localStorage only (every key is prefixed "orbit-").

   FILES (load in this order, all with defer or at the end of <body>; CSP script-src 'self' is enough):
     assets/bots/engine.js        core: NLP, intents, slot filling, KB, events, leads, handover, analytics   (no DOM)
     assets/bots/ui.js            channel skins, Orbit.mount, agent console, KB admin, analytics view
     assets/bots/agents/<id>.js   one file per agent (support, realty, build, clinic, salon, dining, admin)
     assets/bots/bots.css         styles for everything ui.js renders

   EMBED ONE AGENT WITH ONE CALL
     var chat = Orbit.mount(document.getElementById('box'), {
       agent: 'support',            // support | realty | build | clinic | salon | dining | admin
       channel: 'web',              // web | whatsapp | instagram | phone
       context: { product: 'harbor-jacket' },   // what the visitor is looking at; agents read bot.ctx
       source: 'Google',            // true lead source (defaults to the channel name)
       mode: 'inline'               // 'inline' (fills the element) or 'widget' (floating launcher); default inline
     });
     chat.send('where is my order NL-10492');  chat.choose({label:'Yes', value:'slot:confirm=yes'});  chat.handover();  chat.destroy();

   PUBLIC API  (window.Orbit)
     Orbit.registerAgent(def)               see AGENT DEFINITION below
     Orbit.agents                           { id: def }
     Orbit.createSession(agentId, opts)     headless session, used by ui.js and by tests: s.start(); s.send(text); s.choose(btn); returns the new messages
     Orbit.mount / Orbit.console / Orbit.kbAdmin / Orbit.analyticsView   (ui.js)
     Orbit.kb.list(agentId) / add / update / remove / reset            editable FAQ, key "orbit-kb-<agent>"
     Orbit.events.log(type, data) / list(filter) / clear()             event log, key "orbit-events"
     Orbit.leads.add(lead) / list(filter)                              key "orbit-leads"
     Orbit.convos.list() / get(id) / append(id, msg) / setStatus(id, status) / on(fn)    key "orbit-convos"
     Orbit.analytics.summary({days, agent})                            handled-without-agent %, leads, bookings, conversion, by channel/source/agent
     Orbit.nlp                              money, bhk, when, party, phone, email, yesno, name, area, normalize, tokens
     Orbit.samples(path)                    URL of a file under /samples/ (works from any page)
     Orbit.seed(force) / Orbit.reset()      demo history for analytics (about four weeks) / wipe every orbit-* key

   LEAD FORMAT (key "orbit-leads", array, newest last; phase 2 reads this in Lumen CRM)
     { id:'L-1001', timestamp:'2026-11-13T09:41:00.000Z', name:'Priya Nair', phone:'+91…' | '', email:'' | undefined,
       source:'Instagram ad', channel:'whatsapp', agent:'realty', intent:'book_visit',
       payload:{ …anything the agent captured… }, status:'new', seed:true|undefined }

   EVENT FORMAT (key "orbit-events"): { id, ts (ms), type, agent, channel, source, convo, …data }
     types: convo_start, engaged (first visitor message), intent {intent}, fallback, kb {id}, action {action}, lead {lead}, booking {kind}, handover {reason}, resolved, agent_reply

   AGENT DEFINITION  (Orbit.registerAgent({...}))
     id, name ('Northlane Support'), business ('Northlane'), role ('E-commerce support'), industry ('Retail'), blurb, accent ('#hex'), initials ('NL'),
     phoneLabel ('Northlane support line')  // IVR title
     synonyms: { canonical: ['alt','alt'] }   // applied to typed text before matching
     greeting: function (bot) { bot.say('Hi …', {buttons:[…]}); }          // first message(s)
     menu: [ {label,value} … ]                                              // main quick replies (3 to 6)
     intents: [ { id, label, kw:['phrase','phrase'], re:[/regex/i], priority:0, ctx: function(bot){return bonus}, run: function (bot, m) {…} | flow:'flowId' } ]
        m = { text (raw), norm (normalised), ent (extracted entities), score }
     flows: { flowId: { intent?, slots:[ { name, optional, when:function(bot,s){bool}, ask:function(bot,s){bot.say(…)}, parse:function(text,bot,s){value|undefined}, validate:function(v,bot,s){errorString|falsy} } ],
                        done: function (bot, s) {…}, cancel: function(bot,s){} } }
     extract: function (text, bot) { return { slotName: value, … } }       // pulls slot values out of any typed sentence ("3 bhk under 1.5 lakh")
     actions: { name: function (bot, arg) {…} }                            // targets of buttons with value 'act:name:arg'
     kb: [ { id, q, a, keys:['phrase'], buttons:[…] } ]                    // default FAQ, editable at runtime through Orbit.kb
     seeds: { name: function(){ return initialData } }                      // demo data, read with bot.db(name), written with bot.save(name, v)
     samples: ['3 BHK in Indiranagar under 1.5 lakh a month', …]                                    // 4 example typed phrases shown as suggestions on the demo page
     contexts: [ { label:'Viewing: Harbor Jacket', context:{ product:'harbor-jacket' } } ]   // what the demo page can pretend the visitor is looking at
     kind: 'customer' | 'staff'     freeText: function(bot, m){ …return true if handled }   // optional last chance before the fallback

   BUTTON VALUES   (the "value" of {label,value})
     'intent:<id>'  run an intent         'flow:<id>'   start a flow          'slot:<name>=<value>'  fill the active flow's slot
     'act:<name>:<arg>'  run agent.actions[name](bot, arg)        'say:<text>'  same as the visitor typing text
     'handover'  hand over to a person    'menu'  show the main menu          'cancel'  leave the flow

   BOT API  (what handlers receive as `bot`)
     bot.say(text, {buttons, cards, spoken, delay, kind})  card = {title, sub, meta:[…], img, badge, price, buttons:[…]}    **bold** is supported
     bot.menu() bot.startFlow(id, preset) bot.endFlow() bot.fill(name, value) bot.slots  bot.ctx  bot.setContext(obj)  bot.user {name,phone,email,verified}
     bot.db(name) bot.save(name, value)   bot.lead({name,phone,intent,payload}) -> lead   bot.event(type, data)   bot.handover(reason)
     bot.mem (conversation memory, persisted)   bot.channel  bot.source  bot.agent  bot.id  bot.nlp  bot.B(label,value) -> button
*/
(function (root) {
  'use strict';
  var O = root.Orbit = root.Orbit || {};
  if (O.version) return;
  O.version = 1; O.agents = {};

  /* ---------- utilities ---------- */
  var mem = {};
  var ls = (function () { try { var k = '__orbit_t'; root.localStorage.setItem(k, '1'); root.localStorage.removeItem(k); return root.localStorage; } catch (e) { return null; } })();
  function sget(k, d) { try { var v = ls ? ls.getItem(k) : mem[k]; return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sset(k, v) { try { var s = JSON.stringify(v); if (ls) ls.setItem(k, s); else mem[k] = s; } catch (e) {} }
  function sdel(k) { try { if (ls) ls.removeItem(k); else delete mem[k]; } catch (e) {} }
  O._store = { get: sget, set: sset, del: sdel, keys: function () { var o = []; try { if (ls) for (var i = 0; i < ls.length; i++) o.push(ls.key(i)); else o = Object.keys(mem); } catch (e) {} return o; } };
  var uidN = 0; function uid(p) { uidN++; return (p || 'x') + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36) + uidN; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  O.esc = esc; O.uid = uid; O.rng = rng;
  function bus() { var l = []; return { on: function (f) { l.push(f); return function () { l = l.filter(function (x) { return x !== f; }); }; }, emit: function (a, b) { l.slice().forEach(function (f) { try { f(a, b); } catch (e) {} }); } }; }
  O.samples = function (p) { return (O._root || '') + p; };
  try { var cs = root.document && root.document.currentScript; if (cs && cs.src) O._root = cs.src.replace(/assets\/bots\/engine\.js.*$/, ''); } catch (e) {}
  O.money = function (n, cur) { n = Math.round(n); if (cur === '₹') { if (n >= 1e7) return '₹' + (n / 1e7).toFixed(n % 1e7 ? 2 : 0).replace(/\.?0+$/, '') + ' Cr'; if (n >= 1e5) return '₹' + (n / 1e5).toFixed(n % 1e5 ? 2 : 0).replace(/\.?0+$/, '') + ' L'; return '₹' + n.toLocaleString('en-IN'); } return (cur || '$') + n.toLocaleString('en-US'); };

  /* ---------- NLP helpers ---------- */
  var STOP = 'a an the and or of to in on at for is are was be am i me my we you your it its this that these those with from by as do does did can could would should will please pls hi hello hey there any some about just so then than what which who how when where why if not no yes but have has had get got want need like'.split(' ');
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, couple: 2, pair: 2 };
  var NUMWRE = '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
  function stem(w) { if (w.length < 4) return w; return w.replace(/ies$/, 'y').replace(/sses$/, 'ss').replace(/([^s])s$/, '$1').replace(/(.{4,})(ing|ed)$/, '$1'); }
  function tokens(t) { return String(t).toLowerCase().replace(/[^a-z0-9₹$£€.\s'-]/g, ' ').split(/\s+/).filter(Boolean).map(function (w) { return w.replace(/^[.'-]+|[.'-]+$/g, ''); }).filter(Boolean); }
  function norm(t, syn) {
    var s = ' ' + String(t).toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9₹$£€.%@#:'\/\s+-]/g, ' ') + ' ';
    if (syn) Object.keys(syn).forEach(function (c) { (syn[c] || []).forEach(function (a) { s = s.replace(new RegExp('(^|[^a-z0-9])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '(?=$|[^a-z0-9])', 'g'), '$1' + c); }); });
    return s.replace(/\s+/g, ' ').trim();
  }
  function contentTokens(t) { return tokens(t).map(stem).filter(function (w) { return w.length > 1 && !STOPSET[w]; }); }
  function wordNum(w) { w = String(w).toLowerCase(); return /^\d+$/.test(w) ? +w : NUMW[w]; }
  var UNIT = { k: 1e3, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, million: 1e6, m: 1e6 };
  var NOTPRICE = /^\s*(bhk|bed|beds|bedroom|bedrooms|br|bath|baths|sq|sqft|sqm|sft|ft|people|persons|person|ppl|guests|pax|pm|am|kg|%|days?|years?|yrs?|months?|hrs?|hours?|mins?|minutes|inch|cm|mm|x\b|:)/;
  function money(text) {
    var t = ' ' + String(text).toLowerCase().replace(/(?:\+?\d[\s-]?){9,}\d/g, ' ').replace(/(\d),(?=\d)/g, '$1') + ' ', re = /(?:([₹$£€])\s?|\b(rs\.?|inr|usd|rupees?)\s*)?(\d+(?:\.\d+)?)\s?(k\b|thousand|lakhs?|lacs?|crores?|cr\b|million)?(?:\s?(rs\b|inr|rupees|dollars|usd|bucks))?/g, m, c = [], cur;
    while ((m = re.exec(t))) {
      var after = t.slice(re.lastIndex, re.lastIndex + 12), before = t.slice(Math.max(0, m.index - 28), m.index), val = parseFloat(m[3]), unit = m[4] ? UNIT[m[4].replace(/\s/g, '')] : 0, sym = m[1] || m[2] || m[5];
      if (NOTPRICE.test(after) && !sym) continue; if (/(size|no\.?|#|nl-?|room|floor|flat|apt|plot|sector|phase|\bat|\bon)\s*$/.test(before) && !sym && !unit) continue;
      var q = before.match(/(under|below|less than|upto|up to|max(?:imum)?|within|at most|not more than|budget(?: of| is)?|cheaper than|lower than|<)\s*[^\d]{0,8}$/) ? 'max' : before.match(/(over|above|more than|at least|min(?:imum)?|starting(?: from| at)?|from|>)\s*[^\d]{0,8}$/) ? 'min' : before.match(/(around|about|approx\w*|roughly|near)\s*[^\d]{0,8}$/) ? 'approx' : before.match(/between\s*[^\d]{0,8}$/) ? 'between' : null;
      if (!(sym || unit || val >= 500 || q)) continue; if (sym && /[₹]|rs|inr|rupee/.test(sym)) cur = '₹'; else if (sym) cur = /\$|usd|dollar|buck/.test(sym) ? '$' : sym; if (!cur && unit >= 1e5 && unit < 1e7) cur = '₹';
      c.push({ v: val * (unit || 1), unit: unit, q: q, idx: m.index });
    }
    if (!c.length) return null;
    if (c.length >= 2 && !c[0].unit && c[1].unit && c[0].v < c[1].v / (c[1].unit || 1) + 1e-9) c[0].v *= c[1].unit;
    var out = { currency: cur || '' };
    if (c.length >= 2 && (c[0].q === 'between' || /\b(to|and|-)\b/.test(t.slice(c[0].idx, c[1].idx + 2)) && !c[1].q)) { out.min = Math.min(c[0].v, c[1].v); out.max = Math.max(c[0].v, c[1].v); return out; }
    var a = c[0]; if (a.q === 'max') out.max = a.v; else if (a.q === 'min') out.min = a.v; else if (a.q === 'approx') { out.min = a.v * .85; out.max = a.v * 1.15; } else out.max = a.v;
    for (var i = 1; i < c.length; i++) { if (c[i].q === 'min' && out.min == null) out.min = c[i].v; else if (c[i].q === 'max' && out.max == null) out.max = c[i].v; }
    return out;
  }
  function bhk(t) { var m = String(t).toLowerCase().match(new RegExp('\\b(' + NUMWRE + '|\\d)\\s*[- ]?\\s*(?:bhk|bed(?:room)?s?|br|bd)\\b')); if (m) return wordNum(m[1]); if (/\bstudio\b/i.test(t)) return 1; return undefined; }
  var DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }, MONS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function when(text, now) {
    var t = ' ' + String(text).toLowerCase() + ' ', n = now ? new Date(now) : new Date(), r = {}, d, m;
    n.setHours(0, 0, 0, 0);
    if (/\b(today|tonight|this evening|this afternoon|this morning)\b/.test(t)) d = new Date(n);
    else if (/\bday after tomorrow\b/.test(t)) { d = new Date(n); d.setDate(d.getDate() + 2); }
    else if (/\b(tomorrow|tmrw|tmr|tom)\b/.test(t)) { d = new Date(n); d.setDate(d.getDate() + 1); }
    else if ((m = t.match(/\b(?:(next|this|coming|on)\s+)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|sday|nesday|rsday|urday)?\b/))) {
      var w = DOW[m[2].slice(0, 3)], diff = (w - n.getDay() + 7) % 7; if (diff === 0 && m[1] !== 'this') diff = 7; if (m[1] === 'next' && diff < 7 && diff <= (7 - n.getDay()) % 7 && w > n.getDay()) diff += 0; d = new Date(n); d.setDate(d.getDate() + diff);
    }
    else if (/\b(this )?weekend\b/.test(t)) { d = new Date(n); d.setDate(d.getDate() + ((6 - n.getDay() + 7) % 7 || 7)); }
    else if ((m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/)) || (m = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/) && [0, RegExp.$2, RegExp.$1])) {
      var day = +m[1], mon = MONS.indexOf(m[2]); d = new Date(n.getFullYear(), mon, day); if (d < n) d.setFullYear(d.getFullYear() + 1);
    }
    else if ((m = t.match(/\b(\d{1,2})\/(\d{1,2})\b/))) { d = new Date(n.getFullYear(), +m[2] - 1, +m[1]); if (d < n) d.setFullYear(d.getFullYear() + 1); }
    if (d) { r.date = d; r.iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    if ((m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)/))) { var h = +m[1] % 12 + (/p/.test(m[3]) ? 12 : 0); r.time = ('0' + h).slice(-2) + ':' + (m[2] || '00'); }
    else if ((m = t.match(/\b(?:at|around|by|@)\s*(\d{1,2})(?::(\d{2}))?\b(?!\s*(?:people|persons|guests|pax|bhk|lakh|cr|k\b))/))) { var h2 = +m[1]; if (h2 >= 1 && h2 <= 12 && !m[2] && !/am|pm/.test(t)) { r.timeAmbiguous = h2; } else if (h2 <= 23) r.time = ('0' + h2).slice(-2) + ':' + (m[2] || '00'); }
    else if ((m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) r.time = ('0' + m[1]).slice(-2) + ':' + m[2];
    else if (/\bnoon\b/.test(t)) r.time = '12:00';
    if (/\b(morning|am)\b/.test(t) && !/\bpm\b/.test(t)) r.part = 'morning'; else if (/\bafternoon\b/.test(t)) r.part = 'afternoon'; else if (/\b(evening|tonight)\b/.test(t)) r.part = 'evening'; else if (/\bnight\b/.test(t)) r.part = 'evening';
    if (r.timeAmbiguous && r.part === 'evening') { r.time = ('0' + (r.timeAmbiguous % 12 + 12)).slice(-2) + ':00'; delete r.timeAmbiguous; }
    else if (r.timeAmbiguous && r.part === 'afternoon') { r.time = ('0' + (r.timeAmbiguous % 12 + 12)).slice(-2) + ':00'; delete r.timeAmbiguous; }
    else if (r.timeAmbiguous && r.part === 'morning') { r.time = ('0' + r.timeAmbiguous).slice(-2) + ':00'; delete r.timeAmbiguous; }
    return (r.date || r.time || r.part || r.timeAmbiguous) ? r : null;
  }
  function party(t) {
    t = String(t).toLowerCase(); var m;
    if ((m = t.match(new RegExp('\\b(\\d{1,2}|' + NUMWRE + ')\\s*(?:people|persons?|ppl|guests?|pax|adults?|of us|diners)\\b')))) return wordNum(m[1]);
    if ((m = t.match(new RegExp('\\b(?:table|party|group|booking|seats?|reservation)?\\s*(?:for|of)\\s+(\\d{1,2}|' + NUMWRE + ')\\b(?!\\s*(?:pm|am|:|\\d|bhk|lakh|cr))')))) return wordNum(m[1]);
    if (/\b(just me|only me|myself|solo|alone)\b/.test(t)) return 1; if (/\b(a couple|couple|two of us|both of us|date night)\b/.test(t)) return 2;
    return undefined;
  }
  function phone(t) { var m = String(t).match(/(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){9,11}\d/); if (!m) return undefined; var d = m[0].replace(/\D/g, ''); return d.length >= 10 && d.length <= 13 ? (m[0].trim().charAt(0) === '+' ? '+' : '') + d : undefined; }
  function email(t) { var m = String(t).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); return m ? m[0].toLowerCase() : undefined; }
  function yesno(t) { t = ' ' + String(t).toLowerCase().replace(/[^a-z' ]/g, ' ') + ' '; if (/\b(no|nope|nah|not now|don't|dont|do not|cancel|never mind|nevermind|stop|negative|skip)\b/.test(t)) return false; if (/\b(yes|yeah|yep|yup|sure|ok|okay|correct|confirm|confirmed|go ahead|please do|do it|sounds good|right|absolutely|of course|fine|proceed|y)\b/.test(t)) return true; return undefined; }
  function name(t) {
    t = String(t).trim(); var m = t.match(/\b(?:i am|i'm|im|my name is|this is|call me|name'?s|it's|its)\s+([a-z][a-z'.-]+(?:\s+[a-z][a-z'.-]+){0,2})/i);
    var s = m ? m[1] : (/^[a-z][a-z'.-]+(?:\s+[a-z][a-z'.-]+){0,2}$/i.test(t) && !/\b(yes|no|ok|okay|hi|hello|hey|thanks|menu|help|agent|cancel|stop)\b/i.test(t) ? t : '');
    if (!s) return undefined; s = s.replace(/\s+(and|here|speaking|calling|from|looking|want|need)\b.*$/i, ''); return s.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40);
  }
  function area(t) { t = String(t).toLowerCase().replace(/(\d),(?=\d{3})/g, '$1'); var m = t.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s?ft|sqft|sft|square\s*f\w+|sq\.?\s?feet)/); if (m) return Math.round(+m[1]); m = t.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s?m|sqm|m2|m²|square\s*met\w+)/); if (m) return Math.round(+m[1] * 10.764); return undefined; }
  function orderId(t) { var m = String(t).match(/\bNL[- ]?(\d{4,6})\b/i); return m ? 'NL-' + m[1] : undefined; }
  O.nlp = { norm: norm, tokens: tokens, content: contentTokens, stem: stem, money: money, bhk: bhk, when: when, party: party, phone: phone, email: email, yesno: yesno, name: name, area: area, orderId: orderId, wordNum: wordNum };
  function fmtDay(d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ' ' + d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; }
  function fmtTime(hhmm) { var p = String(hhmm).split(':'), h = +p[0]; return (h % 12 || 12) + (p[1] === '00' ? '' : ':' + p[1]) + ' ' + (h < 12 ? 'am' : 'pm'); }
  O.fmtDay = fmtDay; O.fmtTime = fmtTime;

  /* ---------- events ---------- */
  var evBus = bus();
  O.events = {
    list: function (f) { var a = sget('orbit-events', []); if (f) { if (f.type) a = a.filter(function (e) { return e.type === f.type; }); if (f.agent) a = a.filter(function (e) { return e.agent === f.agent; }); if (f.since) a = a.filter(function (e) { return e.ts >= f.since; }); } return a; },
    log: function (type, data) { var e = { id: uid('e'), ts: Date.now(), type: type }; for (var k in data) if (data.hasOwnProperty(k)) e[k] = data[k]; var a = sget('orbit-events', []); a.push(e); if (a.length > 3500) a = a.slice(-3500); sset('orbit-events', a); evBus.emit(e); return e; },
    clear: function () { sdel('orbit-events'); evBus.emit(null); }, on: evBus.on
  };
  var leadBus = bus();
  O.leads = {
    list: function (f) { var a = sget('orbit-leads', []); if (f) { if (f.agent) a = a.filter(function (l) { return l.agent === f.agent; }); if (f.since) a = a.filter(function (l) { return Date.parse(l.timestamp) >= f.since; }); } return a; },
    add: function (l) { var a = sget('orbit-leads', []); l.id = l.id || 'L-' + (1001 + a.length + 7); l.timestamp = l.timestamp || new Date().toISOString(); l.status = l.status || 'new'; l.payload = l.payload || {}; a.push(l); sset('orbit-leads', a); leadBus.emit(l); return l; },
    on: leadBus.on
  };

  /* ---------- knowledge base (editable FAQ) ---------- */
  O.kb = {
    list: function (id) { var s = sget('orbit-kb-' + id, null); if (s) return s; var a = O.agents[id]; return a && a.kb ? a.kb.map(function (x) { return { id: x.id, q: x.q, a: x.a, keys: (x.keys || []).slice(), buttons: x.buttons }; }) : []; },
    save: function (id, list) { sset('orbit-kb-' + id, list); kbBus.emit(id); },
    add: function (id, e) { var l = O.kb.list(id); e.id = e.id || uid('kb'); e.keys = e.keys || []; l.push(e); O.kb.save(id, l); return e; },
    update: function (id, eid, patch) { var l = O.kb.list(id); l.forEach(function (x) { if (x.id === eid) for (var k in patch) x[k] = patch[k]; }); O.kb.save(id, l); },
    remove: function (id, eid) { O.kb.save(id, O.kb.list(id).filter(function (x) { return x.id !== eid; })); },
    reset: function (id) { sdel('orbit-kb-' + id); kbBus.emit(id); },
    match: function (id, text, syn) {
      var q = contentTokens(norm(text, syn)), nt = ' ' + norm(text, syn) + ' ', best = null, bs = 0; if (!q.length) return null;
      O.kb.list(id).forEach(function (e) {
        var s = 0, kt = contentTokens(e.q + ' ' + (e.keys || []).join(' '));
        (e.keys || []).forEach(function (k) { var kk = norm(k, syn); if (kk && (' ' + nt + ' ').indexOf(' ' + kk + ' ') >= 0) s += 3; else { var ks = contentTokens(kk); if (ks.length > 1 && ks.every(function (w) { return q.indexOf(w) >= 0; })) s += 3; } });
        var sh = 0; q.forEach(function (w) { if (kt.indexOf(w) >= 0) sh++; }); s += sh * 1.1; if (sh && q.length <= 3 && sh === q.length) s += 1;
        if (s > bs) { bs = s; best = e; }
      });
      return best && bs >= 2.2 ? { entry: best, score: bs } : null;
    }
  };
  var kbBus = bus(); O.kb.on = kbBus.on;

  /* ---------- conversations (shared by the widget and the agent console) ---------- */
  var cvBus = bus(), cvCache = null;
  function cvAll() { if (!cvCache) cvCache = sget('orbit-convos', []); return cvCache; }
  function cvSave() { var a = cvAll(), now = Date.now(); for (var i = a.length - 1; i >= 0; i--) if (!a[i].seed && !a[i].engaged && a[i].updatedAt && now - a[i].updatedAt > 12e4) a.splice(i, 1); while (a.length > 40) { var k = 0; while (k < a.length && a[k].seed) k++; a.splice(k < a.length ? k : 0, 1); } a.forEach(function (c) { if (c.messages.length > 80) c.messages.splice(0, c.messages.length - 80); }); sset('orbit-convos', a); }
  O.convos = {
    list: function () { return cvAll().filter(function (c) { return !c.hidden; }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }); },
    get: function (id) { var a = cvAll(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; },
    put: function (c) { var a = cvAll(), i; for (i = 0; i < a.length; i++) if (a[i].id === c.id) { a[i] = c; break; } if (i === a.length) a.push(c); c.updatedAt = Date.now(); cvSave(); cvBus.emit({ type: 'update', id: c.id }); },
    append: function (id, msg) { var c = O.convos.get(id); if (!c) return null; msg.id = msg.id || uid('m'); msg.ts = msg.ts || Date.now(); c.messages.push(msg); c.updatedAt = Date.now(); cvSave(); cvBus.emit({ type: 'message', id: id, msg: msg }); return msg; },
    setStatus: function (id, st, extra) { var c = O.convos.get(id); if (!c) return; c.status = st; if (extra) for (var k in extra) c[k] = extra[k]; c.updatedAt = Date.now(); cvSave(); cvBus.emit({ type: 'status', id: id, status: st }); },
    on: cvBus.on, reload: function () { cvCache = null; }
  };
  try { root.addEventListener && root.addEventListener('storage', function (e) { if (e.key === 'orbit-convos') { cvCache = null; cvBus.emit({ type: 'sync' }); } if (e.key === 'orbit-events') evBus.emit(null); if (e.key === 'orbit-leads') leadBus.emit(null); }); } catch (e) {}

  /* ---------- session ---------- */
  function Session(agent, opts) {
    opts = opts || {}; this.agent = agent; this.channel = opts.channel || 'web'; this.ctx = opts.context || {}; this.nlp = O.nlp; this.B = function (l, v) { return { label: l, value: v }; };
    this.source = opts.source || ({ web: 'Website chat', whatsapp: 'WhatsApp', instagram: 'Instagram DM', phone: 'Phone line' }[this.channel] || 'Website chat');
    this.id = opts.convoId || uid('c'); this.slots = {}; this.flow = null; this.fallbacks = 0; this._out = []; this._listeners = bus(); this.opts = opts;
    var ex = opts.convoId && O.convos.get(opts.convoId);
    this.convo = ex || { id: this.id, agent: agent.id, agentName: agent.name, channel: this.channel, source: this.source, status: 'bot', startedAt: Date.now(), messages: [], context: this.ctx, user: {}, mem: {}, engaged: false, seed: false };
    this.user = this.convo.user; this.mem = this.convo.mem; this.id = this.convo.id;
    this.convo.channel = this.channel; this.convo.source = this.source; if (opts.silent) this.convo.hidden = true;
  }
  var P = Session.prototype;
  P.on = function (f) { return this._listeners.on(f); };
  P._emit = function (m) { this._listeners.emit(m); };
  P.event = function (type, data) { if (this.opts.silent) return null; data = data || {}; data.agent = this.agent.id; data.channel = this.channel; data.source = this.source; data.convo = this.id; return O.events.log(type, data); };
  P.setContext = function (c) { for (var k in c) this.ctx[k] = c[k]; this.convo.context = this.ctx; };
  P.db = function (name) { var k = 'orbit-data-' + this.agent.id + '-' + name, v = sget(k, undefined); if (v === undefined) { var s = this.agent.seeds && this.agent.seeds[name]; v = s ? s() : null; sset(k, v); } return v; };
  P.save = function (name, v) { sset('orbit-data-' + this.agent.id + '-' + name, v); };
  P.say = function (text, o) {
    o = o || {}; var m = { from: 'bot', text: text || '', buttons: o.buttons || null, cards: o.cards || null, kind: o.kind || null, delay: o.delay == null ? Math.min(1100, 350 + String(text || '').length * 9) : o.delay, spoken: o.spoken };
    if (this.channel === 'phone') { m.ivr = this._ivr(m); if (!m.spoken) m.spoken = this._spoken(m); }
    this._out.push(m); O.convos.append(this.id, m); m.fresh = true; this._emit(m); return m;
  };
  P._ivr = function (m) { var o = []; (m.cards || []).slice(0, 4).forEach(function (c) { var b = c.buttons && c.buttons[0]; if (b) o.push({ label: c.title + (c.sub ? ', ' + c.sub : '') + (c.price ? ', ' + c.price : ''), value: b.value }); }); (m.buttons || []).forEach(function (b) { if (o.length < 8) o.push(b); }); return o; };
  P._spoken = function (m) {
    var t = String(m.text).replace(/\*\*/g, '').replace(/\n+/g, '. '); if (m.cards && m.cards.length && !(m.cards[0].buttons && m.cards[0].buttons.length)) { t += ' ' + m.cards.slice(0, 3).map(function (c, i) { return 'Option ' + (i + 1) + ': ' + c.title + (c.sub ? ', ' + c.sub : '') + (c.price ? ', ' + c.price : '') + '.'; }).join(' '); }
    if (m.ivr && m.ivr.length) t += ' ' + m.ivr.map(function (b, i) { return 'Press ' + (i + 1) + ' for ' + String(b.label).replace(/\*\*/g, '').toLowerCase() + '.'; }).join(' ') + ' Or press 0 to speak to a person.';
    return t.replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim();
  };
  P.menu = function (intro) { return this.say(intro || 'What can I help you with?', { buttons: this.agent.menu || [] }); };
  P.startFlow = function (id, preset) { var f = this.agent.flows[id]; if (!f) return; this.flow = id; this.slots = {}; var k; if (preset) for (k in preset) if (preset[k] !== undefined) this.slots[k] = preset[k]; this.convo.flow = id; this._advance(); };
  P.endFlow = function () { this.flow = null; this.slots = {}; this.convo.flow = null; };
  P.fill = function (n, v) { this.slots[n] = v; };
  P._advance = function () {
    var f = this.agent.flows[this.flow]; if (!f) return; var s = this.slots, bot = this, i, sl;
    for (i = 0; i < f.slots.length; i++) { sl = f.slots[i]; if (s[sl.name] !== undefined) { if (sl.validate && !sl._ok) { /* validated at fill time */ } continue; } if (sl.optional || !sl.ask) continue; if (sl.when && !sl.when(bot, s)) continue; this.pending = sl; sl.ask(bot, s); return; }
    var id = this.flow; this.pending = null; var snap = {}; for (var k in s) snap[k] = s[k]; this.flow = null; this.convo.flow = null; this.slots = {}; if (f.done) f.done(bot, snap); this._lastFlow = id;
  };
  P.handover = function (reason) {
    if (this.convo.status !== 'bot' || this.agent.kind === 'staff') return; this.convo.handedOver = true; O.convos.setStatus(this.id, 'waiting', { handoverReason: reason || 'Visitor asked for a person', handoverAt: Date.now() });
    this.event('handover', { reason: reason || 'requested' });
    this.say('Connecting you to a person now. They can see everything we have talked about, so you will not need to repeat yourself.' + (this.channel === 'phone' ? ' Please stay on the line.' : ''), { kind: 'system', buttons: null });
    this.flow = null; this.slots = {};
  };
  P.lead = function (l) {
    if (this.opts.silent) { return { id: 'L-demo', timestamp: new Date().toISOString(), name: this.user.name || 'Demo', payload: l && l.payload || {} }; } l = l || {}; l.name = l.name || this.user.name || 'Unknown visitor'; l.phone = l.phone || this.user.phone || ''; if (this.user.email && !l.email) l.email = this.user.email;
    l.source = l.source || this.source; l.channel = this.channel; l.agent = this.agent.id; l.intent = l.intent || this.convo.lastIntent || ''; l.payload = l.payload || {};
    var r = O.leads.add(l); this.convo.leadId = r.id; this.event('lead', { lead: r.id, intent: l.intent }); return r;
  };
  P.start = function () {
    if (this.convo.messages.length) return; O.convos.put(this.convo); this.event('convo_start', {}); this._out = [];
    var a = this.agent; if (a.greeting) a.greeting(this); else { this.say('Hi, I’m the ' + a.name + ' assistant.'); this.menu(); }
    return this._out;
  };
  /* visitor input: text typed, or a button click */
  P.send = function (text) { return this._input({ text: String(text) }); };
  P.choose = function (btn) { return this._input({ btn: btn }); };
  P._input = function (inp) {
    this._out = []; var a = this.agent, cv = this.convo, text = inp.text, bot = this, v;
    if (inp.btn) { v = String(inp.btn.value == null ? '' : inp.btn.value); text = inp.btn.label; }
    if (!O.convos.get(this.id)) O.convos.put(cv);
    var umsg = { from: 'user', text: text, btn: !!inp.btn }; O.convos.append(this.id, umsg); this._emit(umsg);
    if (!cv.engaged) { cv.engaged = true; this.event('engaged', {}); }
    if (cv.status !== 'bot') { /* a person owns the chat */ if (cv.status === 'waiting' && !cv._ack) { cv._ack = true; this.say('Thanks. A person will reply here shortly.' + (this.channel === 'phone' ? ' Please stay on the line.' : ''), { kind: 'system', delay: 600 }); } return this._out; }
    this.fallbacks = this.fallbacks || 0;
    if (inp.btn) { if (this._button(v, inp.btn)) return this._out; text = (v.indexOf('say:') === 0 ? v.slice(4) : inp.btn.label); }
    this._text(text); return this._out;
  };
  P._button = function (v, btn) {
    var a = this.agent, m, bot = this; this.fallbacks = 0;
    if (v === 'handover') { this.handover('Visitor tapped talk to a person'); return true; }
    if (v === 'menu') { this.endFlow(); this.menu(); return true; }
    if (v === 'cancel') { this.endFlow(); this.say('No problem, I have stopped that.'); this.menu('Anything else?'); return true; }
    if (v.indexOf('intent:') === 0) { var it = this._intent(v.slice(7)); if (it) { this.convo.lastIntent = it.id; this.event('intent', { intent: it.id, via: 'button' }); this.endFlow(); this._runIntent(it, { text: btn.label, norm: btn.label.toLowerCase(), ent: {}, score: 9 }); return true; } }
    if (v.indexOf('flow:') === 0) { this.convo.lastIntent = v.slice(5); this.event('intent', { intent: v.slice(5), via: 'button' }); this.startFlow(v.slice(5)); return true; }
    if (v.indexOf('slot:') === 0 && this.flow) { m = v.slice(5).split('='); var name = m.shift(), val = m.join('='); var sl = this._slotDef(name); this.slots[name] = sl && sl.coerce ? sl.coerce(val, this) : val; this._advance(); return true; }
    if (v.indexOf('act:') === 0) { m = v.slice(4).split(':'); var an = m.shift(), arg = m.join(':'); if (a.actions && a.actions[an]) { this.event('action', { action: an }); a.actions[an](this, arg, btn); return true; } }
    return false;
  };
  P._slotDef = function (n) { var f = this.agent.flows[this.flow]; if (!f) return null; for (var i = 0; i < f.slots.length; i++) if (f.slots[i].name === n) return f.slots[i]; return null; };
  P._intent = function (id) { var l = this.agent.intents; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; };
  P._runIntent = function (it, m) { if (it.flow) this.startFlow(it.flow, this._preset(it.flow, m.ent)); else if (it.run) it.run(this, m); };
  P._preset = function (fid, ent) { var f = this.agent.flows[fid], p = {}; if (f) f.slots.forEach(function (s) { if (ent && ent[s.name] !== undefined) p[s.name] = ent[s.name]; }); return p; };
  var GLOBAL = [
    { id: '_human', kw: ['talk to an agent', 'speak to an agent', 'human agent', 'live agent', 'agent please', 'a human', 'real person', 'talk to someone', 'speak to someone', 'talk to a person', 'speak to a person', 'representative', 'customer care', 'live chat', 'call me back', 'speak to a manager', 'talk to a manager', 'someone from your team'], re: [/^(an? )?(agent|human|person|operator|representative)[.! ]*$/, /\b(talk|speak|chat) (to|with) (a |an |the )?(human|person|agent|someone|team|manager)\b/], priority: 3 },
    { id: '_cancel', kw: ['cancel that', 'never mind', 'nevermind', 'stop', 'forget it', 'leave it'], re: [/^(cancel|stop|quit|exit|nope? thanks?)$/], priority: 1 },
    { id: '_menu', kw: ['menu', 'main menu', 'start over', 'restart', 'what can you do', 'help', 'options'], re: [/^(menu|help|options|start over|restart)$/], priority: 1 },
    { id: '_thanks', kw: ['thanks', 'thank you', 'thx', 'cheers', 'appreciate it', 'great thanks'], re: [/^(ty|thanks?!*)$/], priority: 1 },
    { id: '_hello', kw: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'namaste', 'hola'], re: [/^(hi|hello|hey|yo|hii+|hey there)[!. ]*$/], priority: 0 },
    { id: '_bye', kw: ['bye', 'goodbye', 'see you', 'that is all', "that's all", 'all done', 'nothing else'], re: [/^(bye|goodbye|no thanks|that'?s all)[!. ]*$/], priority: 1 }
  ];
  function parsedOf(ent) { var o = []; for (var k in ent) { var v = ent[k]; if (v == null || v === '' || typeof v === 'object') continue; o.push(k + ': ' + v); } return o.slice(0, 4).join(', ').slice(0, 90); }
  function score(intent, nt, raw, syn, bot) {
    var s = 0, hit = 0;
    (intent.kw || []).forEach(function (k) { var kk = norm(k, syn); if (!kk) return; var pad = ' ' + nt + ' '; if (pad.indexOf(' ' + kk + ' ') >= 0 || (kk.length > 4 && pad.indexOf(' ' + kk) >= 0 && kk.split(' ').length === 1 && pad.indexOf(' ' + kk + 's ') >= 0)) { s += 1.5 + kk.split(' ').length; hit++; } else if (kk.length > 5 && kk.indexOf(' ') < 0 && new RegExp('(^| )' + kk.slice(0, -1) + '\\w{0,3}( |$)').test(nt)) { s += 1; hit++; } });
    (intent.re || []).forEach(function (r) { if (r.test(raw) || r.test(nt)) { s += 4; hit++; } });
    if (s && intent.ctx) s += intent.ctx(bot) || 0; if (s) s += (intent.priority || 0); return s;
  }
  P._match = function (text) {
    var a = this.agent, nt = norm(text, a.synonyms), raw = String(text).toLowerCase(), best = null, bs = 0, self = this;
    a.intents.forEach(function (it) { var s = score(it, nt, raw, a.synonyms, self); if (s > bs) { bs = s; best = it; } });
    var g = null, gs = 0; GLOBAL.forEach(function (it) { var s = score(it, nt, raw, a.synonyms, self); if (s > gs) { gs = s; g = it; } });
    return { intent: best, score: bs, global: g, gscore: gs, nt: nt };
  };
  P._text = function (text) {
    var a = this.agent, bot = this, ent = a.extract ? (a.extract(text, this) || {}) : {}, mt = this._match(text), nt = mt.nt, cv = this.convo, ans;
    // person asked
    if (mt.global && mt.global.id === '_human' && mt.gscore >= 3) { this.event('intent', { intent: 'human' }); this.handover('Visitor asked for a person'); return; }
    if (mt.global && mt.global.id === '_cancel' && this.flow && mt.gscore >= 2.5) { this.endFlow(); this.say('No problem, I have stopped that.'); this.menu('Anything else?'); return; }
    if (mt.global && mt.global.id === '_menu' && mt.gscore >= 4 && (!mt.intent || mt.score < 5)) { this.endFlow(); this.menu(); return; }
    // inside a flow
    if (this.flow) {
      var f = a.flows[this.flow], sl = this.pending, k, fillsPending = false, pv;
      if (sl) { pv = sl.parse ? sl.parse(text, this, this.slots) : undefined; fillsPending = pv !== undefined || ent[sl.name] !== undefined; }
      var fillAll = function () {
        var any = false;
        for (var kk in ent) if (ent[kk] !== undefined && bot._slotDef(kk) && !(bot._slotDef(kk).parse === undefined && false)) { var sd = bot._slotDef(kk); if (sd.validate) { var er = sd.validate(ent[kk], bot, bot.slots); if (er) { bot.say(er); return 'err'; } } bot.slots[kk] = ent[kk]; any = true; }
        if (sl && ent[sl.name] === undefined && pv !== undefined) { if (sl.validate) { var er2 = sl.validate(pv, bot, bot.slots); if (er2) { bot.say(er2); return 'err'; } } bot.slots[sl.name] = pv; any = true; }
        return any;
      };
      if (fillsPending) { var r0 = fillAll(); if (r0 === 'err') return; this.fallbacks = 0; this._advance(); return; }
      if (mt.intent && mt.score >= 4.5 && mt.intent.id !== f.intent && mt.intent.flow !== this.flow) { this.endFlow(); this.convo.lastIntent = mt.intent.id; this.event('intent', { intent: mt.intent.id }); this._runIntent(mt.intent, { text: text, norm: nt, ent: ent, score: mt.score }); return; }
      var r1 = fillAll(); if (r1 === 'err') return; if (r1) { this.fallbacks = 0; this._advance(); return; }
      var kb = O.kb.match(a.id, text, a.synonyms); if (kb) { this._kb(kb.entry); this.say('Back to where we were:', { delay: 500 }); if (sl) sl.ask(this, this.slots); return; }
      if (mt.global && mt.global.id === '_thanks') { this.say('Any time.', { delay: 300 }); if (sl) sl.ask(this, this.slots); return; }
      this.fallbacks++; this.event('fallback', { text: String(text).slice(0, 80) });
      if (this.fallbacks >= 3) { this.say('I am having trouble with that one. Want me to bring in a person?', { buttons: [this.B('Yes, talk to a person', 'handover'), this.B('No, keep going', 'say:keep going'), this.B('Cancel this', 'cancel')] }); this.fallbacks = 0; return; }
      this.say(sl && sl.hint ? sl.hint : 'Sorry, I did not catch that. You can tap an option below, or tell me in your own words.', { delay: 400 }); if (sl) sl.ask(this, this.slots); return;
    }
    // intents
    var kbf = mt.intent && mt.score < 9 ? O.kb.match(a.id, text, a.synonyms) : null;
    if (kbf && (!mt.intent || kbf.score > mt.score + .5)) { this.fallbacks = 0; this._kb(kbf.entry); return; }
    if (mt.intent && mt.score >= 2.5) { this.fallbacks = 0; cv.lastIntent = mt.intent.id; this.event('intent', { intent: mt.intent.id, parsed: parsedOf(ent) }); this._runIntent(mt.intent, { text: text, norm: nt, ent: ent, score: mt.score }); return; }
    // global small talk
    if (mt.global && mt.gscore >= 1.5) {
      this.fallbacks = 0; var gi = mt.global.id;
      if (gi === '_hello') { this.say('Hi there. ' + (a.helloLine || 'How can I help?')); this.menu('Pick one, or just tell me what you need.'); return; }
      if (gi === '_thanks') { this.say('You are welcome. Anything else I can help with?', { buttons: [this.B('That is all', 'say:bye'), this.B('Show the menu', 'menu')] }); return; }
      if (gi === '_bye') { this.say('Thanks for stopping by. I am here whenever you need me.'); this.event('resolved', {}); return; }
      if (gi === '_menu') { this.menu(); return; }
      if (gi === '_cancel') { this.say('Okay. Anything else?'); this.menu(); return; }
    }
    // FAQ
    var kbm = O.kb.match(a.id, text, a.synonyms); if (kbm) { this.fallbacks = 0; this._kb(kbm.entry); return; }
    if (a.freeText) { var r = a.freeText(this, { text: text, norm: nt, ent: ent }); if (r) { this.fallbacks = 0; return; } }
    // fallback
    this.fallbacks++; this.event('fallback', { text: String(text).slice(0, 80) });
    if (this.fallbacks >= 2) { this.say('I still have not got that, sorry. I can bring in a person, or you can pick from the menu.', { buttons: [this.B('Talk to a person', 'handover')].concat((a.menu || []).slice(0, 3)) }); this.fallbacks = 0; }
    else this.say('Sorry, I did not quite get that. I can help with the things below, or you can ask in your own words.', { buttons: (a.menu || []).slice(0, 5) });
  };
  P._kb = function (e) { this.event('kb', { id: e.id }); this.say(e.a, { buttons: e.buttons || [this.B('Anything else', 'menu'), this.B('Talk to a person', 'handover')] }); };
  /* a person's reply arrives from the console */
  P.receiveAgent = function (msg) { this._emit(msg); };

  O.registerAgent = function (def) { def.flows = def.flows || {}; def.intents = def.intents || []; def.menu = def.menu || []; O.agents[def.id] = def; if (O.onAgent) O.onAgent(def); return def; };
  O.createSession = function (id, opts) { var a = O.agents[id]; if (!a) throw new Error('Unknown Orbit agent: ' + id); return new Session(a, opts); };
  O.reset = function () { O._store.keys().filter(function (k) { return k.indexOf('orbit-') === 0; }).forEach(sdel); cvCache = null; evBus.emit(null); cvBus.emit({ type: 'sync' }); O.seed(true); };

  /* ---------- analytics ---------- */
  O.analytics = {
    summary: function (o) {
      o = o || {}; var days = o.days || 7, since = Date.now() - days * 864e5, ev = O.events.list({ since: since }); if (o.agent) ev = ev.filter(function (e) { return e.agent === o.agent; }); else ev = ev.filter(function (e) { var a = O.agents[e.agent]; return !(a && a.kind === 'staff'); });
      var conv = {}, leads = 0, book = 0, intents = {}, by = { channel: {}, source: {}, agent: {} }, daily = {}, fb = 0, msgs = 0, kbHits = 0;
      ev.forEach(function (e) {
        var c = conv[e.convo] || (conv[e.convo] = { engaged: false, handover: false, conv: false, e: e });
        if (e.type === 'engaged') c.engaged = true; if (e.type === 'handover') c.handover = true;
        if (e.type === 'lead') { leads++; c.conv = true; } if (e.type === 'booking') { book++; c.conv = true; }
        if (e.type === 'intent') intents[e.intent] = (intents[e.intent] || 0) + 1; if (e.type === 'fallback') fb++; if (e.type === 'kb') kbHits++;
      });
      var total = 0, handled = 0, conv2 = 0; Object.keys(conv).forEach(function (id) {
        var c = conv[id]; if (!c.engaged) return; total++; if (!c.handover) handled++; if (c.conv) conv2++;
        ['channel', 'source', 'agent'].forEach(function (k) { var v = c.e[k] || 'unknown', b = by[k][v] || (by[k][v] = { n: 0, handled: 0, conv: 0 }); b.n++; if (!c.handover) b.handled++; if (c.conv) b.conv++; });
        var d = new Date(c.e.ts); d.setHours(0, 0, 0, 0); daily[d.getTime()] = (daily[d.getTime()] || 0) + 1;
      });
      var series = []; for (var i = days - 1; i >= 0; i--) { var d0 = new Date(); d0.setHours(0, 0, 0, 0); d0.setDate(d0.getDate() - i); series.push({ t: d0.getTime(), n: daily[d0.getTime()] || 0 }); }
      return { days: days, conversations: total, handled: handled, handledPct: total ? Math.round(handled / total * 100) : 0, handovers: total - handled, leads: leads, bookings: book, conversions: conv2, conversionPct: total ? Math.round(conv2 / total * 100) : 0, fallbacks: fb, kbHits: kbHits, intents: intents, byChannel: by.channel, bySource: by.source, byAgent: by.agent, series: series };
    }
  };

  /* ---------- demo history (analytics, leads, a few waiting chats) ---------- */
  var FIRST = ['Aarav', 'Priya', 'Rohan', 'Meera', 'Kabir', 'Ananya', 'Vikram', 'Isha', 'Neel', 'Sana', 'Dev', 'Tara', 'Arjun', 'Zoya', 'Karan', 'Diya', 'Imran', 'Nisha', 'Sam', 'Grace', 'Tom', 'Chloe', 'Marcus', 'Hannah', 'Lena', 'Omar', 'Rhea', 'Yash'], LAST = ['Nair', 'Shah', 'Mehta', 'Iyer', 'Kapoor', 'Rao', 'Bose', 'Khan', 'Verma', 'Patel', 'Joshi', 'Reddy', 'Singh', 'Das', 'Menon', 'Whitaker', 'Reid', 'Cho', 'Berg', 'Fischer'];
  var SEEDCFG = {
    support: { w: 30, intents: ['track_order', 'returns', 'size', 'find', 'restock', 'faq'], lead: .12, book: .2, bookKind: 'return', payload: function (r) { return { topic: ['return', 'exchange', 'restock alert', 'size help'][Math.floor(r() * 4)] }; } },
    realty: { w: 24, intents: ['search', 'book_visit', 'saved_search', 'price', 'faq'], lead: .42, book: .3, bookKind: 'visit', payload: function (r) { return { bhk: 2 + Math.floor(r() * 3), budget: ['80 L', '1.2 Cr', '1.5 Cr', '55k rent', '1.5L rent'][Math.floor(r() * 5)] }; } },
    build: { w: 14, intents: ['estimate', 'site_visit', 'materials', 'faq'], lead: .5, book: .26, bookKind: 'site visit', payload: function (r) { return { project: ['kitchen', 'bathroom', 'full home', 'patio', 'stone cladding'][Math.floor(r() * 5)], area: 80 + Math.floor(r() * 12) * 40 }; } },
    clinic: { w: 12, intents: ['book', 'doctors', 'reschedule', 'faq'], lead: .2, book: .55, bookKind: 'appointment', payload: function (r) { return { treatment: ['check-up', 'dental clean', 'skin consult', 'physio'][Math.floor(r() * 4)] }; } },
    salon: { w: 10, intents: ['book', 'services', 'packages', 'faq'], lead: .15, book: .5, bookKind: 'appointment', payload: function (r) { return { service: ['cut and style', 'colour', 'facial', 'bridal trial'][Math.floor(r() * 4)] }; } },
    dining: { w: 10, intents: ['table', 'menu', 'waitlist', 'faq'], lead: .1, book: .5, bookKind: 'table', payload: function (r) { return { party: 2 + Math.floor(r() * 5) }; } }
  };
  var SRC = [['Google search', 'web', 28], ['Instagram ad', 'instagram', 17], ['Instagram DM', 'instagram', 9], ['WhatsApp click-to-chat', 'whatsapp', 22], ['Website chat', 'web', 14], ['Referral', 'whatsapp', 6], ['Referral', 'whatsapp', 10], ['QR on shop window', 'whatsapp', 5]];
  O.seed = function (force) {
    if (!force && sget('orbit-seed-v', 0) === 5) return; var r = rng(7712), now = Date.now(), ev = [], leads = [], ids = Object.keys(SEEDCFG), tot = 0, k, i; ids.forEach(function (a) { tot += SEEDCFG[a].w; });
    var cvs = sget('orbit-convos', []).filter(function (c) { return !c.seed; });
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function wsrc() { var t = 0; SRC.forEach(function (s) { t += s[2]; }); var x = r() * t; for (var j = 0; j < SRC.length; j++) { x -= SRC[j][2]; if (x <= 0) return SRC[j]; } return SRC[0]; }
    for (var day = 27; day >= 0; day--) {
      var n = Math.round((16 + r() * 8) * (1 + (27 - day) * .012) * ((new Date(now - day * 864e5).getDay() % 6 === 0) ? .7 : 1));
      for (i = 0; i < n; i++) {
        var x = r() * tot, aid = ids[0]; for (k = 0; k < ids.length; k++) { x -= SEEDCFG[ids[k]].w; if (x <= 0) { aid = ids[k]; break; } } var cfg = SEEDCFG[aid], s = wsrc(), ts = now - day * 864e5 - Math.floor(r() * 14 * 36e5), cid = 'seed-' + day + '-' + i, base = { agent: aid, channel: s[1], source: s[0], convo: cid };
        if (aid === 'realty' && (s[0] === 'Phone line')) s = ['Instagram ad', 'instagram'], base.source = 'Instagram ad', base.channel = 'instagram';
        var push = function (type, extra, dt) { var e = { id: 'e' + ev.length + 's', ts: ts + dt, type: type }; for (var q in base) e[q] = base[q]; for (q in extra) e[q] = extra[q]; ev.push(e); };
        push('convo_start', {}, 0); push('engaged', {}, 4e3); var it = pick(cfg.intents); push('intent', { intent: it }, 9e3); if (r() < .5) push('intent', { intent: pick(cfg.intents) }, 3e4); if (r() < .12) push('fallback', {}, 2e4);
        if (r() < .14) { push('handover', { reason: 'seed' }, 6e4); }
        var lead = r() < cfg.lead, bk = r() < cfg.book;
        if (bk) push('booking', { kind: cfg.bookKind }, 9e4);
        if (lead || (bk && r() < .8)) {
          push('lead', {}, 1e5); var nm = pick(FIRST) + ' ' + pick(LAST); var ph = (s[1] === 'phone' || r() < .85) ? ('+91 ' + (9 - Math.floor(r() * 3)) + String(Math.floor(r() * 1e9)).padStart(9, '0')).replace(/^(\+91 \d{5})(\d{5})$/, '$1 $2') : '';
          leads.push({ id: 'L-' + (1001 + leads.length), timestamp: new Date(ts + 1e5).toISOString(), name: nm, phone: ph, source: s[0], channel: s[1], agent: aid, intent: bk ? 'book' : it, payload: cfg.payload(r), status: day > 6 ? (r() < .5 ? 'contacted' : 'won') : 'new', seed: true });
        }
      }
    }
    var real = O.events.list().filter(function (e) { return String(e.convo).indexOf('seed-') !== 0; }), rl = O.leads.list().filter(function (l) { return !l.seed; });
    sset('orbit-events', ev.concat(real).sort(function (a, b) { return a.ts - b.ts; }).slice(-3500)); leads.forEach(function (l, j) { l.id = 'L-' + (1001 + j); }); rl.forEach(function (l, j) { l.id = 'L-' + (1001 + leads.length + j); }); sset('orbit-leads', leads.concat(rl));
    var T = function (m) { return m; }, t0 = now - 14 * 6e4;
    cvs.push({ id: 'seed-w1', seed: true, agent: 'realty', agentName: 'Alderway Homes', channel: 'whatsapp', source: 'Instagram ad', status: 'waiting', startedAt: t0, updatedAt: t0 + 3e5, handoverReason: 'Visitor asked for a person', engaged: true, user: { name: 'Meera Iyer' }, mem: {}, context: {}, messages: [
      { id: 'm1', from: 'bot', text: 'Hi, I’m the Alderway Homes assistant. Looking to buy or rent?', ts: t0 }, { id: 'm2', from: 'user', text: '3 BHK in Indiranagar under 1.5 lakh a month', ts: t0 + 3e4 }, { id: 'm3', from: 'bot', text: 'I found 2 homes that fit: a 3 BHK in Indiranagar at ₹1.4 L / month and a 3 BHK in Domlur at ₹1.35 L / month.', ts: t0 + 4e4 },
      { id: 'm4', from: 'user', text: 'can the owner come down to 1.3? also can I bring my lawyer to the visit', ts: t0 + 2e5 }, { id: 'm5', from: 'bot', text: 'Connecting you to a person now. They can see everything we have talked about.', kind: 'system', ts: t0 + 21e4 }] });
    cvs.push({ id: 'seed-w2', seed: true, agent: 'support', agentName: 'Northlane Support', channel: 'web', source: 'Google search', status: 'waiting', startedAt: t0 + 6e4, updatedAt: t0 + 4e5, handoverReason: 'Failed to understand 3 times', engaged: true, user: { name: 'Oliver Grant' }, mem: {}, context: { product: 'harbor-jacket' }, messages: [
      { id: 'm1', from: 'bot', text: 'Hi, I’m Northlane Support. I can see you are looking at the Harbor Jacket.', ts: t0 + 6e4 }, { id: 'm2', from: 'user', text: 'the zip on my last jacket split on day two, I want it replaced and a refund for the shipping', ts: t0 + 3e5 }, { id: 'm3', from: 'bot', text: 'I am having trouble with that one. Want me to bring in a person?', ts: t0 + 31e4 }, { id: 'm4', from: 'user', text: 'yes', ts: t0 + 34e4 }, { id: 'm5', from: 'bot', text: 'Connecting you to a person now.', kind: 'system', ts: t0 + 35e4 }] });
    cvs.push({ id: 'seed-h1', seed: true, agent: 'clinic', agentName: 'Calder Clinic', channel: 'whatsapp', source: 'WhatsApp click-to-chat', status: 'human', startedAt: t0 - 36e5, updatedAt: t0 - 3e6, engaged: true, user: { name: 'Ravi Menon' }, mem: {}, context: {}, handoverReason: 'Visitor tapped talk to a person', messages: [
      { id: 'm1', from: 'user', text: 'I need to move my appointment but the next free slot is too late', ts: t0 - 36e5 }, { id: 'm2', from: 'system', kind: 'system', text: 'Connected to Nora (front desk)', ts: t0 - 35e5 }, { id: 'm3', from: 'agent', text: 'Hi Ravi, Nora here. I can fit you in on Thursday at 8:30 am if that helps.', ts: t0 - 34e5 }, { id: 'm4', from: 'user', text: 'That works, thanks', ts: t0 - 33e5 }] });
    sset('orbit-convos', cvs); cvCache = null; sset('orbit-seed-v', 5); evBus.emit(null); cvBus.emit({ type: 'sync' });
  };
  try { O.seed(false); } catch (e) {}
})(typeof window !== 'undefined' ? window : globalThis);
