/* Lumen CRM Pro — Conversations: a shared inbox for WhatsApp and email (simulated).
   Thread list · thread · contact context. Assign, status, snooze, canned replies, internal notes,
   first-response timer, log to record, create contact, quick tasks. Data lives in S.pro.convos. */
(function () {
  'use strict';
  var C = window.CRM, esc = C.esc, $ = C.$, $$ = C.$$, V = C.views;
  var P = function () { return C.P(); };
  var M = 6e4, Hr = 36e5, D = 864e5;

  // ---- seed ------------------------------------------------------------------------------------------
  // [channel, contact name or null, unknown sender, subject, status, unread, age minutes, messages [from, minutes after start, text, by?]]
  var SEED = [
    ['wa', null, { name: '+91 98••• ••512', phone: '+91 98••• ••512' }, '', 'open', true, 7, [['in', 0, 'Hi, saw your Instagram reel of the kitchen in Noida. Can you do something similar in a 2BHK in Sector 137? Budget around 5 lakh.']]],
    ['wa', 'Jai Oberoi', null, '', 'open', true, 25, [['out', -1440, 'Hi Jai, rooftop measurements are with the design team. Will share options by Friday.'], ['in', 0, 'Jai here. Saturday 11 baje site visit chalega? Also can you bring the cane chair swatch?']]],
    ['email', 'Aditi Menon', null, 'Revised furniture schedule — L3', 'open', true, 95, [['in', -2880, 'Hi Kabir, thanks for proposal v2. We are aligned on the layout.'], ['out', -2700, 'Thanks Aditi. I will hold the price till the 30th.'], ['note', -2600, 'Finance (Rahul) is the real approver here. Loop him in before sending v3.'], ['in', 0, 'Finance wants the chair count reduced to 20 and the bookshelf moved to phase 2. Can you resend the schedule by Thursday?']]],
    ['wa', 'Ananya Sharma', null, '', 'open', false, 180, [['in', 0, 'Quote dekha. Quartz counter thoda mehenga lag raha hai — koi alternative?'], ['out', 9, 'Hi Ananya! We can do a compact-quartz option that is about 18% lower. Shall I send two swatch photos?'], ['in', 22, 'Haan please, aur soft-close drawers same rahenge na?']]],
    ['email', 'Varun Khurana', null, 'Sconce swatches for the 24 rooms', 'pending', false, 1560, [['in', 0, 'Can we see two finishes of the wall sconce in person before we sign off?'], ['out', 55, 'Absolutely. We will bring brushed brass and matte black to the hotel on Wednesday at 3 pm.'], ['in', 80, 'Perfect, confirmed.']]],
    ['wa', null, { name: '+91 99••• ••078', phone: '+91 99••• ••078' }, '', 'open', true, 130, [['in', 0, 'Do you do only painting? 3BHK repaint in Dwarka, before Diwali.'], ['in', 3, 'Budget approx 1.2 lakh']]],
    ['wa', 'Rohan Mehta', null, '', 'open', false, 300, [['out', -4320, 'Thanks for having us over, Rohan. Measurements done.'], ['in', 0, 'Site visit ke baad moodboard kab tak milega?'], ['out', 14, 'Within 48 hours of the visit — so by tomorrow evening. Meera will send it here.']]],
    ['email', 'Ishaan Kapoor', null, 'Phase 2 show flats — handover date', 'open', true, 420, [['in', 0, 'Our sales launch is on the 15th. Can both show flats be ready by the 10th? Please confirm the furniture lead times from your distributor.']]],
    ['wa', 'Vikram Singh', null, '', 'pending', false, 2880, [['in', 0, 'Bathroom mein ek tile crack ho gaya after the plumber visit. Can someone check?'], ['out', 31, 'Sorry to hear that, Vikram. Our supervisor can come on Thursday 10–12. Does that work?'], ['in', 50, 'Thursday ok 👍'], ['note', 52, 'Raised as a service ticket. Tile from the same batch is in stock.']]],
    ['email', 'Karan Sachdeva', null, 'Second outlet — discount approval', 'open', false, 640, [['in', 0, 'If you can do 8% on the furniture we can sign this week.'], ['note', 20, 'Needs Aarav’s approval above 5%. Asked him on WhatsApp.'], ['out', 40, 'Hi Karan, I have asked for an exception and will revert by 6 pm today.']]],
    ['wa', 'Priya Nair', null, '', 'closed', false, 5800, [['in', 0, 'Wardrobe ke handles change ho sakte hain? Brass wale chahiye.'], ['out', 12, 'Yes, brass bar handles add ₹3,400 for the set. Updating the order now.'], ['in', 30, 'Done, thank you!']]],
    ['email', 'Kiran Shetty', null, 'Site visit request — reception', 'open', true, 75, [['in', 0, 'We would like you to look at the reception and waiting area. Any slot this week after 4 pm?']]],
    ['wa', 'Sneha Reddy', null, '', 'closed', false, 8600, [['in', 0, 'Thank you! Kitchen is lovely. Sharing a Google review today.'], ['out', 20, 'That made our day, Sneha. Thank you 🙏']]],
    ['email', null, { name: 'Palm Grove Clinics', email: 'admin@palmgroveclinics.example' }, 'RFQ: waiting-area furniture for 3 clinics', 'open', true, 260, [['in', 0, 'We are refurbishing waiting areas in three clinics (Noida, Ghaziabad, Gurugram). Please share a quotation for seating, side tables and lighting. Drawings attached.']]],
    ['wa', 'Gaurav Chopra', null, '', 'open', true, 45, [['in', 0, 'Advance transfer kar diya — UTR shared on email. Please confirm.']]],
    ['email', 'Ritika Malhotra', null, 'Two referrals for you this month', 'closed', false, 7200, [['in', 0, 'Sending two clients your way — both full-home projects in Gurugram. Same referral terms?'], ['out', 120, 'Same terms, and thank you Ritika. Isha will call both today.']]]
  ];
  var REPLIES = { wa: ['Ok 👍', 'Theek hai, kal call kar lena.', 'Can you share photos of a similar project?', 'What would the timeline be?', 'Price thoda adjust ho sakta hai?', 'Thanks! Saturday works.'], email: ['Thanks, that works for us.', 'Could you also include the delivery schedule?', 'Please share the GST invoice format you use.', 'Noted. Will revert after our internal review.'] };

  C.seeders.push(function (p) {
    if (p.convos) { p.convos.forEach(function (t, i) { if (!t.who) t.who = { name: '+91 97••• ••' + (400 + i * 11), phone: '+91 97••• ••' + (400 + i * 11), email: '' }; }); return; }
    var now = Date.now(), n = 101;
    p.convos = SEED.map(function (r, i) {
      var c = r[1] ? p.contacts.filter(function (x) { return x.name === r[1]; })[0] : null;
      var d = c ? p.deals.filter(function (x) { return x.c === c.id && C.dealOpen(x); })[0] || p.deals.filter(function (x) { return x.c === c.id; })[0] : null;
      var start = now - r[6] * M, owner = c ? c.owner : (i === 13 ? null : null);
      var msgs = r[7].map(function (m, k) { return { id: 'm' + k, t: start + m[1] * M, from: m[0], by: m[0] === 'in' ? '' : (m[3] || owner || C.TEAM[1]), text: m[2], read: m[0] !== 'in' ? true : !r[5] }; });
      msgs.sort(function (a, b) { return a.t - b.t; });
      var firstIn = msgs.filter(function (m) { return m.from === 'in'; })[0], firstOut = firstIn && msgs.filter(function (m) { return m.from === 'out' && m.t > firstIn.t; })[0];
      return {
        id: 'CV-' + (n++), ch: r[0], subj: r[3], who: c ? { name: c.name, phone: c.phone, email: c.email } : r[2] || (r[0] === 'wa' ? { name: r[1], phone: '+91 97••• ••' + (400 + i * 11), email: '' } : { name: r[1], phone: '', email: r[1].toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com' }), c: c ? c.id : null, d: d ? d.id : null, owner: owner,
        status: r[4], unread: r[5], snooze: r[4] === 'pending' ? now + 20 * Hr : null, created: msgs[0].t, updated: msgs[msgs.length - 1].t,
        firstResp: firstOut ? Math.round((firstOut.t - firstIn.t) / M) : null, msgs: msgs, logged: []
      };
    });
  });

  // ---- helpers -----------------------------------------------------------------------------------
  function all() { return P().convos || []; }
  function th(id) { return all().filter(function (x) { return x.id === id; })[0]; }
  function U() { return C.ui.cv || (C.ui.cv = { box: 'all', st: 'open', ch: 'all', q: '', mode: 'reply' }); }
  function last(t) { return t.msgs.filter(function (m) { return m.from !== 'note'; }).slice(-1)[0] || t.msgs[t.msgs.length - 1]; }
  function chName(ch) { return ch === 'wa' ? 'WhatsApp' : ch === 'web' ? 'Web chat' : ch === 'ig' ? 'Instagram' : 'Email'; }
  function waiting(t) { if (t.firstResp != null || t.status === 'closed') return null; var fi = t.msgs.filter(function (m) { return m.from === 'in'; })[0]; return fi ? C.bizMin(fi.t, Date.now()) : null; }
  function slaState(m) { var tg = P().route.sla; return m < tg * .5 ? 'ok' : m < tg ? 'risk' : 'breach'; }
  function visible(t) { return C.visibleOwner(t.owner); }
  function filtered() {
    var u = U(), me = C.me().name, q = u.q.trim().toLowerCase();
    return all().filter(visible).filter(function (t) {
      if (u.box === 'mine' && t.owner !== me) return false;
      if (u.box === 'unassigned' && t.owner) return false;
      if (u.st !== 'all' && t.status !== u.st) return false;
      if (u.ch !== 'all' && t.ch !== u.ch) return false;
      if (q && (t.who.name + ' ' + (t.subj || '') + ' ' + t.msgs.map(function (m) { return m.text; }).join(' ')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return (b.unread - a.unread) || b.updated - a.updated; });
  }
  function count(fn) { return all().filter(visible).filter(fn).length; }
  function refFor(t) { return t.d ? C.refOf('deal', C.deal(t.d)) : t.c ? C.refOf('contact', C.contact(t.c)) : null; }
  function recRef(t) { var d = t.d && C.deal(t.d), c = t.c && C.contact(t.c); return d ? { c: d.c || t.c, co: d.co, d: d.id } : c ? { c: c.id, co: c.co } : null; }
  function canEdit(t) { return C.can('edit', t); }
  function chIco(ch, s) { return '<span class="cv-ch ' + ch + '" title="' + chName(ch) + '">' + C.ic(ch === 'wa' ? 'wa' : ch === 'web' ? 'bot' : ch === 'ig' ? 'ig' : 'mail', s || 12) + '</span>'; }
  function opts(list, cur) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }

  C.badgeFns.push(function () { return { convos: (P().convos ? count(function (t) { return t.unread && t.status !== 'closed'; }) : 0) }; });
  C.searchers.push(function (terms, hit) {
    return all().filter(visible).filter(function (t) { return hit(t.who.name + ' ' + (t.subj || '') + ' ' + t.msgs.map(function (m) { return m.text; }).join(' ')); }).slice(0, 4).map(function (t) {
      return { g: 'Conversations', ic: 'mail', label: t.who.name + (t.subj ? ' — ' + t.subj : ''), sub: chName(t.ch) + ' · ' + t.status + ' · ' + last(t).text.slice(0, 60), run: function () { location.hash = '#/conversations/' + t.id; } };
    });
  });

  // ---- list ----------------------------------------------------------------------------------------
  function item(t, sel) {
    var l = last(t), w = waiting(t);
    return '<li><a class="cv-item' + (t.unread ? ' unread' : '') + (sel ? ' sel' : '') + '" href="#/conversations/' + t.id + '" data-tid="' + t.id + '"' + (sel ? ' aria-current="true"' : '') + '>' +
      '<span class="cv-av">' + C.avatar(t.who.name.replace(/^\+.*/, '#'), 32) + chIco(t.ch, 10) + '</span>' +
      '<span class="cv-im"><span class="cv-r1"><b class="tr">' + esc(t.who.name) + '</b><time>' + C.rel(t.updated) + '</time></span>' +
      (t.subj ? '<span class="cv-subj tr">' + esc(t.subj) + '</span>' : '') +
      '<span class="cv-snip tr">' + (l.from === 'out' ? '<span class="muted">You: </span>' : l.from === 'note' ? '<span class="muted">Note: </span>' : '') + esc(l.text) + '</span>' +
      '<span class="cv-r3">' + (t.owner ? '<span class="cv-own">' + C.avatar(t.owner, 16) + esc(t.owner.split(' ')[0]) + '</span>' : '<span class="cv-tag un">Unassigned</span>') +
      (t.status !== 'open' ? '<span class="cv-tag ' + t.status + '">' + (t.status === 'pending' ? 'Pending' : 'Closed') + '</span>' : '') +
      (w != null ? '<span class="cv-tag sla ' + slaState(w) + '">' + C.ic('clock', 10) + C.fmtMin(w) + '</span>' : '') +
      (t.unread ? '<i class="cv-dot" aria-label="Unread"></i>' : '') + '</span></span></a></li>';
  }
  function listPane(sel) {
    var u = U(), L = filtered(), me = C.me().name;
    var box = [['all', 'All', count(function (t) { return t.status !== 'closed'; })], ['mine', 'Mine', count(function (t) { return t.owner === me && t.status !== 'closed'; })], ['unassigned', 'Unassigned', count(function (t) { return !t.owner && t.status !== 'closed'; })]];
    return '<section class="cv-list" aria-label="Conversations"><div class="cv-lh">' +
      '<div class="seg cv-box" role="group" aria-label="Inbox">' + box.map(function (b) { return '<button type="button" data-act="cv-box" data-v="' + b[0] + '" aria-pressed="' + (u.box === b[0]) + '">' + b[1] + ' <b>' + b[2] + '</b></button>'; }).join('') + '</div>' +
      '<div class="cv-f"><div class="sfield sm">' + C.ic('search', 14) + '<label class="sr" for="cv-q">Search conversations</label><input id="cv-q" type="search" data-in="cv-q" value="' + esc(u.q) + '" placeholder="Search…" autocomplete="off"></div>' +
      '<label class="sr" for="cv-st">Status</label><select id="cv-st" class="sel sm" data-ch="cv-st">' + opts([['open', 'Open'], ['pending', 'Pending'], ['closed', 'Closed'], ['all', 'Any status']], u.st) + '</select>' +
      '<label class="sr" for="cv-chf">Channel</label><select id="cv-chf" class="sel sm" data-ch="cv-chf">' + opts([['all', 'All channels'], ['web', 'Web chat'], ['wa', 'WhatsApp'], ['ig', 'Instagram'], ['email', 'Email']], u.ch) + '</select></div></div>' +
      '<ul class="cv-items" id="cv-items">' + (L.length ? L.map(function (t) { return item(t, t.id === sel); }).join('') : '<li class="cv-empty">' + C.ic('inbox', 20) + '<b>' + (u.q ? 'No conversations match “' + esc(u.q) + '”' : u.box === 'mine' ? 'Nothing assigned to you here' : u.st === 'open' ? 'Inbox zero' : 'No conversations') + '</b><span>' + (u.box === 'mine' ? 'Pick up an unassigned thread with <kbd>A</kbd>, or switch to All.' : 'New WhatsApp messages and emails land here. Closed threads are under “Closed”.') + '</span></li>') + '</ul></section>';
  }

  // ---- thread --------------------------------------------------------------------------------------
  function bubble(m, t) {
    if (m.from === 'note') return '<li class="cv-note"><div class="cv-nb"><span class="cv-nh">' + C.ic('note', 11) + 'Internal note · ' + esc((m.by || '').split(' ')[0]) + '</span><p>' + esc(m.text) + '</p><time datetime="' + new Date(m.t).toISOString() + '">' + C.dt(m.t) + '</time></div></li>';
    if (m.from === 'bot') return '<li class="cv-msg out bot ' + t.ch + '"><div class="cv-b"><p>' + esc(m.text).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + '</p>' + (m.cards ? m.cards.map(function (c) { return '<div class="cv-card-b"><b>' + esc(c.title || '') + '</b>' + (c.sub ? '<span>' + esc(c.sub) + '</span>' : '') + (c.price ? '<em>' + esc(c.price) + '</em>' : '') + '</div>'; }).join('') : '') + (m.buttons && m.buttons.length ? '<div class="cv-qr">' + m.buttons.map(function (b) { return '<span>' + esc(b.label) + '</span>'; }).join('') + '</div>' : '') + '<span class="cv-meta">' + C.ic('bot', 11) + ' Assistant · <time datetime="' + new Date(m.t).toISOString() + '">' + C.tm(m.t) + '</time></span></div></li>';
    var out = m.from === 'out';
    return '<li class="cv-msg ' + (out ? 'out' : 'in') + ' ' + t.ch + '"><div class="cv-b"><p>' + esc(m.text).replace(/\n/g, '<br>') + '</p><span class="cv-meta">' + (out ? esc((m.by || '').split(' ')[0]) + ' · ' : '') + '<time datetime="' + new Date(m.t).toISOString() + '">' + C.tm(m.t) + '</time>' + '' + (out ? '<span class="cv-tick' + (m.read ? ' read' : '') + '" aria-label="' + (m.read ? 'Read' : 'Delivered') + '">✓✓</span>' : '') + '</span></div></li>';
  }
  function dayLabel(ts) { var d = C.dayStart(ts), td = C.dayStart(); return d === td ? 'Today' : d === td - D ? 'Yesterday' : C.dfull(ts); }
  function threadPane(t) {
    if (!t) return '<section class="cv-thread cv-blank"><div class="empty-st">' + C.ic('mail', 22) + '<b>Pick a conversation</b><span>WhatsApp chats and emails from every channel share one inbox. Assign one to yourself with <kbd>A</kbd>, reply with <kbd>R</kbd>, close with <kbd>E</kbd>.</span></div></section>';
    var u = U(), w = waiting(t), ed = canEdit(t), lastDay = 0;
    var tpls = P().tpls.filter(function (x) { return x.ch === t.ch || (t.ch !== 'email' && x.ch === 'wa'); });
    var linked = [];
    if (t.c) { var c = C.contact(t.c); if (c) linked.push('<a class="cv-link" href="#/contacts/' + c.id + '">' + C.ic('user', 12) + esc(c.name) + '</a>'); }
    if (t.d) { var d = C.deal(t.d); if (d) linked.push('<a class="cv-link" href="#/deals/' + d.id + '">' + C.ic('deal', 12) + esc(d.name.split(' — ').pop()) + '</a>'); }
    var msgs = t.msgs.map(function (m) { var k = C.dayStart(m.t), sep = k !== lastDay ? '<li class="cv-day"><span>' + dayLabel(m.t) + '</span></li>' : ''; lastDay = k; return sep + bubble(m, t); }).join('');
    return '<section class="cv-thread" aria-label="Conversation with ' + esc(t.who.name) + '">' +
      '<header class="cv-th"><a class="cv-back" href="#/conversations">' + C.ic('chev-l', 14) + '<span>All</span></a>' +
      '<div class="cv-tt"><h2>' + chIco(t.ch, 12) + '<span class="tr">' + esc(t.who.name) + '</span></h2><p class="muted sm tr">' + (t.subj ? esc(t.subj) + ' · ' : '') + esc(t.ch === 'wa' ? (t.who.phone || '') : (t.who.email || '')) + ' · ' + esc(t.id) + '</p>' + (linked.length ? '<div class="cv-links">' + linked.join('') + '</div>' : '') + '</div>' +
      '<div class="cv-ta"><label class="sr" for="cv-own">Assignee</label><select id="cv-own" class="sel sm" data-ch="cv-own"' + (ed ? '' : ' disabled') + '><option value="">Unassigned</option>' + opts(P().users.map(function (x) { return [x.name, x.name + (x.name === C.me().name ? ' (me)' : '')]; }), t.owner || '') + '</select>' +
      '<div class="seg" role="group" aria-label="Status">' + [['open', 'Open'], ['pending', 'Pending'], ['closed', 'Closed']].map(function (s) { return '<button type="button" data-act="cv-status" data-v="' + s[0] + '" aria-pressed="' + (t.status === s[0]) + '">' + s[1] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn sm ghost" data-act="cv-snooze" title="Pending until tomorrow, 10 am">' + C.ic('clock', 13) + 'Snooze</button>' +
      '<button type="button" class="btn sm" data-act="cv-log">' + C.ic('clip', 13) + 'Log to record</button>' +
      (!t.c && !t.orbit ? '<button type="button" class="btn sm" data-act="cv-newc">' + C.ic('plus', 13) + 'Create contact</button>' : '') + '</div></header>' + (C.cvBotBar ? C.cvBotBar(t) : '') +
      (w != null ? '<div class="cv-sla ' + slaState(w) + '" role="status">' + C.ic('clock', 13) + '<span>First reply ' + (slaState(w) === 'breach' ? 'overdue: waiting ' : 'due: waiting ') + '<b data-cvw="' + t.id + '">' + C.clock(w) + '</b> of ' + P().route.sla + ' business minutes</span></div>' : t.firstResp != null ? '<div class="cv-sla met">' + C.ic('check', 13) + '<span>First reply in ' + C.fmtMin(t.firstResp) + '</span></div>' : '') +
      '<ol class="cv-msgs" id="cv-msgs" aria-live="polite">' + msgs + '</ol>' +
      '<form class="cv-comp ' + u.mode + '" data-form="cv-send"><div class="cv-ct"><div class="seg" role="group" aria-label="Message type"><button type="button" data-act="cv-mode" data-v="reply" aria-pressed="' + (u.mode === 'reply') + '">' + C.ic(t.ch === 'wa' ? 'wa' : 'mail', 12) + 'Reply</button><button type="button" data-act="cv-mode" data-v="note" aria-pressed="' + (u.mode === 'note') + '">' + C.ic('note', 12) + 'Internal note</button></div>' +
      (u.mode === 'reply' ? '<label class="sr" for="cv-tpl">Canned reply</label><select id="cv-tpl" class="sel sm" data-ch="cv-tpl"><option value="">Canned replies…</option>' + opts(tpls.map(function (x) { return [x.id, x.name]; }), '') + '</select>' : '') + '</div>' +
      '<label class="sr" for="cv-txt">' + (u.mode === 'note' ? 'Internal note (only your team sees it)' : 'Reply on ' + chName(t.ch)) + '</label><textarea id="cv-txt" name="text" rows="3" required placeholder="' + (u.mode === 'note' ? 'Only your team sees notes. Mention context for whoever picks this up.' : 'Reply on ' + chName(t.ch) + '…') + '"></textarea>' +
      '<div class="cv-cf"><button type="button" class="btn sm ghost" data-act="cv-sim" title="Play the customer’s next message">' + C.ic('reply', 13) + 'Customer replies</button><span class="grow"></span><span class="muted sm">' + (u.mode === 'note' ? 'Team only' : 'Sends as ' + C.me().name.split(' ')[0]) + ' · <kbd>' + C.mod + '</kbd><kbd>↵</kbd></span><button class="btn pri sm">' + C.ic(u.mode === 'note' ? 'note' : 'send', 13) + (u.mode === 'note' ? 'Add note' : 'Send') + '</button></div></form></section>';
  }

  // ---- context -------------------------------------------------------------------------------------
  function ctxPane(t) {
    if (!t) return '<aside class="cv-ctx" aria-label="Details"></aside>';
    var c = t.c && C.contact(t.c), co = c && c.co && C.company(c.co), h = '';
    if (c) {
      h += '<section class="cv-card"><div class="cv-pc">' + C.avatar(c.name, 40) + '<div><a href="#/contacts/' + c.id + '"><b>' + esc(c.name) + '</b></a><span class="muted sm">' + esc(c.role) + (co ? ' · <a href="#/companies/' + co.id + '">' + esc(co.name) + '</a>' : '') + '</span></div></div>' +
        '<dl class="cv-dl"><dt>Phone</dt><dd>' + esc(c.phone) + '</dd><dt>Email</dt><dd class="tr">' + esc(c.email) + '</dd><dt>City</dt><dd>' + esc(c.city) + '</dd><dt>Owner</dt><dd>' + esc(c.owner) + '</dd>' + (c.life ? '<dt>Lifecycle</dt><dd>' + esc(c.life) + '</dd>' : '') + (c.cf && c.cf.lang ? '<dt>Language</dt><dd>' + esc(c.cf.lang) + '</dd>' : '') + (c.cf && c.cf.bestTime ? '<dt>Best time</dt><dd>' + esc(c.cf.bestTime) + '</dd>' : '') + '</dl></section>';
      var ds = P().deals.filter(function (d) { return C.assoc('contact', c.id, 'deal').indexOf(d.id) > -1; });
      h += '<section class="cv-card"><h3>' + C.ic('deal', 13) + 'Deals <span class="count-b">' + ds.length + '</span></h3>' + (ds.length ? '<ul class="cv-rl">' + ds.slice(0, 5).map(function (d) { var s = C.pstage(d.pipe, d.stage); return '<li><a href="#/deals/' + d.id + '" class="tr">' + esc(d.name.split(' — ').pop()) + '</a><span><i style="background:' + s.color + '"></i>' + esc(s.label) + ' · ' + C.rs(C.dealVal(d)) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted sm">No deals yet.</p>') + '</section>';
      var T = C.S().tasks.filter(function (x) { return !x.done && ((x.ref && ((x.ref.t === 'contact' && x.ref.id === c.id) || (x.ref.t === 'deal' && ds.some(function (d) { return d.id === x.ref.id; })))) || (c.leadId && x.leadId === c.leadId)); }).sort(function (a, b) { return a.due - b.due; });
      h += '<section class="cv-card"><h3>' + C.ic('tasks', 13) + 'Open tasks <span class="count-b">' + T.length + '</span></h3>' + (T.length ? '<ul class="cv-rl">' + T.slice(0, 4).map(function (x) { return '<li><span class="tr">' + esc(x.text) + '</span><span class="' + (x.due < Date.now() ? 'late' : 'muted') + '">' + C.dshort(x.due) + ', ' + C.tm(x.due) + '</span></li>'; }).join('') + '</ul>' : '') +
        '<form class="cv-task" data-form="cv-task"><label class="sr" for="cv-tk">New task</label><input id="cv-tk" name="text" required placeholder="e.g. Send revised quote" autocomplete="off"><label class="sr" for="cv-tw">Due</label><select id="cv-tw" name="when" class="sel sm"><option value="2">In 2 hours</option><option value="t" selected>Tomorrow, 11 am</option><option value="3">In 3 days</option></select><button class="btn sm">Create task</button></form></section>';
    } else {
      h += '<section class="cv-card cv-unknown">' + C.ic('user', 18) + '<b>Not in your CRM yet</b><p class="muted sm">' + esc(t.who.name) + ' isn’t linked to a contact. Create one to keep the history, add a deal and assign an owner.</p><button type="button" class="btn sm pri" data-act="cv-newc">' + C.ic('plus', 13) + 'Create contact</button><button type="button" class="btn sm" data-act="cv-log">Link to an existing record</button></section>';
    }
    if (t.logged && t.logged.length) h += '<section class="cv-card"><h3>' + C.ic('clip', 13) + 'Logged to</h3><ul class="cv-rl">' + t.logged.map(function (r) { return '<li><a href="' + C.refHref(r) + '">' + esc(r.name) + '</a><span class="muted">' + C.rel(r.at) + '</span></li>'; }).join('') + '</ul></section>';
    return '<aside class="cv-ctx" aria-label="Contact details">' + h + '</aside>';
  }

  V.conversations = {
    title: function () { var t = C.cur && C.cur.arg && th(C.cur.arg); return t ? t.who.name : 'Conversations'; },
    render: function () {
      if (C.orbitSync) C.orbitSync();
      var t = C.cur.arg && th(C.cur.arg); if (t && !visible(t)) t = null;
      var open = count(function (x) { return x.status === 'open'; }), un = count(function (x) { return x.unread && x.status !== 'closed'; });
      return '<header class="page-h cv-ph' + (t ? ' has-t' : '') + '"><div><h1>Conversations</h1><p class="sub">Web chat, WhatsApp, Instagram and email in one inbox · ' + open + ' open · ' + un + ' unread</p></div></header>' +
        '<div class="cv-app' + (t ? ' has-t' : '') + '">' + listPane(t && t.id) + threadPane(t) + ctxPane(t) + '</div>';
    },
    mount: function () {
      var t = C.cur.arg && th(C.cur.arg);
      if (t && t.unread) { t.unread = false; t.msgs.forEach(function (m) { m.read = true; }); C.save(); C.badges(); var a = $('.cv-item[data-tid="' + t.id + '"]'); if (a) a.classList.remove('unread'); var dot = a && a.querySelector('.cv-dot'); if (dot) dot.remove(); }
      var box = $('#cv-msgs'); if (box) box.scrollTop = box.scrollHeight;
      var s = $('.cv-item.sel'); if (s && s.scrollIntoView) { var l = $('#cv-items'); if (l && (s.offsetTop < l.scrollTop || s.offsetTop > l.scrollTop + l.clientHeight - 60)) l.scrollTop = s.offsetTop - 80; }
      if (C.motion() && !C.noFx && box) gsap.from('#cv-msgs > li:last-child', { y: 8, opacity: 0, duration: .35, ease: 'power2.out', clearProps: 'all' });
    }
  };

  // ---- actions -------------------------------------------------------------------------------------
  function cur() { return C.cur && C.cur.name === 'conversations' && C.cur.arg ? th(C.cur.arg) : null; }
  function listSync() { var ul = $('#cv-items'); if (!ul) return; C.rerender(); var q = $('#cv-q'); if (q && document.activeElement !== q && C._cvq) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  C.acts['cv-box'] = function (el) { U().box = el.dataset.v; C.rerender(); var b = $('[data-act="cv-box"][data-v="' + el.dataset.v + '"]'); if (b) b.focus(); };
  C.ins['cv-q'] = function (el) { U().q = el.value; C._cvq = true; clearTimeout(C._cvqt); C._cvqt = setTimeout(function () { listSync(); C._cvq = false; }, 140); };
  C.chs['cv-st'] = function (el) { U().st = el.value; C.rerender(); var x = $('#cv-st'); if (x) x.focus(); };
  C.chs['cv-chf'] = function (el) { U().ch = el.value; C.rerender(); var x = $('#cv-chf'); if (x) x.focus(); };
  C.acts['cv-mode'] = function (el) { U().mode = el.dataset.v; C.rerender(); var x = $('#cv-txt'); if (x) x.focus(); };
  C.chs['cv-tpl'] = function (el) {
    var t = cur(), tp = P().tpls.filter(function (x) { return x.id === el.value; })[0], ta = $('#cv-txt'); if (!t || !tp || !ta) return;
    var c = t.c && C.contact(t.c), d = t.d && C.deal(t.d);
    ta.value = C.fill(tp.body, { name: c ? c.name : t.who.name.replace(/^\+.*/, 'there'), owner: t.owner || C.me().name, service: d ? d.name.split(' — ').pop() : 'your project', city: c ? c.city : '' });
    el.value = ''; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  };
  C.chs['cv-own'] = function (el) {
    var t = cur(); if (!t) return; if (!canEdit(t)) { C.deny('reassign conversations owned by others'); el.value = t.owner || ''; return; }
    var from = t.owner, to = el.value || null; t.owner = to; t.updated = Date.now();
    C.audit('assign', { t: 'convo', id: t.id, name: t.who.name }, 'Assignee', from || 'Unassigned', to || 'Unassigned');
    if (to && to !== C.me().name) C.notify(C.me().name.split(' ')[0] + ' assigned you a ' + chName(t.ch) + ' conversation with ' + t.who.name, '#/conversations/' + t.id, 'user');
    C.save(); C.rerender(); C.toast(to ? 'Assigned to ' + to.split(' ')[0] : 'Unassigned', { icon: 'user', undo: function () { t.owner = from; C.save(); C.rerender(); } });
    var x = $('#cv-own'); if (x) x.focus();
  };
  function setStatus(t, s, why) {
    if (!canEdit(t)) return C.deny('change conversations owned by others');
    var from = t.status; if (from === s) return;
    t.status = s; t.snooze = s === 'pending' ? t.snooze : null; if (s === 'closed') t.unread = false; t.updated = Date.now();
    C.audit('status', { t: 'convo', id: t.id, name: t.who.name }, 'Status', from, s + (why ? ' (' + why + ')' : ''));
    C.save(); C.rerender(); C.badges();
    C.toast(t.who.name + ' → ' + (s === 'closed' ? 'Closed' : s === 'pending' ? 'Pending' + (why ? ' · ' + why : '') : 'Open'), { icon: s === 'closed' ? 'check' : 'clock', undo: function () { t.status = from; C.save(); C.rerender(); C.badges(); } });
  }
  C.acts['cv-status'] = function (el) { var t = cur(); if (t) setStatus(t, el.dataset.v); };
  C.acts['cv-snooze'] = function () { var t = cur(); if (!t) return; var d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); t.snooze = d.getTime(); setStatus(t, 'pending', 'until tomorrow 10 am'); };
  C.forms['cv-send'] = function (f) {
    var t = cur(), txt = (f.elements.text.value || '').trim(); if (!t || !txt) return;
    if (t.orbit && C.cvOrbitSend && C.cvOrbitSend(t, txt, U().mode)) return;
    var mode = U().mode, now = Date.now(), me = C.me().name;
    if (mode === 'note') { t.msgs.push({ id: 'm' + now, t: now, from: 'note', by: me, text: txt }); }
    else {
      t.msgs.push({ id: 'm' + now, t: now, from: 'out', by: me, text: txt, read: false, sim: true });
      if (t.firstResp == null) { var fi = t.msgs.filter(function (m) { return m.from === 'in'; })[0]; if (fi) t.firstResp = Math.max(1, Math.round(C.bizMin(fi.t, now))); }
      if (!t.owner) t.owner = me;
      if (t.status === 'closed') t.status = 'open';
      var rr = recRef(t); if (rr) C.pact(t.ch === 'wa' ? 'wa' : 'email', (t.ch === 'wa' ? 'WhatsApp' : 'Email') + ' sent from Conversations: ' + txt.slice(0, 160), rr, me);
      setTimeout(function () { var m = t.msgs[t.msgs.length - 1]; if (m && m.from === 'out') { m.read = true; C.save(); var k = $$('.cv-tick'); if (k.length && C.cur.arg === t.id) k[k.length - 1].classList.add('read'); } }, 2200);
    }
    t.updated = now; t.unread = false; C.save(); C.rerender(); C.badges();
    C.toast(mode === 'note' ? 'Internal note added' : chName(t.ch) + ' sent', { icon: mode === 'note' ? 'note' : 'send' });
    var ta = $('#cv-txt'); if (ta) ta.focus({ preventScroll: true });
  };
  C.acts['cv-sim'] = function () {
    var t = cur(); if (!t) return; if (t.orbit && C.cvOrbitSim) { C.cvOrbitSim(t); return; } var pool = REPLIES[t.ch], now = Date.now(), txt = pool[t.msgs.length % pool.length];
    t.msgs.push({ id: 'm' + now, t: now, from: 'in', text: txt, read: true }); t.updated = now; if (t.status !== 'open') t.status = 'open';
    var rr = recRef(t); if (rr) C.pact(t.ch === 'wa' ? 'wa' : 'email', (t.ch === 'wa' ? 'WhatsApp' : 'Email') + ' received: ' + txt, rr, t.owner || C.me().name);
    C.save(); C.rerender(); C.toast(t.who.name + ' replied', { icon: 'reply' });
  };
  C.acts['cv-log'] = function () {
    var t = cur(); if (!t) return;
    var cs = P().contacts.filter(C.visible).slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }), ds = P().deals.filter(C.visible).filter(C.dealOpen).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    C.dialog('Log conversation to a record', '<p class="hint">Adds a summary of this ' + chName(t.ch) + ' thread (' + t.msgs.filter(function (m) { return m.from !== 'note'; }).length + ' messages) to the record’s timeline and links the thread to it.</p>' +
      '<div class="field"><label for="cv-lr">Record</label><select id="cv-lr" name="r" required><option value="">Choose a contact or deal…</option><optgroup label="Deals">' + ds.map(function (d) { return '<option value="deal:' + d.id + '"' + (t.d === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('') + '</optgroup><optgroup label="Contacts">' + cs.map(function (c) { return '<option value="contact:' + c.id + '"' + (!t.d && t.c === c.id ? ' selected' : '') + '>' + esc(c.name) + (c.co ? ' · ' + esc((C.company(c.co) || {}).name || '') : '') + '</option>'; }).join('') + '</optgroup></select></div>' +
      '<div class="field"><label for="cv-ls">Summary (optional)</label><input id="cv-ls" name="s" autocomplete="off" placeholder="e.g. Asked for a compact-quartz alternative"></div>', 'Log to record', function (fd) {
        var v = fd.get('r'); if (!v) return false; var p = v.split(':'), rec = p[0] === 'deal' ? C.deal(p[1]) : C.contact(p[1]); if (!rec) return false;
        if (p[0] === 'deal') { t.d = rec.id; if (!t.c && rec.c) t.c = rec.c; } else t.c = rec.id;
        var ref = p[0] === 'deal' ? { c: rec.c, co: rec.co, d: rec.id } : { c: rec.id, co: rec.co }, s = (fd.get('s') || '').trim(), n = t.msgs.filter(function (m) { return m.from !== 'note'; }).length;
        C.pact('convo', chName(t.ch) + ' conversation logged (' + n + ' messages' + (t.subj ? ', “' + t.subj + '”' : '') + ')' + (s ? ': ' + s : ': “' + last(t).text.slice(0, 90) + '”'), ref, C.me().name);
        t.logged = t.logged || []; t.logged.unshift({ t: p[0], id: rec.id, name: rec.name, at: Date.now() });
        C.audit('link', C.refOf(p[0], rec), 'Conversation', '', t.id + ' · ' + t.who.name);
        C.save(); setTimeout(C.rerender, 20); C.toast('Logged to ' + rec.name, { icon: 'clip' });
      });
  };
  C.acts['cv-newc'] = function () {
    var t = cur(); if (!t) return;
    var ph = t.ch === 'wa' ? t.who.phone || '' : '', em = t.ch === 'email' ? t.who.email || '' : '';
    C.dialog('Create contact', '<div class="field"><label for="cv-nn">Full name</label><input id="cv-nn" name="name" required autocomplete="off" value="' + (/^\+/.test(t.who.name) ? '' : esc(t.who.name)) + '" placeholder="Ask their name in the chat"></div>' +
      '<div class="row2"><div class="field"><label for="cv-np">Phone</label><input id="cv-np" name="phone" value="' + esc(ph) + '" autocomplete="off"></div><div class="field"><label for="cv-ne">Email</label><input id="cv-ne" name="email" type="email" value="' + esc(em) + '" autocomplete="off"></div></div>' +
      '<div class="row2"><div class="field"><label for="cv-nc">City</label><input id="cv-nc" name="city" autocomplete="off" placeholder="e.g. Noida"></div><div class="field"><label for="cv-no">Owner</label><select id="cv-no" name="owner">' + P().users.map(function (u) { return '<option' + (u.name === (t.owner || C.me().name) ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></div></div>', 'Create contact', function (fd) {
        var name = (fd.get('name') || '').trim(); if (!name) return false;
        var p = P(), c = { id: C.nextId(p.contacts, 'P-', 300), name: name, co: null, role: 'Homeowner', phone: (fd.get('phone') || '').trim() || '—', email: (fd.get('email') || '').trim() || '—', city: (fd.get('city') || '').trim() || '—', owner: fd.get('owner'), leadId: null, created: Date.now(), life: 'Lead', source: t.ch === 'wa' ? 'whatsapp' : 'web', tags: [], cf: { waOptIn: t.ch === 'wa' ? 'Yes' : '' } };
        p.contacts.unshift(c); t.c = c.id; t.who = { name: c.name, phone: c.phone, email: c.email }; if (!t.owner) t.owner = c.owner;
        C.pact('system', 'Contact created from a ' + chName(t.ch) + ' conversation', { c: c.id }, C.me().name);
        C.pact('convo', chName(t.ch) + ' conversation linked: “' + t.msgs.filter(function (m) { return m.from === 'in'; })[0].text.slice(0, 100) + '”', { c: c.id }, C.me().name);
        C.audit('create', C.refOf('contact', c), 'from conversation', '', t.id);
        if (C.fire) C.fire('contact.created', { t: 'contact', rec: c });
        C.save(); setTimeout(C.rerender, 20); C.toast('Contact ' + c.name + ' created', { icon: 'user' });
      });
  };
  C.forms['cv-task'] = function (f) {
    var t = cur(); if (!t || !t.c) return; var txt = f.elements.text.value.trim(); if (!txt) return;
    var w = f.elements.when.value, d = new Date(); if (w === '2') d = new Date(Date.now() + 2 * Hr); else { d.setDate(d.getDate() + (w === '3' ? 3 : 1)); d.setHours(11, 0, 0, 0); }
    var ref = t.d ? { t: 'deal', id: t.d } : { t: 'contact', id: t.c };
    C.addRefTask(ref, txt, d.getTime(), 15, t.owner || C.me().name);
    C.rerender(); C.toast('Task created on ' + C.refName(ref), { icon: 'tasks' });
  };

  // keyboard: j/k move, e close, a assign to me, r reply; Cmd/Ctrl+Enter sends
  document.addEventListener('keydown', function (e) {
    if (!C.cur || C.cur.name !== 'conversations' || document.querySelector('dialog[open]')) return;
    var tg = e.target, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName);
    if (tg.id === 'cv-txt' && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); var f = tg.form; if (f && f.requestSubmit) f.requestSubmit(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = cur(), L = filtered(), i = t ? L.map(function (x) { return x.id; }).indexOf(t.id) : -1;
    if (e.key === 'j' || e.key === 'k') { var n = L[e.key === 'j' ? Math.min(L.length - 1, i + 1) : Math.max(0, i - 1)]; if (n) { location.hash = '#/conversations/' + n.id; e.preventDefault(); } }
    else if (e.key === 'e' && t) { setStatus(t, t.status === 'closed' ? 'open' : 'closed'); e.preventDefault(); }
    else if (e.key === 'a' && t) { if (!canEdit(t)) { C.deny('take over conversations owned by others'); return; } var me = C.me().name, from = t.owner; if (from === me) return; t.owner = me; C.audit('assign', { t: 'convo', id: t.id, name: t.who.name }, 'Assignee', from || 'Unassigned', me); C.save(); C.rerender(); C.toast('Assigned to you', { icon: 'user', undo: function () { t.owner = from; C.save(); C.rerender(); } }); e.preventDefault(); }
    else if (e.key === 'r' && t) { var x = $('#cv-txt'); if (x) { x.focus(); e.preventDefault(); } }
  });
  // live first-reply timers
  setInterval(function () { $$('[data-cvw]').forEach(function (el) { var t = th(el.dataset.cvw); if (!t) return; var w = waiting(t); if (w != null) el.textContent = C.clock(w); }); }, 1000);
})();
