/* Ordwell — seed data. A fictional Bengaluru agency, Fernhill Digital, running client delivery on Ordwell.
   All dates are offsets from "today" when the demo is first opened; store.js re-bases them on later visits
   so overdue / due-today stays meaningful. Every name, client and number here is fictional demo data. */
(function () {
  'use strict';
  var OW = window.OW = window.OW || {};

  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function dayStr(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function at(n, h, m) { var d = new Date(); d.setDate(d.getDate() + n); d.setHours(h || 10, m || 0, 0, 0); return d.getTime(); }

  var USERS = [
    { id: 'u1', name: 'Aditi Rao', title: 'Delivery lead', role: 'admin', hue: 18, cap: 40, email: 'aditi@fernhill-digital.in' },
    { id: 'u2', name: 'Kabir Mehta', title: 'Founder & creative director', role: 'owner', hue: 222, cap: 30, email: 'kabir@fernhill-digital.in' },
    { id: 'u3', name: 'Priya Nair', title: 'Senior designer', role: 'member', hue: 330, cap: 40, email: 'priya@fernhill-digital.in' },
    { id: 'u4', name: 'Rohan Iyer', title: 'Frontend engineer', role: 'member', hue: 200, cap: 40, email: 'rohan@fernhill-digital.in' },
    { id: 'u5', name: 'Sana Qureshi', title: 'Copy lead', role: 'member', hue: 280, cap: 32, email: 'sana@fernhill-digital.in' },
    { id: 'u6', name: 'Vikram Shetty', title: 'Motion designer', role: 'member', hue: 150, cap: 40, email: 'vikram@fernhill-digital.in' },
    { id: 'u7', name: 'Meera Pillai', title: 'Account manager', role: 'admin', hue: 40, cap: 40, email: 'meera@fernhill-digital.in' },
    { id: 'u8', name: 'Arjun Das', title: 'Backend engineer', role: 'member', hue: 260, cap: 40, email: 'arjun@fernhill-digital.in' },
    { id: 'u9', name: 'Neha Kulkarni', title: 'Social media manager', role: 'member', hue: 350, cap: 36, email: 'neha@fernhill-digital.in' },
    { id: 'u10', name: 'Ishaan Gupta', title: 'QA analyst', role: 'member', hue: 100, cap: 40, email: 'ishaan@fernhill-digital.in' },
    { id: 'u11', name: 'Farhan Ali', title: 'Marketing head, Coorg Ember Coffee', role: 'guest', hue: 28, cap: 0, email: 'farhan@coorgember.in', guestOf: ['p1', 'p2'] },
    { id: 'u12', name: 'Lakshmi Venkat', title: 'Product manager, Tarangini Finserv', role: 'guest', hue: 180, cap: 0, email: 'lakshmi@taranginifinserv.in', guestOf: ['p3'] }
  ];

  var S_DEL = [
    { id: 'brief', name: 'Brief', cat: 'todo' }, { id: 'doing', name: 'In progress', cat: 'active' },
    { id: 'review', name: 'Internal review', cat: 'review' }, { id: 'client', name: 'Client review', cat: 'review2' },
    { id: 'done', name: 'Approved', cat: 'done' }
  ];
  var S_STD = [
    { id: 'backlog', name: 'Backlog', cat: 'backlog' }, { id: 'todo', name: 'To do', cat: 'todo' },
    { id: 'doing', name: 'In progress', cat: 'active' }, { id: 'review', name: 'In review', cat: 'review' },
    { id: 'done', name: 'Done', cat: 'done' }
  ];
  var S_MKT = [
    { id: 'idea', name: 'Idea', cat: 'backlog' }, { id: 'writing', name: 'Writing', cat: 'active' },
    { id: 'design', name: 'Design', cat: 'review' }, { id: 'scheduled', name: 'Scheduled', cat: 'review2' },
    { id: 'done', name: 'Published', cat: 'done' }
  ];
  var S_SITE = [
    { id: 'planned', name: 'Planned', cat: 'todo' }, { id: 'mobilised', name: 'Mobilised', cat: 'active' },
    { id: 'snag', name: 'Snag list', cat: 'blocked' }, { id: 'inspect', name: 'Inspection', cat: 'review' },
    { id: 'done', name: 'Signed off', cat: 'done' }
  ];
  var S_HIRE = [
    { id: 'applied', name: 'Applied', cat: 'backlog' }, { id: 'screen', name: 'Screening', cat: 'todo' },
    { id: 'task', name: 'Design task', cat: 'active' }, { id: 'final', name: 'Final round', cat: 'review' },
    { id: 'done', name: 'Offer accepted', cat: 'done' }
  ];
  function clone(a) { return JSON.parse(JSON.stringify(a)); }

  var WORKSPACES = [
    { id: 'w1', name: 'Fernhill Digital', hue: 18 },
    { id: 'w2', name: 'Fernhill Labs', hue: 222 }
  ];
  var SPACES = [
    { id: 's1', ws: 'w1', name: 'Client delivery', hue: 18 },
    { id: 's2', ws: 'w1', name: 'Marketing', hue: 330 },
    { id: 's3', ws: 'w1', name: 'Operations', hue: 150 },
    { id: 's4', ws: 'w2', name: 'Product', hue: 222 },
    { id: 's5', ws: 'w2', name: 'Studio fit-out', hue: 40 }
  ];
  var PROJECTS = [
    { id: 'p1', space: 's1', key: 'CEW', name: 'Coorg Ember — website relaunch', client: 'Coorg Ember Coffee', owner: 'u1', hue: 18, statuses: clone(S_DEL), health: 'on', budget: 1850000, start: -24, end: 30, desc: 'New Shopify-free storefront, subscription flow and brew guides for a Kodagu specialty roaster. Launch before the Christmas gifting window.' },
    { id: 'p2', space: 's1', key: 'CES', name: 'Coorg Ember — social retainer', client: 'Coorg Ember Coffee', owner: 'u1', hue: 28, statuses: clone(S_STD), health: 'on', budget: 240000, start: -40, end: 60, desc: 'Monthly retainer: 16 posts, 4 reels and community replies. Delivered work moves to the archive automatically.' },
    { id: 'p3', space: 's1', key: 'TAR', name: 'Tarangini — app onboarding', client: 'Tarangini Finserv', owner: 'u7', hue: 200, statuses: clone(S_DEL), health: 'risk', budget: 1240000, start: -30, end: 18, desc: 'Redesign KYC and first-investment onboarding for a Pune mutual-fund app. Drop-off at PAN verification is 38%.' },
    { id: 'p4', space: 's1', key: 'NKR', name: 'Neelkurinji Resorts — monsoon campaign', client: 'Neelkurinji Resorts', owner: 'u7', hue: 150, statuses: clone(S_DEL), health: 'on', budget: 680000, start: -12, end: 26, desc: 'Monsoon-season direct bookings for three Munnar properties: film, landing page and a WhatsApp offer.' },
    { id: 'p5', space: 's2', key: 'MKT', name: 'Fernhill content calendar', client: 'Internal', owner: 'u5', hue: 330, statuses: clone(S_MKT), health: 'on', budget: 0, start: -20, end: 40, desc: 'Our own newsletter, case studies and LinkedIn. Two pieces a week, every week.' },
    { id: 'p6', space: 's3', key: 'HIR', name: 'Hiring — designers', client: 'Internal', owner: 'u2', hue: 280, statuses: clone(S_HIRE), health: 'on', budget: 0, start: -15, end: 30, desc: 'Two product designers and one motion designer for the Bengaluru studio.' },
    { id: 'p7', space: 's3', key: 'ARC', name: 'Delivered archive', client: 'Internal', owner: 'u1', hue: 40, statuses: clone(S_STD), health: 'on', budget: 0, start: -90, end: 90, desc: 'Approved retainer work lands here automatically, for invoicing and the case-study bank.' },
    { id: 'p8', space: 's4', key: 'PLS', name: 'Pulse — sprint 42', client: 'Fernhill Labs', owner: 'u4', hue: 222, statuses: clone(S_STD), health: 'on', budget: 0, start: -6, end: 10, desc: 'Two-week sprint on Pulse, our in-house analytics app for agency retainers.' },
    { id: 'p9', space: 's5', key: 'FIT', name: 'Indiranagar studio fit-out', client: 'Internal', owner: 'u7', hue: 40, statuses: clone(S_SITE), health: 'risk', budget: 2650000, start: -21, end: 35, desc: 'Fitting out the new 3,200 sq ft studio on 12th Main: civil, MEP, joinery and handover.' }
  ];

  // custom fields
  var FIELDS = [
    { id: 'f1', project: 'p1', name: 'Page type', type: 'select', options: ['Home', 'Shop', 'Product', 'Brew guide', 'Checkout', 'Account', 'Content'] },
    { id: 'f2', project: 'p1', name: 'Budget', type: 'number', fmt: 'inr' },
    { id: 'f3', project: 'p1', name: 'Spent', type: 'number', fmt: 'inr' },
    { id: 'f4', project: 'p1', name: 'Remaining', type: 'formula', formula: '{Budget} - {Spent}', fmt: 'inr' },
    { id: 'f5', project: 'p1', name: 'Hours check', type: 'formula', formula: 'IF({Logged} > {Estimate}, "Over by " & ROUND({Logged} - {Estimate}, 1) & "h", "On track")', fmt: 'text' },
    { id: 'f6', project: 'p1', name: 'Reviewer', type: 'people' },
    { id: 'f7', project: 'p1', name: 'Client sign-off', type: 'check' },
    { id: 'f8', project: 'p3', name: 'Screen', type: 'select', options: ['Welcome', 'PAN', 'Aadhaar OTP', 'Bank link', 'Risk profile', 'First SIP'] },
    { id: 'f9', project: 'p3', name: 'Drop-off %', type: 'number', fmt: 'pct' },
    { id: 'f10', project: 'p3', name: 'Target %', type: 'number', fmt: 'pct' },
    { id: 'f11', project: 'p3', name: 'Gap', type: 'formula', formula: '{Drop-off %} - {Target %}', fmt: 'pct' },
    { id: 'f12', project: 'p5', name: 'Channel', type: 'select', options: ['Newsletter', 'LinkedIn', 'Blog', 'Instagram'] },
    { id: 'f13', project: 'p9', name: 'Vendor', type: 'select', options: ['Shreeji Interiors', 'Volt MEP', 'Kalyan Glass', 'Own crew'] },
    { id: 'f14', project: 'p9', name: 'Contract value', type: 'number', fmt: 'inr' },
    { id: 'f15', project: 'p9', name: 'Paid', type: 'number', fmt: 'inr' },
    { id: 'f16', project: 'p9', name: 'Balance', type: 'formula', formula: '{Contract value} - {Paid}', fmt: 'inr' },
    { id: 'f17', project: 'p8', name: 'Points', type: 'number', fmt: 'num' },
    { id: 'f18', project: 'p2', name: 'Format', type: 'select', options: ['Post', 'Carousel', 'Reel', 'Story'] }
  ];

  /* task rows: [title, status, assignees, priority(0-4), start, due, est h, tags, fields, extras]
     priority: 4 urgent · 3 high · 2 medium · 1 low · 0 none */
  var T = {
    p1: [
      ['Sitemap and content inventory', 'done', 'u1,u5', 2, -24, -19, 10, ['strategy'], { f1: 'Content', f2: 60000, f3: 54000, f7: true }],
      ['Moodboard and visual direction', 'done', 'u3', 3, -21, -15, 18, ['design'], { f1: 'Home', f2: 120000, f3: 126000, f7: true, f6: 'u2' }],
      ['Homepage design — hero and story', 'client', 'u3', 4, -12, -1, 24, ['design', 'client-visible'], { f1: 'Home', f2: 180000, f3: 151000, f6: 'u2' }, { desc: 'Hero film loop of the drying patios at the estate, then the three-step "from cherry to cup" story. Client wants the harvest calendar above the fold on mobile.', sub: [['Desktop hero — 3 options', 'done', 'u3'], ['Mobile hero and nav', 'done', 'u3'], ['Harvest calendar module', 'client', 'u3'], ['Annotate for dev handoff', 'brief', 'u3']], check: [['Brand fonts licensed for web', 1], ['Hero film cut to 12 s', 1], ['Alt text for all estate photos', 0], ['Contrast check on cream background', 0]] }],
      ['Shop and filters (PLP)', 'doing', 'u3,u4', 3, -6, 4, 20, ['design', 'dev'], { f1: 'Shop', f2: 140000, f3: 62000, f6: 'u1' }],
      ['Product page with grind selector', 'doing', 'u3', 3, -4, 6, 18, ['design'], { f1: 'Product', f2: 130000, f3: 38000, f6: 'u2' }, { desc: 'Grind selector (whole bean, French press, pour-over, espresso, South Indian filter) changes the brew tip and the pack photo.' }],
      ['Subscription flow — "Fresh every fortnight"', 'review', 'u4,u8', 4, -8, 0, 32, ['dev', 'payments'], { f1: 'Checkout', f2: 220000, f3: 180000, f6: 'u1' }, { desc: 'Fortnightly or monthly roast, pause anytime, skip a delivery from WhatsApp. Uses the payment sandbox until launch week.', sub: [['Plan picker and pricing table', 'done', 'u4'], ['Skip and pause rules', 'review', 'u8'], ['Renewal emails', 'doing', 'u5']] }],
      ['Brew guides — 6 methods', 'doing', 'u5,u6', 2, -5, 8, 22, ['content'], { f1: 'Brew guide', f2: 90000, f3: 30000 }],
      ['Checkout with UPI and COD', 'brief', 'u8', 3, 2, 12, 26, ['dev', 'payments'], { f1: 'Checkout', f2: 160000, f3: 0, f6: 'u4' }],
      ['Account area — orders and addresses', 'brief', 'u4', 2, 6, 15, 16, ['dev'], { f1: 'Account', f2: 80000, f3: 0 }],
      ['Estate story film — edit', 'doing', 'u6', 3, -10, 2, 30, ['motion'], { f1: 'Home', f2: 210000, f3: 160000, f6: 'u3' }],
      ['Photography retouch — 42 SKUs', 'review', 'u3,u6', 2, -9, -2, 14, ['design'], { f1: 'Product', f2: 70000, f3: 72000 }],
      ['SEO migration map (old → new URLs)', 'brief', 'u5', 2, 9, 15, 8, ['seo'], { f1: 'Content', f2: 40000, f3: 0 }],
      ['Performance budget and Lighthouse pass', 'brief', 'u4,u10', 3, 16, 22, 12, ['dev', 'qa'], { f1: 'Content', f2: 50000, f3: 0 }],
      ['UAT with Coorg Ember team', 'brief', 'u10,u1', 3, 22, 26, 10, ['qa', 'client-visible'], { f1: 'Content', f2: 30000, f3: 0 }],
      ['Launch — Christmas gifting', 'brief', 'u1', 4, 30, 30, 2, ['milestone', 'client-visible'], { f1: 'Home', f2: 0, f3: 0 }],
      ['Gift box configurator', 'brief', 'u4,u3', 2, 10, 20, 24, ['dev', 'design'], { f1: 'Product', f2: 150000, f3: 0 }],
      ['Wholesale enquiry form for cafés', 'doing', 'u8', 1, -3, 3, 6, ['dev'], { f1: 'Content', f2: 25000, f3: 9000 }],
      ['Legal pages and FSSAI details', 'review', 'u5', 1, -4, -1, 4, ['content'], { f1: 'Content', f2: 15000, f3: 12000 }],
      ['Weekly status note to Coorg Ember', 'doing', 'u1', 2, -2, -1, 1, ['client-visible'], { f1: 'Content', f2: 0, f3: 0 }, { desc: 'Every Friday: what shipped, what is waiting on them, what is next. Keep it to five lines.' }],
      ['Review subscription flow in the sandbox', 'brief', 'u1,u10', 3, 0, 0, 2, ['qa'], { f1: 'Checkout', f2: 0, f3: 0 }, { check: [['Plan switch keeps the roast date', 0], ['Skip within 48 h is blocked', 0], ['Renewal email copy matches the site', 0]] }],
      ['Homepage sign-off call with Farhan', 'brief', 'u1,u7', 3, 0, 0, 1, ['client-visible'], { f1: 'Home', f2: 0, f3: 0 }],
      ['Kick-off workshop at the Somwarpet estate', 'done', 'u1,u2', 3, -24, -23, 6, ['client-visible'], { f1: 'Content', f2: 40000, f3: 38000, f7: true }],
      ['Audit of the old site — analytics and SEO', 'done', 'u5,u4', 2, -22, -17, 10, ['strategy'], { f1: 'Content', f2: 50000, f3: 46000, f7: true }],
      ['Content model — products, estates, brew methods', 'done', 'u4,u5', 2, -17, -11, 12, ['dev', 'content'], { f1: 'Product', f2: 70000, f3: 74000, f7: true }],
      ['Type, colour and spacing tokens', 'done', 'u3', 2, -14, -8, 10, ['design'], { f1: 'Home', f2: 60000, f3: 52000, f7: true, f6: 'u2' }],
      ['Hosting, CDN and staging setup', 'done', 'u8', 2, -10, -6, 6, ['dev'], { f1: 'Content', f2: 35000, f3: 30000 }]
    ],
    p2: [
      ['November reel — first-crack sound', 'done', 'u6,u9', 3, -14, -9, 8, ['reel'], { f18: 'Reel' }],
      ['Carousel: 5 ways to brew filter kaapi', 'done', 'u5,u3', 2, -12, -8, 6, ['carousel'], { f18: 'Carousel' }],
      ['Community replies — week 47', 'doing', 'u9', 2, -2, 0, 5, ['community'], { f18: 'Story' }],
      ['December content plan', 'review', 'u9,u5', 3, -5, 1, 6, ['plan', 'client-visible'], { f18: 'Post' }],
      ['Reel: harvest at Somwarpet', 'todo', 'u6', 3, 2, 9, 12, ['reel'], { f18: 'Reel' }],
      ['Giveaway post with Bengaluru cafés', 'todo', 'u9,u5', 2, 3, 7, 4, ['post'], { f18: 'Post' }],
      ['Story highlights refresh', 'backlog', 'u3', 1, 8, 12, 3, ['design'], { f18: 'Story' }],
      ['UGC permissions tracker', 'doing', 'u9', 1, -6, 2, 2, ['ops'], { f18: 'Post' }],
      ['Monthly report — November', 'todo', 'u1,u9', 2, 4, 6, 4, ['report', 'client-visible'], { f18: 'Post' }],
      ['Approve December reel scripts', 'review', 'u1', 3, -2, -1, 1, ['client-visible'], { f18: 'Reel' }]
    ],
    p3: [
      ['Funnel audit — PAN to first SIP', 'done', 'u7,u3', 3, -30, -24, 14, ['research'], { f8: 'Welcome', f9: 12, f10: 10 }],
      ['5 user interviews in Pune', 'done', 'u3,u7', 3, -23, -16, 20, ['research'], { f8: 'Welcome', f9: 12, f10: 10 }],
      ['PAN verification screen', 'client', 'u3', 4, -14, -3, 18, ['design', 'client-visible'], { f8: 'PAN', f9: 38, f10: 15 }, { desc: '38% of users drop here. Pre-fill name from PAN, explain why we ask, and allow "do it later" for browsing funds.', sub: [['Error states for name mismatch', 'done', 'u3'], ['Copy: why we need PAN', 'review', 'u5'], ['Prototype for usability test', 'doing', 'u3']] }],
      ['Aadhaar OTP — retry and fallback', 'doing', 'u3,u8', 4, -7, -1, 16, ['design', 'dev'], { f8: 'Aadhaar OTP', f9: 21, f10: 8 }],
      ['Bank linking with penny drop', 'review', 'u8', 3, -8, 2, 20, ['dev'], { f8: 'Bank link', f9: 17, f10: 8 }],
      ['Risk profile quiz — 7 questions', 'doing', 'u5,u3', 2, -4, 5, 12, ['content', 'design'], { f8: 'Risk profile', f9: 9, f10: 6 }],
      ['First SIP nudge and ₹500 start', 'brief', 'u3', 3, 3, 10, 14, ['design'], { f8: 'First SIP', f9: 26, f10: 12 }],
      ['Analytics events spec', 'review', 'u8,u10', 2, -6, 0, 8, ['dev'], { f8: 'Welcome', f9: 0, f10: 0 }],
      ['Usability test — round 2', 'brief', 'u7,u3', 3, 11, 15, 16, ['research', 'client-visible'], { f8: 'PAN', f9: 0, f10: 0 }],
      ['Hand-off to Tarangini dev team', 'brief', 'u7', 4, 18, 18, 4, ['milestone', 'client-visible'], { f8: 'Welcome', f9: 0, f10: 0 }],
      ['Approve PAN screen copy with Lakshmi', 'doing', 'u1,u7', 3, -1, 0, 1, ['client-visible'], { f8: 'PAN', f9: 0, f10: 0 }]
    ],
    p4: [
      ['Campaign idea — "Rain is the reason"', 'done', 'u2,u5', 4, -12, -8, 10, ['concept'], {}],
      ['Film shoot at Chinnakanal — call sheet', 'doing', 'u6,u7', 3, -3, 4, 14, ['production'], {}, { desc: 'Two-day shoot, 6 crew, drone permit pending with the forest office. Backup indoor setups if the mist closes in.' }],
      ['Landing page — monsoon offer', 'brief', 'u3,u4', 3, 2, 12, 22, ['design', 'dev'], {}],
      ['WhatsApp offer flow', 'brief', 'u8', 2, 6, 14, 10, ['dev'], {}],
      ['Media plan — Kerala and Bengaluru', 'review', 'u7', 3, -4, 1, 6, ['media', 'client-visible'], {}],
      ['Film edit — 30 s and 6 s cuts', 'brief', 'u6', 3, 5, 15, 26, ['motion'], {}],
      ['Rate card with resort revenue team', 'doing', 'u7', 2, -2, 0, 3, ['client'], {}],
      ['Launch — monsoon bookings open', 'brief', 'u7', 4, 26, 26, 1, ['milestone', 'client-visible'], {}]
    ],
    p5: [
      ['Case study: Pallava Weaves Diwali lookbook', 'writing', 'u5', 2, -4, 2, 8, ['case-study'], { f12: 'Blog' }],
      ['Newsletter #38 — "Why your retainer needs a scoreboard"', 'design', 'u5,u3', 2, -3, 1, 5, ['newsletter'], { f12: 'Newsletter' }],
      ['LinkedIn: behind the Coorg Ember shoot', 'scheduled', 'u9', 1, -1, 2, 2, ['social'], { f12: 'LinkedIn' }],
      ['Talk: Design Week Bengaluru abstract', 'idea', 'u2', 2, 4, 10, 6, ['events'], { f12: 'Blog' }],
      ['Instagram: studio Fridays', 'done', 'u9', 1, -8, -6, 2, ['social'], { f12: 'Instagram' }],
      ['Newsletter #39 — year in review', 'idea', 'u5', 2, 10, 15, 6, ['newsletter'], { f12: 'Newsletter' }],
      ['LinkedIn carousel: onboarding teardown', 'writing', 'u5,u3', 2, 0, 5, 4, ['social'], { f12: 'LinkedIn' }],
      ['Blog: pricing retainers in 2027', 'idea', 'u2,u5', 1, 12, 20, 8, ['blog'], { f12: 'Blog' }]
    ],
    p6: [
      ['Ritika Sen — product designer', 'final', 'u2,u3', 3, -10, 1, 3, ['design'], {}],
      ['Omkar Joshi — product designer', 'task', 'u3', 2, -6, 3, 3, ['design'], {}],
      ['Tanvi Bhat — motion designer', 'screen', 'u6', 2, -3, 2, 1, ['motion'], {}],
      ['Dev Malhotra — product designer', 'applied', 'u7', 1, 0, 4, 1, ['design'], {}],
      ['Post role on studio careers page', 'done', 'u7', 2, -15, -14, 2, ['ops'], {}],
      ['Design task brief v2', 'done', 'u3', 2, -14, -11, 4, ['ops'], {}]
    ],
    p7: [
      ['October reel — cupping session', 'done', 'u6,u9', 2, -40, -33, 8, ['reel'], {}],
      ['Carousel: estate to espresso', 'done', 'u5,u3', 2, -38, -31, 6, ['carousel'], {}],
      ['October report', 'done', 'u1,u9', 2, -28, -25, 4, ['report'], {}]
    ],
    p8: [
      ['Retainer burn-down widget', 'doing', 'u4', 3, -5, 2, 13, ['frontend'], { f17: 5 }],
      ['Slack digest of overdue tasks', 'review', 'u8', 2, -6, 0, 8, ['backend'], { f17: 3 }],
      ['Fix: timezone offset in weekly report', 'done', 'u8', 4, -6, -4, 3, ['bug'], { f17: 2 }],
      ['Client health score v1', 'todo', 'u4,u8', 3, 3, 8, 16, ['frontend', 'backend'], { f17: 8 }],
      ['Empty states for new workspaces', 'todo', 'u3', 1, 2, 6, 6, ['design'], { f17: 2 }],
      ['Export to CSV', 'backlog', 'u8', 1, 4, 8, 5, ['backend'], { f17: 3 }],
      ['Onboarding checklist', 'doing', 'u3,u4', 2, -3, 3, 10, ['frontend'], { f17: 5 }],
      ['Sprint review and show-and-tell', 'todo', 'u4', 2, 9, 9, 2, ['milestone'], { f17: 0 }]
    ],
    p9: [
      ['Civil — partition walls and flooring', 'done', 'u7', 3, -21, -9, 0, ['civil'], { f13: 'Shreeji Interiors', f14: 820000, f15: 820000 }],
      ['Electrical first fix', 'mobilised', 'u7', 3, -8, 3, 0, ['mep'], { f13: 'Volt MEP', f14: 460000, f15: 230000 }],
      ['Air-conditioning ducting', 'snag', 'u7', 4, -10, -2, 0, ['mep'], { f13: 'Volt MEP', f14: 380000, f15: 190000 }, { desc: 'Duct clashes with the sprinkler line above the meeting room. Volt MEP to re-route by Thursday; ceiling closes after.' }],
      ['Glass partitions — meeting rooms', 'planned', 'u7', 2, 4, 14, 0, ['glazing'], { f13: 'Kalyan Glass', f14: 310000, f15: 93000 }],
      ['Joinery — library wall and pantry', 'planned', 'u7,u2', 2, 6, 24, 0, ['joinery'], { f13: 'Shreeji Interiors', f14: 540000, f15: 0 }],
      ['Fire NOC inspection', 'inspect', 'u7', 4, -1, 5, 0, ['compliance'], { f13: 'Own crew', f14: 40000, f15: 40000 }],
      ['Network racks and Wi-Fi survey', 'planned', 'u8', 2, 18, 26, 6, ['it'], { f13: 'Own crew', f14: 100000, f15: 0 }],
      ['Move-in weekend', 'planned', 'u7,u1', 4, 35, 35, 0, ['milestone'], { f13: 'Own crew', f14: 0, f15: 0 }],
      ['Confirm ceiling vendor date', 'mobilised', 'u1', 2, 0, 1, 0, [], { f13: 'Own crew', f14: 0, f15: 0 }]
    ]
  };
  // dependencies (by [project, fromIndex(blocker), toIndex])
  var DEPS = [
    ['p1', 1, 2], ['p1', 1, 3], ['p1', 1, 4], ['p1', 5, 7], ['p1', 3, 15], ['p1', 7, 12], ['p1', 12, 13], ['p1', 13, 14], ['p1', 6, 11],
    ['p3', 0, 1], ['p3', 1, 2], ['p3', 2, 6], ['p3', 4, 6], ['p3', 6, 8], ['p3', 8, 9],
    ['p4', 0, 1], ['p4', 1, 5], ['p4', 2, 7], ['p4', 5, 7],
    ['p8', 0, 3], ['p8', 3, 7], ['p9', 0, 1], ['p9', 2, 3], ['p9', 5, 6], ['p9', 3, 7], ['p9', 4, 7]
  ];

  OW.seed = function () {
    var S = {
      v: 3, base: dayStr(0), me: 'u1', viewAs: null, ws: 'w1', seq: 500,
      brand: { name: 'Ordwell', accent: '#C2461C', logo: null, domain: 'work.fernhill-digital.in', domainState: 'verified', sender: 'Fernhill Digital', poweredBy: true, loginNote: 'Sign in to the Fernhill client workroom.' },
      prefs: { theme: 'light', sidebar: true, density: 'comfortable', autoShift: true },
      users: clone(USERS), workspaces: clone(WORKSPACES), spaces: clone(SPACES), projects: [], fields: clone(FIELDS),
      tasks: [], comments: [], activity: [], notifs: [], automations: [], runs: [], docs: [], dashboards: [], forms: [], views: [], invites: [], timer: null, favs: ['p1', 'p3']
    };
    PROJECTS.forEach(function (p) {
      var q = clone(p); q.start = dayStr(p.start); q.end = dayStr(p.end); q.fields = FIELDS.filter(function (f) { return f.project === p.id; }).map(function (f) { return f.id; });
      q.members = USERS.filter(function (u) { return u.role !== 'guest' || (u.guestOf || []).indexOf(p.id) > -1; }).map(function (u) { return u.id; });
      S.projects.push(q);
    });
    var num = {}, map = {};
    function add(pid, row, parent, i) {
      var st = row[1], p = PROJECTS.filter(function (x) { return x.id === pid; })[0];
      num[pid] = (num[pid] || 0) + 1;
      var id = 't' + (++S.seq), ex = row[9] || {};
      var start = row[4] != null ? dayStr(row[4]) : null, due = row[5] != null ? dayStr(row[5]) : null;
      var t = {
        id: id, num: p.key + '-' + (100 + num[pid]), project: pid, title: row[0], status: st, assignees: (row[2] || '').split(',').filter(Boolean),
        priority: row[3] || 0, start: start, due: due, est: row[6] || 0, tags: row[7] || [], fields: row[8] || {}, parent: parent || null,
        desc: ex.desc || '', checklist: [], deps: [], attachments: [], time: [], order: i, created: at(Math.min(row[4] == null ? -5 : row[4], -1) - 3 - (i % 4), 10 + (i % 6)), updated: at(-1, 16), doneAt: null, archived: false
      };
      if (st === 'done') t.doneAt = at(row[5] != null ? Math.min(row[5], 0) : -2, 17);
      (ex.check || []).forEach(function (c, k) { t.checklist.push({ id: id + 'c' + k, t: c[0], done: !!c[1] }); });
      S.tasks.push(t);
      (ex.sub || []).forEach(function (s, k) { add(pid, [s[0], s[1], s[2], 2, row[4], row[5], Math.max(2, Math.round((row[6] || 4) / 4)), [], {}], id, k); });
      return t;
    }
    Object.keys(T).forEach(function (pid) { map[pid] = T[pid].map(function (row, i) { return add(pid, row, null, i); }); });
    DEPS.forEach(function (d) { var a = map[d[0]][d[1]], b = map[d[0]][d[2]]; if (a && b && b.deps.indexOf(a.id) < 0) b.deps.push(a.id); });

    // time logs: deterministic pseudo-random spread over past days
    var seedN = 7; function rnd() { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; }
    S.tasks.forEach(function (t) {
      if (!t.est || t.parent) return;
      var cat = statusCat(S, t), frac = cat === 'done' ? 0.85 + rnd() * 0.35 : cat === 'backlog' || cat === 'todo' ? 0 : 0.25 + rnd() * 0.6;
      var mins = Math.round(t.est * 60 * frac / 15) * 15, chunks = Math.max(1, Math.round(mins / 150));
      for (var k = 0; k < chunks && mins > 0; k++) {
        var m = k === chunks - 1 ? mins : Math.round(mins / (chunks - k) / 15) * 15;
        mins -= m; var who = t.assignees[k % t.assignees.length] || 'u1';
        t.time.push({ id: t.id + 'l' + k, uid: who, mins: m, at: at(-1 - Math.floor(rnd() * 9), 11 + k % 6), note: '' });
      }
    });
    // attachments (demo)
    var att = {
      p1: [[2, 'Hero-options-v3.fig', 4200, 'fig'], [2, 'estate-patio-loop.mp4', 18400, 'video'], [5, 'subscription-rules.pdf', 340, 'pdf'], [1, 'moodboard-final.pdf', 9100, 'pdf'], [10, 'SKU-retouch-tracker.xlsx', 88, 'sheet']],
      p3: [[2, 'pan-screen-flows.fig', 3100, 'fig'], [0, 'funnel-audit.pdf', 1200, 'pdf']],
      p9: [[2, 'duct-clash-photo.jpg', 2400, 'image'], [0, 'civil-completion-cert.pdf', 610, 'pdf']]
    };
    Object.keys(att).forEach(function (pid) { att[pid].forEach(function (a, k) { var t = map[pid][a[0]]; t.attachments.push({ id: t.id + 'a' + k, name: a[1], kb: a[2], kind: a[3], by: t.assignees[0], at: at(-3 - k, 12) }); }); });

    // comments
    function cm(pid, i, uid, d, h, text, internal) { var t = map[pid][i]; S.comments.push({ id: 'c' + (++S.seq), task: t.id, uid: uid, at: at(d, h, 15), text: text, internal: !!internal, reactions: {} }); }
    cm('p1', 2, 'u3', -3, 11, 'Uploaded three hero directions. Option B (patio film + harvest calendar) tested best with the team.');
    cm('p1', 2, 'u2', -3, 15, 'B for sure. @Aditi Rao can we get this in front of Farhan before Friday?', true);
    cm('p1', 2, 'u1', -2, 10, 'Shared with Farhan in the client review column. Moving to client review.');
    cm('p1', 2, 'u11', -1, 18, 'Love B. Can the harvest calendar show the current month highlighted? Our customers ask "what\'s fresh now" a lot.');
    cm('p1', 5, 'u8', -1, 12, 'Skip rules are in. A skip within 48 h of roast day is blocked; it shows the next eligible date instead.');
    cm('p1', 5, 'u4', 0, 9, '@Aditi Rao ready for review. Sandbox payments only; the test UPI ID is in the doc.', true);
    cm('p1', 3, 'u4', -1, 16, 'Filters: roast, origin estate, process (washed / natural / honey), and brew method. Mobile filter sheet is done.');
    cm('p1', 9, 'u6', -2, 19, 'Rough cut v2 uploaded. Colour grade tomorrow once the music licence clears.');
    cm('p1', 10, 'u3', -2, 14, '42 of 42 SKUs retouched; 6 need a reshoot because of label glare.');
    cm('p3', 2, 'u12', -1, 11, 'The "why we need PAN" explainer is great. Compliance wants the SEBI line verbatim; I\'ll send it today.');
    cm('p3', 2, 'u7', 0, 10, '@Aditi Rao Lakshmi\'s compliance copy is in; this is the last blocker before the usability test.', true);
    cm('p3', 3, 'u8', -1, 17, 'Retry is capped at 3 OTPs in 10 minutes. Fallback to DigiLocker shown after the second failure.');
    cm('p4', 1, 'u6', -1, 9, 'Forest office says drone permit by Wednesday. Plan B: gimbal + 24 mm from the viewpoint.');
    cm('p9', 2, 'u7', -2, 16, 'Volt MEP confirmed re-route. @Aditi Rao ceiling vendor is on hold till Thursday.');
    cm('p2', 3, 'u9', -1, 13, 'Draft plan is in the doc. 16 posts, 4 reels, 2 collabs with cafés in Indiranagar and Jayanagar.');
    cm('p8', 1, 'u8', 0, 11, 'Digest goes out at 9:30 IST. Grouped by project; only tasks overdue by more than a day.');

    // activity
    function act(t, uid, d, h, text) { S.activity.push({ id: 'a' + (++S.seq), task: t.id, uid: uid, at: at(d, h), text: text }); }
    S.tasks.forEach(function (t) {
      act(t, t.assignees[0] || 'u1', Math.round((t.created - Date.now()) / 864e5), 10, 'created this task');
      if (statusCat(S, t) !== 'todo' && statusCat(S, t) !== 'backlog') act(t, t.assignees[0] || 'u1', -2, 12, 'changed status to ' + statusName(S, t));
    });
    act(map.p1[2], 'u1', -2, 10, 'moved this to Client review');
    act(map.p1[5], 'u4', 0, 9, 'changed status to Internal review');

    // notifications for me (u1)
    function nf(kind, uid, d, h, t, text, read) { S.notifs.push({ id: 'n' + (++S.seq), to: 'u1', kind: kind, from: uid, at: at(d, h, 20), task: t && t.id, text: text, read: !!read }); }
    nf('mention', 'u4', 0, 9, map.p1[5], 'mentioned you: "ready for review. Sandbox payments only…"');
    nf('mention', 'u7', 0, 10, map.p3[2], 'mentioned you: "Lakshmi\'s compliance copy is in…"');
    nf('comment', 'u11', -1, 18, map.p1[2], 'commented: "Love B. Can the harvest calendar show the current month…"');
    nf('assign', 'u7', -1, 11, map.p2[8], 'assigned you to Monthly report — November');
    nf('mention', 'u7', -2, 16, map.p9[2], 'mentioned you: "ceiling vendor is on hold till Thursday"');
    nf('status', 'u8', -1, 12, map.p1[5], 'moved a subtask to Internal review', true);
    nf('due', null, 0, 8, map.p2[2], 'is due today', false);
    nf('auto', null, -1, 9, map.p2[1], 'Automation "Archive approved retainer work" moved this to Delivered archive', true);
    nf('form', null, -2, 15, null, 'New brief from the website form: "Pallava Weaves — Pongal lookbook"', true);
    nf('mention', 'u2', -3, 15, map.p1[2], 'mentioned you: "can we get this in front of Farhan before Friday?"', true);

    // automations
    S.automations = [
      { id: 'au1', name: 'Archive approved retainer work', project: 'p2', on: true, trigger: { type: 'status', to: 'done' }, conds: [], actions: [{ type: 'move', project: 'p7' }, { type: 'notify', who: 'owner' }], created: at(-40, 10), by: 'u1' },
      { id: 'au2', name: 'Route new client briefs', project: 'p1', on: true, trigger: { type: 'created', via: 'form' }, conds: [], actions: [{ type: 'assign', who: 'u7' }, { type: 'priority', value: 3 }, { type: 'tag', value: 'intake' }, { type: 'notify', who: 'owner' }], created: at(-20, 10), by: 'u1' },
      { id: 'au3', name: 'Ask Kabir to review', project: '*', on: true, trigger: { type: 'status', to: 'review' }, conds: [{ field: 'priority', op: 'gte', value: 3 }], actions: [{ type: 'comment', text: 'Ready for internal review. Kabir, can you look at this today?' }, { type: 'notify', who: 'u2' }], created: at(-18, 10), by: 'u2' },
      { id: 'au4', name: 'Subtasks done → parent to review', project: '*', on: true, trigger: { type: 'subtasks-done' }, conds: [], actions: [{ type: 'status', to: 'review' }], created: at(-12, 10), by: 'u1' },
      { id: 'au5', name: 'Due tomorrow reminder', project: '*', on: true, trigger: { type: 'due-soon', days: 1 }, conds: [{ field: 'status', op: 'notdone' }], actions: [{ type: 'notify', who: 'assignees' }], created: at(-30, 10), by: 'u1' },
      { id: 'au6', name: 'Snags go to the top', project: 'p9', on: false, trigger: { type: 'status', to: 'snag' }, conds: [], actions: [{ type: 'priority', value: 4 }, { type: 'notify', who: 'owner' }], created: at(-8, 10), by: 'u7' }
    ];
    var runs = [['au1', -9, map.p7[0], 'ok'], ['au1', -8, map.p7[1], 'ok'], ['au1', -1, map.p2[1], 'ok'], ['au3', -3, map.p1[10], 'ok'], ['au3', 0, map.p1[5], 'ok'], ['au5', 0, map.p2[3], 'ok'], ['au5', 0, map.p1[5], 'ok'], ['au4', -2, map.p1[2], 'skipped'], ['au2', -2, map.p1[16], 'ok'], ['au3', -1, map.p3[4], 'ok']];
    runs.forEach(function (r, k) {
      var a = S.automations.filter(function (x) { return x.id === r[0]; })[0];
      S.runs.push({ id: 'r' + (++S.seq), auto: r[0], at: at(r[1], 9 + k % 8, 5 * k % 60), task: r[2].id, status: r[3], ms: 40 + (k * 37) % 180, steps: r[3] === 'ok' ? a.actions.map(function (x) { return describeAction(S, x); }) : ['Condition not met: 1 subtask still open'] });
    });

    // docs
    S.docs = [
      { id: 'd1', space: 's1', title: 'Coorg Ember — brand and site brief', icon: 'C', by: 'u1', updated: at(-1, 17), blocks: [
        { t: 'p', x: 'Coorg Ember roasts single-estate coffee from three farms around Somwarpet. The relaunch has one job: turn one-time gifting buyers into fortnightly subscribers.' },
        { t: 'callout', x: 'Launch is fixed: gifting traffic peaks from 10 December. Everything on the critical path is in the timeline view.' },
        { t: 'h2', x: 'Goals' },
        { t: 'bullet', x: 'Subscription share of revenue from 9% to 25% by March' },
        { t: 'bullet', x: 'Mobile conversion from 1.1% to 2%' },
        { t: 'bullet', x: 'Brew guides ranking for "filter coffee at home" in Bengaluru and Chennai' },
        { t: 'h2', x: 'Open decisions' },
        { t: 'todo', x: 'Confirm courier partner for Kerala pin codes', d: false },
        { t: 'todo', x: 'Pick the final hero direction (B is favoured)', d: true },
        { t: 'todo', x: 'Price the 500 g subscription', d: false },
        { t: 'h2', x: 'Critical path' },
        { t: 'tasks', q: { project: 'p1', status: 'open', tag: '' }, x: 'Open work on the relaunch' },
        { t: 'h2', x: 'The one task that blocks everything' },
        { t: 'task', ref: map.p1[5].id },
        { t: 'quote', x: '"We don\'t sell coffee, we sell the fortnightly ritual." — Farhan, kick-off call' }
      ] },
      { id: 'd2', space: 's4', title: 'Sprint 42 — goals and retro', icon: '42', by: 'u4', updated: at(0, 9), blocks: [
        { t: 'h2', x: 'Sprint goal' },
        { t: 'p', x: 'Ship the retainer burn-down widget and the overdue digest so account managers stop building spreadsheets on Monday morning.' },
        { t: 'tasks', q: { project: 'p8', status: 'all', tag: '' }, x: 'Sprint scope' },
        { t: 'h2', x: 'Retro — what went well' },
        { t: 'bullet', x: 'Timezone bug caught by QA before it reached clients' },
        { t: 'bullet', x: 'Design and dev paired on the onboarding checklist' },
        { t: 'h2', x: 'To try next sprint' },
        { t: 'todo', x: 'Write acceptance criteria before estimation', d: false },
        { t: 'todo', x: 'Show-and-tell every Friday at 4:30', d: true }
      ] },
      { id: 'd3', space: 's3', title: 'How we run client delivery', icon: 'H', by: 'u2', updated: at(-6, 12), blocks: [
        { t: 'p', x: 'Every client project in Fernhill runs the same five statuses, so anyone can pick up anyone\'s work.' },
        { t: 'h2', x: 'The five statuses' },
        { t: 'numbered', x: 'Brief — the ask is written, with a due date and an owner' },
        { t: 'numbered', x: 'In progress — someone is actively on it' },
        { t: 'numbered', x: 'Internal review — Kabir or a lead checks it within one working day' },
        { t: 'numbered', x: 'Client review — the guest can see it and comment' },
        { t: 'numbered', x: 'Approved — the client said yes in writing (comment or email)' },
        { t: 'divider' },
        { t: 'h2', x: 'Rules we don\'t break' },
        { t: 'todo', x: 'Nothing goes to client review without an internal review', d: true },
        { t: 'todo', x: 'Log time daily, even 15 minutes', d: true },
        { t: 'todo', x: 'Mark internal comments as internal before tagging a guest', d: true },
        { t: 'callout', x: 'Guests (clients) only see tasks tagged client-visible and comments that are not internal.' }
      ] },
      { id: 'd4', space: 's2', title: 'December content plan', icon: 'D', by: 'u9', updated: at(-1, 13), blocks: [
        { t: 'h2', x: 'Theme: the gifting month' },
        { t: 'p', x: 'Four weeks, four stories: the harvest, the roast, the brew, the gift.' },
        { t: 'tasks', q: { project: 'p2', status: 'open', tag: '' }, x: 'Retainer pipeline' },
        { t: 'todo', x: 'Lock café collab partners by 2 December', d: false }
      ] }
    ];
    S.docs.forEach(function (d) { d.blocks.forEach(function (b, i) { b.id = d.id + 'b' + i; }); });

    // dashboards
    S.dashboards = [
      { id: 'db1', name: 'Delivery overview', scope: 'w1', by: 'u1', widgets: [
        { id: 'wg1', type: 'kpis', w: 3 }, { id: 'wg2', type: 'burnup', project: 'p1', w: 2 }, { id: 'wg3', type: 'status', project: '*', w: 1 },
        { id: 'wg4', type: 'overdue', w: 1 }, { id: 'wg5', type: 'workload', w: 2 }, { id: 'wg6', type: 'health', w: 3 }, { id: 'wg7', type: 'time', w: 1 }, { id: 'wg8', type: 'budget', project: 'p1', w: 2 }
      ] },
      { id: 'db2', name: 'Coorg Ember — client view', scope: 'p1', by: 'u7', widgets: [
        { id: 'wg9', type: 'burnup', project: 'p1', w: 2 }, { id: 'wg10', type: 'status', project: 'p1', w: 1 }, { id: 'wg11', type: 'budget', project: 'p1', w: 3 }
      ] }
    ];

    // forms
    S.forms = [
      { id: 'fm1', name: 'Client brief intake', project: 'p1', status: 'brief', slug: 'brief', intro: 'Tell us what you need. Your request lands with the Fernhill delivery team, and you\'ll hear back within one working day.', on: true, fields: [
        { id: 'q1', label: 'What do you need?', type: 'text', map: 'title', req: true, ph: 'e.g. Festive banner set for the homepage' },
        { id: 'q2', label: 'Details', type: 'long', map: 'desc', req: true, ph: 'Sizes, links, references, anything we should know' },
        { id: 'q3', label: 'Which page?', type: 'select', map: 'f1', options: ['Home', 'Shop', 'Product', 'Brew guide', 'Checkout', 'Account', 'Content'] },
        { id: 'q4', label: 'Needed by', type: 'date', map: 'due', req: true },
        { id: 'q5', label: 'How urgent is it?', type: 'select', map: 'priority', options: ['Low', 'Medium', 'High', 'Urgent'] },
        { id: 'q6', label: 'Your email', type: 'email', map: 'email', req: true },
        { id: 'q7', label: 'Reference files', type: 'file', map: 'attach' }
      ], subs: [] },
      { id: 'fm2', name: 'Bug report — Pulse', project: 'p8', status: 'backlog', slug: 'pulse-bug', intro: 'Found something broken in Pulse? Tell us how to reproduce it.', on: true, fields: [
        { id: 'q1', label: 'What broke?', type: 'text', map: 'title', req: true, ph: 'One line' },
        { id: 'q2', label: 'Steps to reproduce', type: 'long', map: 'desc', req: true },
        { id: 'q3', label: 'Severity', type: 'select', map: 'priority', options: ['Low', 'Medium', 'High', 'Urgent'] },
        { id: 'q4', label: 'Your email', type: 'email', map: 'email', req: true }
      ], subs: [] }
    ];
    S.forms[0].subs.push({ id: 'sb1', at: at(-2, 15), email: 'farhan@coorgember.in', task: map.p1[16].id, title: map.p1[16].title });
    S.forms[0].subs.push({ id: 'sb2', at: at(-6, 11), email: 'ops@coorgember.in', task: map.p1[17].id, title: map.p1[17].title });

    // saved views
    S.views = [
      { id: 'v1', project: 'p1', name: 'Critical path', type: 'timeline', filter: { tags: [], who: [], pri: [], due: '' }, group: 'status', by: 'u1', shared: true },
      { id: 'v2', project: 'p1', name: 'Budget sheet', type: 'table', filter: { tags: [], who: [], pri: [], due: '' }, group: '', by: 'u1', shared: true },
      { id: 'v3', project: 'p1', name: 'Client-visible', type: 'list', filter: { tags: ['client-visible'], who: [], pri: [], due: '' }, group: 'status', by: 'u7', shared: true },
      { id: 'v4', project: 'p3', name: 'Due this week', type: 'list', filter: { tags: [], who: [], pri: [], due: 'week' }, group: 'assignee', by: 'u7', shared: true },
      { id: 'v5', project: '*', name: 'Client review queue', type: 'list', filter: { tags: [], who: [], pri: [], due: '', status: 'review2' }, group: 'project', by: 'u1', shared: false, queue: true, due: dayStr(1) }
    ];
    S.invites = [{ id: 'i1', email: 'ritika.sen@fernhill-digital.in', role: 'member', at: at(-1, 12), by: 'u2' }];
    return S;
  };

  function statusCat(S, t) { var p = S.projects.filter(function (x) { return x.id === t.project; })[0]; var s = p && p.statuses.filter(function (x) { return x.id === t.status; })[0]; return s ? s.cat : 'todo'; }
  function statusName(S, t) { var p = S.projects.filter(function (x) { return x.id === t.project; })[0]; var s = p && p.statuses.filter(function (x) { return x.id === t.status; })[0]; return s ? s.name : t.status; }
  function describeAction(S, a) {
    var P = function (id) { return (S.projects.filter(function (p) { return p.id === id; })[0] || {}).name; };
    var U = function (id) { return (S.users.filter(function (u) { return u.id === id; })[0] || {}).name; };
    switch (a.type) {
      case 'move': return 'Moved to ' + P(a.project);
      case 'notify': return 'Notified ' + (a.who === 'owner' ? 'the project owner' : a.who === 'assignees' ? 'the assignees' : U(a.who));
      case 'assign': return 'Assigned ' + U(a.who);
      case 'priority': return 'Set priority to ' + ['None', 'Low', 'Medium', 'High', 'Urgent'][a.value];
      case 'tag': return 'Added tag ' + a.value;
      case 'comment': return 'Posted a comment';
      case 'status': return 'Changed status';
      default: return a.type;
    }
  }
  OW.describeAction = describeAction;
  OW.dateUtil = { iso: iso, dayStr: dayStr };
})();
