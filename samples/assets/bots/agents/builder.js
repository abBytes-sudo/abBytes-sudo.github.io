/* Sthira site desk: the scripted assistant for Sthira Design-Build (samples/build). Rule-based, no LLM, no network calls.
   It reads the firm's own data from window.STHIRA (build/data.js): city cost factors, spec tiers, stages, the live project
   STH-2611, weekly updates, payments, snags, jobs, projects and services. The estimate uses the same formula as
   build/estimate.js, so the chat and the estimator always agree. Portal state ('sthira:portal') is read for live status.
   Every completed estimate, survey booking and handover writes a lead with bot.lead() ('orbit-leads') and pushes the same
   lead into 'sthira:inbox' (newest first), which the back office pipeline imports. Loaded lazily by build/concierge.js. */
(function () {
  'use strict';
  var O = window.Orbit; if (!O || O.agents.builder) return;
  var N = O.nlp;
  var B = function (l, v) { return { label: l, value: v }; };
  function D() { return window.STHIRA || null; }
  // the site runs on a fixed clock
  var NOW = new Date('2026-11-24T10:30:00');
  var SLOTS = ['09:00', '10:30', '12:00', '15:00', '16:30'];
  var FL = ['G', 'G+1', 'G+2', 'G+3', 'G+4'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nice(s) { return O.fmtDay(new Date(s + 'T00:00')); }
  function t12(hhmm) { var p = hhmm.split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + (h < 12 ? ' am' : ' pm'); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function sqft(n) { return Math.round(n).toLocaleString('en-IN'); }
  function inr(n) { var d = D(); return d ? d.inr(n) : '₹' + Math.round(n).toLocaleString('en-IN'); }
  function cap1(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function cap(s) { return String(s).replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function img(p) { return O.samples('build/photos/' + p + '-s.jpg'); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function portal() { var p = lsGet('sthira:portal', {}) || {}; ['paid', 'snagStatus', 'co'].forEach(function (k) { p[k] = p[k] || {}; }); ['snags', 'updates'].forEach(function (k) { p[k] = p[k] || []; }); return p; }
  function digits(p) { return String(p || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
  function fmtPhone(p) { var d = digits(p); return d.length === 10 ? '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) : String(p || ''); }
  function mask(p) { var d = digits(p); return d.length === 10 ? d.slice(0, 2) + '••• ••' + d.slice(-3) : ''; }

  /* ---------- the estimate: the same formula as build/estimate.js ---------- */
  function cityById(id) { var d = D(); return d ? d.CITIES.filter(function (c) { return c.id === id; })[0] : null; }
  function tierById(id) { var d = D(); return d ? d.TIERS.filter(function (t) { return t.id === id; })[0] : null; }
  function calc(s) {
    var city = cityById(s.city), tier = tierById(s.tier), x = s.x || [];
    var rate = tier.rate * city.k * (s.type === 'commercial' ? 1.06 : 1) * (1 + Math.max(0, s.floors - 2) * 0.025);
    var build = rate * s.area, extras = [], plate = s.area / s.floors;
    if (x.indexOf('basement') > -1) extras.push(['Basement (one level)', plate * 2400 * city.k]);
    if (x.indexOf('lift') > -1) extras.push(['Passenger lift, ' + (s.floors + 1) + ' stops', 900000 + s.floors * 85000]);
    if (x.indexOf('interiors') > -1) extras.push(['Interiors and joinery', s.area * tier.int * city.k * 0.85]);
    if (x.indexOf('solar') > -1) extras.push(['Rooftop solar, 5 kW', 340000]);
    if (x.indexOf('landscape') > -1) extras.push(['Landscape', Math.max(250000, plate * 0.6 * 420)]);
    if (x.indexOf('design') > -1) extras.push(['Design and approvals', build * 0.045]);
    var total = build + extras.reduce(function (a, e) { return a + e[1]; }, 0);
    var w = { design: x.indexOf('design') > -1 ? 10 : 0, found: 4 + Math.ceil(plate / 1500) + (x.indexOf('basement') > -1 ? 6 : 0), frame: s.floors * 3 + 1, walls: 4 + Math.ceil(s.area / 1800), mep: 8 + Math.ceil(s.area / 1500), facade: 4 + Math.ceil(s.floors * 0.8), finish: 8 + Math.ceil(s.area / 1400) + (x.indexOf('interiors') > -1 ? 6 : 0), land: x.indexOf('landscape') > -1 ? 4 : 2 };
    var tasks = [];
    function add(name, start, len, hv) { tasks.push({ name: name, s: start, l: len, hv: hv }); return start + len; }
    var a = add('Design and approvals', 0, w.design, false), b = add('Foundation', a, w.found), c = add('Frame: columns and slabs', b, w.frame), d = add('Walls', c - 1, w.walls), e = add('MEP rough-in', d - Math.ceil(w.walls / 2), w.mep);
    add('Windows and facade', d, w.facade); var g = add('Flooring and finishes', e - 3, w.finish), h = add('Landscape, snag, handover', g - 1, w.land + 2, true);
    var months = Math.ceil(h / 4.33);
    return { rate: rate, total: total, build: build, extras: extras, tasks: tasks, weeks: h, months: months, city: city, tier: tier, lo: total * 0.94, hi: total * 1.08, hand: new Date(2026, 11 + months, 1) };
  }
  function range(lo, hi) { if (hi >= 1e7) return '₹' + (lo / 1e7).toFixed(2) + '–' + (hi / 1e7).toFixed(2) + ' Cr'; return '₹' + Math.round(lo / 1e5) + '–' + Math.round(hi / 1e5) + ' L'; }
  function xFor(kind) { return kind === 'turnkey' ? ['design', 'interiors', 'landscape'] : []; }
  function typeFor(kind) { return kind === 'commercial' ? 'commercial' : 'home'; }
  function kindLabel(k) { return { home: 'home', commercial: 'commercial building', turnkey: 'turnkey home', interiors: 'fit-out' }[k] || 'home'; }
  function estUrl(s) { return 'estimate.html?c=' + s.city + '&t=' + typeFor(s.kind) + '&a=' + s.area + '&f=' + s.floors + '&s=' + s.tier + (xFor(s.kind).length ? '&x=' + xFor(s.kind).join(',') : ''); }

  /* ---------- parsing ---------- */
  var CITY_RE = [['blr', /\b(bengaluru|bangalore|blr|bengalooru|whitefield|hsr|koramangala|indiranagar|jp nagar|sarjapur|yelahanka|hebbal|electronic city|kanakapura)\b/i], ['pune', /\b(pune|poona|baner|wakad|hinjewadi|kothrud|bavdhan|kharadi)\b/i], ['hyd', /\b(hyderabad|hyd|secunderabad|gachibowli|kondapur|jubilee hills|banjara hills|tolichowki|kukatpally)\b/i], ['mys', /\b(mysuru|mysore|bogadi|vijayanagar|kuvempunagar)\b/i], ['chn', /\b(chennai|madras|adyar|anna nagar|velachery)\b/i], ['mum', /\b(mumbai|bombay|thane|navi mumbai|mmr)\b/i], ['ncr', /\b(delhi|ncr|gurgaon|gurugram|noida)\b/i]];
  function cityFrom(t) { for (var i = 0; i < CITY_RE.length; i++) if (CITY_RE[i][1].test(t)) return CITY_RE[i][0]; }
  function cityName(id) { var c = cityById(id); return c ? c.name : id; }
  function plotFrom(t, loose) {
    t = String(t).toLowerCase().replace(/(\d),(?=\d)/g, '$1'); var m;
    if ((m = t.match(/(\d{2,3})\s*(?:x|×|\*|by)\s*(\d{2,3})(?!\s*(?:m\b|mt|metre|meter))/))) return +m[1] * +m[2];
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:cents?)\b/))) return Math.round(+m[1] * 435.6);
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:grounds?)\b/))) return Math.round(+m[1] * 2400);
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:guntha|gunta)s?\b/))) return Math.round(+m[1] * 1089);
    if ((m = t.match(/(\d+(?:\.\d+)?)\s*(?:sq\.?\s?yd|sq\.?\s?yards?|square yards?|gaj|gajam)\b/))) return Math.round(+m[1] * 9);
    var a = N.area(t);
    if (a && (loose || /\b(plot|site|land|zameen|jameen)\b/.test(t))) return a;
    if (loose && (m = t.match(/^\s*(\d{3,5})\s*$/))) return +m[1];
  }
  function areaFrom(t, loose) {
    var s = String(t).toLowerCase().replace(/(\d),(?=\d)/g, '$1'), m;
    if ((m = s.match(/(\d+(?:\.\d+)?)\s*k\s*(?:sq\.?\s?ft|sqft|sft)?\b/)) && (loose || /built|bua|construct|carpet|super/.test(s))) return Math.round(+m[1] * 1000);
    var a = N.area(s);
    if (a && (loose || /\b(built.?up|builtup|bua|construction area|built area|total area|carpet)\b/.test(s))) return a;
    if (loose && (m = s.match(/^\s*(?:about|around|approx\w*)?\s*(\d{3,5})\s*$/))) return +m[1];
  }
  function floorsFrom(t) {
    var s = String(t).toLowerCase(), m;
    if ((m = s.match(/\bg\s*\+\s*(\d)\b/)) || (m = s.match(/\bground\s*(?:\+|plus)\s*(\d|one|two|three|four)\b/))) { var n = N.wordNum(m[1]); return n >= 0 && n <= 4 ? n + 1 : undefined; }
    if (/\b(ground floor only|single.?stor(e)?y|only ground|just ground|bungalow|g only)\b/.test(s) || /^\s*g\s*$/.test(s)) return 1;
    if (/\bduplex\b/.test(s)) return 2;
    if ((m = s.match(/\b(\d|one|two|three|four|five)\s*(?:floors?|stor(?:e)?ys?|levels?|manzil|maale)\b/))) { var k = N.wordNum(m[1]); return k >= 1 && k <= 5 ? k : undefined; }
  }
  function tierFrom(t) { t = String(t).toLowerCase(); if (/\b(essential|basic|standard|economy|budget spec|simple|sasta)\b/.test(t)) return 'essential'; if (/\b(signature|premium|mid|better|good quality)\b/.test(t)) return 'signature'; if (/\b(bespoke|luxury|luxurious|high.?end|top|best)\b/.test(t)) return 'bespoke'; }
  function kindFrom(t) { t = String(t).toLowerCase(); if (/\b(turnkey|furnished|ready to move|move.?in ready)\b/.test(t)) return 'turnkey'; if (/\b(interiors?|fit.?out|modular kitchen|wardrobes?)\b/.test(t)) return 'interiors'; if (/\b(office|commercial|showroom|warehouse|clinic|hospital|shop|retail|school|godown|factory)\b/.test(t)) return 'commercial'; if (/\b(home|house|villa|ghar|makaan|makan|residence|bungalow|duplex|rental)\b/.test(t)) return 'home'; }
  function hing(t) { return String(t).replace(/\bkal\b/gi, 'tomorrow').replace(/\baaj\b/gi, 'today').replace(/\bpars[oe]n?\b/gi, 'day after tomorrow').replace(/\bsubah?\b/gi, 'morning').replace(/\bsha?am\b/gi, 'evening').replace(/\bd[ou]pahar\b/gi, 'afternoon').replace(/\b(\d{1,2})\s*baje\b/gi, function (m, h) { h = +h; return h + (h >= 7 && h <= 11 ? ' am' : ' pm'); }); }
  function dayFrom(t) { var w = N.when(hing(t), NOW); return w && w.iso; }
  function timeFrom(t) {
    var s = hing(t), w = N.when(s, NOW), tm = w && w.time;
    if (!tm) { var m = s.match(/\b(\d{1,2})[:.](\d{2})\b/); if (m) { var h = +m[1]; if (h < 8) h += 12; tm = pad(h) + ':' + m[2]; } }
    if (!tm && w && w.timeAmbiguous) { var h2 = w.timeAmbiguous; tm = pad(h2 < 8 ? h2 + 12 : h2) + ':00'; }
    if (!tm) { if (/\bmorning\b/i.test(s)) tm = '09:00'; else if (/\b(noon|lunch)\b/i.test(s)) tm = '12:00'; else if (/\bafternoon\b/i.test(s)) tm = '15:00'; else if (/\bevening\b/i.test(s)) tm = '16:30'; }
    if (!tm) return; var mins = +tm.slice(0, 2) * 60 + +tm.slice(3), best = SLOTS[0], bd = 1e9;
    SLOTS.forEach(function (x) { var d = Math.abs(+x.slice(0, 2) * 60 + +x.slice(3) - mins); if (d < bd) { bd = d; best = x; } }); return best;
  }
  function codeFrom(t, loose) { var m = String(t).match(/\bSTH[-\s]?(\d{3,5})\b/i) || (loose && String(t).match(/^\s*#?(\d{4})\s*$/)); return m ? 'STH-' + m[1] : undefined; }
  function nameFrom(t) { var n = N.name(t) || String(t).trim(); return n.length >= 2 && n.length <= 40 && !/\d/.test(n) && /^[a-z .'-]+$/i.test(n) && !/\b(yes|no|ok|okay|skip|later|why|what|how)\b/i.test(n) ? cap(n.toLowerCase()).slice(0, 40) : undefined; }

  /* ---------- working days for site surveys: the next 10, no Sundays ---------- */
  function workDays() { var out = [], d = new Date(NOW); d.setHours(0, 0, 0, 0); while (out.length < 10) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) out.push(iso(d)); } return out; }
  function takenSlots() {
    var t = (lsGet('orbit-data-builder-surveys', null) || []).map(function (x) { return x.slot; }), d = D(), crm = lsGet('sthira:crm', null), inbox = lsGet('sthira:inbox', []) || [];
    var leads = (d ? d.LEADS : []).concat(crm && crm.leads || [], inbox);
    leads.forEach(function (l) { if (l && l.survey && l.survey.when) t.push(String(l.survey.when).slice(0, 10) + ' ' + String(l.survey.when).slice(11, 16)); });
    return t;
  }
  function freeSlots(day) { var tk = takenSlots(); return SLOTS.filter(function (s) { return tk.indexOf(day + ' ' + s) < 0; }); }
  var why = null; // the reason a typed day or time was refused, read once by the slot hint
  var ENG = { blr: 'Karthik Gowda', mys: 'Karthik Gowda', hyd: 'Nikhil Menon', chn: 'Nikhil Menon', pune: 'Rhea Fernandes', mum: 'Rhea Fernandes', ncr: 'Rhea Fernandes' };

  /* ---------- leads: orbit-leads and the back office inbox ---------- */
  var TYPE = { home: 'Residential', commercial: 'Commercial', interiors: 'Interiors', turnkey: 'Turnkey' };
  function nextId() {
    var crm = lsGet('sthira:crm', null), d = D(), all = (lsGet('sthira:inbox', []) || []).concat(crm && crm.leads || [], d ? d.LEADS : []), mx = 2311;
    all.forEach(function (l) { var m = l && String(l.id).match(/^L-(\d+)$/); if (m && +m[1] > mx && +m[1] < 9000) mx = +m[1]; });
    return 'L-' + (mx + 1);
  }
  function record(bot, o) {
    var inboxLead = null;
    try {
      var inbox = lsGet('sthira:inbox', []); if (!Array.isArray(inbox)) inbox = [];
      var at = new Date(NOW.getTime() + inbox.length * 60000);
      inboxLead = { id: nextId(), name: o.name || bot.user.name || 'Chat visitor', phone: o.phone ? fmtPhone(o.phone) : (bot.user.phone ? fmtPhone(bot.user.phone) : ''), email: bot.user.email || '', city: o.city ? cityName(o.city) : '', loc: o.loc || '', type: TYPE[o.kind] || 'Residential', area: o.area || '', floors: o.floors ? FL[o.floors - 1] : '', budget: o.budget || '', source: 'Chat', stage: 'enquiry', at: at.toISOString(), fresh: true, owner: 'Farah', next: o.next || 'Call back within 4 working hours', due: new Date(at.getTime() + 4 * 3600e3).toISOString(), note: o.note, convo: bot.id };
      if (o.survey) inboxLead.survey = o.survey;
      if (o.estimate) inboxLead.estimate = o.estimate;
      inbox.unshift(inboxLead); lsSet('sthira:inbox', inbox);
    } catch (e) { inboxLead = null; }
    var payload = { kind: o.what, city: o.city ? cityName(o.city) : '', loc: o.loc || '', type: TYPE[o.kind] || 'Residential', area: o.area || '', floors: o.floors ? FL[o.floors - 1] : '', budget: o.budget || '', note: o.note, convo: bot.id, inboxId: inboxLead ? inboxLead.id : null };
    if (o.survey) payload.survey = o.survey;
    var r = bot.lead({ name: o.name || bot.user.name || 'Chat visitor', phone: o.phone || bot.user.phone || '', intent: o.what, payload: payload });
    try { O.convos.setStatus(bot.id, bot.convo.status, { inboxId: inboxLead ? inboxLead.id : null, leadId: r.id, topic: o.what }); } catch (e) {}
    bot.mem.leads = (bot.mem.leads || []).concat(inboxLead ? [inboxLead.id] : []);
    return inboxLead || { id: r.id };
  }

  /* ---------- live project ---------- */
  var EVENTS = [
    { at: '2026-11-26T08:30', t: 'Third-floor blockwork starts' },
    { at: '2026-11-27T18:00', t: 'Weekly photo report, week 25' },
    { at: '2026-11-28T11:00', t: 'Balcony railing walk-through with Karthik, first floor', visit: true },
    { at: '2026-12-01T09:00', t: 'Plumbing sleeves through the terrace slab' }
  ];
  function evDay(e) { var d = new Date(e.at); return O.fmtDay(d) + ', ' + t12(e.at.slice(11, 16)); }
  function status(bot, code) {
    var d = D(); if (!d) { bot.say('The project records are still loading. Try again in a moment.', { buttons: [B('Try again', 'act:status:' + code)] }); return; }
    var L = d.LIVE;
    if (code !== L.id) {
      bot.say('I can’t find **' + code + '**. Project codes are on page 1 of your contract and at the top of your portal, STH- and four digits. If you’ve just signed, the code goes live the day we mobilise.', { buttons: [B('Try another code', 'flow:status'), B('Talk to a person', 'handover'), B('Open the client portal', 'act:go:portal.html')] });
      return;
    }
    var P = portal(), weeks = P.updates.concat(d.WEEKS).sort(function (a, b) { return b.day - a.day; }), wk = weeks[0];
    var stage = d.STAGES.filter(function (s) { return s.key === L.stage; })[0];
    var next = d.PAYMENTS.filter(function (m) { return !P.paid[m.n] && m.status !== 'paid'; })[0];
    var snags = P.snags.concat(d.SNAGS).map(function (s) { return { id: s.id, title: s.title, status: P.snagStatus[s.id] || s.status }; }).filter(function (s) { return s.status !== 'fixed'; });
    var ev = EVENTS.filter(function (e) { return new Date(e.at) > NOW; }), visit = ev.filter(function (e) { return e.visit; })[0];
    var hand = new Date(L.handover + 'T00:00'), hd = hand.getDate() + ' ' + MONTHS[hand.getMonth()] + ' ' + hand.getFullYear();
    bot.mem.code = code;
    var wd = new Date(String(wk.date).slice(0, 10) + 'T00:00');
    var meta = ['Last update, week ' + wk.w + ': ' + wk.title, next ? 'Next payment: M' + next.n + ', ' + next.name.toLowerCase() + ' · ' + inr(L.value * next.pct / 100) + (next.status === 'due' ? ' due ' : ' on ') + O.fmtDay(new Date(next.date + 'T00:00')) : 'All milestones paid to date', ev[0] ? 'Next on site: ' + evDay(ev[0]) + ' · ' + ev[0].t : 'Next on site: weekly report on Friday', snags.length + ' open item' + (snags.length === 1 ? '' : 's') + ' on the snag list'];
    bot.say('**' + L.id + ' · ' + L.name + '**, ' + L.plot.split(',').slice(2, 3).join('').trim() + '. ' + (stage ? stage.name : 'Walls') + ', ' + L.stagePct + '% through the stage. Day ' + L.day + ' of ' + L.total + ', on track for keys on ' + hd + '.' + (visit ? ' Your visit: ' + evDay(visit) + ', ' + visit.t.split(' with ')[0].toLowerCase() + '.' : ''), {
      cards: [
        { title: L.name, sub: (stage ? stage.name : '') + ' · ' + L.stagePct + '% · ' + L.type, img: img(wk.photo), badge: 'Week ' + wk.w + ' · ' + wd.getDate() + ' ' + MONTHS[wd.getMonth()], tag: L.id, meta: meta, buttons: [B('Open the client portal', 'act:go:portal.html'), B('What’s on the snag list?', 'act:snags')] },
        { title: 'Day ' + L.day + ' of ' + L.total, sub: Math.round(L.day / L.total * 100) + '% of the programme · keys ' + hd, badge: 'Programme', meta: d.STAGES.filter(function (s) { return s.day[1] > 0; }).map(function (s) { return s.name + ' · day ' + s.day[0] + '–' + s.day[1]; }) }
      ], buttons: [B('Next payment details', 'act:pay'), B('Open snags', 'act:snags'), B('Talk to Farah (PM)', 'handover')] });
  }

  var MENU = [B('Estimate my build', 'flow:estimate'), B('Book a free site survey', 'intent:survey'), B('Where is my project?', 'intent:status'), B('Our projects', 'intent:projects'), B('Careers', 'intent:careers'), B('Rates and services', 'intent:services')];
  function go(bot, url) {
    bot.say('Opening it for you…', { delay: 250 }); try { sessionStorage.setItem('cg-reopen-builder', '1'); } catch (e) {}
    setTimeout(function () { var u = O.samples('build/' + url), a = document.createElement('a'); a.href = u; if (a.pathname === location.pathname && a.search === location.search) { location.hash = a.hash; location.reload(); } else location.href = u; }, 800);
  }
  function jobCard(j) { return { title: j.title, sub: j.city + ' · ' + j.team, badge: j.exp, price: j.pay + ' / a year', meta: [j.type, j.must[0]], buttons: [B('Read the role and apply', 'act:go:careers.html#' + j.id), B('How the interview works', 'say:interview process')] }; }
  function projCard(p) { var T = { residential: 'Residential', commercial: 'Commercial', interiors: 'Interiors', turnkey: 'Turnkey' }; return { title: p.name, sub: p.loc + ', ' + p.city + ' · ' + p.year, img: img(p.photo), badge: T[p.type], price: p.value + ' / contract', meta: [sqft(p.area) + ' sq ft · ' + p.floors, p.months + ' months on site', p.tag], buttons: [B('Open the case study', 'act:go:project-' + p.id + '.html'), B(p.type === 'interiors' ? 'Price a fit-out like it' : 'Price one like it', 'act:like:' + p.id)] }; }
  function projById(id) { var d = D(); return d && id ? d.PROJECTS.filter(function (p) { return p.id === id; })[0] : null; }
  function cityIdFromName(n) { return cityFrom(n || '') || 'blr'; }

  O.registerAgent({
    id: 'builder', name: 'Sthira site desk', business: 'Sthira', role: 'Estimates, site surveys and project status', industry: 'Design and build', initials: 'S', accent: '#1F4FD8', phoneLabel: 'Sthira site desk',
    blurb: 'Sthira’s site desk in chat: prices a build from the plot and floors, books a free site survey with an engineer, reads a live project’s stage, photo and next payment, and lists the open roles.',
    helloLine: 'I can price a build, book a free site survey, or pull up a live project.',
    samples: ['G+2 on a 30x40 plot in Bengaluru, kitna kharcha?', 'site survey kal subah', 'where is my project STH-2611', 'site engineer jobs in Bengaluru'],
    kind: 'customer', menu: MENU,
    contexts: [{ label: 'Home page', context: { page: 'home' } }, { label: 'Estimator', context: { page: 'estimate' } }, { label: 'Case study: Menon Residence', context: { page: 'project', id: 'menon-residence' } }, { label: 'Client portal', context: { page: 'portal' } }, { label: 'Careers', context: { page: 'careers' } }],
    synonyms: {
      'how much': ['kitna kharcha', 'kitna kharch', 'kharcha kitna', 'kitna lagega', 'kitne ka', 'kitne mein', 'kitna paisa', 'kitna hoga', 'cost kitna'],
      'build a house': ['ghar banana hai', 'ghar banwana hai', 'ghar banana', 'ghar banwana', 'makaan banana', 'makan banana', 'ghar bana do', 'naya ghar'],
      'how long': ['kab tak', 'kitna time', 'kitne din', 'kitne mahine', 'kitna samay', 'kab milega'],
      'where is my project': ['mera project', 'kaam kahan tak', 'kitna kaam hua', 'project kahan tak', 'kaam kaisa chal raha', 'mera ghar kahan tak'],
      'job': ['naukri', 'vacancy', 'vacancies'],
      'site survey': ['plot dekhne', 'site dekhne', 'survey karwana', 'plot visit', 'plot dekh lo'],
      'tomorrow': ['kal'], 'morning': ['subah', 'subha'], 'evening': ['shaam', 'sham'], 'afternoon': ['dopahar', 'dupahar'], 'today': ['aaj'],
      'talk to a person': ['kisi se baat karni hai', 'baat karni hai', 'engineer se baat']
    },
    seeds: { surveys: function () { return []; } },
    nudge: function (c) {
      var d = D(), p = c.page;
      if (p === 'portal' && d) return { text: 'Rao Residence is on day ' + d.LIVE.day + ' of ' + d.LIVE.total + '. Want this week’s photo, the next payment and the next site event in one card?', cta: 'Show me', button: B('Status of ' + d.LIVE.id, 'act:status:' + d.LIVE.id) };
      if (p === 'estimate') return { text: 'Rather not move sliders? Four questions and I’ll give you a ₹ range and the months on site, phase by phase.', cta: 'Estimate in chat', button: B('Estimate my build', 'flow:estimate') };
      if (p === 'projects' || p === 'project') { var pr = projById(c.id); return { text: pr ? 'Building something like ' + pr.name + '? Tell me the plot and floors and I’ll price it the same way.' : 'Building something like these? Give me the plot and floors and I’ll put a number on it.', cta: 'Price mine', button: pr ? B('Price one like it', 'act:like:' + pr.id) : B('Estimate my build', 'flow:estimate') }; }
      return { text: 'Planning a build? One line is enough: “G+2 on a 30×40 in Bengaluru”.', cta: 'Try it', button: B('Estimate my build', 'flow:estimate') };
    },
    greeting: function (bot) {
      // every handover also lands in the back office pipeline
      var h = bot.handover; bot.handover = function (reason) { var was = this.convo.status; h.call(this, reason); if (was === 'bot' && this.convo.status === 'waiting' && !this.mem.handLead) { this.mem.handLead = 1; var last = this.convo.messages.filter(function (m) { return m.from === 'user'; }).slice(-2, -1)[0], est = this.mem.est || {}; record(this, { what: 'handover', name: this.user.name, phone: this.user.phone, city: est.city || this.mem.city, kind: est.kind || 'home', area: est.area, floors: est.floors, budget: est.budget, next: 'Take over the chat in Conversations, then call back', note: (this.mem.code ? 'Client on ' + this.mem.code + '. ' : '') + 'Asked for a person' + (reason ? ' (' + String(reason).toLowerCase() + ')' : '') + (last ? '. Last said: “' + String(last.text).slice(0, 80) + '”' : '') + '.' }); } };
      var c = bot.ctx || {}, d = D(), p = c.page, hi = 'Good morning.';
      if (c.from === 'web') { bot.say('Sthira site desk, now on WhatsApp' + (c.name ? ', ' + first(c.name) : '') + '. Same numbers here, and your survey reminders and weekly reports can come to this chat.', { buttons: MENU.slice(0, 4) }); return; }
      if (p === 'project') { var pr = projById(c.id); if (pr) { bot.say(hi + ' You’re looking at **' + pr.name + '**: ' + sqft(pr.area) + ' sq ft, ' + pr.floors + ' in ' + pr.loc + ', ' + pr.months + ' months on site. Want a number for something similar on your plot?', { buttons: [B(pr.type === 'interiors' ? 'Price a fit-out like it' : 'Price one like it', 'act:like:' + pr.id), B('Book a free site survey', 'intent:survey'), B('More projects', 'intent:projects'), B('Something else', 'menu')] }); return; } }
      if (p === 'estimate') { bot.say(hi + ' You’re on the estimator. I can run the same numbers here in four questions, or explain any line of it: GST, the timeline, the payment stages.', { buttons: [B('Estimate my build', 'flow:estimate'), B('What’s included?', 'say:what is included in the rate'), B('How are payments staged?', 'say:payment schedule'), B('Book a free site survey', 'intent:survey')] }); return; }
      if (p === 'portal') { bot.say(hi + ' Site desk here. Give me your project code (STH- and four digits) and I’ll pull up the stage, this week’s photo, the next payment and the next site event.', { buttons: d ? [B('Status of ' + d.LIVE.id, 'act:status:' + d.LIVE.id), B('Open snags', 'act:snags'), B('Next payment', 'act:pay'), B('Talk to my PM', 'handover')] : MENU }); return; }
      if (p === 'projects') { bot.say(hi + ' Eight finished buildings on this page, homes to offices. Ask me for a type or a city, like “offices in Hyderabad”, or price one like it.', { buttons: [B('Homes', 'act:proj:residential'), B('Offices and commercial', 'act:proj:commercial'), B('Fit-outs', 'act:proj:interiors'), B('Estimate my build', 'flow:estimate')] }); return; }
      if (p === 'careers') { var n = d ? d.JOBS.length : 8; bot.say(hi + ' ' + n + ' open roles in Bengaluru, Pune, Hyderabad and Mysuru, plus the 2027 graduate programme. Which city?', { buttons: [B('Bengaluru', 'act:jobs:Bengaluru'), B('Pune', 'act:jobs:Pune'), B('Hyderabad', 'act:jobs:Hyderabad'), B('Mysuru', 'act:jobs:Mysuru'), B('All roles', 'act:jobs:all')] }); return; }
      if (p === 'services') { bot.say(hi + ' Rates start at **₹2,150 / sq ft** for homes, ₹2,300 for commercial, ₹1,450 for fit-outs and ₹3,350 for turnkey. Want a number for your plot?', { buttons: [B('Estimate my build', 'flow:estimate'), B('What’s in each spec?', 'say:materials and spec'), B('Book a free site survey', 'intent:survey')] }); return; }
      if (p === 'contact') { bot.say(hi + ' The fastest route is a free site survey: an engineer and an architect at your plot for about three hours. Pick a day and I’ll book it.', { buttons: [B('Book a free site survey', 'intent:survey'), B('Estimate first', 'flow:estimate'), B('Talk to a person', 'handover')] }); return; }
      if (p === 'process') { bot.say(hi + ' Seven steps, one contract, and payments tied to stages, not dates. Ask me about any step.', { buttons: [B('Show the seven steps', 'intent:process'), B('How are payments staged?', 'say:payment schedule'), B('Book a free site survey', 'intent:survey')] }); return; }
      if (p === 'safety') { bot.say(hi + ' Eight rules on every site, and anyone can stop the job. Ask me about any of them.', { buttons: [B('The eight rules', 'intent:safety'), B('Can I visit a live site?', 'say:can I visit a live site'), B('Careers in safety', 'act:jobs:safety')] }); return; }
      bot.say(hi + ' Sthira site desk. I answer in numbers: cost per sq ft, months on site, the next payment. What are you building?', { buttons: MENU });
    },
    extract: function (text, bot) {
      var e = {}, c = cityFrom(text), pl = plotFrom(text), ar = areaFrom(text), fl = floorsFrom(text), ti = tierFrom(text), ki = kindFrom(text), co = codeFrom(text), ph = N.phone(text);
      if (c) e.city = c; if (pl) e.plot = pl; if (ar) e.area = ar; if (fl) e.floors = fl; if (ti) e.tier = ti; if (ki) e.kind = ki; if (co) e.code = co;
      if (ph) e.phone = ph; if (/\b(my name is|i am|i'm|this is|naam)\b/i.test(text)) { var nm = N.name(text); if (nm) e.name = nm; }
      if (/\b(kal|aaj|parso|tomorrow|today|day after|mon|tue|wed|thu|fri|sat|sun)[a-z]*\b|\b\d{1,2}\s*(nov|dec|jan)/i.test(text)) { var dy = dayFrom(text); if (dy && workDays().indexOf(dy) > -1) e.day = dy; }
      if (/\b(am|pm|baje|subah|shaam|sham|morning|evening|afternoon|dopahar|noon|\d{1,2}[:.]\d{2})\b/i.test(text)) { var tm = timeFrom(text), dd = e.day || (bot && bot.flow === 'survey' && bot.slots.day); if (tm && (!dd || freeSlots(dd).indexOf(tm) > -1)) e.time = tm; }
      return e;
    },
    intents: [
      { id: 'estimate', label: 'Estimate', kw: ['estimate', 'cost estimate', 'construction cost', 'cost to build', 'build a house', 'build a home', 'building cost', 'how much', 'quote', 'quotation', 'budget', 'cost of construction', 'new house', 'new home', 'price my', 'construct', 'construction'], re: [/\bg\s*\+\s*\d\b/i, /\b\d{2,3}\s*(x|×|by)\s*\d{2,3}\b/i], priority: 1, ctx: function (bot) { return bot.ctx && bot.ctx.page === 'estimate' ? 1 : 0; },
        run: function (bot, m) { var e = m.ent; if (e.kind === 'interiors') { interiors(bot, { city: e.city, area: e.area || N.area(m.text) }); return; } bot.startFlow('estimate', { city: e.city, plot: e.plot, floors: e.floors, area: e.area, tier: e.tier, kind: e.kind }); } },
      { id: 'survey', label: 'Site survey', kw: ['site survey', 'survey', 'site visit', 'visit my plot', 'book a visit', 'come to my plot', 'see my plot', 'meet an engineer', 'book an appointment', 'appointment', 'engineer visit'], re: [/\b(kal|tomorrow|parso|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday)\b.*\b(subah|morning|shaam|evening|afternoon|dopahar|\d{1,2}\s*(am|pm|baje)|\d{1,2}[:.]\d{2})\b/i], priority: 2,
        run: function (bot, m) { var e = m.ent, pre = { city: e.city || (bot.mem.est && bot.mem.est.city), kind: e.kind || (bot.mem.est && bot.mem.est.kind) || (bot.ctx && bot.ctx.page === 'project' && projById(bot.ctx.id) ? { residential: 'home', commercial: 'commercial', interiors: 'interiors', turnkey: 'turnkey' }[projById(bot.ctx.id).type] : undefined), name: e.name || bot.user.name, phone: e.phone || bot.user.phone };
          if (e.day && workDays().indexOf(e.day) > -1) { pre.day = e.day; if (e.time && freeSlots(e.day).indexOf(e.time) > -1) pre.time = e.time; } else if (e.day) bot.mem.dayNote = new Date(e.day + 'T00:00').getDay() === 0 ? 'We don’t survey on Sundays; the site teams rest.' : 'That’s outside the next ten working days I can book.';
          bot.mem.dpage = 0; bot.startFlow('survey', pre); } },
      { id: 'status', label: 'Project status', kw: ['where is my project', 'project status', 'status of my project', 'my project', 'progress', 'construction update', 'how far along', 'site update', 'weekly report', 'update on my house', 'status', 'track my project'], re: [/\bSTH[-\s]?\d{3,5}\b/i], priority: 2, ctx: function (bot) { return bot.ctx && bot.ctx.page === 'portal' ? 1 : 0; },
        run: function (bot, m) { if (m.ent.code) { status(bot, m.ent.code); return; } bot.startFlow('status'); } },
      { id: 'careers', label: 'Careers', kw: ['job', 'jobs', 'career', 'careers', 'hiring', 'openings', 'opening', 'work with you', 'work for you', 'work at sthira', 'apply', 'join your team', 'fresher', 'graduate', 'internship', 'vacancy', 'recruit', 'roles'], priority: 1,
        run: function (bot, m) { bot.mem.topic = 'careers'; var c = m.ent.city ? cityName(m.ent.city) : null, q = m.norm || ''; bot.mem.role = (q.match(/\b(site engineer|engineer|surveyor|qs|safety|designer|interior|project manager|manager|supervisor|mep)\b/) || [])[1] || null; jobs(bot, c || (/safety/.test(q) ? 'safety' : /graduate|fresher|trainee|intern/.test(q) ? 'graduate' : 'all')); bot.mem.role = null; } },
      { id: 'job_pay', label: 'Pay', kw: ['salary', 'salaries', 'ctc', 'pay scale', 'package', 'stipend', 'what do you pay', 'how much do you pay', 'pay range', 'how much salary'], priority: 2, ctx: function (bot) { return bot.mem.topic === 'careers' || (bot.ctx && bot.ctx.page === 'careers') ? 2 : 0; },
        run: function (bot) { var d = D(); bot.mem.topic = 'careers'; bot.say('Pay is in the posting, fixed per role, plus a site allowance on live sites:\n' + d.JOBS.map(function (j) { return '· ' + j.title + ' (' + j.city + '): **' + j.pay + '**'; }).join('\n') + '\nPF, medical cover for your family, and a two-wheeler allowance for site roles.', { buttons: [B('Experience needed', 'intent:job_exp'), B('How the interview works', 'say:interview process'), B('See the roles', 'act:jobs:all')] }); } },
      { id: 'job_exp', label: 'Experience', kw: ['experience', 'years of experience', 'how many years', 'eligibility', 'eligible', 'qualification', 'qualifications', 'minimum experience', 'can a fresher apply'], priority: 1, ctx: function (bot) { return bot.mem.topic === 'careers' || (bot.ctx && bot.ctx.page === 'careers') ? 2 : 0; },
        run: function (bot) { var d = D(); bot.mem.topic = 'careers'; bot.say('Experience per role:\n' + d.JOBS.map(function (j) { return '· ' + j.title + ': **' + j.exp + '** · ' + j.must[0]; }).join('\n') + '\nFinal-year civil students: the Graduate Trainee programme is for you.', { buttons: [B('Pay ranges', 'intent:job_pay'), B('Graduate programme', 'act:jobs:graduate'), B('See the roles', 'act:jobs:all')] }); } },
      { id: 'services', label: 'Services and rates', kw: ['services', 'what do you do', 'what do you build', 'what you do', 'offerings', 'types of projects', 'do you do commercial', 'do you build offices', 'rates and services', 'service'], priority: 1,
        run: function (bot) { var d = D(), P = { residential: 'home-1', commercial: 'office-1', interiors: 'fitout-office', turnkey: 'home-2' }, K = { residential: 'home', commercial: 'commercial', interiors: 'interiors', turnkey: 'turnkey' };
          bot.say('Four ways we work, one team for each. Rates are all-in starting points, GST included:', { cards: d.SERVICES.map(function (s) { return { title: s.name, sub: s.short, img: img(P[s.id]), badge: s.time, price: s.from, meta: s.items.slice(0, 3), buttons: [B(s.id === 'interiors' ? 'Price a fit-out' : 'Estimate this', s.id === 'interiors' ? 'act:fitout' : 'act:est:' + K[s.id]), B('Read more', 'act:go:services.html#' + s.id)] }; }), buttons: [B('What’s in each spec?', 'say:materials and spec'), B('Book a free site survey', 'intent:survey')] }); } },
      { id: 'projects', label: 'Projects', kw: ['projects', 'portfolio', 'past work', 'previous work', 'case study', 'case studies', 'your work', 'examples', 'homes you built', 'built before', 'references', 'show me your'], re: [/\b(show|see)\b.*\b(projects?|work|homes|offices|houses)\b/i, /\b(homes?|houses?|offices?|villas?|fit.?outs?|cafes?)\b.*\bin (bengaluru|bangalore|pune|hyderabad|mysuru|mysore)\b/i], priority: 1,
        run: function (bot, m) { var t = m.norm || '', ty = /office|commercial|warehouse/.test(t) ? 'commercial' : /interior|fit.?out|cafe|café/.test(t) ? 'interiors' : /turnkey/.test(t) ? 'turnkey' : /home|house|villa|residen/.test(t) ? 'residential' : null; projects(bot, ty, m.ent.city ? cityName(m.ent.city) : null); } },
      { id: 'process', label: 'Process', kw: ['process', 'how do you work', 'how it works', 'steps', 'what happens after', 'how does it work', 'procedure', 'the seven steps'], priority: 1,
        run: function (bot) { bot.say('Seven steps, one contract. You pay for design while we design, then by stage while we build:', { cards: [{ title: 'From survey to keys', sub: 'Typical G+2 home', badge: '7 steps', meta: ['01 Site survey · week 1 · free', '02 Concept and estimate · weeks 2–4 · 40% design fee', '03 Design and approvals · weeks 5–12 · 60% design fee', '04 Fixed-price contract · one meeting · 10% on signing', '05 Build · 9 to 14 months · 9 stage payments', '06 Snag and handover · 3–4 weeks · 9% at keys', '07 Warranty · 10 years · 3% retention, year 1'], buttons: [B('Book the free survey', 'intent:survey'), B('Read the process page', 'act:go:process.html')] }], buttons: [B('How are payments staged?', 'say:payment schedule'), B('Estimate my build', 'flow:estimate')] }); } },
      { id: 'safety', label: 'Safety', kw: ['safety', 'safe', 'ppe', 'helmet', 'harness', 'lost time', 'lti', 'injury', 'injuries', 'accident', 'iso 45001', 'site safety'], priority: 1,
        run: function (bot) { bot.say('Eight rules on every Sthira site, checked at the 8:15 toolbox talk every morning:', { cards: [{ title: '0 lost-time injuries', sub: '412,000 man-hours at Banyan Court', img: img('site-scaffold'), badge: 'ISO 45001', meta: ['Harness above two metres', 'Scaffolds tagged every Monday', 'Edge protection before the slab is poured', 'No one under a suspended load', 'Permits for hot work and for depth', 'Locked-out power', 'PPE issued, not borrowed', 'Anyone can stop the job'], buttons: [B('Read the safety page', 'act:go:safety.html'), B('Can I visit a live site?', 'say:can I visit a live site')] }] }); } }
    ],
    flows: {
      estimate: { intent: 'estimate', slots: [
        { name: 'kind', optional: true },
        { name: 'city', ask: function (bot) { bot.say('Which city is the plot in? Rates move with the city.', { buttons: [B('Bengaluru', 'slot:city=blr'), B('Pune', 'slot:city=pune'), B('Hyderabad', 'slot:city=hyd'), B('Mysuru', 'slot:city=mys'), B('Chennai', 'slot:city=chn'), B('Mumbai (MMR)', 'slot:city=mum'), B('Delhi NCR', 'slot:city=ncr')] }); }, parse: function (t) { return cityFrom(t); }, hint: 'We build in Bengaluru, Pune, Hyderabad and Mysuru, and take select projects in Chennai, Mumbai and Delhi NCR.' },
        { name: 'plot', ask: function (bot) { bot.say('Plot size? Feet or sq ft, any way you write it: “30×40”, “2400 sq ft”, “5 cents”.', { buttons: [B('30 × 40', 'slot:plot=1200'), B('30 × 50', 'slot:plot=1500'), B('40 × 60', 'slot:plot=2400'), B('60 × 90', 'slot:plot=5400'), B('No plot yet', 'slot:plot=0')] }); }, coerce: function (v) { return +v; }, parse: function (t) { if (/\b(no plot|not yet|don.?t know|dont know|not sure|pata nahi|skip|nahi pata)\b/i.test(t)) return 0; return plotFrom(t, true); }, validate: function (v) { if (v && (v < 300 || v > 200000)) return 'That plot size looks off. Try it in feet, like 30×40, or in sq ft.'; } },
        { name: 'floors', ask: function (bot, s) { bot.say('How many floors? G is ground only; G+2 is ground and two above.' + (s.plot ? ' On ' + sqft(s.plot) + ' sq ft, G+2 and G+3 are the common choices.' : ''), { buttons: FL.map(function (f, i) { return B(f, 'slot:floors=' + (i + 1)); }) }); }, coerce: function (v) { return +v; }, parse: function (t) { return floorsFrom(t) || (/^\s*[1-5]\s*$/.test(t) ? +t.trim() : undefined); }, validate: function (v) { if (!(v >= 1 && v <= 5)) return 'We build G to G+4. Which one?'; } },
        { name: 'area', ask: function (bot, s) {
            var bs;
            if (s.plot) { var cov = function (k) { return Math.max(800, Math.round(s.plot * k * s.floors / 100) * 100); }; bs = [[cov(0.55), 'compact'], [cov(0.65), 'typical'], [cov(0.75), 'full setbacks']]; bot.say('Built-up area, all floors together? On a ' + sqft(s.plot) + ' sq ft plot at ' + FL[s.floors - 1] + ', the bylaws usually allow about **' + sqft(cov(0.65)) + ' sq ft**. Pick one or type your own.', { buttons: bs.map(function (x) { return B(sqft(x[0]) + ' sq ft · ' + x[1], 'slot:area=' + x[0]); }) }); }
            else { bs = [800, 1000, 1200, 1500].map(function (a) { return a * s.floors; }); bot.say('Built-up area, all floors together? A rough number is fine.', { buttons: bs.map(function (a) { return B(sqft(a) + ' sq ft', 'slot:area=' + a); }) }); }
          }, coerce: function (v) { return +v; }, parse: function (t) { return areaFrom(t, true); }, validate: function (v) { if (v < 500) return 'Under 500 sq ft is too small for us to price fairly. What’s the built-up area?'; if (v > 60000) return 'Above 60,000 sq ft we price from drawings, not a formula. Talk to a person, or try a smaller number.'; } },
        { name: 'tier', ask: function (bot, s) { var d = D(), c = cityById(s.city) || { name: 'Bengaluru', k: 1 }; bot.say('Last one: the spec. It sets the finishes, not the structure, which is the same in all three.', { cards: d.TIERS.map(function (t) { return { title: t.name, price: '₹' + (Math.round(t.rate * c.k / 10) * 10).toLocaleString('en-IN') + ' / sq ft', sub: c.name + ' base rate', meta: t.note.split(', ').slice(0, 4).map(cap1), buttons: [B('Choose ' + t.name, 'slot:tier=' + t.id)] }; }), buttons: d.TIERS.map(function (t) { return B(t.name, 'slot:tier=' + t.id); }) }); }, parse: function (t) { return tierFrom(t); } }
      ], done: function (bot, s) {
        var d = D(); if (!d) { bot.say('The rate tables are still loading. Try again in a moment.'); return; }
        s.area = Math.max(500, Math.round(s.area / 100) * 100); // the estimator's area slider moves in 100 sq ft steps; price the same number
        var kind = s.kind && s.kind !== 'interiors' ? s.kind : 'home', st = { city: s.city, type: typeFor(kind), area: s.area, floors: s.floors, tier: s.tier, x: xFor(kind) }, r = calc(st), budget = range(r.lo, r.hi), psf = Math.round(r.rate / 10) * 10;
        var plate = s.area / s.floors, warn = s.plot && plate > s.plot * 0.8 ? ' Note: ' + sqft(plate) + ' sq ft a floor is more than a ' + sqft(s.plot) + ' sq ft plot usually allows after setbacks; the survey will confirm.' : '';
        var est = { city: s.city, kind: kind, area: s.area, floors: s.floors, tier: s.tier, plot: s.plot, budget: budget, months: r.months, url: estUrl({ city: s.city, kind: kind, area: s.area, floors: s.floors, tier: s.tier }) };
        bot.mem.est = est; bot.mem.city = s.city;
        var top = d.TRADES.slice(0, 3).map(function (tr) { return tr[0].split(' (')[0] + ' ' + inr(r.build * tr[1]); });
        var hand = MONTHS[r.hand.getMonth()] + ' ' + r.hand.getFullYear();
        var phases = r.tasks.filter(function (t) { return t.l > 0; }).map(function (t) { return t.name + ' · wk ' + (t.s + 1) + '–' + (t.s + t.l); });
        if (!xFor(kind).length) phases.unshift('Design and sanction: about 10 weeks before day 1');
        bot.say('**' + FL[s.floors - 1] + ' ' + kindLabel(kind) + ', ' + sqft(s.area) + ' sq ft** in ' + r.city.name + ', ' + r.tier.name + ' spec: **' + budget + '**, about ₹' + psf.toLocaleString('en-IN') + ' a sq ft, and **' + r.months + ' months** on site.' + warn, {
          cards: [
            { title: budget, sub: FL[s.floors - 1] + ' · ' + sqft(s.area) + ' sq ft · ' + r.city.name + ' · ' + r.tier.name, badge: 'Estimate', price: '₹' + psf.toLocaleString('en-IN') + ' / sq ft', meta: top.concat(r.extras.map(function (x) { return x[0] + ' ' + inr(x[1]); }), ['Includes GST; excludes land, sanction fees and deposits']), buttons: [B('Book a free site survey', 'intent:survey'), B('Open the full estimator', 'act:go:' + est.url)] },
            { title: r.months + ' months on site', sub: 'Dec 2026 start · keys ' + hand + ' · ' + r.weeks + ' weeks', badge: 'Programme', meta: phases }
          ], buttons: [B('Try another spec', 'act:respec'), B('How are payments staged?', 'say:payment schedule'), B('Talk to an engineer', 'handover')] });
        var L = record(bot, { what: 'estimate', city: s.city, kind: kind, area: s.area, floors: s.floors, budget: budget, next: 'Call back within 4 working hours to book a site survey', estimate: { tier: s.tier, area: s.area, floors: s.floors, city: s.city, lo: r.lo, hi: r.hi, x: st.x }, note: 'Chat estimate: ' + r.tier.name + ', ' + sqft(s.area) + ' sq ft, ' + FL[s.floors - 1] + (s.plot ? ' on a ' + sqft(s.plot) + ' sq ft plot' : '') + ', ' + r.city.name + ', ' + r.months + ' months.' });
        bot.mem.estLead = L.id;
      } },
      survey: { intent: 'survey', slots: [
        { name: 'kind', ask: function (bot) { bot.say('A free site survey: an engineer and an architect at your plot for about three hours. What are we surveying for?', { buttons: [B('A home', 'slot:kind=home'), B('Office or commercial', 'slot:kind=commercial'), B('Interiors fit-out', 'slot:kind=interiors'), B('Turnkey home', 'slot:kind=turnkey')] }); }, parse: function (t) { return kindFrom(t); } },
        { name: 'name', ask: function (bot) { bot.say('Who should the engineer ask for? First and last name.'); }, parse: function (t) { return nameFrom(t); }, hint: 'Just the name, like “Ananya Rao”.' },
        { name: 'phone', ask: function (bot, s) { bot.say('A mobile number for ' + first(s.name || bot.user.name) + '? The engineer calls before leaving for the plot. Ten digits; it never appears on the site.'); }, parse: function (t) { return N.phone(t); }, validate: function (v) { var d = digits(v); if (d.length !== 10 || !/^[6-9]/.test(d)) return 'That doesn’t look like an Indian mobile number. Ten digits, starting 6 to 9.'; }, hint: 'That doesn’t look like a mobile number. Ten digits, starting 6 to 9.' },
        { name: 'city', ask: function (bot) { bot.say('Which city?', { buttons: [B('Bengaluru', 'slot:city=blr'), B('Pune', 'slot:city=pune'), B('Hyderabad', 'slot:city=hyd'), B('Mysuru', 'slot:city=mys'), B('Another city', 'slot:city=other')] }); }, parse: function (t, bot, s) { var c = cityFrom(t); if (c && !s.loc && String(t).replace(CITY_RE.filter(function (x) { return x[0] === c; })[0][1], '').replace(/[\s,.]+/g, ' ').trim().length >= 3) s.loc = String(t).trim().slice(0, 90); return c || (/other|another|else/i.test(t) ? 'other' : undefined); }, hint: 'We survey in Bengaluru, Pune, Hyderabad and Mysuru. Tap one, or “Another city”.' },
        { name: 'loc', ask: function (bot, s) { bot.say(s.city === 'other' ? 'Where’s the plot? Town, area and a landmark. Outside our four cities we survey on request, so a person will confirm.' : 'Where in ' + cityName(s.city) + '? The area and a landmark is enough, like “Bogadi 2nd Stage, near the water tank”.'); }, parse: function (t) { t = String(t).trim(); return t.length >= 3 && /[a-z]/i.test(t) && !/^(yes|no|ok|okay|skip)$/i.test(t) ? t.slice(0, 90) : undefined; }, hint: 'The area and a landmark is enough.' },
        { name: 'day', ask: function (bot) {
            why = null; var days = workDays(), pg = bot.mem.dpage || 0, cut = [[0, 4], [4, 8], [8, 10]][pg] || [0, 4], btns = days.slice(cut[0], cut[1]).map(function (x) { return B(nice(x), 'slot:day=' + x); });
            if (pg < 2) btns.push(B('Later dates', 'act:dpage:' + (pg + 1))); else btns.push(B('Back to this week', 'act:dpage:0'));
            var note = bot.mem.dayNote; bot.mem.dayNote = null;
            bot.say((note ? note + ' ' : '') + 'Pick a day. We survey Monday to Saturday; the next ten working days are open.', { buttons: btns });
          }, parse: function (t) { var v = dayFrom(t); if (!v) return; if (new Date(v + 'T00:00').getDay() === 0) { why = 'We don’t survey on Sundays; the site teams rest. Saturday or Monday?'; return; } if (workDays().indexOf(v) < 0) { why = v <= iso(NOW) ? 'The earliest I can book is tomorrow.' : 'I can book the next ten working days, up to ' + nice(workDays()[9]) + '.'; return; } return v; }, get hint() { return why || 'Tap a day below, or type one like “Monday” or “2 Dec”.'; } },
        { name: 'time', ask: function (bot, s) {
            why = null; var free = freeSlots(s.day), gone = SLOTS.filter(function (x) { return free.indexOf(x) < 0; });
            if (!free.length) { delete bot.slots.day; bot.say(nice(s.day) + ' is fully booked. Another day?'); bot._advance(); return; }
            bot.say('Slots on **' + nice(s.day) + '**' + (gone.length ? ' (' + gone.map(t12).join(' and ') + (gone.length > 1 ? ' are' : ' is') + ' taken)' : '') + '. A survey takes about three hours.', { buttons: free.map(function (x) { return B(t12(x), 'slot:time=' + x); }).concat([B('Another day', 'act:reday')]) });
          }, parse: function (t, bot, s) { var v = timeFrom(t); if (v && s.day && freeSlots(s.day).indexOf(v) < 0) { why = t12(v) + ' is already booked that day. Pick another slot.'; return; } return v; }, get hint() { return why || 'Tap a slot below, or type a time like “10:30” or “subah”.'; } }
      ], done: function (bot, s) {
        var name = s.name, phone = s.phone, city = s.city === 'other' ? null : s.city, who = ENG[city] || 'Farah Siddiqui', when = s.day + 'T' + s.time, est = bot.mem.est || {};
        bot.user.name = name; bot.user.phone = phone; bot.mem.city = city;
        var db = bot.db('surveys') || []; db.push({ slot: s.day + ' ' + s.time, name: name, convo: bot.id }); bot.save('surveys', db);
        bot.event('booking', { kind: 'site_survey' });
        var L = record(bot, { what: 'site_survey', name: name, phone: phone, city: city, loc: s.loc, kind: s.kind || est.kind, area: est.area, floors: est.floors, budget: est.budget, survey: { when: when, who: who }, next: 'Confirm the survey for ' + nice(s.day) + ', ' + t12(s.time) + ' by phone', note: 'Site survey booked in chat for ' + nice(s.day) + ', ' + t12(s.time) + ' with ' + who + ' at ' + s.loc + (est.budget ? '. Chat estimate ' + est.budget + ' (' + FL[est.floors - 1] + ', ' + sqft(est.area) + ' sq ft)' : '') + '.' });
        bot.say('Booked, ' + first(name) + '. ' + first(who) + ' will call ' + mask(phone) + ' the evening before to confirm.', { cards: [{ title: 'Site survey · ' + nice(s.day) + ', ' + t12(s.time), sub: s.loc + (city && s.loc.toLowerCase().indexOf(cityName(city).toLowerCase()) < 0 ? ', ' + cityName(city) : ''), img: img('site-engineer'), badge: 'Booked', tag: L.id, meta: ['Engineer: ' + who + ', with an architect', 'About 3 hours: total station, soil auger, photos', 'Keep the sale deed and khata handy if you can', 'Free, and no obligation'], buttons: [B('What happens at the survey?', 'say:what happens at a site survey'), B(est.budget ? 'See my estimate again' : 'Estimate my build', est.budget ? 'act:go:' + est.url : 'flow:estimate')] }], buttons: [B('That’s all, thanks', 'say:thanks'), B('Something else', 'menu')] });
      } },
      status: { intent: 'status', slots: [
        { name: 'code', ask: function (bot) { bot.say('Your project code? It’s on page 1 of your contract and at the top of the portal: STH- and four digits.', bot.ctx && bot.ctx.page === 'portal' && D() ? { buttons: [B(D().LIVE.id, 'slot:code=' + D().LIVE.id)] } : {}); }, parse: function (t) { return codeFrom(t, true); }, hint: 'Project codes look like STH-1234.' }
      ], done: function (bot, s) { status(bot, s.code); } }
    },
    actions: {
      go: function (bot, url) { go(bot, url); },
      status: function (bot, code) { status(bot, code); },
      dpage: function (bot, n) { bot.mem.dpage = +n || 0; if (bot.flow === 'survey' && bot.pending && bot.pending.name === 'day') bot.pending.ask(bot, bot.slots); else { bot.startFlow('survey', { name: bot.user.name, phone: bot.user.phone }); } },
      reday: function (bot) { if (bot.flow !== 'survey') { bot.startFlow('survey'); return; } delete bot.slots.day; delete bot.slots.time; bot.mem.dpage = 0; bot._advance(); },
      respec: function (bot) { var e = bot.mem.est; if (!e) { bot.startFlow('estimate'); return; } bot.startFlow('estimate', { city: e.city, plot: e.plot, floors: e.floors, area: e.area, kind: e.kind }); },
      est: function (bot, kind) { bot.startFlow('estimate', { kind: kind, city: bot.mem.city }); },
      fitout: function (bot) { interiors(bot, {}); },
      like: function (bot, id) { var p = projById(id); if (!p) { bot.startFlow('estimate'); return; } var c = cityIdFromName(p.city); if (p.type === 'interiors') { interiors(bot, { area: p.area, city: c }); return; } bot.startFlow('estimate', { city: c, floors: floorsFrom(p.floors) || 3, area: p.area, plot: 0, kind: p.type === 'commercial' ? 'commercial' : p.type === 'turnkey' ? 'turnkey' : 'home' }); },
      jobs: function (bot, c) { bot.mem.topic = 'careers'; jobs(bot, c); },
      proj: function (bot, t) { projects(bot, t, null); },
      snags: function (bot) {
        var d = D(); if (!d) return; var P = portal(), all = P.snags.concat(d.SNAGS).map(function (s) { return Object.assign({}, s, { status: P.snagStatus[s.id] || s.status }); }), open = all.filter(function (s) { return s.status !== 'fixed'; });
        bot.say(open.length ? '**' + open.length + ' open** on ' + d.LIVE.id + ' (' + (all.length - open.length) + ' fixed):' + open.map(function (s) { return '\n· ' + s.id + ', ' + s.title + (s.status === 'review' ? ' (under review)' : '') + (s.fix ? '. ' + s.fix : ''); }).join('') : 'Nothing open on the snag list. Every item is fixed and signed off.', { buttons: [B('Raise a snag in the portal', 'act:go:portal.html'), B('Talk to Karthik (site)', 'handover')] });
      },
      pay: function (bot) {
        var d = D(); if (!d) return; var P = portal(), L = d.LIVE, rows = d.PAYMENTS.map(function (m) { return { m: m, st: P.paid[m.n] ? 'paid' : m.status }; }), paid = rows.filter(function (r) { return r.st === 'paid'; }), next = rows.filter(function (r) { return r.st !== 'paid'; })[0], pct = paid.reduce(function (a, r) { return a + r.m.pct; }, 0);
        if (!next) { bot.say('Every milestone to date is paid: ' + pct + '% of ' + inr(L.value) + '.'); return; }
        bot.say('Next milestone on ' + L.id + ': **M' + next.m.n + ', ' + next.m.name.toLowerCase() + '**, ' + next.m.pct + '% = **' + inr(L.value * next.m.pct / 100) + '**, ' + (next.st === 'due' ? 'due ' : 'expected ') + O.fmtDay(new Date(next.m.date + 'T00:00')) + '. It’s released when the stage is signed off, not on the date. Paid so far: ' + pct + '%, ' + inr(L.value * pct / 100) + '. Pay from the portal by bank transfer; nobody at Sthira asks for card details or an OTP in chat.', { buttons: [B('Open payments in the portal', 'act:go:portal.html#pay'), B('How are payments staged?', 'say:payment schedule')] });
      }
    },
    freeText: function (bot, m) {
      var e = m.ent;
      if (e.code) { status(bot, e.code); return true; }
      if (e.area || e.plot || e.floors || e.tier || (e.city && !e.day)) { if (e.kind === 'interiors') { interiors(bot, { city: e.city, area: e.area || N.area(m.text) }); return true; } bot.startFlow('estimate', { city: e.city, plot: e.plot, floors: e.floors, area: e.area, tier: e.tier, kind: e.kind }); return true; }
      if (e.day || e.time) { bot.startFlow('survey', { name: bot.user.name, phone: bot.user.phone, day: e.day && workDays().indexOf(e.day) > -1 ? e.day : undefined, time: e.day && e.time && freeSlots(e.day).indexOf(e.time) > -1 ? e.time : undefined }); return true; }
    },
    kb: [
      { id: 'rates', q: 'What are your rates per sq ft?', a: 'All-in construction rates in Bengaluru, GST included: **Essential ₹2,150**, **Signature ₹2,750** and **Bespoke ₹3,650 / sq ft**. Pune is about 4% less, Hyderabad 5% less, Mysuru 12% less. Each floor above G+1 adds 2.5% for the extra structure and hoisting. Commercial adds 6%.', keys: ['rate per sq ft', 'per sq ft', 'sq ft rate', 'per square foot', 'rates', 'construction rate', 'per sqft', 'rate kya hai', 'square feet rate', 'cost per square foot'], buttons: [B('Estimate my build', 'flow:estimate'), B('What’s in each spec?', 'say:materials and spec')] },
      { id: 'included', q: 'What is included in the rate?', a: 'Structure, walls, plaster, plumbing, electrical, flooring, doors, windows, paint, supervision and GST. Not included: land, plan-sanction fees, utility deposits and stamp duty. Interiors, a lift, a basement, solar and landscape are priced as extras.', keys: ['what is included', 'included in the rate', 'whats included', 'excluded', 'exclusions', 'hidden cost', 'hidden charges'], buttons: [B('Estimate my build', 'flow:estimate')] },
      { id: 'timeline', q: 'How long does it take to build?', a: 'A G+2 home of about 3,000 sq ft takes **9 months on site**, plus about 10 weeks of design and sanction before day 1. Each extra floor adds about three weeks to the frame. Bigger homes and turnkey run 12 to 18 months. The estimate shows the programme phase by phase.', keys: ['how long', 'how many months', 'timeline', 'duration', 'time to build', 'when will it be ready', 'completion time'], buttons: [B('Estimate my build', 'flow:estimate')] },
      { id: 'sanction', q: 'Do you handle plan sanction?', a: 'Yes. We prepare the drawings, file the plan sanction with BBMP, BDA, PMC, GHMC or MUDA, and follow it through the office. It usually takes **6 to 10 weeks**. Authority fees are paid at actuals and are not in our estimate; we tell you the amount before we file.', keys: ['plan sanction', 'sanction', 'building approval', 'approval', 'permit', 'bbmp', 'bda', 'ghmc', 'pmc', 'naksha pass', 'map approval'] },
      { id: 'payments', q: 'How are payments staged?', a: 'By stage, not by date: **10% on signing**, then each milestone is released when the stage is signed off. Foundation 10%, each slab 8%, blockwork 4% + 4%, plaster, MEP and windows 10%, finishes 10%, **9% at handover** and **3% retention** after the 12-month defects period. You pay by bank transfer against an invoice; nobody from Sthira asks for card details or an OTP in chat.', keys: ['payment schedule', 'payment terms', 'payments', 'how do i pay', 'milestones', 'stage payment', 'advance', 'installments', 'kitna advance'] },
      { id: 'warranty', q: 'What warranty do you give?', a: '**12 months** of defects liability with a 48-hour response, then a **ten-year structural warranty**. We hold 3% retention until the defects period ends, so the incentive to come back is ours.', keys: ['warranty', 'guarantee', 'defects', 'defect liability', 'after handover', 'leakage after'] },
      { id: 'materials', q: 'Which materials do you use?', a: 'Every tier gets the same structure: Fe 550D TMT steel, M25 ready-mix concrete with 6 cubes per pour, and AAC block walls. The tier changes the finishes. **Essential**: vitrified tiles, UPVC windows, mid-range branded fittings. **Signature**: Italian-finish tiles, engineered wood in bedrooms, aluminium windows with DGU. **Bespoke**: natural stone, solid timber, slim-profile glazing, VRF air-conditioning.', keys: ['materials', 'material', 'brand', 'brands', 'steel', 'cement', 'which tiles', 'spec', 'specification', 'materials and spec', 'what is in each spec', 'quality of material'], buttons: [B('Estimate my build', 'flow:estimate')] },
      { id: 'cities', q: 'Which cities do you build in?', a: 'Bengaluru, Pune, Hyderabad and Mysuru, with our head office in Indiranagar, Bengaluru and our joinery workshop in Bommasandra. We also take select projects in Chennai, Mumbai and Delhi NCR.', keys: ['which cities', 'cities', 'where do you work', 'do you work in', 'locations', 'service area', 'outside bangalore', 'office address', 'where are you'] },
      { id: 'interiors', q: 'Do you do interiors?', a: 'Yes, for offices and homes, from **₹1,450 / sq ft**, in **6 to 16 weeks**. Our own workshop in Bommasandra builds the kitchens, wardrobes and reception desks, so what you approve in the drawing is what gets installed. Live offices are fitted out after hours.', keys: ['interiors', 'interior', 'fit out', 'fit-out', 'modular kitchen', 'wardrobes', 'interior design', 'office interiors'], buttons: [B('Price a fit-out', 'act:fitout'), B('Book a free site survey', 'intent:survey')] },
      { id: 'turnkey', q: 'What is turnkey?', a: 'One contract from an empty plot to a furnished home: design, approvals, construction, interiors and landscape. From **₹3,350 / sq ft**, 12 to 18 months, one project manager and one number to call.', keys: ['turnkey', 'turn key', 'end to end', 'furnished', 'ready to move', 'everything included', 'one contract'], buttons: [B('Estimate a turnkey home', 'act:est:turnkey')] },
      { id: 'sitevisit', q: 'Can I visit the site?', a: 'Any working day: tell your site engineer the day before and we’ll lend you a helmet. If you’d like to see a live Sthira site before you sign, we’ll arrange a walk through one in your city.', keys: ['visit the site', 'visit a live site', 'see a live site', 'visit during construction', 'can i come to site', 'see your site', 'visit ongoing project', 'can I visit a live site'], buttons: [B('Arrange it with a person', 'handover')] },
      { id: 'gst', q: 'Is GST included?', a: 'Yes. Our rates and estimates include **GST at 18%** on the works contract; the quote shows it as its own line. Land, plan-sanction fees, utility deposits and stamp duty are not included.', keys: ['gst', 'tax', 'taxes', 'including gst', 'excluding gst', 'tds'] },
      { id: 'changes', q: 'Can I make changes during construction?', a: 'Yes. Ask any time and you get a revised drawing and a priced change order, usually within two days. Nothing changes on site until you approve it in the portal, and the portal shows what it does to the price and the date.', keys: ['change', 'changes', 'change order', 'modify', 'modification', 'variation', 'change my mind', 'badlav'] },
      { id: 'delays', q: 'What if the project is delayed?', a: 'The handover date is in the contract, with a delay clause: **0.25% of the contract value per week** of delay caused by us, capped at 5%. Rain, sanction delays and your change orders move the date only by what the programme shows, and we tell you in writing the same week.', keys: ['delay', 'delays', 'late', 'penalty', 'delayed', 'handover date', 'on time', 'der'] },
      { id: 'monsoon', q: 'Do you build during the monsoon?', a: 'Yes, and we plan around it: excavation and foundations before June where we can, the roof closed in before the heavy months, and masons move inside on rain days. Kondapur Works was closed in on day 201 and took no water at the first rain.', keys: ['monsoon', 'rain', 'rainy season', 'barish', 'baarish', 'waterproofing'] },
      { id: 'soil', q: 'Do you do a soil test?', a: 'Always. Two or three boreholes or trial pits and a safe bearing capacity report from an accredited lab, about ₹25,000 to ₹45,000, included in the design fee on our design-build contracts. The footings are designed to that report, not to a habit.', keys: ['soil test', 'soil', 'soil report', 'sbc', 'bearing capacity', 'geotechnical', 'mitti'] },
      { id: 'vastu', q: 'Do you design to Vastu?', a: 'If you want it, yes. Our architects plan to Vastu routinely: the entrance, the kitchen in the south-east, the master bedroom in the south-west, and the stair and water tank placed to suit. Tell us at the survey how strictly you follow it. It changes the plan, not the rate.', keys: ['vastu', 'vaastu', 'vastu compliant', 'east facing', 'north facing', 'direction'] },
      { id: 'rental', q: 'Can you build rental floors?', a: 'Many of our homes are owner-plus-rental, G+2 or G+3: a separate entrance and meter per floor, a common stair, and simple layouts that let quickly. The Rao Residence is a G+3 with two rental floors. Floors cost the same per sq ft, plus 2.5% per floor above G+1.', keys: ['rental', 'rental floors', 'rent out', 'tenants', 'kiraya', 'income floors', 'owner plus rental', 'separate entrance'], buttons: [B('Estimate my build', 'flow:estimate')] },
      { id: 'portal', q: 'What is the client portal?', a: 'Every client gets one: the Friday photo report from the same camera points, payments and receipts, snags, change orders, drawings and messages with your project manager. Sign in with the details on your contract.', keys: ['portal', 'client portal', 'login', 'sign in', 'app', 'track online', 'dashboard'], buttons: [B('Open the client portal', 'act:go:portal.html'), B('Where is my project?', 'intent:status')] },
      { id: 'survey', q: 'What happens at a site survey?', a: 'An engineer and an architect visit the plot with a total station and a soil auger. We check the setbacks against the bylaws, whether a ready-mix truck can reach the gate, and photograph the neighbours’ walls so nobody argues later. About **three hours**, free, and you get a survey report.', keys: ['what happens at a site survey', 'what happens at the survey', 'survey cost', 'is the survey free', 'survey charges', 'survey report'], buttons: [B('Book a free site survey', 'intent:survey')] },
      { id: 'loan', q: 'Will it work with a home loan?', a: 'Yes. The stage-linked schedule matches how banks release home-construction loans. We give your bank the BOQ, the sanctioned plan and a stage certificate for every milestone, so each release is quick.', keys: ['home loan', 'loan', 'bank loan', 'construction loan', 'emi', 'finance', 'bank'] },
      { id: 'demolition', q: 'Can you demolish my old house?', a: 'Yes. We demolish, clear the plot and salvage what you want to keep: teak doors, grills, stone. A typical 1,500 sq ft house takes about two weeks and ₹1.5 to 2.5 L, less whatever the salvage is worth.', keys: ['demolish', 'demolition', 'old house', 'rebuild', 'tod', 'tear down', 'existing house'] },
      { id: 'basement', q: 'Can you build a basement or stilt parking?', a: 'Stilt parking is standard from G+2 up. A basement adds about **₹2,400 per sq ft** of floor plate and six weeks to the foundation, and needs a soil report showing the water table. The full estimator adds both.', keys: ['basement', 'stilt', 'parking', 'cellar', 'car parking', 'lift'], buttons: [B('Open the full estimator', 'act:go:estimate.html')] },
      { id: 'escalation', q: 'Will the price go up later?', a: 'No. The contract is a fixed price for the scope in the drawings and the BOQ, with no escalation clause on steel or cement. The price only changes through a change order you sign, with its price on it.', keys: ['price increase', 'escalation', 'fixed price', 'price go up', 'cost overrun', 'over budget', 'steel price'] },
      { id: 'design', q: 'What does design cost?', a: 'Design and approvals are about **4.5% of the build cost**: 40% at the concept stage, 60% at sanction. That covers two concepts, around 70 working drawings, structure, MEP and the sanction file.', keys: ['design fee', 'architect fee', 'architect', 'drawings cost', 'design cost', 'naksha'] },
      { id: 'interview', q: 'How does the interview work?', a: 'A 30-minute call, then a site walk with the project manager. Decision within 10 days. A real person reads every application within a week.', keys: ['interview', 'interview process', 'hiring process', 'selection process', 'how long to hear back', 'rounds'], buttons: [B('See the roles', 'act:jobs:all'), B('Pay ranges', 'intent:job_pay')] },
      { id: 'contact', q: 'How do I reach you?', a: 'Here, any time. Our engineers call back within **four working hours**, Monday to Saturday, 9:30 to 18:30. Head office: 12th Main, HAL 2nd Stage, Indiranagar, Bengaluru.', keys: ['contact', 'phone number', 'call you', 'office hours', 'timings', 'email', 'reach you', 'working hours'], buttons: [B('Talk to a person', 'handover'), B('Book a free site survey', 'intent:survey')] }
    ]
  });

  function jobs(bot, c) {
    var d = D(); if (!d) return; var all = d.JOBS, L = all;
    if (c === 'safety') L = all.filter(function (j) { return j.team === 'Safety'; });
    else if (c === 'graduate') L = all.filter(function (j) { return j.type === 'Graduate'; });
    else if (c && c !== 'all') L = all.filter(function (j) { return j.city === c || j.city === 'All offices'; });
    var role = bot.mem.role, rk = function (j) { return role && j.title.toLowerCase().indexOf(role === 'qs' ? 'quantity' : role) > -1 ? 0 : 1; }; if (role) L = L.slice().sort(function (a, b) { return rk(a) - rk(b); });
    var cities = ['Bengaluru', 'Pune', 'Hyderabad', 'Mysuru'].filter(function (x) { return x !== c; });
    bot.say(L.length ? (c && c !== 'all' ? L.length + ' open in ' + (c === 'safety' ? 'safety' : c === 'graduate' ? 'the graduate programme' : c) : 'All ' + L.length + ' open roles') + ', pay in the posting:' : 'Nothing open there right now.', { cards: L.map(jobCard), buttons: cities.slice(0, 3).map(function (x) { return B(x, 'act:jobs:' + x); }).concat([B('Pay and experience', 'intent:job_pay'), B('Interview process', 'say:interview process')]) });
  }
  function projects(bot, ty, city) {
    var d = D(); if (!d) return; var L = d.PROJECTS.filter(function (p) { return (!ty || p.type === ty || (ty === 'residential' && p.type === 'turnkey')) && (!city || p.city === city); }), wide = '';
    if (!L.length) { L = d.PROJECTS.filter(function (p) { return !ty || p.type === ty; }); wide = 'None of those in ' + city + ' yet; here they are across our cities. '; }
    bot.say(wide + L.length + ' finished ' + (L.length === 1 ? (ty === 'commercial' ? 'commercial building' : ty === 'interiors' ? 'fit-out' : ty ? 'home' : 'project') : ty === 'commercial' ? 'commercial buildings' : ty === 'interiors' ? 'fit-outs' : ty ? 'homes' : 'projects') + (city && !wide ? ' in ' + city : '') + (L.length > 1 ? ', newest first:' : ':'), { cards: L.slice().sort(function (a, b) { return b.year - a.year; }).map(projCard), buttons: [B('Homes', 'act:proj:residential'), B('Commercial', 'act:proj:commercial'), B('Fit-outs', 'act:proj:interiors'), B('Estimate my build', 'flow:estimate')] });
  }
  function interiors(bot, e) {
    var d = D(); if (!d) return; var c = cityById(e.city || bot.mem.city || 'blr'), a = e.area || 2000;
    bot.say('Fit-outs are priced per sq ft of floor. For **' + sqft(a) + ' sq ft** in ' + c.name + ', by spec, GST included:', { cards: d.TIERS.map(function (t) { var v = a * t.int * c.k * 0.85; return { title: t.name + ' fit-out', price: range(v * 0.94, v * 1.08), priceLabel: '6 to 16 weeks', meta: ['About ₹' + (Math.round(t.int * c.k * 0.85 / 10) * 10).toLocaleString('en-IN') + ' / sq ft', 'Joinery from our Bommasandra workshop'], buttons: [B('Book a free site survey', 'intent:survey')] }; }), buttons: [B('Book a free site survey', 'intent:survey'), B('Talk to a person', 'handover')] });
    var sg = d.TIERS[1], sv = a * sg.int * c.k * 0.85, budget = range(sv * 0.94, sv * 1.08);
    bot.mem.est = { city: c.id, kind: 'interiors', area: a, floors: 0, budget: budget, url: 'services.html#interiors' }; bot.mem.city = c.id;
    record(bot, { what: 'estimate', city: c.id, kind: 'interiors', area: a, budget: budget, next: 'Call back within 4 working hours to book a site survey', note: 'Chat fit-out estimate: ' + sqft(a) + ' sq ft in ' + c.name + ', Signature ' + budget + ' (Essential to Bespoke shown).' });
  }
})();
