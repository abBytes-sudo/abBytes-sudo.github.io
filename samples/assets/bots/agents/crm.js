/* Agent: CRM assistant (staff-facing, scripted, no AI). The team side of Orbit Assistants, one workspace per fictional business.
   Business comes from bot.ctx.biz: realty | support | build | clinic | salon | dining (default realty).
   Data: seeded demo CRM leads + team per business (bot.db 'leads:<biz>', 'team:<biz>', 'tasks:<biz>', 'calls:<biz>', 'sent:<biz>', 'undo:<biz>'),
   merged with the real leads the visitor created in that business's customer chat (Orbit.leads, agent === biz, not seed).
   Capabilities: ranked call list with a visible score, follow-ups due, WhatsApp drafts, team split with Apply/Undo, assign, snooze, won/lost,
   load check, daily summary, find a lead, log a call, tasks and reminders.
   Exposes window.Orbit.crm = { api, on, samples, biz } for crm-ui.js (the workspace skin). Demo only: fictional data, nothing leaves the browser. */
(function () {
  'use strict';
  var O = window.Orbit, N = O.nlp, B = function (l, v) { return { label: l, value: v }; };
  var H = 36e5, DAY = 864e5, PAGE_T = Date.now();
  var CHAN = { Web: 'web', WhatsApp: 'whatsapp', Instagram: 'instagram' };
  var IDS = ['realty', 'support', 'build', 'clinic', 'salon', 'dining'];

  /* ---------- small helpers ---------- */
  function two(n) { return ('0' + n).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function dayStart(off) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + (off || 0)); return d; }
  function parseDay(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function plural(n, w, pl) { return n + ' ' + (n === 1 ? w : (pl || w + 's')); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function first(n) { return String(n || 'there').split(/\s+/)[0]; }
  function shortName(n) { var p = String(n).split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1].charAt(0) + '.' : p[0]; }
  function initials(n) { var p = String(n || '?').replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean); return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase(); }
  function hrs(h) { if (h < 1) return 'under an hour'; if (h < 48) return Math.round(h) + ' h'; return Math.round(h / 24) + ' days'; }
  function agoTxt(ts) { if (!ts) return 'no contact yet'; var m = Math.max(1, Math.round((Date.now() - ts) / 6e4)); if (m < 60) return m + ' min ago'; if (m < 1440) return Math.round(m / 60) + ' h ago'; var d = Math.round(m / 1440); return d + (d === 1 ? ' day ago' : ' days ago'); }
  function mask(p) { var d = String(p || '').replace(/\D/g, ''); if (d.length < 6) return 'no phone on file'; return (d.length > 10 ? '+' + d.slice(0, d.length - 10) + ' ' : '') + '••••• ' + d.slice(-5); }
  function say(bot, t, o) { o = o || {}; if (o.delay == null) o.delay = 140; return bot.say(t, o); }
  function bizName(biz) { return (O.agents[biz] && O.agents[biz].business) || ({ realty: 'Alderway Homes', support: 'Northlane', build: 'Ashlar & Co.', clinic: 'Calder Clinic', salon: 'Maison Verve', dining: 'Tamarind Row' })[biz] || biz; }

  /* ---------- per-business configuration ---------- */
  var BIZ = {
    realty: { pre: 'RE', cur: '₹', cc: '+91', vref: 5000000, mid: 'Visit booked', bookWord: 'visit', bookTxt: 'visit booked', bookIs: 'a visit is booked', noun: 'enquiry', me: 'aditi',
      team: [['aditi', 'Aditi Rao', 'Senior consultant', 'indiranagar koramangala domlur buy kannada'], ['dev', 'Dev Kulkarni', 'Rentals', 'hsr whitefield jayanagar rent hindi'], ['zara', 'Zara Khan', 'Villas and new launches', 'sarjapur hebbal villa buy urdu'], ['ishaan', 'Ishaan Bose', 'Associate', 'jp-nagar jayanagar rent tamil']],
      tpl: ['booked'], vtag: 'rent' },
    support: { pre: 'NL', cur: '$', cc: '+1', vref: 260, mid: 'Case open', bookWord: 'pickup', bookTxt: 'pickup booked', bookIs: 'a pickup is booked', noun: 'case', me: 'asha',
      team: [['asha', 'Asha Menon', 'Returns lead', 'returns exchange refunds'], ['tom', 'Tom Whitaker', 'Delivery desk', 'delivery courier customs'], ['lena', 'Lena Fischer', 'VIP care', 'vip restock loyalty'], ['noah', 'Noah Brooks', 'Support associate', 'refunds restock instagram']],
      tpl: ['booked', 'vip', 'delivery', 'restock', 'returns'] },
    build: { pre: 'AC', cur: '₹', cc: '+91', vref: 600000, mid: 'Quote sent', bookWord: 'site visit', bookTxt: 'site visit booked', bookIs: 'a site visit is booked', noun: 'enquiry', me: 'karan',
      team: [['karan', 'Karan Malhotra', 'Estimator', 'kitchen granite quartz stone cladding bathroom'], ['rhea', 'Rhea Kapoor', 'Outdoor projects', 'patio slate landscaping paving terrace'], ['imran', 'Imran Siddiqui', 'Site lead', 'full-home renovation villa'], ['tanvi', 'Tanvi Joshi', 'Coordinator', 'bathroom flooring']],
      tpl: ['booked'] },
    clinic: { pre: 'CC', cur: '₹', cc: '+91', vref: 1200, mid: 'Appt booked', bookWord: 'appointment', bookTxt: 'appointment booked', bookIs: 'an appointment is booked', noun: 'patient', me: 'nora',
      team: [['nora', 'Nora Pillai', 'Front desk', 'no-show recall new-patient hindi'], ['meera', 'Meera Joshi', 'Dental coordinator', 'dental recall'], ['arjun', 'Arjun Nambiar', 'Physio and skin', 'physio skin'], ['sana', 'Sana Hussain', 'Patient care', 'new-patient general vaccination tamil']],
      tpl: ['booked', 'no-show', 'recall', 'new-patient'] },
    salon: { pre: 'MV', cur: '₹', cc: '+91', vref: 6000, mid: 'Booked', bookWord: 'booking', bookTxt: 'booking confirmed', bookIs: 'a booking is confirmed', noun: 'client', me: 'tara',
      team: [['anika', 'Anika Dsouza', 'Senior stylist', 'colour balayage bridal'], ['tara', 'Tara Kulkarni', 'Stylist', 'cut rebook waitlist'], ['leila', 'Leila Hamid', 'Skin and spa', 'facial packages'], ['rishi', 'Rishi Menon', 'Front desk', 'waitlist hindi bookings']],
      tpl: ['booked', 'waitlist', 'rebook', 'packages', 'bridal'] },
    dining: { pre: 'TR', cur: '₹', cc: '+91', vref: 30000, mid: 'Table held', bookWord: 'booking', bookTxt: 'table held', bookIs: 'a table is held', noun: 'guest', me: 'kabir',
      team: [['kabir', 'Kabir Anand', 'Events manager', 'event private-room birthday anniversary'], ['isha', 'Isha Rao', 'Reservations', 'table waitlist'], ['omar', 'Omar Siddiqui', 'Host and VIP', 'vip table'], ['diya', 'Diya Menon', 'Guest relations', 'birthday vegan']],
      tpl: ['booked', 'private-room', 'event', 'waitlist'] }
  };
  /* seed rows: name, last5, source, stage, owner, intent, ask, intentLevel, value, valueLabel, createdH, inboundH, contactH, due[dayOffset,hour], bookedSlot, tags, area, notes, extra
     (inboundH smaller than contactH means the customer wrote after our last contact, so they are waiting for us. extra: hours since won/lost, or days snoozed) */
  var ROWS = {
    realty: [
      ['Priya Nair', '42117', 'WhatsApp', 'new', null, '3 BHK rent in Indiranagar, asked about a Saturday visit', 'the 3 BHK rental in Indiranagar', 'strong', 1680000, '₹1.4 L / month', 2, 2, null, [0, 12], '', 'indiranagar rent', 'Indiranagar', 'Wants a pet-friendly building.'],
      ['Priya Shetty', '50893', 'Instagram', 'new', null, '2 BHK to buy near Koramangala, budget ₹1.1 Cr', 'the 2 BHK near Koramangala', 'strong', 11000000, '₹1.1 Cr budget', 5, 5, null, [0, 14], '', 'koramangala buy', 'Koramangala', 'Found us through a reel.'],
      ['Rohit Menon', '73310', 'Web', 'mid', 'aditi', 'Visit booked, 4 BHK villa on Sarjapur Road', 'the Sarjapur Road villa', 'ready', 28500000, '₹2.85 Cr', 30, 6, 20, [0, 10], 'Sun 11 am', 'sarjapur villa buy', 'Sarjapur Road', 'Bringing his father to the visit.'],
      ['Anjali Rao', '18265', 'WhatsApp', 'contacted', 'dev', '2 BHK rent in HSR Layout, up to ₹45 K a month', 'the 2 BHK rental in HSR Layout', 'mid', 540000, '₹45 K / month', 50, 4, 26, [-1, 17], '', 'hsr rent', 'HSR Layout', 'Prefers unfurnished.'],
      ['Kabir Sethi', '90456', 'Instagram', 'new', null, 'Studio rent near Whitefield', 'the studio near Whitefield', 'light', 300000, '₹25 K / month', 1, 1, null, [0, 16], '', 'whitefield rent', 'Whitefield', 'Moving in next month.'],
      ['Meera Iyer', '66724', 'WhatsApp', 'contacted', 'aditi', '3 BHK to buy in Domlur, wants a second visit', 'the 3 BHK in Domlur', 'strong', 14000000, '₹1.4 Cr', 96, 9, 30, [0, 9], '', 'domlur buy', 'Domlur', 'Loan pre-approved.'],
      ['Arvind Pai', '31908', 'Web', 'mid', 'ishaan', 'Visit booked, 1 BHK rent in Jayanagar', 'the 1 BHK in Jayanagar', 'ready', 240000, '₹20 K / month', 48, 20, 10, [1, 15], 'Fri 5 pm', 'jayanagar rent', 'Jayanagar', ''],
      ['Sana Farooq', '27741', 'WhatsApp', 'won', 'aditi', 'Lease signed, 3 BHK in Koramangala', 'the Koramangala lease', 'ready', 2000000, '₹1.7 L / month', 144, 30, 26, null, '', 'koramangala rent', 'Koramangala', 'Referral from a past tenant.', 28],
      ['Tarun Gowda', '84032', 'Instagram', 'lost', 'zara', 'Went with another broker', 'the Hebbal plot', 'mid', 9000000, '₹90 L', 120, 60, 50, null, '', 'hebbal buy', 'Hebbal', '', 50],
      ['Nikita Reddy', '55619', 'Web', 'snoozed', 'ishaan', 'JP Nagar 2 BHK rent, moving in January', 'the 2 BHK in JP Nagar', 'light', 420000, '₹35 K / month', 72, 50, 44, null, '', 'jp-nagar rent', 'JP Nagar', 'Call after the New Year.', 3],
      ['Lakshmi Varma', '12390', 'WhatsApp', 'contacted', 'dev', '3 BHK rent in Hebbal, around ₹80 K', 'the 3 BHK in Hebbal', 'mid', 960000, '₹80 K / month', 70, 26, 20, [1, 11], '', 'hebbal rent', 'Hebbal', ''],
      ['Faisal Ahmed', '40571', 'Instagram', 'contacted', 'aditi', 'Plot enquiry in Hebbal, budget ₹2 Cr', 'the Hebbal plot', 'strong', 20000000, '₹2 Cr budget', 40, 8, 30, [-1, 10], '', 'hebbal buy', 'Hebbal', 'Asked for a site layout.'],
      ['Ritu Bansal', '61238', 'Web', 'contacted', 'aditi', '2 BHK rent in Koramangala, furnished', 'the furnished 2 BHK in Koramangala', 'mid', 720000, '₹60 K / month', 22, 5, 12, [0, 18], '', 'koramangala rent', 'Koramangala', '']
    ],
    support: [
      ['Maya Okafor', '30218', 'WhatsApp', 'new', null, 'Return request, Harbor Jacket zip split on day two', 'the Harbor Jacket return', 'strong', 210, '$210 order', 2, 2, null, [0, 11], '', 'returns', 'Returns', 'Wants the shipping refunded too.'],
      ['Maya Lindqvist', '77045', 'Web', 'new', null, 'Delivery issue, order NL-10482 stuck for 4 days', 'order NL-10482', 'strong', 96, '$96 order', 6, 6, null, [0, 13], '', 'delivery', 'Delivery', ''],
      ['Oliver Grant', '58612', 'Web', 'contacted', 'tom', 'Marked delivered but not received, NL-10517', 'order NL-10517', 'ready', 138, '$138 order', 60, 7, 20, [-1, 15], '', 'delivery', 'Delivery', 'The courier photo does not match his door.'],
      ['Grace Liu', '14390', 'Instagram', 'new', null, 'Restock alert, Sage Brogue size 42', 'the Sage Brogue in size 42', 'light', 138, '$138 item', 1, 1, null, [0, 15], '', 'restock', 'Restock', ''],
      ['Daniel Cho', '90377', 'WhatsApp', 'mid', 'asha', 'Exchange in progress, Loop Hoodie L to XL', 'the Loop Hoodie exchange', 'mid', 88, '$88 order', 40, 30, 12, [0, 11], 'Label sent', 'exchange returns', 'Returns', ''],
      ['Sofia Alvarez', '66201', 'Web', 'contacted', 'lena', 'VIP asking about early access to the new drop', 'early access to the new drop', 'strong', 380, '$380 lifetime', 90, 10, 18, [0, 15], '', 'vip', 'VIP', 'Orders every month. Reply within the hour.'],
      ['Marcus Reid', '23851', 'Instagram', 'contacted', 'asha', 'Return, Desert Boot too small, wants a refund to card', 'the Desert Boot return', 'strong', 148, '$148 order', 30, 4, 22, [0, 13], 'Pickup Thu', 'returns', 'Returns', ''],
      ['Hannah Berg', '41920', 'WhatsApp', 'contacted', 'asha', 'Refund still pending after 5 days', 'her pending refund', 'ready', 185, '$185 refund', 120, 12, 60, [-1, 10], '', 'returns refunds', 'Returns', 'The payments team said it left on Monday.'],
      ['Isla Campbell', '85530', 'Web', 'won', 'lena', 'Replacement shipped, customer happy', 'the replacement tote', 'mid', 185, '$185 order', 100, 40, 38, null, '', 'returns', 'Returns', '', 30],
      ['Amir Haddad', '10672', 'Instagram', 'lost', 'noah', 'Cancelled the order before it shipped', 'the cancelled order', 'light', 120, '$120 order', 90, 70, 66, null, '', 'refunds', 'Payments', '', 60],
      ['Zoe Hartman', '52746', 'WhatsApp', 'snoozed', 'tom', 'Customs hold on an international order', 'order NL-10533', 'mid', 210, '$210 order', 50, 30, 28, null, '', 'delivery', 'Delivery', 'Waiting for the customs release.', 2]
    ],
    build: [
      ['Arun Pillai', '33180', 'Instagram', 'new', null, 'Quote request, 120 sq ft kitchen in granite', 'the 120 sq ft granite kitchen', 'strong', 530000, '₹4.3 to 6.4 L est.', 2, 2, null, [0, 12], '', 'kitchen granite', 'Kitchen', 'Sent a reference photo on Instagram.'],
      ['Arun Bhatt', '62057', 'Web', 'new', null, 'Patio of about 200 sq ft, next month', 'the 200 sq ft patio', 'strong', 380000, '₹3 to 4.6 L est.', 4, 4, null, [0, 15], '', 'patio slate', 'Patio', 'Mentioned a tight date.'],
      ['Divya Menon', '80214', 'WhatsApp', 'mid', 'karan', 'Quote sent, stone cladding on a 300 sq ft wall', 'the stone cladding quote', 'ready', 240000, '₹2.4 L quote', 60, 6, 30, [0, 11], '', 'cladding stone', 'Cladding', 'Comparing two contractors.'],
      ['Rajiv Shah', '71943', 'Web', 'contacted', 'imran', 'Full-home renovation, 1,800 sq ft, wants a site visit', 'the full-home renovation', 'ready', 2200000, '₹18 to 26 L est.', 50, 5, 20, [0, 15], 'Sat 10 am', 'full-home renovation', 'Full home', 'His brother handles the site.'],
      ['Pooja Venkat', '25908', 'Instagram', 'mid', 'karan', 'Quote sent, bathroom refit of 60 sq ft', 'the bathroom refit quote', 'mid', 220000, '₹2.2 L quote', 100, 40, 32, [-1, 12], '', 'bathroom', 'Bathroom', ''],
      ['Sameer Qureshi', '49631', 'WhatsApp', 'contacted', 'karan', 'Kitchen island in quartz, 3 days since the quote', 'the quartz kitchen island', 'strong', 480000, '₹4.8 L quote', 110, 50, 72, [-2, 10], '', 'kitchen quartz', 'Kitchen', 'Asked for a price match.'],
      ['Neelam Das', '17724', 'Web', 'new', null, 'Driveway paving, about 600 sq ft', 'the 600 sq ft driveway', 'mid', 420000, '₹3.6 to 4.8 L est.', 1, 1, null, [0, 17], '', 'paving landscaping', 'Paving', ''],
      ['Gaurav Iyer', '56388', 'WhatsApp', 'won', 'imran', 'Signed, terrace garden of 250 sq ft', 'the terrace garden', 'ready', 650000, '₹6.5 L', 200, 60, 50, null, '', 'landscaping terrace', 'Terrace', '', 48],
      ['Kavita Rao', '94075', 'Instagram', 'lost', 'rhea', 'Budget too low for slate', 'the slate patio', 'mid', 300000, '₹3 L', 150, 90, 80, null, '', 'patio slate', 'Patio', '', 70],
      ['Yusuf Ali', '38160', 'Web', 'snoozed', 'tanvi', 'Flooring, planning for April', 'the flooring job', 'light', 380000, '₹3.8 L est.', 90, 70, 66, null, '', 'flooring', 'Flooring', '', 4]
    ],
    clinic: [
      ['Rohan Kapoor', '45027', 'WhatsApp', 'new', null, 'New patient, dental clean, evenings only', 'the dental clean', 'strong', 1200, '₹1,200 visit', 2, 2, null, [0, 11], '', 'dental new-patient', 'Dental', 'Works until 6 pm.'],
      ['Rohan Das', '69318', 'Web', 'contacted', 'nora', 'No-show for a skin consult yesterday at 6 pm', 'the missed skin consult', 'strong', 900, '₹900 visit', 72, null, 26, [0, 10], '', 'skin no-show', 'Skin', 'Said work ran late.'],
      ['Kavya Nair', '23844', 'Instagram', 'new', null, 'Asks about an adult flu vaccination', 'the flu vaccination', 'mid', 600, '₹600 visit', 3, 3, null, [0, 14], '', 'general vaccination', 'General', 'Walk-in is fine for her.'],
      ['Imran Sheikh', '81570', 'WhatsApp', 'mid', 'arjun', 'Appointment booked, physiotherapy', 'his physiotherapy session', 'ready', 800, '₹800 visit', 48, 22, 10, [1, 10], 'Thu 6:30 pm', 'physio', 'Physio', 'Knee, after surgery.'],
      ['Ishita Menon', '37201', 'Web', 'contacted', 'meera', 'Recall due, six-month dental clean', 'her six-month dental clean', 'mid', 1200, '₹1,200 visit', 200, null, 50, [0, 9], '', 'dental recall', 'Dental', 'Prefers mornings.'],
      ['Vivek Sharma', '70965', 'WhatsApp', 'contacted', 'nora', 'Recall due, annual check-up, left a voicemail', 'his annual check-up', 'mid', 600, '₹600 visit', 300, null, 30, [-1, 11], '', 'general recall', 'General', ''],
      ['Tanya Bose', '52139', 'Instagram', 'contacted', 'nora', 'No-show for dental, asked to reschedule', 'the missed dental visit', 'strong', 1200, '₹1,200 visit', 96, 6, 30, [-2, 16], '', 'dental no-show', 'Dental', 'Asked for a Saturday.'],
      ['Prakash Rao', '18853', 'Web', 'won', 'sana', 'Rebooked physiotherapy, six sessions', 'his physio plan', 'ready', 4800, '₹4,800 plan', 250, 50, 48, null, '', 'physio', 'Physio', '', 20],
      ['Leela Fernandes', '90412', 'WhatsApp', 'lost', 'meera', 'Moved to another city', 'her recall', 'light', 1200, '₹1,200 visit', 400, 200, 190, null, '', 'dental recall', 'Dental', '', 90],
      ['Aditya Kumar', '36680', 'Web', 'snoozed', 'sana', 'Wants a call after exams', 'his check-up', 'light', 600, '₹600 visit', 60, 40, 36, null, '', 'general', 'General', '', 3],
      ['Zoya Merchant', '64792', 'Instagram', 'new', null, 'Skin consult for acne, wants a dermatologist slot', 'the skin consult', 'strong', 900, '₹900 visit', 1, 1, null, [0, 13], '', 'skin new-patient', 'Skin', '']
    ],
    salon: [
      ['Neha Sethi', '41068', 'Instagram', 'new', null, 'Bridal trial, wedding in six weeks', 'a bridal trial', 'ready', 25000, '₹25,000 package', 1, 1, null, [0, 11], '', 'bridal colour', 'Bridal', 'Wants hair and makeup.'],
      ['Neha Bajaj', '80273', 'WhatsApp', 'contacted', 'tara', 'Rebook due, usual cut and style, last seen 6 weeks ago', 'your usual cut and style', 'mid', 1800, '₹1,800 visit', 200, null, 30, [0, 10], '', 'cut rebook', 'Cut', 'Always books Thursday evenings.'],
      ['Divya Kohli', '27591', 'Web', 'new', null, 'Package enquiry, five facials', 'the five-facial package', 'mid', 9000, '₹9,000 package', 4, 4, null, [0, 15], '', 'facial packages', 'Facial', ''],
      ['Sunita Rao', '59134', 'WhatsApp', 'mid', 'anika', 'Balayage booked', 'your balayage', 'ready', 9500, '₹9,500 service', 72, 26, 14, [1, 10], 'Sat 2 pm', 'balayage colour', 'Colour', 'Hair is level 5, needs lightening.'],
      ['Pallavi Jain', '72806', 'Instagram', 'contacted', 'tara', 'Moved her 4 pm cut to Friday, wants Anika', 'your Friday cut', 'mid', 1500, '₹1,500 visit', 26, 3, 8, [0, 13], '', 'cut', 'Cut', ''],
      ['Rhea Sood', '33417', 'Web', 'contacted', 'tara', 'Rebook due, colour touch-up', 'your colour touch-up', 'mid', 4500, '₹4,500 visit', 300, null, 70, [-1, 12], '', 'colour rebook', 'Colour', ''],
      ['Tanvi Arora', '65920', 'WhatsApp', 'contacted', 'tara', 'Waitlist for a Saturday morning cut', 'a Saturday morning cut', 'mid', 1800, '₹1,800 visit', 20, 5, 12, [0, 9], '', 'cut waitlist', 'Cut', 'Any stylist is fine.'],
      ['Ayesha Khan', '14058', 'Instagram', 'won', 'leila', 'Booked the facial package', 'the facial package', 'ready', 9000, '₹9,000 package', 200, 50, 48, null, '', 'facial packages', 'Facial', '', 22],
      ['Mitali Desai', '88372', 'Web', 'lost', 'anika', 'Wanted a discount on the bridal package', 'the bridal package', 'mid', 25000, '₹25,000 package', 160, 80, 70, null, '', 'bridal', 'Bridal', '', 60],
      ['Komal Puri', '46619', 'WhatsApp', 'snoozed', 'rishi', 'Back from holiday next week', 'your next visit', 'light', 1500, '₹1,500 visit', 50, 40, 36, null, '', 'cut', 'Cut', '', 5]
    ],
    dining: [
      ['Vikram Anand', '38295', 'Web', 'new', null, 'Private room for 14, birthday on 29 Nov', 'the private room for 14', 'ready', 60000, '₹60,000 est. spend', 2, 2, null, [0, 12], '', 'private-room birthday', 'Birthday', 'Wants a vegetarian menu.'],
      ['Vikram Chopra', '71460', 'WhatsApp', 'new', null, 'Table for 6 on Saturday at 8 pm', 'the table for 6', 'strong', 18000, '₹18,000 est. spend', 1, 1, null, [0, 14], '', 'table', 'Table', ''],
      ['Smita Joshi', '25834', 'Instagram', 'contacted', 'isha', 'Waitlist for 2, Friday at 9 pm', 'the Friday table for 2', 'mid', 6000, '₹6,000 est. spend', 24, 3, 8, [0, 14], '', 'waitlist table', 'Waitlist', 'Flexible on time.'],
      ['Rahul Bhatia', '90763', 'WhatsApp', 'mid', 'kabir', 'Table held for an anniversary dinner, party of 4', 'the anniversary table', 'strong', 16000, '₹16,000 est. spend', 40, 18, 12, [0, 12], 'Sat 8 pm', 'table anniversary', 'Table', 'Wants a corner table.'],
      ['Ananya Das', '54017', 'Web', 'contacted', 'kabir', 'Corporate lunch for 20, wants menu options', 'the corporate lunch for 20', 'ready', 90000, '₹90,000 est. spend', 72, 10, 30, [-1, 11], '', 'event private-room', 'Event', 'Needs invoices with GST.'],
      ['Farhan Qureshi', '16282', 'Instagram', 'contacted', 'kabir', 'Birthday cake and decor for 10', 'the birthday set-up for 10', 'strong', 35000, '₹35,000 est. spend', 30, 4, 12, [0, 17], '', 'birthday event', 'Birthday', ''],
      ['Jaya Menon', '83549', 'WhatsApp', 'contacted', 'kabir', 'Wine pairing evening for 8 guests', 'the wine pairing evening', 'strong', 48000, '₹48,000 est. spend', 60, 30, 40, [1, 11], '', 'event vip', 'Event', ''],
      ['Sheetal Rao', '47105', 'Web', 'won', 'omar', 'Booked the chef table for 6', 'the chef table', 'ready', 30000, '₹30,000 est. spend', 150, 40, 36, null, '', 'vip table', 'VIP', '', 16],
      ['Mohit Arya', '62398', 'Instagram', 'lost', 'isha', 'Chose another venue for the group', 'the group booking', 'mid', 24000, '₹24,000 est. spend', 120, 80, 76, null, '', 'table event', 'Table', '', 40],
      ['Gita Iyer', '28871', 'WhatsApp', 'snoozed', 'diya', 'Planning a family lunch in December', 'the family lunch', 'mid', 20000, '₹20,000 est. spend', 40, 30, 28, null, '', 'table', 'Table', '', 6]
    ]
  };
  var TASKROWS = {
    realty: [['Send the Domlur floor plan to Meera Iyer', 1, 11], ['Review rent comparables for HSR Layout', 3, 15]],
    support: [['Check the courier claim for order NL-10517', 1, 12], ['Review this week\'s return reasons', 3, 15]],
    build: [['Send revised kitchen drawings to Arun Pillai', 1, 11], ['Book the stone supplier for Friday', 2, 15]],
    clinic: [['Confirm tomorrow\'s physio slots', 1, 9], ['Call the lab about the recall list', 3, 15]],
    salon: [['Confirm Saturday\'s bridal trial prep', 1, 11], ['Reorder colour stock', 3, 15]],
    dining: [['Send the private-room menu to Vikram Anand', 1, 11], ['Confirm the wine order for Thursday', 2, 15]]
  };

  /* ---------- seeds ---------- */
  function seedLeads(biz) {
    var cfg = BIZ[biz], now = Date.now(), items = ROWS[biz].map(function (r, i) {
      var l = { id: cfg.pre + '-' + (201 + i), name: r[0], phone: cfg.cc + ' ••••• ' + r[1], source: r[2], channel: CHAN[r[2]], stage: r[3], owner: r[4] || null, intent: r[5], ask: r[6], il: r[7], value: r[8], valueLabel: r[9],
        createdAt: now - r[10] * H, lastInbound: r[11] == null ? null : now - r[11] * H, lastContact: r[12] == null ? null : now - r[12] * H, dueAt: r[13] ? dayStart(r[13][0]).getTime() + r[13][1] * H : null,
        booked: !!r[14], when: r[14] || '', tags: r[15].split(' '), area: r[16], notes: r[17] || '', seed: true, touched: false, nextStep: '' };
      if (r[3] === 'won') l.wonAt = now - r[18] * H; if (r[3] === 'lost') l.lostAt = now - r[18] * H;
      if (r[3] === 'snoozed') { l.prev = 'contacted'; var d = dayStart(r[18]); d.setHours(9, 0, 0, 0); l.snoozeUntil = d.getTime(); l.dueAt = l.snoozeUntil; }
      return l;
    });
    return { v: 1, base: Date.now(), items: items };
  }
  function seedTeam(biz) { return BIZ[biz].team.map(function (t) { return { id: t[0], name: t[1], role: t[2], skills: t[3].split(' ') }; }); }
  function seedTasks(biz) { return TASKROWS[biz].map(function (r, i) { return { id: i + 1, title: r[0], due: iso(dayStart(r[1])), time: two(r[2]) + ':00', owner: BIZ[biz].me, lead: '', done: false, created: Date.now() }; }); }

  /* ---------- data layer ---------- */
  function bizOf(bot) { var b = bot.ctx && bot.ctx.biz; return BIZ[b] ? b : 'realty'; }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; }
  function fromOrbit(biz, ol) {
    var cfg = BIZ[biz], p = ol.payload || {}, ts = Date.parse(ol.timestamp) || Date.now(), R = function (n) { return O.money(n, cfg.cur); }, it = ol.intent || '', m = { intent: it || 'Enquiry', il: 'mid', value: 0, vl: 'Value not shared', when: '', tags: [], area: '', hl: [], ask: 'your enquiry' };
    function modeTag(m) { return m === 'sale' ? 'buy' : (m || ''); }
    function low(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    if (biz === 'realty') {
      if (it === 'book_visit') { var pr = num(p.price), rent = p.mode === 'rent'; m = { intent: 'Visit booked, ' + (p.title || 'a listing'), il: 'ready', value: rent ? pr * 12 : pr, vl: pr ? (rent ? R(pr) + ' / month' : R(pr)) : 'Price on listing', when: p.slot || '', tags: [low(p.locality), modeTag(p.mode)], area: p.locality || '', ask: 'the ' + (p.title || 'listing'), hl: [['Listing', p.title], ['Locality', p.locality], ['Visit slot', p.slot], ['Price', pr ? R(pr) : '']] }; }
      else if (it === 'saved_search') { var f = p.filters || {}; m = { intent: 'Saved search, ' + (p.search || 'new listings'), il: 'mid', value: num(f.maxPrice || f.minPrice), vl: f.maxPrice ? 'Up to ' + R(f.maxPrice) : 'Budget not shared', tags: [low([].concat(f.locality || '').join(' ')), modeTag(f.mode)], area: [].concat(f.locality || '').join(', '), ask: 'your saved search', hl: [['Search', p.search], ['Contact', /^[+\d][\d\s-]{8,}$/.test(String(p.contact || '')) ? mask(p.contact) : p.contact]] }; }
    } else if (biz === 'support') {
      if (it === 'return') m = { intent: 'Return request, ' + (p.item || 'an item') + (p.reason ? ' (' + p.reason + ')' : ''), il: 'strong', value: 120, vl: p.resolution ? 'Wants ' + p.resolution : 'Return', tags: ['returns', low(p.resolution)], area: 'Returns', ask: 'your ' + (p.item || 'return'), hl: [['Return', p.rma], ['Order', p.order], ['Item', p.item], ['Reason', p.reason], ['Resolution', p.resolution]] };
      else if (it === 'restock_alert') m = { intent: 'Restock alert, ' + (p.product || 'a product') + (p.size ? ' (' + p.size + ')' : ''), il: 'light', value: 70, vl: 'Restock alert', tags: ['restock'], area: 'Restock', ask: 'the ' + (p.product || 'item') + ' restock', hl: [['Product', p.product], ['Size', p.size], ['Email', p.email]] };
    } else if (biz === 'build') {
      if (it === 'site_visit') { var lo = num(p.estimateLow), hi = num(p.estimateHigh); m = { intent: 'Site visit, ' + (p.project || 'a project') + (p.area ? ' ' + p.area + ' sq ft' : ''), il: 'ready', value: (lo + hi) / 2 || num(p.budget), vl: lo ? R(lo) + ' to ' + R(hi) + ' est.' : 'Estimate pending', when: p.slot || '', tags: String(p.project || '').toLowerCase().split(/[^a-z]+/).filter(Boolean).concat(p.material ? [low(p.material)] : []), area: p.project || '', ask: 'the ' + (p.project || 'project'), hl: [['Project', p.project], ['Area', p.area ? p.area + ' sq ft' : ''], ['Tier', p.tier], ['Estimate', lo ? R(lo) + ' to ' + R(hi) : ''], ['Visit', p.slot], ['Place', p.place]] }; }
    } else if (biz === 'clinic') {
      if (it === 'book') m = { intent: 'Appointment booked, ' + (p.treatment || 'a visit') + (p.doctor ? ' with ' + p.doctor : ''), il: 'ready', value: num(p.fee), vl: p.fee ? R(num(p.fee)) + ' visit' : 'Fee on request', when: [p.date, p.time].filter(Boolean).join(' '), tags: low(p.treatment).split('-').concat(['new-patient']), area: p.treatment || '', ask: 'your ' + (p.treatment || 'appointment'), hl: [['Treatment', p.treatment], ['Doctor', p.doctor], ['When', [p.date, p.time].filter(Boolean).join(' ')], ['Booked for', p.forWhom], ['Ref', p.ref]] };
    } else if (biz === 'salon') {
      var sv = (p.services || []).join(', ');
      if (it === 'book') m = { intent: 'Booking, ' + (sv || 'a service'), il: 'ready', value: num(p.total), vl: p.total ? R(num(p.total)) + ' service' : 'Total pending', when: [p.date, p.time].filter(Boolean).join(' '), tags: low(sv).split('-'), area: sv.split(',')[0] || '', ask: 'your ' + (sv || 'booking'), hl: [['Services', sv], ['Stylist', (p.stylists || []).join(', ')], ['When', [p.date, p.time].filter(Boolean).join(' ')], ['Deposit', p.deposit ? R(num(p.deposit)) : ''], ['Ref', p.ref]] };
      else if (it === 'waitlist') m = { intent: 'Waitlist, ' + (sv || 'a service'), il: 'mid', value: 1800, vl: 'Waitlist', tags: ['waitlist'].concat(low(sv).split('-')), area: sv.split(',')[0] || '', ask: 'a slot for ' + (sv || 'your service'), hl: [['Services', sv], ['Day', p.date], ['Time', p.time], ['Stylist', p.stylist]] };
      else if (it === 'package') m = { intent: 'Package enquiry, ' + (p.package || 'a package'), il: 'mid', value: num(p.price), vl: p.price ? R(num(p.price)) + ' package' : 'Package', tags: ['packages'], area: 'Packages', ask: 'the ' + (p.package || 'package'), hl: [['Package', p.package], ['Price', p.price ? R(num(p.price)) : ''], ['You save', p.saving ? R(num(p.saving)) : '']] };
    } else if (biz === 'dining') {
      var party = num(p.party), when = [p.date, p.time].filter(Boolean).join(' ');
      if (it === 'table') m = { intent: 'Table for ' + (party || '?') + (when ? ', ' + when : ''), il: 'strong', value: party * 3000, vl: party ? R(party * 3000) + ' est. spend' : 'Party size pending', when: when, tags: ['table'].concat(p.occasion ? [low(p.occasion)] : []), area: p.occasion || 'Table', ask: 'the table for ' + (party || 'your group'), hl: [['Party', party || ''], ['When', when], ['Table', p.table], ['Occasion', p.occasion], ['Requests', p.requests], ['Ref', p.ref]] };
      else if (it === 'waitlist') m = { intent: 'Waitlist for ' + (party || '?') + (when ? ', ' + when : ''), il: 'mid', value: party * 3000, vl: 'Waitlist', when: when, tags: ['waitlist', 'table'], area: 'Waitlist', ask: 'the table for ' + (party || 'your group'), hl: [['Party', party || ''], ['When', when], ['Est. wait', p.estWaitMin ? p.estWaitMin + ' min' : '']] };
      else if (it === 'private_dining') m = { intent: 'Private dining for ' + (party || '?') + (p.occasion ? ', ' + p.occasion : ''), il: 'ready', value: party * 4500, vl: party ? R(party * 4500) + ' est. spend' : 'Party size pending', when: when, tags: ['private-room', 'event'].concat(p.occasion ? [low(p.occasion)] : []), area: 'Private room', ask: 'the private room for ' + (party || 'your group'), hl: [['Party', party || ''], ['When', when], ['Occasion', p.occasion]] };
    }
    m.tags = m.tags.filter(Boolean);
    return { id: ol.id, ref: ol.id, name: ol.name || 'Unknown visitor', phone: ol.phone || '', email: ol.email || '', source: ol.channel === 'whatsapp' ? 'WhatsApp' : ol.channel === 'instagram' ? 'Instagram' : 'Web', channel: ol.channel === 'whatsapp' || ol.channel === 'instagram' ? ol.channel : 'web',
      stage: 'new', owner: null, intent: m.intent, ask: m.ask, il: m.il, value: m.value, valueLabel: m.vl, createdAt: ts, lastInbound: ts, lastContact: null, dueAt: ts + 2 * H, booked: !!m.when, when: m.when, tags: m.tags, area: m.area,
      notes: 'Captured by the ' + bizName(biz) + ' chat on ' + (ol.channel || 'web') + '.', hl: m.hl.filter(function (x) { return x[1] != null && x[1] !== ''; }).map(function (x) { return [x[0], String(x[1])]; }), fromChat: true, touched: false, nextStep: '' };
  }
  function syncChat(biz, st) {
    var have = {}, changed = false; st.items.forEach(function (l) { if (l.ref) have[l.ref] = 1; });
    O.leads.list({ agent: biz }).forEach(function (ol) { if (ol.seed || have[ol.id]) return; st.items.unshift(fromOrbit(biz, ol)); have[ol.id] = 1; changed = true; });
    return changed;
  }
  var SHIFT = ['createdAt', 'lastInbound', 'lastContact', 'dueAt', 'wonAt', 'lostAt', 'snoozeUntil'];
  function store(bot) {
    var biz = bizOf(bot), key = 'leads:' + biz, st = bot.db(key), now = Date.now(), dirty = false;
    if (!st || !st.items) { st = seedLeads(biz); dirty = true; }
    var d = Math.floor((now - st.base) / DAY);
    if (d >= 1) { st.items.forEach(function (l) { if (l.seed && !l.touched) SHIFT.forEach(function (k) { if (l[k]) l[k] += d * DAY; }); }); st.base += d * DAY; dirty = true; }
    st.items.forEach(function (l) { if (l.stage === 'snoozed' && l.snoozeUntil && l.snoozeUntil <= now) { l.stage = l.prev || 'contacted'; l.dueAt = l.snoozeUntil; l.snoozeUntil = null; dirty = true; } });
    if (syncChat(biz, st)) dirty = true;
    if (dirty) bot.save(key, st);
    return st;
  }
  function leadsOf(bot) { return store(bot).items; }
  function teamOf(bot) { var biz = bizOf(bot), t = bot.db('team:' + biz); return t && t.length ? t : seedTeam(biz); }
  function tasksOf(bot) { return bot.db('tasks:' + bizOf(bot)) || []; }
  var subs = [];
  function emit(ev) { subs.slice().forEach(function (f) { try { f(ev); } catch (e) {} }); }
  function commit(bot, st, ids, kind) { bot.save('leads:' + bizOf(bot), st); emit({ biz: bizOf(bot), ids: ids || [], kind: kind || 'change' }); }
  function getL(items, id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function isOpen(l) { return l.stage === 'new' || l.stage === 'contacted' || l.stage === 'mid'; }
  function stageLabel(l, cfg) { return { new: 'New', contacted: 'Contacted', mid: cfg.mid, won: 'Won', lost: 'Lost', snoozed: 'Snoozed' }[l.stage] || l.stage; }
  function memberOf(team, id) { for (var i = 0; i < team.length; i++) if (team[i].id === id) return team[i]; return null; }
  function meOf(bot) { var team = teamOf(bot); return memberOf(team, bot.mem.me) || memberOf(team, BIZ[bizOf(bot)].me) || team[0]; }
  function loadMap(team, items) { var m = {}; team.forEach(function (t) { m[t.id] = 0; }); items.forEach(function (l) { if (isOpen(l) && l.owner && m[l.owner] != null) m[l.owner]++; }); return m; }
  function avgLoad(team, lm) { var s = 0; team.forEach(function (t) { s += lm[t.id]; }); return team.length ? s / team.length : 0; }
  function overT(avg) { return Math.max(avg + 1, Math.ceil(avg * 1.3)); }
  function isOver(n, avg) { return n >= overT(avg) && n >= 2; }
  function isFree(n, avg) { return n <= Math.floor(avg * 0.7); }

  /* ---------- scoring (the visible rule) ---------- */
  var IPTS = { ready: 30, strong: 22, mid: 14, light: 6 };
  function waitH(l, now) { return (isOpen(l) && l.lastInbound && (!l.lastContact || l.lastInbound > l.lastContact)) ? Math.max(0, (now - l.lastInbound) / H) : 0; }
  function scoreOf(l, cfg, now) {
    now = now || Date.now();
    var age = (now - l.createdAt) / H, wh = waitH(l, now), p = { intent: IPTS[l.il] || 10, value: Math.round(25 * Math.min(1, (l.value || 0) / cfg.vref)), recency: age < 2 ? 15 : age < 6 ? 12 : age < 24 ? 9 : age < 72 ? 5 : 2, noreply: Math.min(20, Math.round(wh * 1.5)), booked: l.booked ? 10 : 0 };
    p.total = p.intent + p.value + p.recency + p.noreply + p.booked; p.waitH = wh; p.age = age; return p;
  }
  var HOT = 60, WARM = 40;
  function heat(t) { return t >= HOT ? 'hot' : t >= WARM ? 'warm' : 'cold'; }
  function dueState(l, now) { if (!l.dueAt || !isOpen(l)) return ''; if (l.dueAt < dayStart(0).getTime()) return 'overdue'; if (l.dueAt < dayStart(1).getTime()) return 'today'; return 'later'; }
  function dueLabel(l) {
    if (!l.dueAt) return 'No follow-up set'; var d = new Date(l.dueAt), diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - dayStart(0)) / DAY), tm = two(d.getHours()) + ':' + two(d.getMinutes());
    return diff === 0 ? 'Due today ' + tm : diff === 1 ? 'Due tomorrow ' + tm : diff === -1 ? 'Overdue since yesterday' : diff < 0 ? 'Overdue by ' + (-diff) + ' days' : 'Due ' + O.fmtDay(d);
  }
  function enrich(bot, l, now, cfg, team) {
    var sc = scoreOf(l, cfg, now), ow = l.owner && memberOf(team, l.owner), ds = dueState(l, now);
    var fresh = !!(l.fromChat && l.stage === 'new'), justNow = fresh && (now - l.createdAt) < 30 * 6e4;
    return { id: l.id, name: l.name, source: l.source, channel: l.channel, stage: l.stage, stageLabel: stageLabel(l, cfg), heat: heat(sc.total), score: sc.total, parts: sc, owner: l.owner || null, ownerName: ow ? ow.name : '', ownerInitials: ow ? initials(ow.name) : '', intent: l.intent, value: l.value, valueLabel: l.valueLabel, dueAt: l.dueAt, dueLabel: dueLabel(l), dueState: ds,
      lastContact: l.lastContact ? agoTxt(l.lastContact) : 'No contact yet', waitH: sc.waitH, booked: l.booked, when: l.when, notes: l.notes, phone: mask(l.phone), hl: l.hl || [], fresh: fresh, freshLabel: fresh ? (justNow ? 'New · from your chat just now' : 'New · from your chat') : '', area: l.area, tags: l.tags, closed: l.stage === 'won' || l.stage === 'lost', snoozeUntil: l.snoozeUntil || 0, createdAt: l.createdAt, fromChat: !!l.fromChat, email: l.email || '' };
  }
  function todayRaw(items, now) { var end = dayStart(1).getTime(); return items.filter(function (l) { return isOpen(l) && ((l.dueAt && l.dueAt < end) || l.stage === 'new' || now - l.createdAt < DAY || (l.fromChat && !l.touched)); }); }
  function view(bot) {
    var biz = bizOf(bot), cfg = BIZ[biz], st = store(bot), now = Date.now(), team = teamOf(bot), lm = loadMap(team, st.items), avg = avgLoad(team, lm);
    var all = st.items.map(function (l) { return enrich(bot, l, now, cfg, team); }), byId = {}; all.forEach(function (e) { byId[e.id] = e; });
    var tIds = {}; todayRaw(st.items, now).forEach(function (l) { tIds[l.id] = 1; });
    function byScore(a, b) { return (b.score - a.score) || (a.createdAt - b.createdAt); }
    function order(list) { var f = list.filter(function (e) { return e.fresh; }).sort(function (a, b) { return b.createdAt - a.createdAt; }), r = list.filter(function (e) { return !e.fresh; }).sort(byScore); return f.concat(r); }
    var today = order(all.filter(function (e) { return tIds[e.id]; })), open = order(all.filter(function (e) { return !e.closed && e.stage !== 'snoozed'; })), closed = all.filter(function (e) { return e.closed || e.stage === 'snoozed'; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    var due = all.filter(function (e) { return e.dueState === 'overdue' || e.dueState === 'today'; });
    return { biz: biz, name: bizName(biz), cur: cfg.cur, mid: cfg.mid, team: team.map(function (t) { return { id: t.id, name: t.name, role: t.role, skills: t.skills, initials: initials(t.name), load: lm[t.id], over: isOver(lm[t.id], avg), free: isFree(lm[t.id], avg) }; }), avg: avg, all: all, byId: byId, today: today, open: open, closed: closed,
      counts: { today: today.length, open: open.length, due: due.length, overdue: due.filter(function (e) { return e.dueState === 'overdue'; }).length, hot: open.filter(function (e) { return e.heat === 'hot'; }).length, unassigned: open.filter(function (e) { return !e.owner; }).length }, zero: due.length === 0, tasksDue: tasksDue(bot).length };
  }
  function openRanked(bot) { var v = view(bot); return v.open.slice().sort(function (a, b) { return (b.score - a.score) || (a.createdAt - b.createdAt); }); }

  /* ---------- fuzzy names ---------- */
  var STOPSET = {}; ('a an the and or of to in on at for is are was be am i me my we you your it its this that these those with from by as do does did can could would should will please pls hi hello hey there any some about just so then than what which who how when where why if not no yes but have has had get got want need like ' +
    'draft write compose prepare message messages whatsapp whatsap text sms reply nudge follow followup follow-up up assign reassign allocate give hand over pass snooze postpone defer park till until next week weekend today tomorrow tonight morning afternoon evening mon monday tue tuesday wed wednesday thu thursday fri friday sat saturday sun sunday jan feb mar apr may jun jul aug sep oct nov dec ' +
    'mark set move close closed won lost deal lead leads call called log logged rang phoned spoke talked voicemail answer reached picked pick didnt wrong number remind reminder task note notes show find search lookup look whats him her them one first second third fourth fifth top hottest last sent send done complete tick off open details detail info customer client person prospect enquiry team new hot cold warm instagram insta web website unassigned owner owned load day days pm am noon later back again now ok okay thanks thank').split(' ').forEach(function (w) { STOPSET[w] = 1; });
  function lev(a, b) { var m = a.length, n = b.length, i, j, p = []; if (Math.abs(m - n) > 2) return 9; for (j = 0; j <= n; j++) p[j] = j; for (i = 1; i <= m; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= n; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); prev = t; } } return p[n]; }
  function tokMatch(q, w) { if (q === w) return 3; if (q.length >= 3 && w.indexOf(q) === 0) return 2.5; if (q.length >= 4) { var d = lev(q, w); if (d <= 1) return 1.6; if (q.length >= 7 && d <= 2) return 1.4; } return 0; }
  function nameTokens(text) { return (String(text).toLowerCase().replace(/'s\b/g, '').match(/[a-z][a-z-]*/g) || []).map(function (w) { return w.replace(/^-+|-+$/g, ''); }).filter(function (w) { return w.length >= 2 && !STOPSET[w]; }); }
  function matchNames(items, text, nameOf, extraStop) {
    var q = nameTokens(text).filter(function (w) { return !(extraStop && extraStop[w]); }); if (!q.length) return [];
    var rows = items.map(function (it) { var ws = String(nameOf(it)).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean), sum = 0, c = 0, strong = 0; q.forEach(function (t) { var b = 0; ws.forEach(function (w) { var s = tokMatch(t, w); if (s > b) b = s; }); if (b) { sum += b; c++; if (b >= 2.5) strong++; } }); return { it: it, s: sum, c: c, strong: strong }; }).filter(function (r) { return r.c > 0; });
    if (!rows.length) return []; if (rows.some(function (r) { return r.strong > 0; })) rows = rows.filter(function (r) { return r.strong > 0; });
    var top = 0; rows.forEach(function (r) { if (r.s > top) top = r.s; }); return rows.filter(function (r) { return r.s >= top - 0.01; }).map(function (r) { return r.it; });
  }
  /* -> { ids:[...], how } ; ids empty = nothing found ; null = the text names nobody */
  var ORD = { first: 0, '1st': 0, top: 0, second: 1, '2nd': 1, third: 2, '3rd': 2, fourth: 3, fifth: 4 };
  function findLead(bot, text) {
    var items = leadsOf(bot), t = String(text), lt = t.toLowerCase(), m, i;
    if ((m = lt.match(/\b([a-z]{1,2})-(\d{3,5})\b/))) { var idc = (m[1] + '-' + m[2]).toUpperCase(), h = getL(items, idc); if (h) return { ids: [h.id], how: 'id' }; }
    if ((/^\s*(?:this|that|it|him|her|them|the same)\s*$/i.test(lt) || /\b(him|her|them|this (?:lead|one|customer|person)|that (?:lead|one|customer|person)|the same (?:lead|one|person)|current lead|same one)\b/.test(lt)) && bot.mem.focus && getL(items, bot.mem.focus)) return { ids: [bot.mem.focus], how: 'focus' };
    if ((m = lt.match(/\b(first|1st|second|2nd|third|3rd|fourth|fifth|top)(?: one| lead)?\b/)) && bot.mem.shown && bot.mem.shown[ORD[m[1]]] && /\b(one|lead|the|number|#)\b/.test(lt)) { var oid = bot.mem.shown[ORD[m[1]]]; if (getL(items, oid)) return { ids: [oid], how: 'ordinal' }; }
    if ((m = t.match(/(?:\+?\d[\s-]?){4,}\d/))) { var dg = m[0].replace(/\D/g, ''), ph = items.filter(function (l) { return String(l.phone || '').replace(/\D/g, '').slice(-dg.length) === dg.slice(-Math.min(dg.length, 10)) || String(l.phone || '').replace(/\D/g, '').indexOf(dg) >= 0; }); if (ph.length) return { ids: ph.map(function (l) { return l.id; }), how: 'phone' }; }
    var hit = matchNames(items, t, function (l) { return l.name; });
    if (hit.length) { var ex = hit.filter(function (l) { return l.name.toLowerCase() === nameTokens(t).join(' '); }); if (ex.length === 1) hit = ex; return { ids: hit.map(function (l) { return l.id; }), how: 'name' }; }
    return nameTokens(t).length ? { ids: [], how: 'none' } : null;
  }
  function findPerson(bot, text) {
    var team = teamOf(bot), lt = String(text).toLowerCase();
    if (/\b(me|myself|mine)\b/.test(lt) && !matchNames(team, text, function (t) { return t.name; }).length) return { ids: [meOf(bot).id], how: 'me' };
    var hit = matchNames(team, text, function (t) { return t.name; });
    if (hit.length) return { ids: hit.map(function (t) { return t.id; }), how: 'name' };
    return nameTokens(text).length ? { ids: [], how: 'none' } : null;
  }
  /* parks candidates in bot.mem for the slot prompts */
  function parkLead(bot, r) { bot.mem.candList = null; bot.mem.noMatch = false; if (!r) return undefined; if (r.ids.length === 1) return r.ids[0]; if (r.ids.length > 1) { bot.mem.candList = r.ids.slice(0, 5); return undefined; } bot.mem.noMatch = true; return undefined; }
  function parkPerson(bot, r) { bot.mem.pCands = null; bot.mem.pNone = false; if (!r) return undefined; if (r.ids.length === 1) return r.ids[0]; if (r.ids.length > 1) { bot.mem.pCands = r.ids.slice(0, 4); return undefined; } bot.mem.pNone = true; return undefined; }

  /* ---------- reasons, next steps, cards ---------- */
  function reasonFor(l, sc, cfg) {
    var r = []; if (l.booked) r.push(cfg.bookTxt + (l.when ? ' (' + l.when + ')' : '')); if (sc.noreply >= 6) r.push('waiting ' + hrs(sc.waitH) + ' for a reply'); if (sc.value >= 15) r.push('high value, ' + l.valueLabel); if (sc.recency >= 12) r.push('new, ' + hrs(sc.age) + ' ago'); if (IPTS[l.il] >= 22 && r.length < 3) r.push('ready to act');
    if (!r.length) r.push(sc.value >= 8 ? l.valueLabel : 'worth a quick check-in'); return cap(r.slice(0, 3).join(', '));
  }
  function nextStep(l, cfg) {
    var now = Date.now(), wh = waitH(l, now), tg = l.tags || [];
    if (l.nextStep) return 'Planned: ' + l.nextStep;
    if (l.booked && l.stage !== 'new') return 'Confirm the ' + (l.when || cfg.bookWord) + ' slot';
    if (l.stage === 'new') return 'First contact: call, then WhatsApp the details';
    if (wh >= 2) return 'Reply now, they have waited ' + hrs(wh);
    if (tg.indexOf('no-show') >= 0) return 'Offer two slots to rebook';
    if (tg.indexOf('recall') >= 0 || tg.indexOf('rebook') >= 0) return 'Offer two slots this week';
    if (l.stage === 'mid' && (cfg.mid === 'Quote sent')) return 'Ask if they have seen the quote';
    if (tg.indexOf('refunds') >= 0 || tg.indexOf('delivery') >= 0) return 'Share a status update';
    return 'Check in and ask for a decision';
  }
  function leadCard(bot, l, o) {
    o = o || {}; var cfg = BIZ[bizOf(bot)], team = teamOf(bot), sc = scoreOf(l, cfg), ow = l.owner && memberOf(team, l.owner), meta = [l.intent];
    if (o.reason) meta = [o.reason]; if (o.next) meta.push('Next: ' + nextStep(l, cfg)); if (o.extra) meta = meta.concat(o.extra); if (o.due) meta.push(dueLabel(l));
    return { lead: l.id, heat: heat(sc.total), title: (o.n ? o.n + '. ' : '') + l.name, sub: l.source + ' · ' + stageLabel(l, cfg) + ' · ' + (ow ? ow.name : 'Unassigned'), badge: cap(heat(sc.total)) + ' ' + sc.total, meta: meta, buttons: o.buttons || [B('Call', 'act:call:' + l.id), B('Draft WhatsApp', 'act:draft:' + l.id), B('Assign', 'act:assignask:' + l.id)] };
  }
  function ruleLine(cfg) { return 'Score out of 100: intent (up to 30) + value (up to 25) + how recent the enquiry is (up to 15) + hours waiting without our reply (1.5 points an hour, up to 20) + 10 if ' + cfg.bookIs + '. Hot is ' + HOT + ' or more, warm ' + WARM + ' or more.'; }
  function topChips() { return [B('Who should I call first?', 'intent:rank'), B('Follow-ups due', 'intent:due'), B('Split today\'s leads', 'intent:split'), B('Daily summary', 'intent:summary'), B('Who is overloaded?', 'intent:load')]; }

  /* ---------- core actions ---------- */
  function touch(l) { l.touched = true; }
  function doAssign(bot, id, pid, quiet) {
    var st = store(bot), l = getL(st.items, id), team = teamOf(bot), p = memberOf(team, pid), cfg = BIZ[bizOf(bot)]; if (!l || !p) { say(bot, 'I could not find that lead or person.'); return null; }
    var prev = l.owner; l.owner = p.id; touch(l); commit(bot, st, [id], 'assign'); bot.mem.focus = id; bot.event('action', { action: 'assign', lead: id, to: p.id, from: prev || null });
    if (quiet) return l;
    var lm = loadMap(team, st.items), match = skillMatch(l, p), best = team.slice().sort(function (a, b) { return skillMatch(l, b) - skillMatch(l, a) || lm[a.id] - lm[b.id]; })[0], hint = '';
    if (!match && skillMatch(l, best) > 0 && best.id !== p.id) { var shared = (l.tags || []).filter(function (t) { return best.skills.indexOf(t) >= 0; }).join(', '); hint = ' Heads up: ' + best.name + ' is a closer match (' + shared + '). Say "assign ' + first(l.name) + ' to ' + first(best.name) + '" to switch.'; }
    say(bot, 'Assigned **' + l.name + '** to **' + p.name + '**' + (prev && prev !== p.id ? ' (was ' + (memberOf(team, prev) ? first(memberOf(team, prev).name) : 'someone else') + ')' : '') + '. ' + first(p.name) + ' now has ' + plural(lm[p.id], 'open lead') + '.' + hint, { buttons: [B('Draft WhatsApp to ' + first(l.name), 'act:draft:' + id), B('Who is overloaded?', 'intent:load'), B('Who should I call first?', 'intent:rank')] });
    return l;
  }
  function parseUntil(text) {
    var t = String(text).toLowerCase(), m, d, w = N.when(t);
    if ((m = t.match(/\b(?:in|for|by)\s+(\d{1,2}|a|one|two|three|four|five|six|seven)\s+(day|week)s?\b/))) { var n = m[1] === 'a' ? 1 : (N.wordNum(m[1]) || +m[1] || 1); d = dayStart(n * (m[2] === 'week' ? 7 : 1)); return iso(d); }
    if (/\bnext week\b/.test(t) && !(w && w.date)) { d = dayStart(0); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return iso(d); }
    if (/\b(?:a|one) week\b/.test(t) && !(w && w.date)) return iso(dayStart(7));
    if (/\bnext month\b/.test(t)) return iso(dayStart(30));
    if (w && w.iso) return w.iso; return undefined;
  }
  function doSnooze(bot, id, dateIso) {
    var st = store(bot), l = getL(st.items, id), d = parseDay(dateIso); if (!l) return null; d.setHours(9, 0, 0, 0);
    if (isNaN(d.getTime()) || d.getTime() <= Date.now()) { say(bot, 'That date has already started. Pick tomorrow or later.', { buttons: [B('Tomorrow', 'act:snooze:' + id + '|' + iso(dayStart(1))), B('Next Monday', 'act:snooze:' + id + '|' + iso(nextMon()))] }); return null; }
    if (l.stage !== 'snoozed') l.prev = l.stage; l.stage = 'snoozed'; l.snoozeUntil = d.getTime(); l.dueAt = d.getTime(); touch(l); commit(bot, st, [id], 'snooze'); bot.mem.focus = id; bot.event('action', { action: 'snooze', lead: id, until: dateIso });
    say(bot, '**' + l.name + '** is snoozed until **' + O.fmtDay(d) + '**. It returns to Today that morning.', { buttons: [B('Who should I call first?', 'intent:rank'), B('Follow-ups due', 'intent:due')] });
    return l;
  }
  function nextMon() { var d = dayStart(0); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d; }
  function doClose(bot, id, verdict) {
    var st = store(bot), l = getL(st.items, id); if (!l) return null; l.stage = verdict; if (verdict === 'won') l.wonAt = Date.now(); else l.lostAt = Date.now(); l.dueAt = null; l.snoozeUntil = null; touch(l); commit(bot, st, [id], verdict); bot.mem.focus = id; bot.event('action', { action: verdict, lead: id });
    var v = view(bot);
    say(bot, 'Marked **' + l.name + '** as **' + verdict + '**.' + (verdict === 'won' ? ' Nice one.' : ' I have removed it from the follow-up list.') + (v.zero ? ' That clears every follow-up.' : ''), { buttons: v.zero ? [B('Daily summary', 'intent:summary')] : [B('Follow-ups due', 'intent:due'), B('Who should I call first?', 'intent:rank')], kind: v.zero ? 'zero' : null });
    return l;
  }
  function doSent(bot, id) {
    var st = store(bot), l = getL(st.items, id), cfg = BIZ[bizOf(bot)]; if (!l) return null; var d = bot.mem.draft, me = meOf(bot), sent = bot.db('sent:' + bizOf(bot)) || [];
    var was = l.stage; l.lastContact = Date.now(); if (l.stage === 'new') l.stage = 'contacted'; l.dueAt = null; touch(l); commit(bot, st, [id], 'sent'); bot.mem.focus = id; bot.mem.draft = null;
    sent.push({ lead: id, name: l.name, by: me.id, at: Date.now(), kind: d && d.kind || 'whatsapp' }); bot.save('sent:' + bizOf(bot), sent); bot.event('action', { action: 'draft_sent', lead: id, medium: 'WhatsApp' });
    var v = view(bot);
    say(bot, 'Logged as sent to **' + l.name + '**.' + (was === 'new' ? ' Stage: Contacted.' : '') + ' Follow-up cleared. I sent nothing myself.' + (v.zero ? ' That was the last one due.' : ''), { kind: v.zero ? 'zero' : null, buttons: [B('Remind me in 2 days', 'act:remind:' + id + '|2'), B('Follow-ups due', 'intent:due'), B('Who should I call first?', 'intent:rank')] });
    return l;
  }

  /* ---------- team split / rebalance ---------- */
  function skillMatch(l, p) { var n = 0; (l.tags || []).forEach(function (t) { if (p.skills.indexOf(t) >= 0) n++; }); return n; }
  function plan(bot, mode) {
    var st = store(bot), items = st.items, team = teamOf(bot), now = Date.now(), cfg = BIZ[bizOf(bot)], lm0 = loadMap(team, items), avg = avgLoad(team, lm0), cands, base = {}, i;
    team.forEach(function (t) { base[t.id] = 0; });
    if (mode === 'rebalance') {
      cands = []; team.forEach(function (t) { var over = lm0[t.id] - Math.ceil(avg); if (over > 0) { var mine = items.filter(function (l) { return isOpen(l) && l.owner === t.id && !l.booked; }).sort(function (a, b) { return scoreOf(a, cfg, now).total - scoreOf(b, cfg, now).total; }); cands = cands.concat(mine.slice(0, over)); } });
      items.forEach(function (l) { if (isOpen(l) && l.owner && cands.indexOf(l) < 0) base[l.owner]++; });
    } else {
      cands = todayRaw(items, now).sort(function (a, b) { return scoreOf(b, cfg, now).total - scoreOf(a, cfg, now).total; });
      items.forEach(function (l) { if (isOpen(l) && l.owner && cands.indexOf(l) < 0) base[l.owner]++; });
    }
    var total = cands.length; team.forEach(function (t) { total += base[t.id]; }); var cap2 = Math.max(1, Math.ceil(total / team.length)), got = {}, moves = [];
    team.forEach(function (t) { got[t.id] = []; });
    cands.forEach(function (l) {
      var best = null, bk = -1e9; team.forEach(function (t) {
        var ld = base[t.id] + got[t.id].length; if (ld >= cap2 && !(team.every(function (x) { return base[x.id] + got[x.id].length >= cap2; }))) return;
        if (mode === 'rebalance' && t.id === l.owner) return;
        var k = skillMatch(l, t) * 10 + (t.id === l.owner ? 4 : 0) - ld; if (k > bk) { bk = k; best = t; }
      });
      best = best || team[0]; got[best.id].push(l); if (best.id !== l.owner) moves.push({ id: l.id, from: l.owner || null, to: best.id });
    });
    var rows = team.map(function (t) {
      var ls = got[t.id], after = base[t.id] + ls.length, why = [], sk = {}; ls.forEach(function (l) { (l.tags || []).forEach(function (tg) { if (t.skills.indexOf(tg) >= 0) sk[tg] = 1; }); });
      var sks = Object.keys(sk).slice(0, 3); if (sks.length) why.push('skills: ' + sks.join(', ')); else if (ls.length) why.push('balances the load'); if (mode === 'rebalance') { var fr = {}; ls.forEach(function (l) { var f = l.owner && memberOf(team, l.owner); if (f) fr[first(f.name)] = 1; }); if (Object.keys(fr).length) why.push('from ' + Object.keys(fr).join(', ')); }
      return { id: t.id, name: t.name, ids: ls.map(function (l) { return l.id; }), names: ls.map(function (l) { var mv = moves.filter(function (m) { return m.id === l.id; })[0]; return shortName(l.name) + (mv && mode !== 'rebalance' ? ' (new)' : ''); }), why: why.join('; ') || 'no leads this round', before: lm0[t.id], after: after };
    });
    return { mode: mode, rows: rows, moves: moves, count: cands.length, ts: now };
  }
  function planCard(bot, pl, noApply) {
    var table = { cols: ['Person', 'Leads', 'Why', 'Load'], rows: pl.rows.map(function (r) { return [r.name, r.ids.length ? r.ids.length + ': ' + r.names.join(', ') : '0', r.why, r.before + ' to ' + r.after]; }) };
    return { title: pl.mode === 'rebalance' ? 'Rebalance plan' : 'Split plan for today', sub: pl.moves.length + ' of ' + pl.count + ' leads change owner. ' + table.rows.map(function (r) { return r[0] + ' ' + r[1] + ' (' + r[3] + ')'; }).join('. '), table: table, buttons: noApply ? [B('Why this split?', 'act:split_why:')] : [B('Apply', 'act:split_apply:'), B('Why this split?', 'act:split_why:')] };
  }
  function applyPlan(bot) {
    var pl = bot.mem.plan; if (!pl) { say(bot, 'There is no plan to apply yet. Ask me to split today\'s leads first.', { buttons: [B('Split today\'s leads', 'intent:split')] }); return; }
    if (!pl.moves.length) { say(bot, 'Nothing to change. Every lead already sits with a good fit.', { buttons: topChips().slice(0, 3) }); bot.mem.plan = null; return; }
    var st = store(bot), team = teamOf(bot), undo = { ts: Date.now(), mode: pl.mode, items: [] }, ids = [];
    pl.moves.forEach(function (m) { var l = getL(st.items, m.id); if (!l) return; undo.items.push({ id: l.id, prev: l.owner || null }); l.owner = m.to; touch(l); ids.push(l.id); });
    commit(bot, st, ids, 'split_apply'); bot.save('undo:' + bizOf(bot), undo); bot.mem.plan = null; bot.event('action', { action: 'split_apply', moved: ids.length, mode: pl.mode });
    var lm = loadMap(team, st.items);
    say(bot, 'Applied. **' + plural(ids.length, 'lead') + '** ' + (ids.length === 1 ? 'now has' : 'now have') + ' a new owner. Loads: ' + team.map(function (t) { return first(t.name) + ' ' + lm[t.id]; }).join(', ') + '.', { buttons: [B('Undo', 'act:split_undo:'), B('Who is overloaded?', 'intent:load'), B('Who should I call first?', 'intent:rank')] });
  }
  function undoPlan(bot) {
    var u = bot.db('undo:' + bizOf(bot)); if (!u || !u.items || !u.items.length) { say(bot, 'There is nothing to undo.', { buttons: topChips().slice(0, 3) }); return; }
    var st = store(bot), ids = []; u.items.forEach(function (it) { var l = getL(st.items, it.id); if (l) { l.owner = it.prev; touch(l); ids.push(l.id); } });
    commit(bot, st, ids, 'split_undo'); bot.save('undo:' + bizOf(bot), null); bot.event('action', { action: 'split_undo', restored: ids.length });
    say(bot, 'Undone. I restored the previous owner on **' + plural(ids.length, 'lead') + '**.', { buttons: [B('Split today\'s leads', 'intent:split'), B('Who is overloaded?', 'intent:load')] });
  }

  /* ---------- drafts ---------- */
  function tplKey(l, cfg) {
    if (l.booked) return 'booked'; var tg = l.tags || [], order = cfg.tpl, i; for (i = 0; i < order.length; i++) if (tg.indexOf(order[i]) >= 0) return order[i];
    if (l.stage === 'mid' && cfg.mid === 'Quote sent') return 'quote'; return 'default';
  }
  var TPL = {
    realty: { booked: 'Hi $n, this is $me from Alderway Homes. Your visit for $ask is booked for $when. Reply YES and I will send the location pin. Is there anything you would like me to line up before then?', default: 'Hi $n, this is $me from Alderway Homes. Thanks for asking about $ask. I have a couple of options that fit what you described. Would a quick call today after 5 pm or tomorrow morning suit you better?' },
    support: { booked: 'Hi $n, $me from Northlane here. Your pickup for $ask is set for $when. Please keep the item in its original packaging and reply here if the time needs to change.', returns: 'Hi $n, $me from Northlane here. I am sorry about $ask. I can start the return today and send a prepaid label. Would you like a refund or an exchange?', delivery: 'Hi $n, $me from Northlane here. I have asked the courier about $ask and will update you by end of day. Thanks for your patience, and tell me if you need anything sooner.', restock: 'Hi $n, $me from Northlane here. Good news, we are tracking $ask. I will message you the moment it is back in stock.', vip: 'Hi $n, $me from Northlane here. Thank you for asking about $ask. I am checking what I can arrange for you and will come back to you within the hour.', default: 'Hi $n, $me from Northlane here. I am following up on $ask. Is there anything else I can sort out for you today?' },
    build: { booked: 'Hi $n, $me from Ashlar & Co. Your site visit for $ask is booked for $when. Please keep the area clear and have your reference photos handy.', quote: 'Hi $n, $me from Ashlar & Co. Just checking you have had a chance to look at the quote for $ask. Happy to adjust the scope or the material if the number needs to move.', default: 'Hi $n, $me from Ashlar & Co. Thanks for the details on $ask. I would like to confirm the measurements and book a site visit. Would Thursday morning or Saturday suit you?' },
    clinic: { booked: 'Hi $n, this is $me from Calder Clinic confirming $ask on $when. Reply YES to confirm, or tell me a better time and I will move it.', 'no-show': 'Hi $n, $me from Calder Clinic. We missed you at $ask, and no worries. I can offer Thursday 10 am or Friday 6:30 pm to rebook. Which do you prefer?', recall: 'Hi $n, $me from Calder Clinic. It is time for $ask. I have a couple of slots this week. Would a morning or an evening work better?', 'new-patient': 'Hi $n, $me from Calder Clinic. Thanks for reaching out about $ask. I can book you in this week. Do you prefer a morning or an evening slot?', default: 'Hi $n, $me from Calder Clinic. Thanks for getting in touch about $ask. Would you like me to find a slot this week?' },
    salon: { booked: 'Hi $n, $me from Maison Verve. Your booking for $ask is on $when. Reply YES to confirm, or tell me a better time and I will move it.', waitlist: 'Hi $n, $me from Maison Verve. A slot may open for $ask. Shall I hold it for you if it does? Just reply YES.', rebook: 'Hi $n, $me from Maison Verve. It has been a few weeks since $ask. Anika has Thursday at 6 pm if you would like your usual. Shall I book it?', packages: 'Hi $n, $me from Maison Verve. Thanks for asking about $ask. It saves you money over single visits and the sessions can be spread over a few months. Want me to hold it?', bridal: 'Hi $n, $me from Maison Verve. Congratulations! For $ask I suggest a trial about four weeks before the day. Which Saturday works for you?', default: 'Hi $n, $me from Maison Verve. Thanks for asking about $ask. I can book you in this week. Which day suits you best?' },
    dining: { booked: 'Hi $n, $me from Tamarind Row. We are holding $ask for $when. Reply YES to confirm and tell me about any dietary needs.', 'private-room': 'Hi $n, $me from Tamarind Row. Thanks for asking about $ask. We have a room that fits your group. If you share the headcount and any menu preferences, I will send the options and the minimum spend.', event: 'Hi $n, $me from Tamarind Row. Thanks for asking about $ask. I can put together a menu and a quote. Could you share the date and headcount?', waitlist: 'Hi $n, $me from Tamarind Row. You are on the waitlist for $ask. I will message you the moment a table opens. Is your time flexible?', default: 'Hi $n, $me from Tamarind Row. Thanks for asking about $ask. I can hold a table for you. What time works best?' }
  };
  function draftText(bot, l) {
    var biz = bizOf(bot), cfg = BIZ[biz], key = tplKey(l, cfg), set = TPL[biz], t = set[key] || set.default;
    return t.replace(/\$n/g, first(l.name)).replace(/\$me/g, first(meOf(bot).name)).replace(/\$ask/g, l.ask || 'your enquiry').replace(/\$when/g, l.when || 'the agreed time');
  }
  function showDraft(bot, l) {
    var text = draftText(bot, l); bot.mem.draft = { id: l.id, text: text, kind: tplKey(l, BIZ[bizOf(bot)]) }; bot.mem.focus = l.id;
    say(bot, 'Draft for **' + l.name + '**. Copy it into WhatsApp, then tap Mark as sent.', { cards: [{ lead: l.id, title: 'WhatsApp to ' + l.name, sub: text, draft: { text: text, id: l.id }, meta: ['Phone ' + mask(l.phone)], badge: 'Draft', buttons: [B('Copy', 'act:copy:' + l.id), B('Mark as sent', 'act:sent:' + l.id), B('Log a call instead', 'act:call:' + l.id)] }] });
  }

  /* ---------- tasks ---------- */
  function addTask(bot, t) { var a = tasksOf(bot); t.id = a.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; t.done = false; t.created = Date.now(); t.owner = t.owner || meOf(bot).id; a.push(t); bot.save('tasks:' + bizOf(bot), a); bot.event('action', { action: 'task_created', task: t.id }); emit({ biz: bizOf(bot), ids: [], kind: 'task' }); return t; }
  function taskDue(t) { return !t.done && t.due && parseDay(t.due) < dayStart(1); }
  function tasksDue(bot) { return tasksOf(bot).filter(taskDue); }
  function taskWhen(t) { var d = Math.round((parseDay(t.due) - dayStart(0)) / DAY), tm = t.time ? ' at ' + O.fmtTime(t.time) : ''; return !t.due ? 'no date' : d === 0 ? 'today' + tm : d === 1 ? 'tomorrow' + tm : d < 0 ? 'overdue by ' + plural(-d, 'day') : O.fmtDay(parseDay(t.due)) + tm; }
  function taskCard(bot, t) { var team = teamOf(bot), o = memberOf(team, t.owner), l = t.lead && getL(leadsOf(bot), t.lead); return { title: '#' + t.id + ' ' + t.title, sub: taskWhen(t) + (o ? ', ' + o.name : ''), badge: taskDue(t) && parseDay(t.due) < dayStart(0) ? 'overdue' : '', meta: l ? ['For ' + l.name] : [], buttons: t.done ? [] : [B('Mark done', 'act:tdone:' + t.id)] }; }
  function completeTask(bot, n) {
    var a = tasksOf(bot), t = a.filter(function (x) { return x.id === n; })[0];
    if (!t) { say(bot, 'I cannot find task ' + n + '. Say my tasks to see the list.', { buttons: [B('My tasks', 'intent:tasks')] }); return; }
    if (t.done) { say(bot, 'Task ' + n + ' is already done.'); return; }
    t.done = true; t.doneAt = Date.now(); bot.save('tasks:' + bizOf(bot), a); bot.event('action', { action: 'task_done', task: n }); emit({ biz: bizOf(bot), ids: [], kind: 'task' });
    var left = a.filter(function (x) { return !x.done; }).length; say(bot, 'Done. **#' + n + ' ' + t.title + '** is ticked off. ' + (left ? plural(left, 'task') + ' left.' : 'No open tasks left.'), { buttons: [B('My tasks', 'intent:tasks'), B('Follow-ups due', 'intent:due')] });
  }
  function dueFrom(r) { if (!r) return undefined; var time = r.time; if (!time && r.timeAmbiguous) { var h = r.timeAmbiguous; time = two(h < 8 ? h + 12 : h) + ':00'; } if (!time && r.part && r.iso) time = { morning: '09:00', afternoon: '14:00', evening: '18:00' }[r.part]; if (!r.iso && !time) return undefined; return (r.iso || iso(dayStart(0))) + (time ? ' ' + time : ''); }
  function splitDue(s) { if (!s || s === 'none') return { due: '', time: '' }; var p = String(s).split(' '); return { due: p[0], time: p[1] || '' }; }
  function cleanTitle(t) {
    var s = String(t).replace(/^\s*(?:please\s+)?(?:(?:create|add|new|make|set)\s+(?:a\s+)?(?:task|reminder|to-?do)\b[:\s]*(?:to\s+)?|task\s*:\s*|to-?do\s*:\s*|reminder\s*:\s*|remind\s+me(?:\s+to)?\b\s*)/i, '');
    s = s.replace(/\b(?:by|on|before|due|until)?\s*(?:next\s+|this\s+)?(?:mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?|sun)(?:day)?\b/ig, ' ').replace(/\b(?:by|on|before|due|at|around|@)?\s*(?:day after tomorrow|tomorrow|tmrw|today|tonight|this (?:weekend|morning|afternoon|evening)|next week)(?:\s+(?:morning|afternoon|evening|night))?\b/ig, ' ').replace(/\b(?:at|by|around|@)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/ig, ' ').replace(/\b(?:at|by|around|@)\s*\d{1,2}(?::\d{2})?\b/ig, ' ').replace(/\b(?:on\s+)?\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/ig, ' ');
    s = s.replace(/\s{2,}/g, ' ').replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, '').replace(/\s+(?:and|to|by|on|at|for)$/i, '').replace(/^to\s+/i, '').trim(); return s.length >= 3 ? cap(s) : '';
  }

  /* ---------- text patterns shared by intents and the entity extractor ---------- */
  var RX = {
    assign: /\b(?:re-?assign|assign|allocate|hand over|handover to|delegate)\b|\b(?:give|pass)\s+(?!me\b|us\b)\w.*\bto\s+\w/i,
    split: /\b(?:split|divide|distribute|spread|share out)\b/i,
    snooze: /^(?!\s*(?:how|what|why|does|do|can|is)\b).*\b(?:(?:snooze|postpone|defer|park)\b(?!d)|push\b.+\b(?:to|till|until)\b)/i,
    mark: /\b(?:(?:mark|set|move|close|tag|flag|log)\b.*\b(?:won|lost|converted)|(?:as|is|was|are) (?:won|lost|converted)|we (?:won|lost|closed|converted)|(?:won|lost) (?:the )?(?:deal|lead|sale|customer|client|patient|booking))\b|^\s*(?:won|lost)\s+[a-z]/i,
    draft: /\bdraft\b|\bwhatsapp (?:to|for)\b|\b(?:write|compose|prepare)\b.*\b(?:message|whatsapp|text|reply|nudge)\b|\b(?:message|whatsapp|text)\s+(?:for|to)\s+\w|^\s*(?:whatsapp|message|text)\s+(?!leads?\b|enquir|only\b|from\b|messages?\b|chats?\b|source|conversations?\b)[a-z]/i,
    call: /\blog(?:ged)? (?:a |the )?call\b|\b(?:i |just |we )?(?:called|rang|phoned|spoke (?:to|with)|talked to)\b|\bno answer\b|\bvoicemail\b|\b(?:didn'?t|did not|not) pick(?:ed)? up\b/i,
    task: /\bremind me\b|\b(?:create|add|new|make|set) (?:a )?(?:task|reminder|to-?do)\b|^\s*(?:task|todo|to-do|reminder)\s*:/i
  };
  function kindOf(t) { t = String(t); if (RX.task.test(t)) return 'task'; if (RX.mark.test(t)) return 'mark'; if (RX.snooze.test(t)) return 'snooze'; if (RX.draft.test(t)) return 'draft'; if (RX.call.test(t)) return 'call'; if (RX.assign.test(t) && !/\b(?:all|today'?s|the|my)\s+(?:new\s+)?leads\b/i.test(t)) return 'assign'; return null; }
  function outcomeOf(t) { t = String(t).toLowerCase(); return /wrong number|wrong no|disconnected|invalid number/.test(t) ? 'wrong number' : /voice ?mail|left a message|\bvm\b/.test(t) ? 'voicemail' : /no answer|did ?n.?t (?:pick|answer)|did not (?:pick|answer)|not picking|unanswered|no reply|not reachable|\bbusy\b/.test(t) ? 'no answer' : /reached|spoke|talked|picked up|answered|connected|got through|\bhad a chat\b/.test(t) ? 'reached' : undefined; }
  function splitAssign(t) { var m = String(t).match(/\b(?:re-?assign|assign|allocate|delegate|give|pass|hand(?: over)?)\b\s+(.+?)\s+\b(?:to|over to)\b\s+(.+)$/i); return m ? { lead: m[1], person: m[2] } : null; }

  function fixNames(bot, ti) { if (!ti) return ti; var names = []; leadsOf(bot).forEach(function (l) { names.push(l.name); names.push(first(l.name)); }); teamOf(bot).forEach(function (t) { names.push(t.name); names.push(first(t.name)); }); names.sort(function (a, b) { return b.length - a.length; }).forEach(function (n) { if (n.length < 3) return; ti = ti.replace(new RegExp('\\b' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig'), n); }); return ti; }
  var PRE = { nlead: 'lead', nperson: 'person', nuntil: 'until', nverdict: 'verdict', noutcome: 'outcome', ntitle: 'title', ndue: 'due' };
  function launch(bot, flow, ent) { var p = {}; Object.keys(PRE).forEach(function (k) { if (ent && ent[k] !== undefined) p[PRE[k]] = ent[k]; }); bot.startFlow(flow, p); }

  /* ---------- flow slots ---------- */
  function leadSlot() {
    return { name: 'lead', hint: 'Tell me a name, part of a phone number, or pick one below.',
      ask: function (bot, s) {
        var c = bot.mem.candList; bot.mem.candList = null; var v;
        if (c && c.length > 1) { say(bot, 'More than one match. Which one do you mean?', { buttons: c.map(function (id) { var l = getL(leadsOf(bot), id); return B(l.name + ' · ' + l.source, 'slot:lead=' + id); }) }); return; }
        var pre = bot.mem.noMatch ? 'I could not find a lead like that. ' : ''; bot.mem.noMatch = false;
        var fc = bot.mem.focus && getL(leadsOf(bot), bot.mem.focus); v = openRanked(bot).slice(0, 4);
        say(bot, pre + 'Which lead? Type a name, or pick one.', { buttons: (fc && isOpen(fc) ? [B(fc.name + ' (current)', 'slot:lead=' + fc.id)] : []).concat(v.filter(function (e) { return !fc || e.id !== fc.id; }).slice(0, fc ? 3 : 4).map(function (e) { return B(e.name, 'slot:lead=' + e.id); })) });
      },
      parse: function (t, bot) { var k = kindOf(t); if (k && k !== bot.flow) return undefined; return parkLead(bot, findLead(bot, t)); } };
  }
  function personSlot() {
    return { name: 'person', hint: 'Pick a team member below, or type a first name.',
      ask: function (bot, s) {
        var team = teamOf(bot), lm = loadMap(team, leadsOf(bot)), l = getL(leadsOf(bot), s.lead), c = bot.mem.pCands, pre = bot.mem.pNone ? 'I do not know that person. ' : ''; bot.mem.pCands = null; bot.mem.pNone = false;
        var list = c && c.length > 1 ? c.map(function (id) { return memberOf(team, id); }) : team;
        say(bot, (c && c.length > 1 ? 'More than one match. ' : pre) + 'Who should take **' + (l ? l.name : 'it') + '**?', { buttons: list.map(function (t) { return B(first(t.name) + ' (' + lm[t.id] + ' open)', 'slot:person=' + t.id); }) });
      },
      parse: function (t, bot) { var k = kindOf(t); if (k && k !== bot.flow) return undefined; return parkPerson(bot, findPerson(bot, t)); } };
  }
  function untilSlot() {
    return { name: 'until', hint: 'Say a day like tomorrow, Monday, 20 Nov, or in 3 days.',
      ask: function (bot, s) { var l = getL(leadsOf(bot), s.lead); say(bot, 'Snooze **' + (l ? l.name : 'it') + '** until when?', { buttons: [B('Tomorrow', 'slot:until=' + iso(dayStart(1))), B('In 3 days', 'slot:until=' + iso(dayStart(3))), B('Next Monday', 'slot:until=' + iso(nextMon())), B('In a week', 'slot:until=' + iso(dayStart(7)))] }); },
      parse: function (t, bot) { var k = kindOf(t); if (k && k !== bot.flow) return undefined; return parseUntil(t); } };
  }

  /* ---------- reports ---------- */
  function rankReport(bot, more) {
    var v = view(bot), ranked = v.open.slice().sort(function (a, b) { return (b.score - a.score) || (a.createdAt - b.createdAt); }).slice(0, 5), cfg = BIZ[v.biz], items = leadsOf(bot);
    if (!ranked.length) { say(bot, 'Nobody is waiting for a call. Every lead is closed or snoozed.', { kind: 'zero', buttons: [B('Daily summary', 'intent:summary')] }); return; }
    bot.mem.shown = ranked.map(function (e) { return e.id; }); bot.mem.rank = bot.mem.shown.slice(); bot.mem.focus = ranked[0].id;
    say(bot, 'Call these first, best score on top.', { cards: ranked.map(function (e, i) { var l = getL(items, e.id); return leadCard(bot, l, { n: i + 1, reason: reasonFor(l, e.parts, cfg) }); }), buttons: [B('Why this order?', 'intent:why'), B('Split today\'s leads', 'intent:split'), B('Follow-ups due', 'intent:due')] });
  }
  function whyReport(bot) {
    var cfg = BIZ[bizOf(bot)], items = leadsOf(bot), ids = bot.mem.rank && bot.mem.rank.length ? bot.mem.rank : openRanked(bot).slice(0, 5).map(function (e) { return e.id; }), now = Date.now();
    var rows = ids.map(function (id) { var l = getL(items, id); if (!l) return null; var p = scoreOf(l, cfg, now); return [l.name, String(p.intent), String(p.value), String(p.recency), String(p.noreply), String(p.booked), String(p.total)]; }).filter(Boolean);
    if (!rows.length) { say(bot, 'There is nothing to rank right now.', { buttons: [B('Daily summary', 'intent:summary')] }); return; }
    say(bot, ruleLine(cfg), { cards: [{ title: 'Score breakdown', sub: rows.map(function (r) { return r[0] + ' ' + r[6]; }).join(', '), table: { cols: ['Lead', 'Intent', 'Value', 'Recency', 'No reply', 'Booked', 'Total'], rows: rows, num: true }, meta: ['Intent max 30, value 25, recency 15, no reply 20, booked 10'] }], buttons: [B('Who should I call first?', 'intent:rank'), B('Split today\'s leads', 'intent:split')] });
  }
  function dueReport(bot, which) {
    var v = view(bot), items = leadsOf(bot), cfg = BIZ[v.biz], list = v.all.filter(function (e) { return which === 'overdue' ? e.dueState === 'overdue' : (e.dueState === 'overdue' || e.dueState === 'today'); }).sort(function (a, b) { return (a.dueAt || 0) - (b.dueAt || 0); }), td = tasksDue(bot).filter(function (t) { return which !== 'overdue' || parseDay(t.due) < dayStart(0); });
    if (!list.length) { say(bot, 'Inbox zero, nice work. No follow-ups ' + (which === 'overdue' ? 'are overdue' : 'are due today') + '.' + (td.length ? ' ' + plural(td.length, 'task') + ' still open.' : ''), { kind: 'zero', buttons: td.length ? [B('My tasks', 'intent:tasks'), B('Daily summary', 'intent:summary')] : [B('Daily summary', 'intent:summary'), B('Who should I call first?', 'intent:rank')] }); return; }
    bot.mem.shown = list.map(function (e) { return e.id; }); bot.mem.focus = list[0].id; var od = list.filter(function (e) { return e.dueState === 'overdue'; }).length;
    say(bot, '**' + plural(list.length, 'follow-up') + '** ' + (which === 'overdue' ? 'overdue' : 'due today') + (which !== 'overdue' && od ? ', ' + od + ' of them overdue' : '') + '.' + (list.length > 5 ? ' Showing the first five.' : '') + (td.length ? ' Plus ' + plural(td.length, 'task') + ' due.' : ''),
      { cards: list.slice(0, 5).map(function (e) { var l = getL(items, e.id); return leadCard(bot, l, { due: true, next: true, buttons: [B('Draft WhatsApp', 'act:draft:' + l.id), B('Call', 'act:call:' + l.id), B('Snooze', 'act:snoozeask:' + l.id)] }); }), buttons: [B('Who should I call first?', 'intent:rank')].concat(td.length ? [B('My tasks', 'intent:tasks')] : [], [B('Split today\'s leads', 'intent:split')]) });
  }
  function loadReport(bot, mode) {
    var v = view(bot), avg = v.avg, ov = v.team.filter(function (t) { return t.over; }), fr = v.team.filter(function (t) { return t.free; }), rows = v.team.slice().sort(function (a, b) { return b.load - a.load; });
    var table = { cols: ['Person', 'Open leads', 'Vs average', 'Status'], rows: rows.map(function (t) { var d = t.load - avg; return [t.name, String(t.load), (d >= 0 ? '+' : '') + d.toFixed(1), t.over ? 'Overloaded' : t.free ? 'Free' : 'Balanced']; }) };
    var head;
    if (mode === 'free') head = fr.length ? '**' + fr.map(function (t) { return t.name; }).join(', ') + '** ' + (fr.length === 1 ? 'has' : 'have') + ' room, against a team average of ' + avg.toFixed(1) + ' open leads.' : 'Nobody is clearly free. The team average is ' + avg.toFixed(1) + ' open leads.';
    else head = ov.length ? '**' + ov.map(function (t) { return t.name + ' (' + t.load + ')'; }).join(', ') + '** ' + (ov.length === 1 ? 'is' : 'are') + ' above the team average of ' + avg.toFixed(1) + ' open leads.' : 'Nobody is overloaded. The team average is ' + avg.toFixed(1) + ' open leads.';
    var sug = ov.length && fr.length ? ' Suggestion: move ' + plural(Math.max(1, ov[0].load - Math.ceil(avg)), 'lead') + ' from ' + first(ov[0].name) + ' to ' + fr.map(function (t) { return first(t.name); }).join(' or ') + '.' : '';
    say(bot, head + sug, { cards: [{ title: 'Team load', sub: rows.map(function (t) { return t.name + ' ' + t.load; }).join(', '), table: table }], buttons: (ov.length && fr.length ? [B('Rebalance now', 'intent:rebalance')] : []).concat([B('Split today\'s leads', 'intent:split'), B(mode === 'free' ? 'Who is overloaded?' : 'Who is free?', mode === 'free' ? 'intent:load' : 'say:who is free')]) });
  }
  function summaryReport(bot) {
    var v = view(bot), now = Date.now(), items = v.all, nw = items.filter(function (e) { return e.createdAt >= now - DAY; }).length, won = items.filter(function (e) { return e.stage === 'won'; }).length;
    var wonWeek = leadsOf(bot).filter(function (l) { return l.stage === 'won' && l.wonAt && l.wonAt >= now - 7 * DAY; }).length, src = { Web: 0, WhatsApp: 0, Instagram: 0 }; items.forEach(function (e) { src[e.source] = (src[e.source] || 0) + 1; });
    var tot = items.length || 1, hot = v.counts.hot;
    say(bot, 'Daily summary for **' + v.name + '**: ' + plural(nw, 'new lead') + ' in the last day, ' + plural(hot, 'hot lead') + ', ' + plural(v.counts.due, 'follow-up') + ' due' + (v.counts.overdue ? ' (' + v.counts.overdue + ' overdue)' : '') + ', ' + wonWeek + ' won this week.', { cards: [{ title: 'Today at ' + v.name, sub: 'New ' + nw + ', hot ' + hot + ', due ' + v.counts.due + ', won this week ' + wonWeek + '. Source split: Web ' + src.Web + ', WhatsApp ' + src.WhatsApp + ', Instagram ' + src.Instagram + '.',
      kpis: [{ label: 'New leads', value: nw }, { label: 'Hot leads', value: hot }, { label: 'Follow-ups due', value: v.counts.due }, { label: 'Won this week', value: wonWeek }],
      bars: [{ label: 'Web', value: src.Web, pct: Math.round(src.Web / tot * 100) }, { label: 'WhatsApp', value: src.WhatsApp, pct: Math.round(src.WhatsApp / tot * 100) }, { label: 'Instagram', value: src.Instagram, pct: Math.round(src.Instagram / tot * 100) }], barsTitle: 'Source split, all ' + items.length + ' leads' }], buttons: [B('Who should I call first?', 'intent:rank'), B('Follow-ups due', 'intent:due'), B('Who is overloaded?', 'intent:load')] });
  }
  function findReport(bot, text) {
    var v = view(bot), t = String(text).toLowerCase(), items = leadsOf(bot), list = null, desc = '', r;
    var srcM = t.match(/\b(whatsapp|instagram|insta|web|website)\b/), isLeadsOnly = /\bleads?\b|\benquir/.test(t);
    var team = teamOf(bot);
    if ((r = t.match(/\b(?:show|list|find|get|pull up)?\s*(?:me\s+)?([a-z]+)'?s?\s+(?:open\s+)?(?:leads|list|queue|load|pipeline|working on|handling)\b/) || t.match(/\bwhat(?:'s| is) ([a-z]+) (?:working on|handling|got)\b/)) && !STOPSET[r[1]]) { var pp = findPerson(bot, r[1]); if (pp && pp.ids.length === 1) { var pm = memberOf(team, pp.ids[0]); list = v.all.filter(function (e) { return e.owner === pm.id && !e.closed; }); desc = pm.name + '\'s open leads'; } }
    if (!list && /\bunassigned\b|\bno owner\b|\bnobody owns\b/.test(t)) { list = v.open.filter(function (e) { return !e.owner; }); desc = 'unassigned leads'; }
    if (!list && /\b(new|newest|latest|fresh|recent)\b/.test(t) && isLeadsOnly) { list = v.all.filter(function (e) { return e.stage === 'new'; }).sort(function (a, b) { return b.createdAt - a.createdAt; }); desc = 'new leads'; }
    if (!list && /\bhot\b/.test(t)) { list = v.open.filter(function (e) { return e.heat === 'hot'; }); desc = 'hot leads'; }
    if (!list && /\bsnoozed\b/.test(t)) { list = v.all.filter(function (e) { return e.stage === 'snoozed'; }); desc = 'snoozed leads'; }
    if (!list && /\b(won|lost)\b/.test(t) && isLeadsOnly) { var wl = /\bwon\b/.test(t) ? 'won' : 'lost'; list = v.all.filter(function (e) { return e.stage === wl; }); desc = wl + ' leads'; }
    if (!list && srcM) { var sn = srcM[1] === 'whatsapp' ? 'WhatsApp' : srcM[1] === 'instagram' || srcM[1] === 'insta' ? 'Instagram' : 'Web'; list = v.all.filter(function (e) { return e.source === sn && !e.closed; }); desc = sn + ' leads'; }
    if (!list) {
      var f = findLead(bot, text);
      if (f && f.ids.length) { list = f.ids.map(function (id) { return v.byId[id]; }).filter(Boolean); desc = f.how === 'phone' ? 'that number' : 'your search'; }
      else if (f) { say(bot, 'I could not find a lead like that. Try part of a name, the last digits of a phone number, a source such as Instagram, or a lead number.', { buttons: [B('New leads', 'say:show new leads'), B('Who should I call first?', 'intent:rank')] }); return; }
      else { say(bot, 'Who or what should I look for? Give me a name, the last digits of a phone number, or something like Instagram leads or unassigned leads.', { buttons: [B('New leads', 'say:show new leads'), B('Unassigned leads', 'say:unassigned leads'), B('Hot leads', 'say:hot leads')] }); return; }
    }
    if (!list.length) { say(bot, 'No ' + desc + ' right now.', { buttons: topChips().slice(0, 3) }); return; }
    list = list.slice(); bot.mem.shown = list.map(function (e) { return e.id; }); if (list.length === 1) bot.mem.focus = list[0].id;
    var chips = list.length === 1 ? [B('Draft WhatsApp', 'act:draft:' + list[0].id), B('Snooze', 'act:snoozeask:' + list[0].id), B('Mark won', 'act:won:' + list[0].id), B('Mark lost', 'act:lost:' + list[0].id)] : [B('Who should I call first?', 'intent:rank'), B('Daily summary', 'intent:summary')];
    say(bot, 'Found **' + plural(list.length, 'lead') + '** for ' + desc + (list.length > 5 ? ', showing the first five' : '') + '.', { cards: list.slice(0, 5).map(function (e) { var l = getL(items, e.id); return leadCard(bot, l, { extra: ['Last contact: ' + agoTxt(l.lastContact), dueLabel(l)], buttons: [B('Open', 'act:open:' + l.id), B('Draft WhatsApp', 'act:draft:' + l.id), B('Assign', 'act:assignask:' + l.id)] }); }), buttons: chips });
  }
  function listTasks(bot, text) {
    var t = String(text).toLowerCase(), all = tasksOf(bot).filter(function (x) { return !x.done; }), kind = /\boverdue\b/.test(t) ? 'overdue' : /\btoday\b/.test(t) ? 'today' : 'open', list = all.filter(function (x) { return kind === 'open' || (kind === 'today' ? x.due && x.due <= iso(dayStart(0)) : x.due && parseDay(x.due) < dayStart(0)); }).sort(function (a, b) { return String(a.due || '9').localeCompare(String(b.due || '9')) || String(a.time).localeCompare(String(b.time)); });
    if (!list.length) { say(bot, 'No ' + (kind === 'open' ? 'open' : kind) + ' tasks. Say "remind me to call someone tomorrow at 5" to add one.', { buttons: [B('New task', 'flow:task'), B('Follow-ups due', 'intent:due')] }); return; }
    say(bot, '**' + plural(list.length, 'task') + '** ' + (kind === 'open' ? 'open' : kind) + '.', { cards: list.slice(0, 5).map(function (x) { return taskCard(bot, x); }), buttons: [B('New task', 'flow:task'), B('Follow-ups due', 'intent:due')] });
  }
  function openLead(bot, id) {
    var l = getL(leadsOf(bot), id); if (!l) { say(bot, 'I cannot find that lead any more.'); return; } bot.mem.focus = id; var cfg = BIZ[bizOf(bot)], sc = scoreOf(l, cfg), h = (l.hl || []).slice(0, 4).map(function (x) { return x[0] + ': ' + x[1]; });
    say(bot, 'Here is **' + l.name + '**. ' + reasonFor(l, sc, cfg) + '.', { cards: [leadCard(bot, l, { extra: ['Value: ' + l.valueLabel, 'Phone ' + mask(l.phone), 'Last contact: ' + agoTxt(l.lastContact), dueLabel(l)].concat(l.notes ? ['Notes: ' + l.notes] : [], h), buttons: [B('Draft WhatsApp', 'act:draft:' + id), B('Call', 'act:call:' + id), B('Assign', 'act:assignask:' + id)] })], buttons: [B('Snooze', 'act:snoozeask:' + id), B('Mark won', 'act:won:' + id), B('Mark lost', 'act:lost:' + id)] });
  }
  function greet(bot) {
    var v = view(bot), me = meOf(bot), hr = new Date().getHours(), part = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening', fresh = v.all.filter(function (e) { return e.fresh; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    var counts = v.counts.hot + ' hot ' + (v.counts.hot === 1 ? 'lead' : 'leads') + ', ' + plural(v.counts.due, 'follow-up') + ' due' + (v.counts.unassigned ? ', ' + v.counts.unassigned + ' unassigned' : '');
    say(bot, 'Good ' + part + ', ' + first(me.name) + '. **' + v.name + '** today: ' + (v.zero ? 'inbox zero, ' : '') + counts + '.' + (fresh.length ? '\nNew from your chat: **' + fresh[0].name + '**.' : ''), { buttons: (fresh.length ? [B('Open ' + first(fresh[0].name), 'act:open:' + fresh[0].id)] : []).concat(topChips()), kind: v.zero ? 'zero' : null });
  }

  /* ---------- the agent ---------- */
  var seeds = {}; IDS.forEach(function (b) { seeds['leads:' + b] = function () { return seedLeads(b); }; seeds['team:' + b] = function () { return seedTeam(b); }; seeds['tasks:' + b] = function () { return seedTasks(b); }; seeds['calls:' + b] = function () { return []; }; seeds['sent:' + b] = function () { return []; }; seeds['undo:' + b] = function () { return null; }; });
  var SAMPLES = { realty: ['Who should I call first?', 'Draft a WhatsApp to Priya Nair', 'Snooze Anjali till Monday', 'Split today\'s leads between the team'], support: ['Who should I call first?', 'Draft a WhatsApp to Oliver', 'Assign Grace to Noah', 'Who is overloaded?'], build: ['Who should I call first?', 'Draft a WhatsApp to Arun Pillai', 'Split today\'s leads between the team', 'Remind me to call Rajiv tomorrow at 5'], clinic: ['Who should I call first?', 'Follow-ups due today', 'Mark Tanya as won', 'Who is free?'], salon: ['Who should I call first?', 'Draft a WhatsApp to Neha Bajaj', 'Split today\'s leads between the team', 'Daily summary'], dining: ['Who should I call first?', 'Assign Vikram Anand to Kabir', 'Follow-ups due today', 'Who is overloaded?'] };

  O.registerAgent({
    id: 'crm', name: 'CRM assistant', business: 'Orbit CRM', role: 'Team-side lead assistant', industry: 'Sales operations', initials: 'CR', accent: '#C8FF4D', kind: 'staff',
    blurb: 'The team side of Orbit Assistants: ranks who to call first with a visible score, lists follow-ups, drafts WhatsApp replies, splits leads between teammates with Apply and Undo, and logs calls and tasks. Scripted, no AI.',
    helloLine: 'Ask me who to call first, what is due, or to split the leads between the team.',
    samples: ['Who should I call first?', 'Draft a WhatsApp to the first lead', 'Split today\'s leads between the team', 'Snooze a lead till Monday'],
    contexts: IDS.map(function (b) { return { label: bizName(b), context: { biz: b } }; }),
    synonyms: { lead: ['leads', 'enquiries', 'enquiry', 'inquiry', 'inquiries', 'prospect', 'prospects'], assignto: ['reassign', 're-assign'] },
    seeds: seeds,
    menu: topChips(),
    greeting: function (bot) { greet(bot); },
    extract: function (text, bot) {
      var e = {}, t = String(text), k, r, v, a;
      bot.mem.candList = null; bot.mem.noMatch = false; bot.mem.pCands = null; bot.mem.pNone = false;
      k = kindOf(t); if (!k) return e; e.kind = k; /* keys are prefixed with n so they never fill a slot of a flow that is already running */
      if (k === 'assign') { a = splitAssign(t); if (a) { v = parkLead(bot, findLead(bot, a.lead)); if (v) e.nlead = v; var pv = parkPerson(bot, findPerson(bot, a.person)); if (pv) e.nperson = pv; } else { var m1 = t.match(/\b(?:re-?assign|assign|allocate|delegate)\b\s+(?:to\s+)?(.+)$/i); if (m1) { v = parkLead(bot, findLead(bot, m1[1])); if (v) e.nlead = v; } } }
      else if (k === 'snooze') { v = parkLead(bot, findLead(bot, t)); if (v) e.nlead = v; var u = parseUntil(t); if (u) e.nuntil = u; }
      else if (k === 'mark') { v = parkLead(bot, findLead(bot, t)); if (v) e.nlead = v; e.nverdict = /\b(?:lost|dropped)\b/i.test(t) ? 'lost' : 'won'; }
      else if (k === 'draft') { v = parkLead(bot, findLead(bot, t)); if (v) e.nlead = v; }
      else if (k === 'call') { v = parkLead(bot, findLead(bot, t)); if (v) e.nlead = v; var oc = outcomeOf(t); if (oc) e.noutcome = oc; }
      else if (k === 'task') { var ti = fixNames(bot, cleanTitle(t)); if (ti) e.ntitle = ti; var du = dueFrom(N.when(t)); if (du) e.ndue = du; r = findLead(bot, ti || t); if (r && r.ids.length === 1) e.nlead = r.ids[0]; }
      return e;
    },
    intents: [
      { id: 'rank', label: 'Who should I call first?', kw: ['who should i call first', 'call first', 'top leads', 'priority leads', 'who to call', 'who do i call', 'who should i call', 'best leads'], re: [/\bwho (?:should|shall|do|can|to) (?:i|we)? ?(?:call|ring|contact|ping|chase|text|phone)\b/i, /\b(?:call|contact|ring) (?:first|next)\b/i, /\b(?:top|best|hottest|priority) (?:\d+ )?(?:leads?|enquir\w+|calls?)\b/i, /\bprioriti[sz]e\b/i, /\brank(?:ing)? (?:my |the |today'?s )?leads?\b/i, /\bwho(?:'s| is) (?:hot|hottest|next)\b/i, /\bwho first\b/i, /\bwhich (?:leads?|enquir\w+|customers?) (?:are|is) (?:the )?(?:hot|hottest|best|top|priority|urgent)\b/i, /\bhottest\b/i], priority: 2, run: function (bot) { rankReport(bot); } },
      { id: 'why', label: 'Why this order?', kw: ['why this order', 'score breakdown', 'show the score', 'show scores', 'how are leads scored'], re: [/\bwhy (?:this|that|the) (?:order|ranking|list)\b/i, /\bwhy is .+ (?:first|top|ranked|number one|hot)\b/i, /\b(?:score|scoring) breakdown\b|\bbreakdown\b/i, /\bshow (?:me )?(?:the )?(?:scores?|points)\b/i], priority: 3, run: function (bot) { whyReport(bot); } },
      { id: 'due', label: 'Follow-ups due', kw: ['follow up', 'follow-up', 'followups', 'due today', 'overdue', 'what is due', 'pending follow up', 'who is due'], re: [/\bfollow[- ]?ups?\b/i, /\boverdue\b/i, /\bwhat(?:'s| is) due\b/i, /\bdue (?:today|now|leads)\b/i, /\bwho (?:is|are) (?:due|overdue)\b/i], priority: 1, run: function (bot, m) { dueReport(bot, /\boverdue\b/i.test(m.text) && !/\btoday\b/i.test(m.text) ? 'overdue' : 'today'); } },
      { id: 'split', label: 'Split today\'s leads', kw: ['split today lead', 'split the lead', 'split lead between the team', 'delegate lead', 'divide the lead', 'distribute lead', 'share the lead'], re: [RX.split, /\bdelegate\b.*\b(?:leads?|today|team|work|between)\b/i, /\ballocate\b.*\b(?:leads?|today)\b/i, /\bassign\b.*\b(?:all|today'?s|the|my)\s+(?:new\s+)?leads\b/i, /\bwho (?:should )?(?:takes?|handles?|owns?) (?:which|what|each)\b/i], priority: 3, run: function (bot) {
        var pl = plan(bot, 'split'); if (!pl.count) { say(bot, 'There are no open leads to split today.', { kind: 'zero', buttons: [B('Daily summary', 'intent:summary')] }); return; }
        bot.mem.plan = pl; say(bot, 'Split of **' + plural(pl.count, 'lead') + '**: skills first, then load.' + (pl.moves.length ? ' Nothing is saved until you tap Apply.' : ' Nothing needs to move.'), { cards: [pl.moves.length ? planCard(bot, pl) : planCard(bot, pl, true)], buttons: [B('Who is overloaded?', 'intent:load'), B('Who should I call first?', 'intent:rank')] }); } },
      { id: 'rebalance', label: 'Rebalance', kw: ['rebalance', 're-balance', 'even out the load', 'balance the load', 'balance the team'], re: [/\brebalanc\w*/i, /\bre-balanc\w*/i, /\b(?:even|level) out\b/i, /\bbalance (?:the )?(?:load|team|work)\b/i], priority: 4, run: function (bot) {
        var pl = plan(bot, 'rebalance'); if (!pl.moves.length) { say(bot, 'The load is already balanced, so there is nothing to move.', { buttons: [B('Who is overloaded?', 'intent:load'), B('Split today\'s leads', 'intent:split')] }); return; }
        bot.mem.plan = pl; say(bot, 'Rebalance: **' + plural(pl.moves.length, 'lead') + '** move from the busiest to teammates with room. Nothing is saved until you tap Apply.', { cards: [planCard(bot, pl)], buttons: [B('Who is overloaded?', 'intent:load'), B('Split today\'s leads', 'intent:split')] }); } },
      { id: 'apply', label: 'Apply the plan', kw: [], re: [/^\s*(?:yes[, ]*)?(?:apply|confirm|go ahead|do it|looks good|apply (?:it|that|this|the (?:plan|split)))\s*[.!]*\s*$/i], priority: 5, run: function (bot) { applyPlan(bot); } },
      { id: 'undo', label: 'Undo', kw: ['undo'], re: [/\bundo\b/i, /\brevert (?:the )?(?:split|plan|assign\w*)\b/i, /\broll ?back\b/i], priority: 5, run: function (bot) { undoPlan(bot); } },
      { id: 'assign', label: 'Assign a lead', kw: ['assign', 'reassign', 'allocate'], re: [RX.assign, /\bhand (?:\w+ )?over to\b/i], priority: 2, run: function (bot, m) { launch(bot, 'assign', m.ent); } },
      { id: 'snooze', label: 'Snooze a lead', kw: ['snooze', 'postpone', 'defer'], re: [RX.snooze], priority: 3, run: function (bot, m) { launch(bot, 'snooze', m.ent); } },
      { id: 'mark', label: 'Mark won or lost', kw: ['mark won', 'mark lost', 'closed won', 'deal won', 'deal lost'], re: [RX.mark], priority: 3, run: function (bot, m) { launch(bot, 'mark', m.ent); } },
      { id: 'load', label: 'Who is overloaded?', kw: ['overloaded', 'overload', 'who is free', 'who is busy', 'workload', 'team load', 'who has capacity', 'busiest'], re: [/\boverload\w*|\bover[- ]?stretched|\bswamped|\bbusiest|\bheaviest\b|\blightest\b/i, /\bwho(?:'s| is) (?:free|available|idle|least busy|busy)\b/i, /\bwho has (?:capacity|room|time|space)\b/i, /\bwho(?:'s| has) got (?:capacity|room|time|space)\b/i, /\bhow (?:loaded|busy|stretched)\b/i, /\b(?:team |current )?(?:load|workload|capacity)\b/i], priority: 2, run: function (bot, m) { loadReport(bot, /\b(?:free|available|idle|least busy|capacity|room|lightest)\b/i.test(m.text) && !/overload/i.test(m.text) ? 'free' : 'over'); } },
      { id: 'summary', label: 'Daily summary', kw: ['daily summary', 'summary', 'recap', 'rundown', 'brief me', 'briefing', 'source split', 'snapshot', 'how are we doing', 'what is new'], re: [/\b(?:daily )?(?:summary|recap|rundown|briefing|snapshot)\b/i, /\bbrief me\b/i, /\bhow (?:are|is) (?:we|it|the day|today)\b/i, /\bsource split\b|\bleads? by source\b|\bby source\b/i, /\bhow many\b.*\b(?:won|new|hot|lost|leads?|follow)/i, /\b(?:won|lost) (?:this|last) week\b/i, /\bwhat(?:'s| is) (?:new|happening)\b/i], priority: 4, run: function (bot) { summaryReport(bot); } },
      { id: 'sent', label: 'Mark as sent', kw: [], re: [/^(?!\s*(?:how|what|why|does|do|can|is)\b).*\bmark(?:ed)?(?: (?:it|this|the draft))?(?: as)? sent\b/i, /\bi (?:have |already |just )?sent (?:it|that|the message)\b/i, /\bsent it\b/i], priority: 6, run: function (bot, m) {
        var r = findLead(bot, m.text), id = r && r.ids.length === 1 && r.how !== 'focus' ? r.ids[0] : (bot.mem.draft && bot.mem.draft.id);
        if (!id) { say(bot, 'There is no draft open. Tell me who to message, for example "draft a WhatsApp to" and a name.', { buttons: [B('Who should I call first?', 'intent:rank')] }); return; } doSent(bot, id); } },
      { id: 'copy', label: 'Copy the draft', kw: [], re: [/^\s*copy(?: it| that| the (?:message|draft|text))?\s*[.!]*\s*$/i], priority: 5, run: function (bot) { O.agents.crm.actions.copy(bot, bot.mem.draft ? bot.mem.draft.id : ''); } },
      { id: 'draft', label: 'Draft a WhatsApp', kw: ['draft', 'draft a whatsapp', 'whatsapp message', 'write a message', 'message for'], re: [RX.draft], priority: 3, run: function (bot, m) { launch(bot, 'draft', m.ent); } },
      { id: 'call', label: 'Log a call', kw: ['log a call', 'log call', 'i called', 'just called', 'spoke to', 'spoke with', 'left a voicemail', 'no answer'], re: [RX.call], priority: 2, run: function (bot, m) { launch(bot, 'call', m.ent); } },
      { id: 'task', label: 'Create a task', kw: ['create a task', 'add a task', 'new task', 'remind me', 'set a reminder'], re: [RX.task], priority: 4, run: function (bot, m) { launch(bot, 'task', m.ent); } },
      { id: 'task_done', label: 'Complete a task', kw: [], re: [/^\s*(?:mark\s+)?(?:task\s+)?(?:done|finished|complete[d]?|tick off)\b\s*(?:with\s+)?(?:task\s+)?#?\d{1,3}\b/i, /\btask\s*#?\d{1,3}\s+(?:is\s+)?(?:done|complete[d]?|finished)\b/i], priority: 5, run: function (bot, m) { var n = (String(m.text).match(/#?(\d{1,3})\b/) || [])[1]; completeTask(bot, +n); } },
      { id: 'tasks', label: 'My tasks', kw: ['my task', 'task list', 'open task', 'to do list', 'my reminder', 'what do i have to do'], re: [/\b(?:my |open |pending |all |today'?s )?(?:tasks?|to-?dos?|reminders?)\b/i], priority: 1, run: function (bot, m) {
        var n = (String(m.text).toLowerCase().match(/\b(?:done|finished|complete[d]?|tick off|close|mark)\b[^\d]{0,14}#?(\d{1,3})\b/) || [])[1]; if (n) { completeTask(bot, +n); return; } listTasks(bot, m.text); } },
      { id: 'whoami', label: 'Switch user', kw: [], re: [/\b(?:i am|i'm|this is|switch to|log in as|sign in as)\s+[a-z]+\b/i], priority: 1, run: function (bot, m) {
        var r = findPerson(bot, String(m.text).replace(/\b(?:i am|i'm|this is|switch to|log in as|sign in as)\b/i, '')); if (r && r.ids.length === 1) { bot.mem.me = r.ids[0]; var p = memberOf(teamOf(bot), r.ids[0]); say(bot, 'Hello ' + p.name + ' (' + p.role + '). I will use your name for drafts and reminders.', { buttons: topChips().slice(0, 3) }); return; } say(bot, 'I do not know that team member. The team is ' + teamOf(bot).map(function (t) { return first(t.name); }).join(', ') + '.'); } },
      { id: 'find', label: 'Find a lead', kw: ['find', 'look up', 'search for', 'pull up', 'who is', 'show me', 'new leads', 'hot leads', 'unassigned leads', 'instagram leads', 'whatsapp leads', 'web leads', 'open lead'], re: [/\b(?:find|look ?up|search(?: for)?|pull up|who is|open)\b/i, /\b(?:new|hot|unassigned|snoozed|won|lost|instagram|whatsapp|web|website) leads?\b/i, /\bleads? (?:from|via|on) (?:whatsapp|instagram|web|website)\b/i, /\bshow (?:me )?(?:all )?[a-z]+'?s? (?:open )?leads\b/i, /\bwhat(?:'s| is) [a-z]+ (?:working on|handling|got)\b/i, /\bunassigned\b|\bno owner\b/i], priority: 0, run: function (bot, m) { findReport(bot, m.text); } }
    ],
    flows: {
      assign: { intent: 'assign', slots: [leadSlot(), personSlot()], done: function (bot, s) { doAssign(bot, s.lead, s.person); } },
      snooze: { intent: 'snooze', slots: [leadSlot(), untilSlot()], done: function (bot, s) { doSnooze(bot, s.lead, s.until); } },
      mark: { intent: 'mark', slots: [leadSlot(), { name: 'verdict', hint: 'Say won or lost.', ask: function (bot, s) { var l = getL(leadsOf(bot), s.lead); say(bot, 'Is **' + (l ? l.name : 'it') + '** won or lost?', { buttons: [B('Won', 'slot:verdict=won'), B('Lost', 'slot:verdict=lost')] }); }, parse: function (t) { return /\b(won|win|converted|closed)\b/i.test(t) ? 'won' : /\b(lost|lose|dropped|gone)\b/i.test(t) ? 'lost' : undefined; } }], done: function (bot, s) { doClose(bot, s.lead, s.verdict); } },
      draft: { intent: 'draft', slots: [leadSlot()], done: function (bot, s) { var l = getL(leadsOf(bot), s.lead); if (!l) { say(bot, 'I lost track of that lead. Tell me who it is for.'); return; } showDraft(bot, l); } },
      call: { intent: 'call', slots: [leadSlot(),
        { name: 'outcome', hint: 'Pick one: reached, no answer, voicemail or wrong number.', ask: function (bot, s) { var l = getL(leadsOf(bot), s.lead); say(bot, (s.dial ? 'Call **' + (l ? l.name : 'them') + '** on ' + (l ? mask(l.phone) : '') + ' (masked in this demo). ' : '') + 'How did the call with **' + (l ? first(l.name) : 'them') + '** go?', { buttons: [B('Reached', 'slot:outcome=reached'), B('No answer', 'slot:outcome=no answer'), B('Voicemail', 'slot:outcome=voicemail'), B('Wrong number', 'slot:outcome=wrong number')] }); }, parse: function (t) { return outcomeOf(t); } },
        { name: 'notes', ask: function (bot) { say(bot, 'Any notes? One line is enough.', { buttons: [B('No notes', 'slot:notes=-')] }); }, parse: function (t, bot) { t = String(t).trim(); if (!t) return undefined; return /^(?:no|none|nothing|skip|nope|no (?:notes?|thanks))\.?$/i.test(t) ? '-' : t; } },
        { name: 'next', when: function (bot, s) { return s.outcome !== 'wrong number'; }, ask: function (bot) { say(bot, 'What is the next step? Add a day if you like, for example "send brochure on Friday". Or skip it.', { buttons: [B('Follow up tomorrow', 'slot:next=follow up tomorrow'), B('No next step', 'slot:next=-')] }); }, parse: function (t, bot) { t = String(t).trim(); if (!t) return undefined; return /^(?:no|none|nothing|skip|nope|n\/a|no (?:next )?(?:step|notes?))\.?$/i.test(t) ? '-' : t; } }
      ], done: function (bot, s) {
        var st = store(bot), l = getL(st.items, s.lead); if (!l) { say(bot, 'I lost track of that lead.'); return; } var notes = s.notes === '-' || !s.notes ? '' : s.notes, nx = s.next && s.next !== '-' ? s.next : '', calls = bot.db('calls:' + bizOf(bot)) || [], was = l.stage;
        calls.push({ id: 'K-' + (calls.length + 1), lead: l.id, name: l.name, by: meOf(bot).id, outcome: s.outcome, notes: notes, next: nx, at: Date.now() }); bot.save('calls:' + bizOf(bot), calls);
        if (s.outcome !== 'wrong number') { l.lastContact = Date.now(); if (l.stage === 'new') l.stage = 'contacted'; } else { l.notes = (l.notes ? l.notes + ' ' : '') + 'Wrong number on file.'; }
        if (notes) l.notes = notes + (l.notes ? ' ' + l.notes : ''); l.nextStep = nx;
        var due = nx ? dueFrom(N.when(nx)) : undefined, dueTxt = '';
        if (due) { var sd = splitDue(due), dd = parseDay(sd.due); dd.setHours(sd.time ? +sd.time.split(':')[0] : 10, sd.time ? +sd.time.split(':')[1] : 0, 0, 0); l.dueAt = dd.getTime(); dueTxt = O.fmtDay(dd); }
        else if (nx) { var d1 = dayStart(1); d1.setHours(10, 0, 0, 0); l.dueAt = d1.getTime(); dueTxt = 'tomorrow'; }
        else if (s.outcome === 'no answer' || s.outcome === 'voicemail') { var d2 = dayStart(1); d2.setHours(10, 0, 0, 0); l.dueAt = d2.getTime(); dueTxt = 'tomorrow'; }
        else l.dueAt = null;
        touch(l); commit(bot, st, [l.id], 'call'); bot.mem.focus = l.id; bot.event('action', { action: 'call_logged', outcome: s.outcome, lead: l.id });
        var v = view(bot);
        say(bot, 'Logged. Call with **' + l.name + '**: ' + s.outcome + '.' + (was === 'new' && l.stage === 'contacted' ? ' Stage is now Contacted.' : '') + (dueTxt ? ' Next follow-up: ' + dueTxt + '.' : ' No follow-up needed.') + (s.outcome === 'wrong number' ? ' Worth checking the number on file.' : '') + (v.zero ? ' That clears every follow-up.' : ''), { kind: v.zero ? 'zero' : null, buttons: [B('Draft WhatsApp', 'act:draft:' + l.id), B('Follow-ups due', 'intent:due'), B('Who should I call first?', 'intent:rank')] });
      } },
      task: { intent: 'task', slots: [
        { name: 'title', hint: 'Tell me the task in a few words, for example call Priya tomorrow at 5.', ask: function (bot) { say(bot, 'What is the task? For example: call back tomorrow at 5.'); }, parse: function (t) { return cleanTitle(t) || undefined; } },
        { name: 'due', hint: 'Say a day, like tomorrow, Friday or 20 Nov, or say no date.', ask: function (bot) { say(bot, 'When is it due?', { buttons: [B('Today', 'slot:due=' + iso(dayStart(0))), B('Tomorrow', 'slot:due=' + iso(dayStart(1))), B('This week', 'slot:due=' + iso(dayStart(4))), B('No date', 'slot:due=none')] }); }, parse: function (t) { if (/\b(?:no date|none|whenever|no deadline|no rush|skip)\b/i.test(t)) return 'none'; return dueFrom(N.when(t)); } },
        { name: 'lead', optional: true }
      ], done: function (bot, s) { var sd = splitDue(s.due), t = addTask(bot, { title: s.title, due: sd.due, time: sd.time, lead: s.lead || '' }); say(bot, 'Reminder set: **' + t.title + '**, ' + taskWhen(t) + '.', { cards: [taskCard(bot, t)], buttons: [B('My tasks', 'intent:tasks'), B('Follow-ups due', 'intent:due')] }); } }
    },
    actions: {
      open: function (bot, id) { openLead(bot, id); },
      call: function (bot, id) { var l = getL(leadsOf(bot), id); if (!l) { say(bot, 'I cannot find that lead any more.'); return; } bot.mem.focus = id; bot.startFlow('call', { lead: id, dial: true }); },
      draft: function (bot, id) { var l = getL(leadsOf(bot), id); if (!l) { say(bot, 'I cannot find that lead any more.'); return; } showDraft(bot, l); },
      copy: function (bot, id) {
        var d = bot.mem.draft; if (!d || (id && d.id !== id)) { say(bot, 'There is no draft to copy. Ask me to draft a WhatsApp first.', { buttons: [B('Who should I call first?', 'intent:rank')] }); return; }
        var ok = false; try { if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(d.text); ok = true; } } catch (e) { ok = false; }
        bot.event('action', { action: 'draft_copied', lead: d.id }); say(bot, ok ? 'Copied. Paste it into WhatsApp, then tap Mark as sent.' : 'Select and copy the text in the card above, then tap Mark as sent.', { buttons: [B('Mark as sent', 'act:sent:' + d.id)] });
      },
      sent: function (bot, id) { id = id || (bot.mem.draft && bot.mem.draft.id); if (!id) { say(bot, 'There is no draft to mark as sent.'); return; } doSent(bot, id); },
      assign: function (bot, arg) { var a = String(arg).split('|'); doAssign(bot, a[0], a[1]); },
      assignask: function (bot, id) { var l = getL(leadsOf(bot), id); if (!l) return; bot.mem.focus = id; bot.startFlow('assign', { lead: id }); },
      snooze: function (bot, arg) { var a = String(arg).split('|'); doSnooze(bot, a[0], a[1]); },
      snoozeask: function (bot, id) { var l = getL(leadsOf(bot), id); if (!l) return; bot.mem.focus = id; bot.startFlow('snooze', { lead: id }); },
      won: function (bot, id) { doClose(bot, id, 'won'); },
      lost: function (bot, id) { doClose(bot, id, 'lost'); },
      remind: function (bot, arg) { var a = String(arg).split('|'), st = store(bot), l = getL(st.items, a[0]), n = +a[1] || 2; if (!l) return; var d = dayStart(n); d.setHours(10, 0, 0, 0); l.dueAt = d.getTime(); touch(l); commit(bot, st, [l.id], 'remind'); bot.event('action', { action: 'follow_up_set', lead: l.id }); say(bot, 'Follow-up for **' + l.name + '** set for ' + O.fmtDay(d) + ', 10:00.', { buttons: [B('Follow-ups due', 'intent:due'), B('Who should I call first?', 'intent:rank')] }); },
      split_apply: function (bot) { applyPlan(bot); },
      split_undo: function (bot) { undoPlan(bot); },
      split_why: function (bot) { var pl = bot.mem.plan; if (!pl) { say(bot, 'No plan is open. Ask me to split today\'s leads.', { buttons: [B('Split today\'s leads', 'intent:split')] }); return; } say(bot, 'How the split works: leads go to the person whose skills match the lead\'s area first (' + teamOf(bot).map(function (t) { return first(t.name) + ': ' + t.skills.slice(0, 3).join(', '); }).join('; ') + '). Ties are broken by current load, and nobody gets more than their even share. Hottest leads are placed first.', { buttons: [B('Apply', 'act:split_apply:'), B('Who is overloaded?', 'intent:load')] }); },
      tdone: function (bot, n) { completeTask(bot, +n); }
    },
    kb: [
      { id: 'ranking', q: 'How does the ranking work?', a: 'Every open lead gets a score out of 100 from five visible inputs: intent (up to 30), value (up to 25), how recent the enquiry is (up to 15), hours it has waited without our reply (up to 20) and 10 if a visit or appointment is booked. Highest score goes to the top. Tap Why this order for the table.', keys: ['how does the ranking work', 'how is the score calculated', 'ranking rule', 'how are leads ranked', 'scoring rule', 'how do you rank', 'how do you score', 'what is the score based on'], buttons: [B('Why this order?', 'intent:why'), B('Who should I call first?', 'intent:rank')] },
      { id: 'data', q: 'What data does it read?', a: 'Three things, all stored in this browser: the demo CRM leads and team for the business you are viewing, the leads a visitor creates in that business\'s customer chat on this page, and your own tasks, calls and notes. Phone numbers are masked. Nothing is sent anywhere.', keys: ['what data does it read', 'what data do you read', 'where does the data come from', 'what can you see', 'data sources', 'which data'], buttons: [B('Daily summary', 'intent:summary')] },
      { id: 'delegation', q: 'How do handover and delegation work?', a: 'A lead captured in the customer chat lands at the top of Today with a "New" label, unassigned. To delegate, say "split today\'s leads": I match each lead\'s area or skill to a teammate first, then balance by current load, and show a table with Apply and Undo. Or assign one lead: "assign Priya to Dev".', keys: ['how does handover work', 'how does delegation work', 'how do you delegate', 'handover', 'hand over', 'who gets new leads', 'how do leads reach the team', 'how does assigning work'], buttons: [B('Split today\'s leads', 'intent:split'), B('Who is overloaded?', 'intent:load')] },
      { id: 'sending', q: 'Does it send WhatsApp messages?', a: 'No. I write the message from the lead\'s details. You copy it into WhatsApp yourself. Mark as sent only records that you sent it: it updates last contact and stage and clears the follow-up.', keys: ['does it send messages', 'do you send whatsapp', 'does it send whatsapp', 'can you send messages', 'actually send', 'mark as sent mean', 'what does mark as sent do'], buttons: [B('Who should I call first?', 'intent:rank')] },
      { id: 'dates', q: 'How do snooze and follow-up dates work?', a: 'A follow-up is due today or overdue when its date has arrived. Snooze hides a lead until the morning of the day you pick, then it returns to Today. Logging a call can set the next follow-up, and Mark as sent clears the current one. Say "snooze Anjali till Monday".', keys: ['how does snooze work', 'what does snooze do', 'follow up dates', 'when do snoozed leads come back', 'how do follow ups work'], buttons: [B('Follow-ups due', 'intent:due')] },
      { id: 'demo', q: 'Is this real data?', a: 'No. This is a scripted demo with no AI and no network. Every business, lead, teammate and number is fictional, and phone numbers are masked. The only real lead is one you create yourself in the customer chat, and it appears here live.', keys: ['is this real', 'is this a demo', 'real data', 'fake data', 'is this ai', 'does this use ai', 'privacy', 'personal data'], buttons: [B('Who should I call first?', 'intent:rank')] }
    ],
    freeText: function (bot, m) {
      var r = findLead(bot, m.text); if (r && r.ids.length) { findReport(bot, m.text); return true; } return false;
    }
  });

  /* ---------- exposed for crm-ui.js and the page ---------- */
  O.crm = { api: { view: view, store: store, leads: leadsOf, team: teamOf, openRanked: openRanked, scoreOf: scoreOf, biz: bizOf, bizName: bizName, cfg: function (b) { return BIZ[b]; }, ids: IDS, draftText: draftText, initials: initials, nextMon: nextMon }, on: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; }, samples: SAMPLES, biz: IDS, pageLoadedAt: PAGE_T };
})();
