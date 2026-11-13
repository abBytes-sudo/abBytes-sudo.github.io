/* Agent: Calder Clinic Assistant (fictional multi-speciality outpatient clinic). Booking only: never medical advice.
   Treatments, doctors and bookings are demo data. Slots are generated for the next 10 days and booked slots really disappear (bookings live in bot.db). */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var DAYMS = 864e5, HOUR = 36e5, HORIZON = 10, SLOTMIN = 30;
  var TX = [
    { id: 'general', name: 'General consultation', btn: 'General consultation', dur: 20, n: 1, fee: 600, blurb: 'A routine visit with a family or general physician' },
    { id: 'dental', name: 'Dental check-up and clean', btn: 'Dental check-up', dur: 45, n: 2, fee: 1200, blurb: 'Examination and a professional clean' },
    { id: 'skin', name: 'Skin consultation', btn: 'Skin consultation', dur: 30, n: 1, fee: 900, blurb: 'A consultation with our dermatologist' },
    { id: 'physio', name: 'Physiotherapy session', btn: 'Physiotherapy', dur: 45, n: 2, fee: 800, blurb: 'A one to one session with a physiotherapist' },
    { id: 'eye', name: 'Eye test', btn: 'Eye test', dur: 30, n: 1, fee: 500, blurb: 'A full vision test with our eye specialist' },
    { id: 'vaccine', name: 'Vaccination', btn: 'Vaccination', dur: 15, n: 1, fee: 350, blurb: 'The visit and administration; the vaccine itself is charged at cost' },
    { id: 'health', name: 'Health check package', btn: 'Health check package', dur: 90, n: 3, fee: 3499, blurb: 'A full check package with a physician review' },
    { id: 'womens', name: 'Women’s health consult', btn: 'Women’s health', dur: 30, n: 1, fee: 1000, blurb: 'A private consultation with our gynaecologist' }
  ];
  var DR = [
    { id: 'rao', name: 'Dr Anil Rao', ini: 'AR', spec: 'Dentist', tx: ['dental'], days: [1, 2, 4, 5, 6], wk: [[9, 13], [16, 19]], we: [[9, 12]], langs: ['English', 'Hindi', 'Telugu'], exp: 14, busy: .3 },
    { id: 'iyer', name: 'Dr Kavya Iyer', ini: 'KI', spec: 'Dermatologist', tx: ['skin'], days: [1, 3, 5, 6], wk: [[10, 13], [15, 18]], we: [[10, 13]], langs: ['English', 'Hindi', 'Tamil'], exp: 11, busy: .36 },
    { id: 'menon', name: 'Dr Rohan Menon', ini: 'RM', spec: 'General physician', tx: ['general', 'health'], days: [1, 2, 3, 4, 5], wk: [[9, 13], [15, 19]], we: [[9, 12]], langs: ['English', 'Hindi', 'Malayalam'], exp: 18, busy: .32 },
    { id: 'shah', name: 'Dr Pooja Shah', ini: 'PS', spec: 'Family physician', tx: ['general', 'vaccine', 'health'], days: [2, 3, 4, 5, 6, 0], wk: [[10, 14], [16, 20]], we: [[10, 13]], langs: ['English', 'Hindi', 'Gujarati'], exp: 9, busy: .28 },
    { id: 'kulkarni', name: 'Dr Sana Kulkarni', ini: 'SK', spec: 'Physiotherapist', tx: ['physio'], days: [1, 2, 3, 4, 5, 6], wk: [[8, 12], [16, 20]], we: [[9, 12]], langs: ['English', 'Hindi', 'Marathi'], exp: 8, busy: .25 },
    { id: 'bose', name: 'Dr Ishita Bose', ini: 'IB', spec: 'Gynaecologist', tx: ['womens'], days: [2, 4, 6], wk: [[10, 13], [15, 18]], we: [[10, 13]], langs: ['English', 'Hindi', 'Bengali'], exp: 16, busy: .38 },
    { id: 'nair', name: 'Dr Vikram Nair', ini: 'VN', spec: 'Eye specialist', tx: ['eye'], days: [1, 2, 3, 5, 0], wk: [[9, 13], [15, 18]], we: [[10, 13]], langs: ['English', 'Hindi', 'Malayalam'], exp: 12, busy: .3 }
  ];
  var TBY = {}, DBY = {}; TX.forEach(function (t) { TBY[t.id] = t; }); DR.forEach(function (d) { DBY[d.id] = d; });
  var POLICY = 'Cancelling or rescheduling is free up to 4 hours before your appointment. After that a late fee of ₹200 may apply.';
  var EMERG = /(chest pain|(can.?t|cannot|not able to|unable to) breathe|difficulty breathing|trouble breathing|struggling to breathe|not breathing|bleeding (heavily|badly|a lot)|heavy bleeding|won.?t stop bleeding|unconscious|passed out|collapsed|not responding|\bstroke\b|heart attack|overdos|suicid|seizure|choking|anaphyla|severe allergic|\bemergency\b(?!\s+(services?|care|department|room|ward|facilit\w+|number|helpline|clinic|hours))|ambulance)/i;
  var SYMP = /\b(pain|painful|paining|fever|cough|headache|migraine|rash|dizzy|dizziness|vomit\w*|nausea|nauseous|unwell|not feeling well|feeling ill|swelling|swollen|infection|infected|itching|itchy|allerg\w*|bleeding|symptoms?|hurts?|aching|ache|sore throat|diarrh\w+|breathless|lump|cramps?)\b/i;
  var MONF = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' }, DOWF = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

  /* ---------- small helpers ---------- */
  function pad(n) { return ('0' + n).slice(-2); }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dateOf(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function dayList() { var o = [], t = new Date(); for (var i = 0; i < HORIZON; i++) o.push(isoOf(addDays(t, i))); return o; }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function tstr(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function toM(t) { var p = String(t).split(':'); return +p[0] * 60 + +p[1]; }
  function fT(m) { return O.fmtTime(typeof m === 'number' ? tstr(m) : m); }
  function rs(n) { return O.money(n, '₹'); }
  function sur(d) { return d.name.split(' ')[2]; }
  function sho(d) { return 'Dr ' + sur(d); }
  function dayLabel(iso, mid) { var d = dateOf(iso), diff = Math.round((d - dateOf(isoOf(new Date()))) / DAYMS), p = diff === 0 ? 'Today, ' : diff === 1 ? 'Tomorrow, ' : ''; return (mid ? p.toLowerCase() : p) + O.fmtDay(d); }
  function dayOn(iso) { var d = dateOf(iso), diff = Math.round((d - dateOf(isoOf(new Date()))) / DAYMS); return diff === 0 || diff === 1 ? dayLabel(iso, true) : 'on ' + O.fmtDay(d); }
  function apptDate(b) { var d = dateOf(b.iso), m = toM(b.time); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d; }
  function fDT(d) { return O.fmtDay(d) + ', ' + fT(d.getHours() * 60 + d.getMinutes()); }
  function sp(s) { // make text read well when spoken on the phone channel
    if (s == null) return s;
    return String(s).replace(/₹([\d,]+)/g, function (m, n) { return n.replace(/,/g, '') + ' rupees'; }).replace(/\bDr\.? /g, 'Doctor ').replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, function (m, a, b, c) { return DOWF[a] + ' ' + b + ' ' + MONF[c]; }).replace(/\bCL-(\d{4})\b/g, function (m, d) { return 'C L ' + d.split('').join(' '); }).replace(/ · /g, ', ').replace(/•\s*/g, '').replace(/\b(\d+) min\b/g, '$1 minutes');
  }
  function S(bot, text, o) { // every message goes through here
    if (bot.channel === 'phone') {
      text = sp(text);
      if (o) {
        o = { buttons: o.buttons, cards: o.cards, kind: o.kind, spoken: o.spoken, delay: o.delay };
        if (o.buttons) o.buttons = o.buttons.map(function (b) { return { label: sp(b.label), value: b.value }; });
        if (o.cards) o.cards = o.cards.map(function (c) { var x = {}; for (var k in c) x[k] = c[k]; x.title = sp(c.title); x.sub = sp(c.sub); x.price = sp(c.price); if (!c.ivr) x.buttons = undefined; return x; });
      }
    }
    return bot.say(text, o);
  }
  function R(bot, text, o) { // info answers given mid-booking get a button that puts the booking back
    if (bot._rs && bot._rs.n === bot.convo.messages.length) { o = o || {}; o = { buttons: (o.buttons || []).concat([B('Continue my ' + (bot._rs.flow === 'book' ? 'booking' : 'request'), 'act:resume:')]), cards: o.cards, kind: o.kind }; }
    return S(bot, text, o);
  }
  function eligible(tid) { return DR.filter(function (d) { return d.tx.indexOf(tid) >= 0; }); }
  function partOK(p) { return function (s) { return p === 'any' || !p || (p === 'morning' ? s.m < 720 : p === 'afternoon' ? s.m >= 720 && s.m < 1020 : s.m >= 1020); }; }

  /* ---------- treatments and doctors from text ---------- */
  function treatmentFrom(nt) {
    if (/\bdental\b/.test(nt)) return 'dental'; if (/\bskin\b/.test(nt)) return 'skin'; if (/\bphysio\b/.test(nt)) return 'physio';
    if (/\beye test\b|\beyes?\b|\bvision\b/.test(nt)) return 'eye'; if (/\bvaccination\b/.test(nt)) return 'vaccine';
    if (/\bwomens? health\b|\bwomen health\b/.test(nt)) return 'womens'; if (/\bhealth check\b/.test(nt)) return 'health'; if (/\bgeneral consultation\b/.test(nt)) return 'general';
  }
  function docFrom(nt) {
    var best = null; DR.forEach(function (d) { var p = d.name.toLowerCase().split(' '); if (new RegExp('\\b' + p[2] + '\\b').test(nt) || new RegExp('\\bdr\\.? ' + p[1] + '\\b').test(nt)) best = d; }); return best;
  }
  function nextMonday() { var d = new Date(), k = (8 - d.getDay()) % 7 || 7; return isoOf(addDays(d, k)); }
  function whenOf(text) {
    var t = String(text).toLowerCase(), w = N.when(t.replace(/\btom\b/g, ' ')) || {}, r = {}, m;
    if (w.date) r.day = w.iso; else if (/\bnext week\b/.test(t)) r.after = nextMonday(); else if ((m = t.match(/\bin (\d+|two|three|four|five|six|seven) days?\b/))) r.day = isoOf(addDays(new Date(), N.wordNum(m[1])));
    if (w.time) r.time = w.time; else if (w.timeAmbiguous) { var h = w.timeAmbiguous; r.time = pad(h >= 8 && h <= 11 ? h : h === 12 ? 12 : h + 12) + ':00'; }
    if (w.part) r.part = w.part; else if (r.time) r.part = toM(r.time) < 720 ? 'morning' : toM(r.time) < 1020 ? 'afternoon' : 'evening';
    if (r.time && !w.part && !/\bam\b|\bpm\b|:/.test(t)) delete r.part;
    return r;
  }

  /* ---------- slots ---------- */
  function baseSlots(doc, iso) { // deterministic availability before real bookings
    var dow = dateOf(iso).getDay(); if (doc.days.indexOf(dow) < 0) return [];
    var we = dow === 0 || dow === 6, r = O.rng(hash(doc.id + iso)), full = hash(doc.id + iso + 'f') % 9 === 0, busy = doc.busy + (we ? .06 : 0), out = [];
    (we ? doc.we : doc.wk).forEach(function (w) { for (var m = w[0] * 60; m < w[1] * 60; m += SLOTMIN) { var b = r() < busy; out.push({ m: m, busy: full || b }); } });
    return out;
  }
  function freeStarts(bks, doc, iso, n) {
    var base = baseSlots(doc, iso), st = {}, out = [], now = new Date(), min = iso === isoOf(now) ? now.getHours() * 60 + now.getMinutes() + 60 : -1;
    base.forEach(function (s) { st[s.m] = s.busy; });
    bks.forEach(function (b) { if (b.status === 'booked' && b.doc === doc.id && b.iso === iso) for (var k = 0; k < b.n; k++) st[toM(b.time) + SLOTMIN * k] = true; });
    base.forEach(function (s) { if (s.m < min) return; for (var k = 0; k < n; k++) if (st[s.m + SLOTMIN * k] !== false) return; out.push(s.m); });
    return out;
  }
  function slotsFor(bks, c, iso) {
    var docs = c.doc === 'any' || !c.doc ? eligible(c.tid) : [DBY[c.doc]], out = [], n = TBY[c.tid].n;
    docs.forEach(function (d, i) { freeStarts(bks, d, iso, n).forEach(function (m) { out.push({ doc: d, m: m, iso: iso, i: i }); }); });
    return out.sort(function (a, b) { return a.m - b.m || a.i - b.i; });
  }
  function daysWith(bks, c, after, part) {
    var out = []; dayList().forEach(function (iso) { if (after && iso < after) return; var l = slotsFor(bks, c, iso).filter(partOK(part)); if (l.length) out.push({ iso: iso, count: l.length }); }); return out;
  }
  function nextFor(bks, tid, docId) { // earliest slot per doctor, soonest first
    var out = []; (docId && docId !== 'any' ? [DBY[docId]] : eligible(tid)).forEach(function (d) {
      var dl = dayList(); for (var i = 0; i < dl.length; i++) { var f = freeStarts(bks, d, dl[i], TBY[tid].n); if (f.length) { out.push({ doc: d, iso: dl[i], m: f[0] }); break; } }
    });
    return out.sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : a.m - b.m; });
  }
  function isFree(bks, tid, docId, iso, hhmm) { return slotsFor(bks, { tid: tid, doc: docId }, iso).some(function (s) { return s.m === toM(hhmm); }); }

  /* ---------- bookings (stored through bot.db / bot.save) ---------- */
  function seedBookings(have) {
    var defs = [['CL-1042', 'skin', 'iyer', 'Meera Joshi', '4821', 2], ['CL-1043', 'dental', 'rao', 'Arjun Verma', '7305', 3], ['CL-1044', 'physio', 'kulkarni', 'Sunita Pillai', '4821', 4], ['CL-1045', 'general', 'menon', 'Rahul Desai', '1190', 1]], out = [];
    defs.forEach(function (d) {
      if (have.some(function (b) { return b.ref === d[0]; })) return; var tx = TBY[d[1]], doc = DBY[d[2]], all = have.concat(out);
      for (var k = d[5]; k < HORIZON; k++) { var iso = isoOf(addDays(new Date(), k)), fs = freeStarts(all, doc, iso, tx.n); if (fs.length) { out.push({ ref: d[0], tid: d[1], doc: d[2], iso: iso, time: tstr(fs[Math.min(1, fs.length - 1)]), n: tx.n, patient: d[3], whom: 'self', rel: '', phone: '', last4: d[4], status: 'booked', at: Date.now(), fee: tx.fee, seed: true }); break; } }
    });
    return out;
  }
  function BK(bot) { // bookings, with demo bookings refreshed once they are in the past
    var l = bot.db('bookings'), now = new Date(), stale = l.filter(function (b) { return b.seed && b.status === 'booked' && apptDate(b) < now; });
    if (stale.length) { l = l.filter(function (b) { return stale.indexOf(b) < 0; }); l = l.concat(seedBookings(l)); bot.save('bookings', l); } return l;
  }
  function byRef(l, ref) { for (var i = 0; i < l.length; i++) if (l[i].ref === ref) return l[i]; return null; }
  function findBookings(bot, key) {
    var l = BK(bot); if (/^CL-/.test(key)) return l.filter(function (b) { return b.ref === key && b.status === 'booked'; });
    return l.filter(function (b) { return b.last4 === key && b.status === 'booked'; });
  }
  function lookupParse(t) {
    var m = String(t).match(/\bCL[- ]?(\d{4})\b/i); if (m) return 'CL-' + m[1]; var ph = N.phone(t); if (ph) return ph.slice(-4);
    m = String(t).match(/(?:ending|last\s*(?:4|four)(?:\s*digits)?|digits)[^\d]{0,12}(\d{4})\b/i) || String(t).match(/^\D*(\d{4})\D*$/); return m ? m[1] : undefined;
  }
  function bcard(b, head) {
    var tx = TBY[b.tid], d = DBY[b.doc];
    return { title: (head || b.ref) + (head ? ' · ' + b.ref : ''), sub: tx.name + ' with ' + d.name, price: rs(b.fee || tx.fee), badge: d.ini, meta: [dayLabel(b.iso) + ' at ' + fT(b.time), 'For ' + b.patient, 'About ' + tx.dur + ' min'], buttons: [B('Reschedule', 'act:resch:' + b.ref), B('Cancel', 'act:cancel:' + b.ref)] };
  }
  function reminderCards(b) { // simulated: shows exactly what would be sent, nothing is sent
    var tx = TBY[b.tid], d = DBY[b.doc], at = apptDate(b), now = Date.now(), first = b.patient.split(' ')[0], free = new Date(at.getTime() - 4 * HOUR);
    function msg(lead) { return 'Calder Clinic: Hello ' + first + ', ' + lead + ' your ' + tx.name.toLowerCase() + ' with ' + d.name + ' on ' + O.fmtDay(at) + ' at ' + fT(b.time) + '. Ref ' + b.ref + '. Please arrive 10 minutes early with a photo ID. Reply 1 to confirm or 2 to reschedule. Free cancellation until ' + fDT(free) + '.'; }
    function card(title, ms, hrs, lead) { var send = new Date(at.getTime() - hrs * HOUR); return { title: title, sub: msg(lead), badge: 'Preview · simulated', meta: [send.getTime() < now ? 'Would send right away, as the visit is less than ' + hrs + ' hours away' : 'Scheduled for ' + fDT(send), 'Channel: SMS and WhatsApp', 'Nothing is actually sent in this demo'] }; }
    return [card('Reminder 24 hours before', 0, 24, 'this is a reminder for'), card('Reminder 2 hours before', 0, 2, 'we look forward to seeing you in 2 hours for')];
  }
  function sayReminders(bot, b, intro) {
    var cs = reminderCards(b), t = intro || 'Here is a **preview** of the two reminders we would send for **' + b.ref + '**. It is simulated, so no message actually goes out.';
    S(bot, t, { cards: cs, spoken: bot.channel === 'phone' ? sp(t.replace(/\*\*/g, '')) + ' The first, 24 hours before, would say: ' + sp(cs[0].sub) + ' The second, 2 hours before, would say: ' + sp(cs[1].sub) : undefined });
  }
  function docCard(d) {
    var order = [1, 2, 3, 4, 5, 6, 0], dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { ivr: true, title: d.name, sub: d.spec + ' · ' + d.exp + ' years of experience', badge: d.ini, meta: ['Speaks ' + d.langs.join(', '), 'Works ' + order.filter(function (x) { return d.days.indexOf(x) >= 0; }).map(function (x) { return dn[x]; }).join(', '), 'Offers ' + d.tx.map(function (t) { return TBY[t].btn.toLowerCase(); }).join(', ')], buttons: [B('Book with ' + sho(d), 'act:bookdoc:' + d.id), B('Next free slot', 'act:nextdoc:' + d.id)] };
  }
  function showNext(bot, tid, docId) {
    var t = TBY[tid], res = nextFor(BK(bot), tid, docId), who = docId && docId !== 'any' ? DBY[docId] : null;
    if (!res.length) { R(bot, 'I cannot see a free ' + t.btn.toLowerCase() + ' slot in the next ' + HORIZON + ' days' + (who ? ' with ' + who.name : '') + '. A person can check for cancellations.', { buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }); return; }
    var f = res[0];
    R(bot, 'The earliest ' + t.btn.toLowerCase() + ' slot' + (who ? ' with ' + who.name : '') + ' is **' + dayLabel(f.iso, true) + ' at ' + fT(f.m) + '** with ' + f.doc.name + '.', { cards: res.slice(0, 3).map(function (r) { return { ivr: true, title: r.doc.name + ' · ' + dayLabel(r.iso) + ', ' + fT(r.m), sub: t.name + ' · ' + t.dur + ' min', price: rs(t.fee), badge: r.doc.ini, buttons: [B('Book this slot', 'act:pick:' + [tid, r.doc.id, r.iso, tstr(r.m)].join('|')), B('More times that day', 'act:dayof:' + [tid, r.doc.id, r.iso].join('|'))] }; }) });
  }
  function profile(bot, d) { R(bot, d.name + ' is our ' + d.spec.toLowerCase() + '.', { cards: [docCard(d)] }); }
  function symptomsReply(bot, m) {
    if (m.ent && m.ent.treatment) { S(bot, 'I am sorry you are uncomfortable. I cannot give medical advice or say what is causing it, but I can book you the appointment you are asking for.'); bot.startFlow('book', bot._preset('book', m.ent)); return; }
    S(bot, 'I am sorry you are not feeling well. I am a booking assistant, so I cannot give medical advice or say what a symptom might mean. A doctor has to do that. I can book you a general consultation. If it feels urgent, please call your local emergency number or go to the nearest emergency department.', { buttons: [B('Book a general consultation', 'act:bookgen:'), B('Earliest general slot', 'act:next:general'), B('Talk to a person', 'handover')] });
  }
  function nameParse(t, bot) {
    t = String(t).replace(/^(her|his|their|the patient'?s?|patient'?s?) name is\s+/i, '');
    if (EMERG.test(t) || SYMP.test(t) || /\d/.test(t) || (bot && O.kb.match('clinic', t, bot.agent.synonyms))) return undefined;
    if (/\b(what|how|where|when|why|who|which|can|could|do|does|is|are|will|would|yes|no|ok|okay|cancel|menu|help|thanks|fees?|cost|insurance|parking|hours|price|address|report|doctor|appointment|slot|myself|dentist|book|change|time)\b/i.test(t) && !/\b(my name is|name is|this is|call me)\b/i.test(t)) return undefined;
    var q = N.name(t) || (/^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){0,3}$/.test(t.trim()) ? t.trim().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }).slice(0, 40) : undefined);
    return q;
  }
  function ynParse(t) { var y = N.yesno(t); if (/\b(change|different|another|other|new)\b.*\b(time|day|slot|date)\b|reschedule|\bearlier\b|\blater\b/i.test(t)) return 'change'; return y === undefined ? undefined : (y ? 'yes' : 'no'); }
  function ctxOf(bot, s) { if (bot.flow === 'resched') { var b = byRef(BK(bot), s.bk); return b ? { tid: b.tid, doc: b.doc } : { tid: 'general', doc: 'any' }; } return { tid: s.treatment, doc: s.doctor || 'any' }; }
  function noSlots(bot, s, c, why) {
    delete bot.slots.day; var days = daysWith(BK(bot), c, null, null).slice(0, 5);
    if (!days.length) { S(bot, why + ' I cannot see any free slots in the next ' + HORIZON + ' days for this. A person can help.', { buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }); bot.endFlow(); return; }
    S(bot, why + ' The nearest days with a free slot are these.', { buttons: days.map(function (d) { return B(dayLabel(d.iso) + ' · ' + d.count + ' free', 'slot:day=' + d.iso); }) });
  }
  /* slot steps shared by booking and rescheduling */
  function showCur(bot, s) { if (bot.flow === 'resched' && !s.shown) { s.shown = true; S(bot, 'Found your booking.', { cards: [bcard(byRef(BK(bot), s.bk))] }); } }
  var SLOTSTEPS = [
    { name: 'after', optional: true }, { name: 'part', optional: true }, { name: 'time', optional: true },
    { name: 'day', ask: function (bot, s) {
      var c = ctxOf(bot, s), days = daysWith(BK(bot), c, s.after, s.part), doc = c.doc !== 'any' ? DBY[c.doc] : null; showCur(bot, s);
      if (!days.length) { days = daysWith(BK(bot), c, null, null); if (!days.length) { S(bot, 'I cannot see any free slots in the next ' + HORIZON + ' days' + (doc ? ' with ' + doc.name : '') + '. A person can check for cancellations.', { buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }); bot.endFlow(); return; } }
      S(bot, 'Which day suits you' + (doc ? ' with ' + sho(doc) : '') + '?' + (s.after ? ' I am showing next week onwards.' : '') + (s.part && s.part !== 'any' ? ' Days with ' + s.part + ' slots are listed.' : ''), { buttons: days.slice(0, 6).map(function (d) { return B(dayLabel(d.iso) + ' · ' + d.count + ' free', 'slot:day=' + d.iso); }) });
    }, parse: function (t, bot, s) {
      var r = whenOf(t); if (r.day) return r.day; if (/\b(earliest|soonest|first|any day|anytime|whenever)\b/i.test(t)) { var dd = daysWith(BK(bot), ctxOf(bot, s), s.after, null); return dd.length ? dd[0].iso : undefined; }
    } },
    { name: 'slot', ask: function (bot, s) {
      var c = ctxOf(bot, s), bks = BK(bot), iso = s.day, dl = dayList(), doc = c.doc !== 'any' ? DBY[c.doc] : null, tx = TBY[c.tid]; showCur(bot, s);
      if (dl.indexOf(iso) < 0) { noSlots(bot, s, c, 'I can only book the next ' + HORIZON + ' days, up to ' + O.fmtDay(dateOf(dl[HORIZON - 1])) + '.'); return; }
      var all = slotsFor(bks, c, iso); if (!all.length) { noSlots(bot, s, c, 'There are no free slots ' + dayOn(iso) + (doc ? ' with ' + doc.name : '') + '.'); return; }
      var list = all, note = '', tm = s.time && s.time !== 'any' ? toM(s.time) : null;
      if (s.part && s.part !== 'any') { var f = all.filter(partOK(s.part)); if (f.length) list = f; else note = 'Nothing is free in the ' + s.part + ' that day, so here are the other times. '; }
      if (tm !== null) { note += all.some(function (x) { return x.m === tm; }) ? fT(tm) + ' is free. ' : 'Nothing is free at ' + fT(tm) + ', so these are the closest. '; list = list.slice().sort(function (a, b) { return Math.abs(a.m - tm) - Math.abs(b.m - tm) || a.m - b.m; }); }
      var lim = all.length > 5 && !s.part ? 4 : 6, btns = list.slice(0, lim).map(function (x) { return B(fT(x.m) + (doc ? '' : ' · ' + sho(x.doc)), 'slot:slot=' + x.doc.id + '|' + iso + '|' + tstr(x.m)); });
      if (all.length > 5 && !s.part) ['morning', 'afternoon', 'evening'].filter(function (p) { return all.some(partOK(p)); }).slice(0, 2).forEach(function (p) { btns.push(B('Only ' + p, 'slot:part=' + p)); });
      btns.push(B('Another day', 'act:otherday:'));
      S(bot, note + 'Here are the nearest free times **' + dayOn(iso) + '**' + (doc ? ' with ' + doc.name : '') + ' for the ' + tx.name.toLowerCase() + ' (about ' + tx.dur + ' min). ' + (bot.channel === 'phone' ? 'Choose one, or say a time.' : 'Tap one, or type a time.'), { buttons: btns });
    }, parse: function (t, bot, s) {
      if (!s.day) return undefined; var r = whenOf(t); if (!r.time) return undefined; var x = slotsFor(BK(bot), ctxOf(bot, s), s.day).filter(function (y) { return y.m === toM(r.time); })[0];
      return x ? x.doc.id + '|' + s.day + '|' + tstr(x.m) : undefined;
    } }
  ];

  O.registerAgent({
    id: 'clinic', name: 'Calder Clinic Assistant', business: 'Calder Clinic', role: 'Clinic bookings', industry: 'Healthcare', initials: 'CC', accent: '#60A5FA', phoneLabel: 'Calder Clinic appointments line',
    blurb: 'Books, reschedules and cancels appointments from real free slots, finds the earliest slot or the right doctor, shows reminder previews and answers clinic FAQs. Never gives medical advice.',
    helloLine: 'I can book, reschedule or cancel an appointment, find the earliest slot or tell you who sees what. I cannot give medical advice.',
    samples: ['dentist tomorrow evening', 'I need to see Dr Rao on Saturday morning', 'book a skin consult for my mother next week', 'physio 6pm friday'],
    kind: 'customer',
    contexts: [{ label: 'Just browsing', context: {} }, { label: 'Viewing: Dr Anil Rao (dentist)', context: { doctor: 'rao' } }, { label: 'Viewing: Dr Kavya Iyer (skin)', context: { doctor: 'iyer' } }, { label: 'Viewing: Skin consultation', context: { treatment: 'skin' } }, { label: 'Viewing: Physiotherapy session', context: { treatment: 'physio' } }],
    synonyms: {
      dental: ['dentist', 'dentists', 'dentistry', 'teeth', 'tooth', 'teeth cleaning', 'tooth cleaning', 'scaling'],
      skin: ['derm', 'derma', 'dermatologist', 'dermatologists', 'dermatology', 'skin doctor', 'skin specialist', 'skin consult', 'skin consultation'],
      physio: ['physios', 'physiotherapy', 'physiotherapist', 'physical therapy', 'physical therapist', 'bone doctor', 'bone specialist'],
      'eye test': ['eye check', 'eye checkup', 'eye check up', 'eye exam', 'eye examination', 'vision test', 'sight test', 'eyesight test', 'optometrist', 'ophthalmologist', 'eye doctor', 'eye specialist'],
      vaccination: ['vaccine', 'vaccines', 'jab', 'jabs', 'shot', 'shots', 'immunisation', 'immunization', 'booster', 'vaccinate'],
      'health check': ['checkup', 'check up', 'check-up', 'full body', 'full body checkup', 'full checkup', 'health package', 'master health', 'executive health'],
      'womens health': ['gynae', 'gyne', 'gynaecologist', 'gynecologist', 'gynaecology', 'gynecology', 'women\'s health', 'women health', 'ladies doctor'],
      'general consultation': ['gp', 'general physician', 'family doctor', 'family physician', 'general doctor', 'general consult', 'normal doctor'],
      'next available': ['earliest', 'soonest', 'first available', 'asap', 'as soon as possible', 'nearest slot', 'soonest available'],
      reschedule: ['rebook', 'postpone', 'move my appointment', 'change my appointment', 'shift my appointment', 'change my booking'],
      appointment: ['appt', 'apointment', 'appointments']
    },
    seeds: { bookings: function () { return seedBookings([]); } },
    menu: [B('Book an appointment', 'flow:book'), B('Reschedule or cancel', 'intent:manage'), B('Earliest available', 'intent:next_available'), B('Our doctors', 'intent:doctors'), B('Fees and insurance', 'intent:fees')],
    greeting: function (bot) {
      var d = bot.ctx.doctor && DBY[bot.ctx.doctor], t = bot.ctx.treatment && TBY[bot.ctx.treatment], hi = 'Hi, I’m the Calder Clinic booking assistant. ';
      if (d) { S(bot, hi + 'I can see you are looking at **' + d.name + '**, ' + d.spec.toLowerCase() + '. I can show the next free slot, or book you in now. I do not give medical advice.', { buttons: [B('Next free slot with ' + sho(d), 'act:nextdoc:' + d.id), B('Book with ' + sho(d), 'act:bookdoc:' + d.id), B('Fees', 'intent:fees'), B('Reschedule or cancel', 'intent:manage')] }); return; }
      if (t) { S(bot, hi + 'I can see you are looking at the **' + t.name.toLowerCase() + '**: about ' + t.dur + ' minutes, ' + rs(t.fee) + '. Want the earliest slot, or shall I book it?', { buttons: [B('Book ' + t.btn.toLowerCase(), 'act:booktx:' + t.id), B('Earliest slot', 'act:next:' + t.id), B('Who does this?', 'act:docs:' + t.id), B('Reschedule or cancel', 'intent:manage')] }); return; }
      S(bot, hi + 'I can book, reschedule or cancel an appointment, find the earliest slot or tell you who sees what. I cannot give medical advice.', { buttons: bot.agent.menu });
    },
    extract: function (text, bot) {
      var e = {}, pend = bot.flow && bot.pending && bot.pending.name; bot._rs = bot.flow ? { flow: bot.flow, n: bot.convo.messages.length, slots: JSON.parse(JSON.stringify(bot.slots)) } : null; if (pend === 'patient' || pend === 'phone' || pend === 'lookup') { var lk = lookupParse(text); if (pend === 'lookup' && lk) e.lookup = lk; return e; }
      var syn = bot.agent.synonyms, nt = N.norm(text, syn), t = String(text).toLowerCase(), tid = treatmentFrom(nt), doc = docFrom(nt), cur = tid || (bot.flow === 'book' && bot.slots.treatment), m, w = whenOf(text), ph = N.phone(text), ref = String(text).match(/\bCL[- ]?(\d{4})\b/i);
      if (!tid && /\b(bone|joint|spine)\b/.test(t) && /\b(doctor|specialist|session|appointment|book)\b/.test(t)) tid = 'physio';
      if (doc && !tid && doc.tx.length === 1) tid = doc.tx[0];
      if (doc && (tid || cur) && doc.tx.indexOf(tid || cur) < 0) { bot.mem.dm = doc.id; doc = null; } else if (doc) delete bot.mem.dm;
      if (bot.flow === 'book' && tid && bot.slots.treatment && tid !== bot.slots.treatment) { delete bot.slots.doctor; delete bot.slots.slot; }
      if (tid) e.treatment = tid; if (doc) e.doctor = doc.id;
      if (w.day) { e.day = w.day; if (bot.flow && bot.slots.slot) delete bot.slots.slot; } if (w.after) e.after = w.after; if (w.part) e.part = w.part; if (w.time) { e.time = w.time; if (bot.flow && bot.slots.slot) delete bot.slots.slot; }
      if ((m = t.match(/\bfor (?:my |our )?(mother|mom|mum|father|dad|wife|husband|spouse|partner|son|daughter|kid|child|baby|friend|brother|sister|parents?|grandmother|grandfather|grandma|grandpa|mil|fil)\b/))) { e.whom = 'other'; e.rel = m[1]; } else if (/\bfor (?:someone else|somebody else|a friend|my family)\b/.test(t)) e.whom = 'other'; else if (/\bfor (?:me|myself)\b/.test(t)) e.whom = 'self';
      if ((m = String(text).match(/\b(?:my name is|name is|call me)\s+([A-Za-z][A-Za-z'.-]+(?:\s+[A-Za-z][A-Za-z'.-]+)?)/i))) { e.patient = N.name('my name is ' + m[1]); if (!e.whom) e.whom = 'self'; }
      if (ph) e.phone = ph; if (ref) { e.ref = 'CL-' + ref[1]; e.lookup = e.ref; } else { var lk2 = String(text).match(/(?:ending|last\s*(?:4|four)(?:\s*digits)?)[^\d]{0,12}(\d{4})\b/i); if (lk2) e.lookup = lk2[1]; }
      return e;
    },
    intents: [
      { id: 'emergency', label: 'Emergency wording', kw: [], re: [EMERG], priority: 10, run: function (bot) {
        bot.event('action', { action: 'emergency_wording' }); S(bot, 'This could be an emergency, and I cannot help with that here. Please call your local emergency number now, or go to the nearest emergency department. Do not wait for an appointment. I am alerting our front desk as well.'); bot.handover('Possible emergency wording');
      } },
      { id: 'clinical', label: 'Clinical question', kw: ['which medicine', 'what medicine', 'medicine for', 'medication', 'dosage', 'prescribe', 'prescription', 'antibiotic', 'antibiotics', 'side effects', 'is it safe to', 'diagnose', 'diagnosis', 'what is wrong with me', 'what could it be', 'is it serious', 'should i take', 'can i take', 'what should i do for', 'what does my report'], priority: 4, run: function (bot) {
        S(bot, 'I cannot give medical advice, diagnoses or medicine guidance, and I do not want to guess. I am passing this to our clinical team, who will pick it up with you. You can also book a consultation with a doctor.', { buttons: [B('Book a general consultation', 'act:bookgen:')] }); bot.handover('Clinical question');
      } },
      { id: 'symptoms', label: 'Symptoms described', kw: ['pain', 'painful', 'fever', 'cough', 'cold', 'headache', 'migraine', 'rash', 'dizzy', 'vomiting', 'nausea', 'unwell', 'not feeling well', 'feeling ill', 'swelling', 'swollen', 'infection', 'infected', 'itching', 'itchy', 'allergy', 'bleeding', 'symptoms', 'symptom', 'hurts', 'aching', 'sore throat', 'breathless', 'lump'], priority: 3, run: function (bot, m) { symptomsReply(bot, m); } },
      { id: 'billing', label: 'Billing dispute', kw: ['billing dispute', 'billing issue', 'billing problem', 'overcharged', 'charged twice', 'double charged', 'extra charge', 'wrong charge', 'wrong bill', 'incorrect bill', 'bill is wrong', 'dispute'], re: [/\b(charged (me )?(twice|double|extra|wrong|too much)|wrong (bill|charge|amount)|refund (for|of) my)\b/], priority: 4, run: function (bot) {
        S(bot, 'I am sorry about that. Billing questions need our accounts team, who can see your invoice. I am passing this on with the whole chat so you do not need to repeat it.'); bot.handover('Billing dispute');
      } },
      { id: 'report_q', label: 'Report question', kw: ['explain my report', 'report is wrong', 'results are wrong', 'missing report', 'report delay', 'my results', 'report not received', 'report has not come', 'what does my report say'], re: [/\b(my|the) (report|results?|scan|lab)\b.*\b(wrong|mistake|error|missing|not (arrived|received|come|ready)|hasn'?t|delay\w*|explain|mean|normal|abnormal)\b/], priority: 4, run: function (bot) {
        S(bot, 'I cannot read or explain test results, and I cannot see report status from here. I am passing this to our front desk with the chat so they can look into it.'); bot.handover('Report question');
      } },
      { id: 'reschedule', label: 'Reschedule', kw: ['reschedule', 'change my appointment', 'move my appointment', 'change appointment', 'different time', 'rebook', 'postpone'], re: [/\b(re-?schedule|move|change|shift|postpone)\b.*\b(appointment|booking|slot|visit)\b/], flow: 'resched', priority: 3 },
      { id: 'cancel_appt', label: 'Cancel appointment', kw: ['cancel appointment', 'cancel my appointment', 'cancel booking', 'cancel my booking', 'cancel my visit'], re: [/\bcancel\b.*\b(appointment|booking|visit|slot|consult\w*|CL-?\d+)\b/i, /^cancel[.! ]*$/], flow: 'cancel', priority: 3 },
      { id: 'manage', label: 'Manage booking', kw: ['my appointment', 'my booking', 'manage booking', 'existing booking', 'booking status', 'existing appointment'], priority: 1, run: function (bot) {
        S(bot, 'Sure. What would you like to do with your booking?', { buttons: [B('Reschedule it', 'intent:reschedule'), B('Cancel it', 'intent:cancel_appt'), B('Preview my reminders', 'intent:reminder')] });
      } },
      { id: 'reminder', label: 'Reminder preview', kw: ['reminder', 'reminders', 'remind me', 'will you remind', 'sms reminder', 'whatsapp reminder', 'reminder preview'], priority: 2, run: function (bot, m) {
        var ref = m.ent.ref || bot.mem.lastRef, b = ref && byRef(BK(bot), ref);
        if (b && b.status === 'booked') { sayReminders(bot, b); return; }
        R(bot, 'We send a reminder 24 hours and again 2 hours before every appointment, by SMS and WhatsApp. Give me a booking reference like CL-1042 and I will show you exactly what it would say, or book something and I will show it right away.', { buttons: [B('Preview with a sample booking', 'act:reminder:sample'), B('Book an appointment', 'flow:book')] });
      } },
      { id: 'next_available', label: 'Earliest available', kw: ['next available', 'free slot', 'any slot', 'slots', 'availability', 'available today', 'is anyone free', 'when is dr', 'when can i see'], priority: 3, run: function (bot, m) {
        var e = m.ent; if (e.day || e.time || e.part) { bot.startFlow('book', bot._preset('book', e)); return; }
        if (e.doctor) { showNext(bot, e.treatment || DBY[e.doctor].tx[0], e.doctor); return; }
        if (e.treatment) { showNext(bot, e.treatment, 'any'); return; }
        var cd = bot.ctx.doctor && DBY[bot.ctx.doctor], ct = bot.ctx.treatment && TBY[bot.ctx.treatment]; if (cd) { showNext(bot, cd.tx[0], cd.id); return; } if (ct) { showNext(bot, ct.id, 'any'); return; }
        S(bot, 'Happy to find the earliest slot. Which service?', { buttons: TX.map(function (t) { return B(t.btn, 'act:next:' + t.id); }) });
      } },
      { id: 'doctors', label: 'Who treats what', kw: ['who treats', 'who does', 'who can', 'which doctor', 'which specialist', 'who should i see', 'who handles', 'specialist for', 'our doctors', 'your doctors', 'meet the doctors', 'doctors', 'specialists', 'the team'], priority: 3, run: function (bot, m) {
        var e = m.ent; if (!e.treatment && !e.doctor && SYMP.test(m.text)) { symptomsReply(bot, m); return; } if (e.doctor && !String(m.norm).match(/who (treats|does|can)/)) { profile(bot, DBY[e.doctor]); return; }
        if (e.treatment) { var el = eligible(e.treatment); R(bot, el.length === 1 ? el[0].name + ' handles the ' + TBY[e.treatment].name.toLowerCase() + '.' : el.length + ' doctors offer the ' + TBY[e.treatment].name.toLowerCase() + '.', { cards: el.map(docCard) }); return; }
        R(bot, 'Here is our team. I can show the next free slot or book with any of them.', { cards: DR.map(docCard) });
      } },
      { id: 'profile', label: 'Doctor profile', kw: ['tell me about', 'about dr', 'who is dr', 'profile', 'qualification', 'experience', 'languages', 'speaks'], priority: 2, run: function (bot, m) {
        var d = m.ent.doctor && DBY[m.ent.doctor] || bot.ctx.doctor && DBY[bot.ctx.doctor]; if (d) { profile(bot, d); return; } S(bot, 'Which doctor would you like to know about?', { buttons: DR.slice(0, 6).map(function (x) { return B(x.name, 'act:profile:' + x.id); }) });
      } },
      { id: 'fees', label: 'Fees', kw: ['fee', 'fees', 'cost', 'price', 'prices', 'pricing', 'how much', 'charges', 'charge', 'rate', 'rates', 'consultation fee'], priority: 4, run: function (bot, m) {
        var e = m.ent, t = e.treatment && TBY[e.treatment] || (!e.doctor && bot.ctx.treatment && TBY[bot.ctx.treatment]);
        if (t) { R(bot, 'The ' + t.name.toLowerCase() + ' is **' + rs(t.fee) + '**, about ' + t.dur + ' minutes. ' + t.blurb + '. Payment is at the clinic; cashless is available on request.', { buttons: [B('Book it', 'act:booktx:' + t.id), B('Earliest slot', 'act:next:' + t.id), B('Insurance and cashless', 'say:insurance')] }); return; }
        R(bot, 'Our fees:\n' + TX.map(function (x) { return '• ' + x.name + ': ' + rs(x.fee) + ' (' + x.dur + ' min)'; }).join('\n') + '\nTests, vaccines and procedures a doctor advises are billed separately. Payment is at the clinic.', { buttons: [B('Insurance and cashless', 'say:insurance'), B('Book an appointment', 'flow:book'), B('Menu', 'menu')] });
      } },
      { id: 'book', label: 'Book an appointment', kw: ['book', 'booking', 'appointment', 'schedule', 'consult', 'consultation', 'see a doctor', 'see doctor', 'see dr', 'need to see', 'want to see', 'visit', 'dental', 'skin', 'physio', 'eye test', 'vaccination', 'health check', 'womens health', 'general consultation'], flow: 'book', priority: 0 }
    ],
    flows: {
      book: { intent: 'book', slots: [
        { name: 'treatment', ask: function (bot, s) {
          var d = (s.doctor && s.doctor !== 'any' && DBY[s.doctor]) || (bot.ctx.doctor && DBY[bot.ctx.doctor]), c = bot.ctx.treatment && TBY[bot.ctx.treatment];
          if (c && !s.doctor) { S(bot, 'Booking the **' + c.name.toLowerCase() + '**, as that is the page you are on.'); bot.slots.treatment = c.id; bot._advance(); return; }
          var list = d ? d.tx.map(function (x) { return TBY[x]; }) : TX; if (list.length === 1) { bot.slots.treatment = list[0].id; bot._advance(); return; }
          S(bot, d ? 'What would you like to see ' + d.name + ' for?' : 'Sure. What would you like to book?', { buttons: list.map(function (x) { return B(x.btn, 'slot:treatment=' + x.id); }) });
        }, parse: function (t, bot) { return treatmentFrom(N.norm(t, bot.agent.synonyms)); }, hint: 'Tell me the service, for example dentist, skin consultation, physio or eye test.' },
        { name: 'doctor', ask: function (bot, s) {
          var el = eligible(s.treatment), tx = TBY[s.treatment], cd = bot.ctx.doctor && DBY[bot.ctx.doctor], note = bot.mem.dm ? DBY[bot.mem.dm].name + ' does not see patients for the ' + tx.name.toLowerCase() + '. ' : ''; delete bot.mem.dm;
          if (cd && el.indexOf(cd) >= 0 && !note) { S(bot, 'Booking with **' + cd.name + '**, as that is the page you are on.'); bot.slots.doctor = cd.id; bot._advance(); return; }
          if (el.length === 1) { S(bot, note + el[0].name + ' is our ' + el[0].spec.toLowerCase() + ', so I will book with them.'); bot.slots.doctor = el[0].id; bot._advance(); return; }
          S(bot, note + 'Do you want a particular doctor for the ' + tx.name.toLowerCase() + '?', { buttons: [B('Any available doctor', 'slot:doctor=any')].concat(el.map(function (d) { return B(d.name, 'slot:doctor=' + d.id); })) });
        }, parse: function (t, bot, s) {
          if (/\b(any|anyone|whoever|whichever|no preference|does ?n.?t matter|earliest|soonest|next available)\b/i.test(t)) return 'any';
          var d = docFrom(N.norm(t, bot.agent.synonyms)); return d && d.tx.indexOf(s.treatment) >= 0 ? d.id : undefined;
        }, hint: 'Say a doctor’s name, or “any doctor” and I will pick the earliest.' }
      ].concat(SLOTSTEPS).concat([
        { name: 'whom', ask: function (bot) { S(bot, 'Is this appointment for you, or for someone else?', { buttons: [B('For me', 'slot:whom=self'), B('Someone else', 'slot:whom=other')] }); },
          parse: function (t) { return /\b(me|myself|my own|self|i)\b/i.test(t) && !/\b(else|other|mother|father|wife|husband)\b/i.test(t) ? 'self' : /\b(someone|somebody|else|other|mother|mom|mum|father|dad|wife|husband|spouse|son|daughter|kid|child|friend|brother|sister|parent|grand\w+)\b/i.test(t) ? 'other' : undefined; } },
        { name: 'rel', optional: true },
        { name: 'patient', ask: function (bot, s) { if (s.whom === 'self' && bot.user.name) { bot.slots.patient = bot.user.name; bot._advance(); return; } S(bot, s.whom === 'other' ? 'What is the patient’s full name?' : 'What name should I put the booking under?'); }, parse: nameParse, hint: 'Just type the name, for example Priya Nair.' },
        { name: 'phone', ask: function (bot) { S(bot, 'And a mobile number for the confirmation and reminders? Digits only is fine.', bot.user.phone ? { buttons: [B('Use the number ending ' + bot.user.phone.slice(-4), 'slot:phone=' + bot.user.phone)] } : undefined); }, parse: function (t) { return N.phone(t); }, hint: 'Please type a 10 digit mobile number.' },
        { name: 'confirm', ask: function (bot, s) {
          var tx = TBY[s.treatment], p = s.slot.split('|'), d = DBY[p[0]];
          S(bot, 'Please check the details.\n**' + tx.name + '** with ' + d.name + '\n' + dayLabel(p[1]) + ' at ' + fT(p[2]) + ', about ' + tx.dur + ' minutes\nFor ' + s.patient + ', contact number ending ' + s.phone.slice(-4) + '\nFee ' + rs(tx.fee) + ', paid at the clinic.\nShall I confirm this booking?', { buttons: [B('Yes, confirm', 'slot:confirm=yes'), B('Change the time', 'slot:confirm=change'), B('No, stop', 'slot:confirm=no')] });
        }, parse: ynParse }
      ]), done: function (bot, s) {
        if (s.confirm === 'no') { S(bot, 'No problem, nothing has been booked.'); bot.menu('Anything else?'); return; }
        var keep = { treatment: s.treatment, doctor: s.doctor, whom: s.whom, rel: s.rel, patient: s.patient, phone: s.phone };
        if (s.confirm === 'change') { bot.startFlow('book', keep); return; }
        var tx = TBY[s.treatment], p = s.slot.split('|'), d = DBY[p[0]], l = BK(bot);
        if (!isFree(l, tx.id, d.id, p[1], p[2])) { S(bot, 'Sorry, that slot has just been taken. Let me show you what is still free.'); keep.doctor = s.doctor; bot.startFlow('book', keep); return; }
        var num = 1042 + l.length, ref; do { ref = 'CL-' + (num++); } while (byRef(l, ref));
        var b = { ref: ref, tid: tx.id, doc: d.id, iso: p[1], time: p[2], n: tx.n, patient: s.patient, whom: s.whom, rel: s.rel || '', phone: s.phone, last4: s.phone.slice(-4), status: 'booked', at: Date.now(), fee: tx.fee };
        l.push(b); bot.save('bookings', l); bot.mem.lastRef = ref; bot.user.phone = s.phone; if (s.whom === 'self') bot.user.name = s.patient;
        bot.lead({ name: s.patient, phone: s.phone, intent: 'book', payload: { ref: ref, treatment: tx.name, doctor: d.name, date: p[1], time: p[2], forWhom: s.whom === 'other' ? 'someone else' + (s.rel ? ' (' + s.rel + ')' : '') : 'self', fee: tx.fee } });
        bot.event('booking', { kind: 'appointment', ref: ref });
        S(bot, 'You are booked. Your reference is **' + ref + '**.' + (bot.channel === 'phone' ? '' : ' Keep it handy to reschedule or cancel.'), { cards: [bcard(b, 'Confirmed')], spoken: bot.channel === 'phone' ? sp('You are booked. Your reference is ' + ref + '. That is ' + tx.name.toLowerCase() + ' with ' + d.name + ', ' + dayLabel(b.iso) + ' at ' + fT(b.time) + ', for ' + b.patient + '. The fee is ' + rs(tx.fee) + ', paid at the clinic.') : undefined });
        sayReminders(bot, b);
        S(bot, POLICY, { buttons: [B('Directions and parking', 'say:directions'), B('What to bring', 'say:what to bring'), B('Book another', 'flow:book'), B('That’s all', 'say:bye')] });
      } },
      resched: { intent: 'reschedule', slots: [
        { name: 'lookup', ask: function (bot) { S(bot, 'Sure. What is your booking reference, like **CL-1042**, or the last 4 digits of the phone number on the booking?' + (bot.channel === 'web' ? ' (Demo tip: try CL-1042, or 4821.)' : '')); }, parse: lookupParse, hint: 'A reference looks like CL-1042. Or give me just the last 4 digits of your phone number.' },
        { name: 'bk', ask: function (bot, s) {
          var l = findBookings(bot, s.lookup), now = new Date(), up = l.filter(function (b) { return apptDate(b) > now; });
          if (!up.length) { S(bot, l.length ? 'That appointment time has already passed, so it cannot be moved.' : 'I could not find an upcoming booking for **' + s.lookup + '**. Check the reference or number and try again, or I can bring in a person.', { buttons: [B('Try again', 'flow:resched'), B('Talk to a person', 'handover'), B('Menu', 'menu')] }); bot.endFlow(); return; }
          if (up.length === 1) { bot.slots.bk = up[0].ref; bot._advance(); return; }
          S(bot, 'I found ' + up.length + ' bookings on that number. Which one?', { buttons: up.map(function (b) { return B(TBY[b.tid].btn + ' · ' + dayLabel(b.iso) + ' ' + fT(b.time), 'slot:bk=' + b.ref); }) });
        }, parse: function (t, bot, s) { var r = lookupParse(t); return r && /^CL-/.test(r) && byRef(BK(bot), r) ? r : undefined; } }
      ].concat(SLOTSTEPS).concat([
        { name: 'confirm', ask: function (bot, s) {
          var b = byRef(BK(bot), s.bk), p = s.slot.split('|');
          S(bot, 'Move **' + b.ref + '** from ' + dayLabel(b.iso, true) + ' at ' + fT(b.time) + ' to **' + dayLabel(p[1], true) + ' at ' + fT(p[2]) + '** with ' + DBY[p[0]].name + '? Your old slot is released. ' + POLICY, { buttons: [B('Yes, move it', 'slot:confirm=yes'), B('Pick another time', 'slot:confirm=change'), B('No, keep the old time', 'slot:confirm=no')] });
        }, parse: ynParse }
      ]), done: function (bot, s) {
        var l = BK(bot), b = byRef(l, s.bk);
        if (s.confirm === 'no') { S(bot, 'No problem, **' + b.ref + '** stays at ' + dayLabel(b.iso, true) + ' at ' + fT(b.time) + '.'); bot.menu('Anything else?'); return; }
        if (s.confirm === 'change') { bot.startFlow('resched', { lookup: s.lookup, bk: s.bk }); return; }
        var p = s.slot.split('|'), old = dayLabel(b.iso, true) + ' at ' + fT(b.time);
        if (!isFree(l, b.tid, p[0], p[1], p[2])) { S(bot, 'Sorry, that slot has just been taken. Let me show you what is still free.'); bot.startFlow('resched', { lookup: s.lookup, bk: s.bk }); return; }
        b.doc = p[0]; b.iso = p[1]; b.time = p[2]; b.rescheduled = (b.rescheduled || 0) + 1; bot.save('bookings', l); bot.mem.lastRef = b.ref; bot.event('booking', { kind: 'reschedule', ref: b.ref });
        S(bot, 'Done. **' + b.ref + '** is now ' + dayLabel(b.iso, true) + ' at ' + fT(b.time) + ', and ' + old + ' is free again for someone else.', { cards: [bcard(b, 'Rescheduled')] });
        S(bot, 'Here is a **preview** of the updated reminders. It is simulated, so nothing is actually sent.', { cards: reminderCards(b) });
        S(bot, POLICY, { buttons: [B('Directions and parking', 'say:directions'), B('That’s all', 'say:bye')] });
      } },
      cancel: { intent: 'cancel_appt', slots: [
        { name: 'lookup', ask: function (bot) { S(bot, 'Okay. What is your booking reference, like **CL-1042**, or the last 4 digits of the phone number on the booking?' + (bot.channel === 'web' ? ' (Demo tip: try CL-1043, or 4821.)' : '')); }, parse: lookupParse, hint: 'A reference looks like CL-1042. Or give me just the last 4 digits of your phone number.' },
        { name: 'bk', ask: function (bot, s) {
          var l = findBookings(bot, s.lookup), now = new Date(), up = l.filter(function (b) { return apptDate(b) > now; });
          if (!up.length) { S(bot, l.length ? 'That appointment time has already passed.' : 'I could not find an upcoming booking for **' + s.lookup + '**. Check the reference or number and try again, or I can bring in a person.', { buttons: [B('Try again', 'flow:cancel'), B('Talk to a person', 'handover'), B('Menu', 'menu')] }); bot.endFlow(); return; }
          if (up.length === 1) { bot.slots.bk = up[0].ref; bot._advance(); return; }
          S(bot, 'I found ' + up.length + ' bookings on that number. Which one?', { buttons: up.map(function (b) { return B(TBY[b.tid].btn + ' · ' + dayLabel(b.iso) + ' ' + fT(b.time), 'slot:bk=' + b.ref); }) });
        }, parse: function (t, bot) { var r = lookupParse(t); return r && /^CL-/.test(r) && byRef(BK(bot), r) ? r : undefined; } },
        { name: 'confirm', ask: function (bot, s) {
          var b = byRef(BK(bot), s.bk), hrs = (apptDate(b) - new Date()) / HOUR;
          S(bot, 'This is the booking.', { cards: [bcard(b)] });
          S(bot, 'Cancel **' + b.ref + '**? ' + (hrs >= 4 ? 'Our policy is free cancellation up to 4 hours before, and this one is further away than that, so there is no charge.' : 'Our policy is free cancellation up to 4 hours before, and this one starts sooner, so a late fee of ₹200 may apply at the front desk.'), { buttons: [B('Yes, cancel it', 'slot:confirm=yes'), B('Move it instead', 'slot:confirm=change'), B('No, keep it', 'slot:confirm=no')] });
        }, parse: ynParse }
      ], done: function (bot, s) {
        var l = BK(bot), b = byRef(l, s.bk);
        if (s.confirm === 'no') { S(bot, 'Okay, **' + b.ref + '** stays as it is.'); bot.menu('Anything else?'); return; }
        if (s.confirm === 'change') { bot.startFlow('resched', { lookup: s.lookup, bk: s.bk }); return; }
        b.status = 'cancelled'; b.cancelledAt = Date.now(); bot.save('bookings', l); bot.event('action', { action: 'cancel_appointment', ref: b.ref });
        S(bot, 'Done. **' + b.ref + '** (' + TBY[b.tid].name.toLowerCase() + ', ' + dayLabel(b.iso, true) + ' at ' + fT(b.time) + ') is cancelled and the slot is free again. A cancellation message is on its way to you.', { buttons: [B('Book another time', 'flow:book'), B('That’s all', 'say:bye')] });
      } }
    },
    actions: {
      bookdoc: function (bot, id) { var d = DBY[id]; bot.startFlow('book', d.tx.length === 1 ? { doctor: id, treatment: d.tx[0] } : { doctor: id }); },
      booktx: function (bot, id) { bot.startFlow('book', { treatment: id }); },
      bookgen: function (bot) { bot.startFlow('book', { treatment: 'general' }); },
      next: function (bot, id) { showNext(bot, id, 'any'); },
      nextdoc: function (bot, id) { showNext(bot, DBY[id].tx[0], id); },
      resume: function (bot) { var r = bot._rs; if (r) bot.startFlow(r.flow, r.slots); else bot.menu(); },
      docs: function (bot, id) { var el = eligible(id); R(bot, el.length + ' doctor' + (el.length === 1 ? '' : 's') + ' offer' + (el.length === 1 ? 's' : '') + ' the ' + TBY[id].name.toLowerCase() + '.', { cards: el.map(docCard) }); },
      profile: function (bot, id) { profile(bot, DBY[id]); },
      pick: function (bot, arg) { var a = arg.split('|'); bot.startFlow('book', { treatment: a[0], doctor: a[1], day: a[2], slot: a[1] + '|' + a[2] + '|' + a[3] }); },
      dayof: function (bot, arg) { var a = arg.split('|'); bot.startFlow('book', { treatment: a[0], doctor: a[1], day: a[2] }); },
      otherday: function (bot) { delete bot.slots.day; delete bot.slots.part; delete bot.slots.time; delete bot.slots.slot; bot._advance(); },
      resch: function (bot, ref) { bot.startFlow('resched', { lookup: ref }); },
      cancel: function (bot, ref) { bot.startFlow('cancel', { lookup: ref }); },
      reminder: function (bot, ref) { var b = ref === 'sample' ? byRef(BK(bot), 'CL-1042') || BK(bot).filter(function (x) { return x.status === 'booked'; })[0] : byRef(BK(bot), ref); if (!b) { S(bot, 'I do not have a booking to preview yet. Book one and I will show it.', { buttons: [B('Book an appointment', 'flow:book')] }); return; } sayReminders(bot, b, ref === 'sample' ? 'Here is a **preview** for a sample booking. It is simulated, so nothing is actually sent.' : null); }
    },
    kb: [
      { id: 'hours', q: 'What are your opening hours?', a: 'We are open Monday to Saturday, 8 am to 8 pm, and Sunday 9 am to 1 pm. Each doctor keeps their own days, so I always show real free slots when you book.', keys: ['opening hours', 'working hours', 'clinic hours', 'timings', 'what time do you open', 'what time do you close', 'closing time', 'open on sunday', 'sunday timings', 'when are you open', 'open today'], buttons: [B('Book an appointment', 'flow:book'), B('Menu', 'menu')] },
      { id: 'insurance', q: 'Do you accept insurance and cashless claims?', a: 'Yes. We take cashless claims from most major insurers and corporate health plans on the panel list at the front desk. Bring your insurance card and a photo ID, and tell us a day ahead for planned visits so approval is ready. If your insurer is not on our panel you can pay at the clinic and we give an itemised invoice for reimbursement.', keys: ['insurance', 'cashless', 'mediclaim', 'tpa', 'health insurance', 'insurer', 'panel', 'corporate plan', 'reimbursement', 'claim'] },
      { id: 'directions', q: 'Where are you and where can I park?', a: 'Calder Clinic is on the second floor of Calder Arcade, Meridian Road, next to the pharmacy with the green awning. There is a lift from the basement. Parking: the basement is free for patients for two hours, and reception validates your ticket.', keys: ['directions', 'address', 'location', 'where are you', 'where is the clinic', 'how to reach', 'how do i get there', 'parking', 'park', 'landmark', 'map', 'find you'] },
      { id: 'bring', q: 'What should I bring?', a: 'Please bring a photo ID, your insurance card if you have one, any earlier reports or prescriptions, and a list of what you currently take. Arrive 10 minutes early. For packages, the front desk confirms any preparation and it is included in your reminder.', keys: ['what to bring', 'what should i bring', 'what do i need to bring', 'documents', 'bring with me', 'carry', 'what to carry', 'arrive early'] },
      { id: 'reports', q: 'How are reports shared?', a: 'Reports are shared securely by SMS or email link as soon as they are ready, usually within 24 hours for routine tests and 48 hours for scans. You can also collect a printed copy at the front desk. Your doctor reviews them with you; I cannot explain results.', keys: ['how are reports shared', 'receive my report', 'report delivery', 'get my reports', 'download report', 'when will reports be ready', 'collect my report', 'share reports'] },
      { id: 'payment', q: 'How can I pay?', a: 'Payment is at the clinic after your visit: cash, UPI and all major cards. Fees include GST and you receive an itemised invoice by email or print.', keys: ['payment', 'how to pay', 'pay', 'upi', 'card payment', 'cash', 'invoice', 'receipt', 'gst bill'] },
      { id: 'policy', q: 'What is your cancellation policy?', a: 'Cancelling or rescheduling is free up to 4 hours before your appointment. Inside 4 hours, or if you do not arrive, a late fee of ₹200 may apply. I can cancel or move a booking for you right now.', keys: ['cancellation policy', 'cancel policy', 'cancellation fee', 'no show', 'late cancellation', 'late fee', 'reschedule policy'], buttons: [B('Reschedule', 'intent:reschedule'), B('Cancel a booking', 'intent:cancel_appt'), B('Menu', 'menu')] },
      { id: 'languages', q: 'Which languages do your doctors speak?', a: 'Between them our doctors speak English, Hindi, Telugu, Tamil, Malayalam, Marathi, Gujarati and Bengali. Each doctor profile lists their languages, and you can ask for one when you book.', keys: ['language', 'languages', 'speak hindi', 'speak tamil', 'speak telugu', 'speak malayalam', 'speak marathi', 'speak bengali', 'speak gujarati', 'english speaking'], buttons: [B('See our doctors', 'intent:doctors'), B('Menu', 'menu')] },
      { id: 'walkin', q: 'Do you take walk-ins or run emergency services?', a: 'We are an outpatient clinic, so we do not run emergency services. For an emergency please call your local emergency number or go to the nearest emergency department. Walk-ins are welcome when a doctor is free, but booking is the surest way to avoid a wait.', keys: ['walk in', 'walk-in', 'walkin', 'without appointment', 'without booking', 'no appointment', 'open 24 hours', 'late night', 'emergency services', 'emergency department', 'emergency room', 'emergency care'] },
      { id: 'access', q: 'Is the clinic accessible, and do you see children?', a: 'Yes. There is step-free access, a lift and an accessible restroom. Children can be booked like anyone else, using the parent’s phone number, and under 12s must come with a parent or guardian.', keys: ['wheelchair', 'accessible', 'accessibility', 'lift', 'elderly', 'senior citizen', 'children', 'kids', 'child'] },
      { id: 'video', q: 'Do you offer video consultations?', a: 'Not in this demo. Every visit is in the clinic. If you cannot travel, tell a person and they can note it for the doctor.', keys: ['video consult', 'online consultation', 'teleconsult', 'video call', 'consult online', 'telehealth'], buttons: [B('Talk to a person', 'handover'), B('Menu', 'menu')] }
    ],
    freeText: function (bot, m) {
      var e = m.ent; if (e.doctor && !treatmentFrom(m.norm) && !e.day && !e.time && !e.part) { profile(bot, DBY[e.doctor]); return true; }
      if (e.treatment || e.doctor || e.day || e.time || e.part) { bot.startFlow('book', bot._preset('book', e)); return true; } return false;
    }
  });
})();
