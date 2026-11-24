/* Studio OS: CRM + ERP seed layer. Lead configuration, leads, design boards, vendor bids, site measurements, handover.
   Runs after the core seed with its own random stream so the quote-to-cash story stays identical. Fictional data. */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u;

  MR.CONFIG_DEFAULT = function () {
    return {
      tracks: ['Turnkey', 'Virtual Design'],
      stages: {
        'Turnkey': [['new', 'Enquiry', 0.5], ['discovery', 'Discovery call', 24], ['visit', 'Site visit', 48], ['brief', 'Brief & measurements', 72], ['fee', 'Design fee', 72], ['quote', 'Quote', 96], ['won', 'Won', 0], ['lost', 'Lost', 0]],
        'Virtual Design': [['new', 'Enquiry', 0.5], ['discovery', 'Discovery call', 24], ['package', 'Package chosen', 48], ['fee', 'Fee paid', 72], ['won', 'Won', 0], ['lost', 'Lost', 0]]
      },
      sources: ['Instagram', 'Website form', 'Google search', 'Referral', 'Architect referral', 'Walk-in', 'Repeat client'],
      fields: [
        { k: 'property', n: 'Property', type: 'select', opts: ['2BHK apartment', '3BHK apartment', '4BHK apartment', 'Builder floor', 'Villa', 'Penthouse', 'Office', 'Clinic', 'Café', 'Preschool'] },
        { k: 'area', n: 'Carpet area (sqft)', type: 'number' },
        { k: 'budget', n: 'Budget band', type: 'select', opts: ['Under ₹15 L', '₹15–30 L', '₹30–60 L', '₹60 L+'] },
        { k: 'possession', n: 'Possession', type: 'date' },
        { k: 'style', n: 'Style', type: 'select', opts: ['Warm modern', 'Japandi', 'Classic', 'Industrial', 'Minimal', 'Contemporary Indian'] },
        { k: 'family', n: 'Who lives there', type: 'text' },
        { k: 'vastu', n: 'Vastu', type: 'select', opts: ['Not needed', 'Preferred', 'Must follow'] }
      ],
      rules: [
        ['Budget band is ₹60 L+', 'Assign to Kabir and tell Ira'],
        ['Project is commercial', 'Assign to Kabir'],
        ['Source is Instagram', 'Assign to Naina'],
        ['Track is Virtual Design', 'Assign to Tanvi (designer)'],
        ['Everything else', 'Round robin: Kabir, Naina']
      ],
      tasks: [
        ['Turnkey', 'new', 'Acknowledge enquiry and collect the brief', 0.5, 'Owner of lead'],
        ['Turnkey', 'new', 'Log source and budget in the CRM', 1, 'Owner of lead'],
        ['Turnkey', 'discovery', 'Send the discovery-call booking link', 2, 'Owner of lead'],
        ['Turnkey', 'discovery', 'Upload discovery notes and a first moodboard', 24, 'Designer'],
        ['Turnkey', 'visit', 'Confirm the site-visit date with the client', 24, 'Project manager'],
        ['Turnkey', 'visit', 'Upload site photos and measurements', 48, 'Site engineer'],
        ['Turnkey', 'brief', 'Prepare the scope document', 72, 'Designer'],
        ['Turnkey', 'fee', 'Raise the design-fee request', 24, 'Accounts'],
        ['Turnkey', 'quote', 'Build the BOQ and quotation', 72, 'Owner of lead'],
        ['Turnkey', 'quote', 'Internal review of the quotation', 24, 'Owner'],
        ['Turnkey', 'quote', 'Send the quotation to the client', 1, 'Owner of lead'],
        ['Virtual Design', 'new', 'Acknowledge enquiry and share packages', 0.5, 'Designer'],
        ['Virtual Design', 'package', 'Confirm the package and rooms in scope', 24, 'Designer'],
        ['Virtual Design', 'fee', 'Send the fee link and the welcome kit', 24, 'Accounts']
      ],
      packages: [['Essential', 'Layout, moodboard and one 3D view per room', 18000], ['Premium', 'Two 3D views per room, material schedule, two revisions', 32000], ['Bespoke', 'Unlimited views, custom furniture drawings, site visits', 55000]],
      checklist: ['Snag list closed and signed by the client', 'Deep clean done', 'Keys, remotes and access cards handed over', 'Warranty folder handed over', 'As-built electrical and plumbing drawings shared', 'Appliance walkthroughs given', 'Final walk-through signed', 'Retention invoice raised'],
      warranty: [['BWP/BWR ply carcasses', 120], ['Waterproofing', 60], ['Hardware and fittings', 12], ['Electrical and plumbing work', 12], ['Workmanship', 12]],
      messages: [
        ['First response', 'Hi {first}, thanks for reaching Marlow & Reed. I am {me}; I will call you in the next 30 minutes. Is this a good number?'],
        ['Site-visit confirmation', 'Hi {first}, confirming our site visit on {date}. Our engineer will measure every room; it takes about 90 minutes.'],
        ['Design-fee request', 'Hi {first}, as discussed, the design fee is {amount} + GST and is adjusted against the final quote.'],
        ['Quote follow-up', 'Hi {first}, did you get a chance to go through the quote? Happy to walk you through it on a call today.']
      ]
    };
  };

  MR.seedCRM = function (S, T) {
    var R = u.rng(424242), D = function (n) { return u.addD(T, -n); };
    function TS(n, h, m) { var d = u.pd(D(n)); d.setHours(h == null ? 10 : h, m == null ? Math.floor(R() * 60) : m); return d.toISOString(); }
    function A(at, by, entity, ref, action, detail) { S.audit.push({ id: u.uid('a'), at: at, by: by, entity: entity, ref: ref, action: action, detail: detail || '' }); }
    S.config = MR.CONFIG_DEFAULT();
    S.seq.lead = 0; S.seq.bid = 13;

    /* extra vendors so every trade can be bid three ways */
    [['v-woodcraft', 'Woodcraft Interiors Pvt Ltd', 'Carpentry', 'Sector 25, Faridabad', 'HR', '06AABCW4410K1Z2', 'Sanjay Bhatt', 'Net 30', 4.3, 18],
     ['v-sharma', 'Sharma Furniture Works', 'Carpentry', 'Kirti Nagar, New Delhi', 'DL', '07AAFPS8813M1Z9', 'Rakesh Sharma', 'Net 15', 4.0, 24],
     ['v-marbella', 'Marbella Stone House', 'Flooring', 'Rajouri Garden, New Delhi', 'DL', '07AAKFM3307H1Z6', 'Irfan Qadri', 'Net 30', 4.6, 9],
     ['v-tilecraft', 'Tilecraft Depot', 'Flooring', 'Sector 63, Noida', 'UP', '09AAJFT6612B1Z3', 'Neha Goel', 'Advance', 3.9, 4],
     ['v-skyline', 'Skyline Ceilings', 'False ceiling', 'Sector 10A, Gurugram', 'HR', '06AAMFS2290C1Z1', 'Manoj Yadav', 'Net 15', 4.2, 5],
     ['v-habitat', 'Habitat Drywall Systems', 'False ceiling', 'Sector 2, Noida', 'UP', '09AAHFH7781D1Z4', 'Kunal Batra', 'Net 30', 4.5, 6],
     ['v-ohm', 'Ohm Electricals', 'Electrical', 'Lajpat Rai Market, Delhi', 'DL', '07AABFO1123E1Z8', 'Vikas Jain', 'Net 15', 4.1, 3]
    ].forEach(function (v) { S.vendors.push({ id: v[0], name: v[1], cat: v[2], city: v[3], state: v[4], gstin: v[5], contact: v[6], terms: v[7], rating: v[8], lead: v[9], phone: '+91 98' + (110 + Math.floor(R() * 800)) + ' ' + (10000 + Math.floor(R() * 89999)) }); });

    /* ---------------- leads ---------------- */
    var LEADS = [
      // name, track, stage, source, owner, city, state, daysAgo created, fields, score, extras
      ['Ananya Kulkarni', 'Turnkey', 'new', 'Instagram', 'u-naina', 'Sector 84, Gurugram', 'HR', 0.01, { property: '3BHK apartment', area: 1650, budget: '₹30–60 L', style: 'Japandi', family: 'Couple, one toddler' }, 'hot'],
      ['Rajat & Megha Bhalla', 'Turnkey', 'new', 'Website form', 'u-kabir', 'Sector 47, Noida', 'UP', 0.1, { property: 'Builder floor', area: 2100, budget: '₹30–60 L' }, 'warm'],
      ['Devansh Gupta', 'Turnkey', 'new', 'Google search', 'u-kabir', 'Indirapuram, Ghaziabad', 'UP', 3, { property: '2BHK apartment', area: 1050, budget: '₹15–30 L' }, 'cold'],
      ['Farhan Siddiqui', 'Turnkey', 'discovery', 'Google search', 'u-kabir', 'Sector 137, Noida', 'UP', 2, { property: '3BHK apartment', area: 1480, budget: '₹15–30 L', possession: u.addD(T, 40) }, 'warm'],
      ['Greenleaf Montessori', 'Turnkey', 'discovery', 'Referral', 'u-kabir', 'Sector 50, Gurugram', 'HR', 4, { property: 'Preschool', area: 3800, budget: '₹30–60 L' }, 'hot', { kind: 'Commercial' }],
      ['Kavya Reddy', 'Turnkey', 'visit', 'Referral', 'u-naina', 'Sohna Road, Gurugram', 'HR', 6, { property: 'Villa', area: 4200, budget: '₹60 L+', style: 'Contemporary Indian', vastu: 'Must follow', family: 'Parents, two teenagers' }, 'hot'],
      ['Hemant Arora', 'Turnkey', 'brief', 'Walk-in', 'u-naina', 'Paschim Vihar, New Delhi', 'DL', 11, { property: '4BHK apartment', area: 2300, budget: '₹30–60 L', style: 'Warm modern' }, 'warm'],
      ['Nikita & Arjun Bose', 'Turnkey', 'fee', 'Architect referral', 'u-kabir', 'Golf Links, New Delhi', 'DL', 15, { property: 'Penthouse', area: 3600, budget: '₹60 L+', style: 'Minimal' }, 'hot'],
      ['Pallavi Joshi', 'Virtual Design', 'package', 'Instagram', 'u-tanvi', 'Pune (remote)', 'HR', 5, { property: '2BHK apartment', area: 980, style: 'Warm modern' }, 'warm'],
      ['Sameer Khan', 'Virtual Design', 'discovery', 'Website form', 'u-tanvi', 'Jaipur (remote)', 'HR', 2, { property: '3BHK apartment', area: 1500 }, 'cold'],
      ['Ritika Chauhan', 'Turnkey', 'lost', 'Instagram', 'u-naina', 'Sector 56, Gurugram', 'HR', 19, { property: '2BHK apartment', area: 900, budget: 'Under ₹15 L' }, 'cold']
    ];
    S.leads = [];
    function stageAt(track, k) { return S.config.stages[track].map(function (s) { return s[0]; }).indexOf(k); }
    function mkTasks(l, createdTs) {
      var st = S.config.stages[l.track], cur = stageAt(l.track, l.stage);
      return S.config.tasks.filter(function (t) { return t[0] === l.track && stageAt(l.track, t[1]) > -1 && stageAt(l.track, t[1]) <= cur; }).map(function (t, i) {
        var past = stageAt(l.track, t[1]) < cur, due = new Date(new Date(createdTs).getTime() + t[3] * 3600e3 * (1 + i * 0.4));
        return { id: u.uid('tk'), stage: t[1], title: t[2], sla: t[3], who: t[4], due: due.toISOString(), done: past || (l.stage === 'quote' && i < 9), doneAt: past ? due.toISOString() : null };
      });
    }
    LEADS.forEach(function (x, i) {
      var created = TS(x[7], x[7] < 1 ? (new Date().getHours() - (x[7] < 0.05 ? 0 : 2) + 24) % 24 : 11, x[7] < 0.05 ? Math.max(0, new Date().getMinutes() - 18) : null);
      if (x[7] < 1) { var d = new Date(Date.now() - x[7] * 864e5 - (x[7] < 0.05 ? 18 * 60e3 : 0)); created = d.toISOString(); }
      var first = x[0].split(/ & | /)[0];
      var l = { id: 'l-' + (i + 1), no: 'LD-' + u.pad(201 + i, 4), name: x[0], track: x[1], stage: x[2], source: x[3], owner: x[4], city: x[5], state: x[6], kind: (x[10] || {}).kind || 'Residential', created: created, score: x[9], f: x[8], phone: '+91 9' + (8100 + Math.floor(R() * 1800)) + ' ' + (10000 + Math.floor(R() * 89999)), email: first.toLowerCase() + '@example.com', remarks: [], visit: null, measure: null, brief: null, fee: null, pkg: null, clientId: null, quoteId: null, next: null, lostWhy: '' };
      l.tasks = mkTasks(l, created);
      S.leads.push(l);
    });
    function L(name) { return S.leads.filter(function (l) { return l.name === name; })[0]; }
    function rem(l, ago, h, outcome, note, by) { l.remarks.push({ id: u.uid('rm'), at: TS(ago, h), by: by || l.owner, outcome: outcome, note: note }); }
    // stories
    var a = L('Ananya Kulkarni'); a.note = 'DM on Instagram: “Loved the Kapoor villa reel. Need full interiors, possession in March.”';
    var b = L('Rajat & Megha Bhalla'); b.note = 'Website form: “Builder floor, ground + first. Want a modular kitchen and wardrobes first, rest later.”'; b.first = null;
    var dv = L('Devansh Gupta'); rem(dv, 3, 12, 'noanswer', 'No answer. Sent the intro message on WhatsApp.'); rem(dv, 1, 17, 'noanswer', 'No answer again. Try after 7 pm, office hours.'); dv.next = { at: TS(0, 19, 0), text: 'Call after 7 pm' };
    var fs = L('Farhan Siddiqui'); rem(fs, 2, 11, 'connected', 'Connected. Possession in 40 days; wants kitchen, wardrobes and false ceiling. Booked a discovery call.'); fs.next = { at: TS(0, 16, 0), text: 'Discovery call (Meet)', kind: 'call' };
    var gm = L('Greenleaf Montessori'); rem(gm, 4, 15, 'connected', 'Director Mansi Kapur, referred by Arbor Learning. Opening in May; 6 classrooms.'); gm.next = { at: TS(-1, 12, 0), text: 'Discovery call with the director' };
    var kr = L('Kavya Reddy'); rem(kr, 6, 16, 'connected', 'Very keen. Villa of 4,200 sqft, Vastu must be followed. Parents move in by April.'); rem(kr, 3, 11, 'connected', 'Discovery done. Site visit fixed for tomorrow 11 am; gate pass with the RWA.'); kr.visit = { at: TS(-1, 11, 0), by: 'u-imran', done: false }; kr.next = { at: TS(-1, 11, 0), text: 'Site visit and measurements', kind: 'visit' };
    var ha = L('Hemant Arora'); rem(ha, 11, 18, 'connected', 'Walked into the studio. Wants a warm modern look; elderly mother, so grab rails and no rugs.'); rem(ha, 7, 12, 'connected', 'Site visit done. 4BHK, old wiring needs full replacement.'); ha.visit = { at: TS(7, 11, 0), by: 'u-deepak', done: true };
    ha.measure = { at: TS(7, 13, 0), by: 'u-deepak', rooms: [['Living & dining', 22, 14, 10, 2, 3], ['Kitchen', 12, 9, 10, 1, 1], ['Master bedroom', 15, 13, 10, 1, 2], ['Bedroom 2', 13, 12, 10, 1, 1], ['Bedroom 3', 12, 11, 10, 1, 1], ['Study', 10, 9, 10, 1, 1]].map(function (r) { return { name: r[0], l: r[1], w: r[2], h: r[3], doors: r[4], windows: r[5], note: '' }; }), photos: ['s-shell.jpg', 's-demolition.jpg'], note: 'Old aluminium windows to be replaced. DB at the entrance, 8-way, undersized.' };
    ha.brief = { rooms: ['Living & dining', 'Kitchen', 'Master bedroom', 'Bedroom 2', 'Bedroom 3', 'Study'], style: 'Warm modern', must: 'Grab rails in two bathrooms; no rugs; study for home office; puja niche in living.', avoid: 'Glossy laminates, dark wood.', status: 'draft' }; ha.next = { at: TS(-1, 15, 0), text: 'Share the scope document' };
    var nb = L('Nikita & Arjun Bose'); rem(nb, 15, 12, 'connected', 'Referred by an architect we work with. Penthouse with a terrace; wants a minimal look with lots of storage.'); rem(nb, 9, 17, 'connected', 'Brief signed off. Design fee of ₹1,20,000 agreed; adjusted against the final quote.');
    nb.visit = { at: TS(12, 11, 0), by: 'u-imran', done: true }; nb.brief = { rooms: ['Living & dining', 'Terrace', 'Kitchen', 'Master suite', 'Two bedrooms', 'Study'], style: 'Minimal', must: 'Hidden storage everywhere; terrace usable in Delhi summers; home theatre in study.', avoid: 'Heavy cornices.', status: 'approved' };
    nb.fee = { amount: 120000, requestedAt: TS(8, 12), paidAt: null, due: D(-2) }; nb.next = { at: TS(0, 18, 0), text: 'Check design-fee transfer' };
    var pj = L('Pallavi Joshi'); rem(pj, 5, 20, 'connected', 'Remote client in Pune. Picked Premium after seeing the Premium moodboard.'); pj.pkg = 'Premium'; pj.next = { at: TS(-1, 11, 0), text: 'Confirm rooms in scope' };
    var sk = L('Sameer Khan'); sk.next = { at: TS(0, 13, 0), text: 'First call' }; rem(sk, 1, 12, 'callback', 'Asked to call back today after lunch.', 'u-tanvi');
    var rc = L('Ritika Chauhan'); rem(rc, 19, 12, 'connected', 'Budget under ₹12 L for a full 2BHK.'); rem(rc, 14, 16, 'notinterested', 'Went with a modular-kitchen showroom package.'); rc.lostWhy = 'Budget below our minimum';
    // leads behind the existing quote pipeline and the projects
    var link = [['c-mehra', 'q-mehra', 'Referral', 'quote', 'hot'], ['c-bhatia', 'q-bhatia', 'Website form', 'quote', 'warm'], ['c-gill', 'q-gill', 'Website form', 'quote', 'warm'], ['c-dutta', 'q-dutta', 'Referral', 'quote', 'warm'], ['c-sinha', 'q-sinha', 'Instagram', 'quote', 'warm'], ['c-oberoi', 'q-oberoi', 'Referral', 'quote', 'cold'], ['c-saffron', 'q-saffron', 'Instagram', 'quote', 'hot'], ['c-northgate', 'q-northgate', 'Google search', 'quote', 'warm'],
      ['c-iyer', 'q-iyer', 'Google search', 'won', 'hot'], ['c-kapoor', 'q-kapoor', 'Referral', 'won', 'hot'], ['c-saxena', 'q-saxena', 'Architect referral', 'won', 'hot'], ['c-kestrel', 'q-kestrel', 'Referral', 'won', 'hot'], ['c-arbor', 'q-arbor', 'Repeat client', 'won', 'hot'], ['c-rao', 'q-rao', 'Referral', 'won', 'warm'], ['c-sethi', 'q-sethi', 'Instagram', 'won', 'warm'], ['c-malhotra', 'q-malhotra', 'Website form', 'won', 'warm'],
      ['c-bansal', 'q-bansal', 'Instagram', 'lost', 'cold'], ['c-chawla', 'q-chawla', 'Walk-in', 'lost', 'cold'], ['c-khanna', 'q-khanna', 'Website form', 'lost', 'cold'], ['c-verma', 'q-verma', 'Referral', 'lost', 'warm'], ['c-nambiar', 'q-nambiar', 'Instagram', 'lost', 'warm']];
    link.forEach(function (x) {
      var c = S.clients.filter(function (y) { return y.id === x[0]; })[0], q = S.quotes.filter(function (y) { return y.id === x[1]; })[0]; if (!c || !q) return;
      var made = u.addD(q.created.slice(0, 10), -Math.round(8 + R() * 10));
      var l = { id: 'l-' + (S.leads.length + 1), no: 'LD-' + u.pad(140 + S.leads.length, 4), name: c.name, track: 'Turnkey', stage: x[3], source: x[2], owner: q.owner, city: c.city, state: c.state, kind: c.kind, created: made + 'T11:00:00.000Z', score: x[4], f: { property: ({ full3: '3BHK apartment', villa: 'Villa', kitchen: '3BHK apartment', refresh: '2BHK apartment', living: 'Penthouse', office: 'Office', clinic: 'Clinic', cafe: 'Café', preschool: 'Preschool' })[q.tpl] }, phone: c.phone, email: c.email, remarks: [], visit: { at: u.addD(made, 3) + 'T11:00:00.000Z', by: 'u-imran', done: true }, measure: null, brief: { rooms: MR.ver(q).sections.map(function (s) { return s.title; }), style: 'Warm modern', must: '', avoid: '', status: 'approved' }, fee: { amount: c.kind === 'Commercial' ? 60000 : 45000, requestedAt: u.addD(made, 5) + 'T12:00:00.000Z', paidAt: u.addD(made, 6) + 'T15:00:00.000Z' }, pkg: null, clientId: c.id, quoteId: q.id, next: null, lostWhy: x[3] === 'lost' ? q.lostWhy : '' };
      l.remarks.push({ id: u.uid('rm'), at: made + 'T12:00:00.000Z', by: l.owner, outcome: 'connected', note: 'First call done. ' + (c.note || 'Interested in full interiors.') });
      l.tasks = mkTasks(l, l.created); l.tasks.forEach(function (t) { t.done = true; t.doneAt = t.due; });
      S.leads.push(l);
    });
    S.seq.lead = 260;
    S.leads.forEach(function (l) { A(l.created, l.owner, 'lead', l.no, 'created', l.name + ' · ' + l.source + ' · ' + l.track); });

    /* ---------------- site measurements on live projects ---------------- */
    S.projects.forEach(function (p) { if (p.id === 'p-iyer') p.measure = { at: TS(9, 12), by: 'u-imran', rooms: [['Living & dining', 20, 13, 10, 2, 2], ['Kitchen & utility', 11, 9, 10, 1, 1], ['Master bedroom', 14, 12, 10, 1, 2], ['Bedroom 2', 12, 11, 10, 1, 1], ["Kids' room", 11, 10, 10, 1, 1]].map(function (r) { return { name: r[0], l: r[1], w: r[2], h: r[3], doors: r[4], windows: r[5], note: '' }; }), photos: ['s-shell.jpg'], note: 'Ceiling height 10 ft 2 in everywhere. Beam in the living room at 8 ft from the window wall.' }; });

    /* ---------------- design boards ---------------- */
    function board(id, ref, refType, token, rooms) { return { id: id, ref: ref, refType: refType, token: token, rooms: rooms }; }
    function room(name, status, mood, palette, sel, renders, pins, decided) { return { id: u.uid('rmn'), name: name, status: status, mood: mood, palette: palette, sel: sel.map(function (s) { return { code: s[0], name: s[1], finish: s[2], sku: s[3] }; }), renders: renders.map(function (r, i) { return { v: i + 1, kind: r[0], photo: r[1], at: TS(r[2], 15), note: r[3] || '' }; }), pins: (pins || []).map(function (p) { return { id: u.uid('pin'), x: p[0], y: p[1], v: p[2], by: p[3], who: p[4], text: p[5], at: TS(p[6], p[7] || 20), resolved: !!p[8] }; }), decidedAt: decided ? TS(decided, 19) : null }; }
    S.boards = [
      board('b-iyer', 'p-iyer', 'project', 'dz-iyer', [
        room('Living & dining', 'approved', ['d-room-1.jpg', 'd-linen.jpg', 'd-clay.jpg', 'd-vase.jpg'], ['#E8E0D4', '#C29A6B', '#5B6650', '#2E2B28'], [['CP-404', 'TV unit', 'Fluted oak veneer, natural matt', 'VN-OAK-118'], ['FL-501', 'Floor', 'Vitrified 800×800, Sahara beige', 'VT-8080-21'], ['PT-602', 'Feature wall', 'Limewash, Bone 04', 'LW-BONE-04']], [['2D', 'd-room-2.jpg', 12, 'Layout v1'], ['3D', 'p-living.jpg', 8, 'Warm modern v1'], ['3D', 'd-room-1.jpg', 5, 'v2: lighter oak, linen curtains']], [[62, 40, 2, 'client', 'Rohan Iyer', 'Can the shelves be closed at the bottom? Toddler-proofing.', 6, 20, true], [30, 70, 3, 'u-tanvi', 'Tanvi Joshi', 'Done in v2: closed shutters below 900 mm.', 5, 11, true]], 3),
        room('Kitchen & utility', 'changes', ['p-kitchen.jpg', 'd-clay.jpg'], ['#F2EFEA', '#7C8A6E', '#C6B49A', '#2F2C29'], [['CP-401', 'Kitchen', 'Acrylic, Sage matt · quartz Calacatta-look', 'AC-SAGE-07'], ['FL-501', 'Floor', 'Vitrified 600×1200, warm grey', 'VT-6012-09']], [['2D', 'p-kitchen2.jpg', 9, 'L-shape v1'], ['3D', 'p-kitchen.jpg', 2, 'Sage v1']], [[48, 34, 2, 'client', 'Divya Iyer', 'Sage looks great, but can we try a lighter shade on the upper cabinets?', 1, 21], [72, 62, 2, 'client', 'Divya Iyer', 'Need a tall unit for the microwave and OTG here.', 1, 21]]),
        room('Master bedroom', 'shared', ['d-bedroom.jpg', 'd-linen.jpg'], ['#EDE6DC', '#9C7B5B', '#41403C', '#D8CFC2'], [['CP-402', 'Wardrobe', 'Laminate, Suede walnut 1 mm', 'LM-2231'], ['FC-302', 'Ceiling', 'Cove with 3000 K profile', '—']], [['3D', 'd-bedroom.jpg', 1, 'Walnut + linen v1']], []),
        room("Kids' room", 'draft', ['d-room-4.jpg'], ['#F4EFE7', '#E4B77A', '#7FA5B3', '#3A3A3A'], [['CP-402', 'Wardrobe', 'Laminate, Pastel blue', 'LM-1180']], [], [])
      ]),
      board('b-mehra', 'q-mehra', 'quote', 'dz-mehra', [
        room('Living & dining', 'shared', ['p-lounge.jpg', 'd-vase.jpg', 'd-clay.jpg'], ['#E6DFD3', '#6A4A33', '#B79C7E', '#262422'], [['CP-404', 'TV unit', 'Walnut veneer, satin', 'VN-WAL-204'], ['PT-602', 'Two walls', 'Limewash, Clay 12', 'LW-CLAY-12'], ['FN-705', 'Rug', 'Hand-tufted wool, oat', 'RG-0810-OAT']], [['3D', 'd-room-3.jpg', 10, 'Oak v1'], ['3D', 'p-lounge.jpg', 4, 'v2: walnut TV wall']], [[55, 45, 2, 'client', 'Dev Mehra', 'Walnut is the one. Can the downlights be warmer?', 3, 22]])
      ]),
      board('b-bhatia', 'q-bhatia', 'quote', 'dz-bhatia', [
        room('Prayer room', 'draft', ['d-bath-stone.jpg', 'd-clay.jpg'], ['#EDE4D6', '#B9945F', '#8A6A44', '#F7F2EA'], [['CP-406', 'Jaali wall', 'Stone-look CNC jaali, ivory', 'JL-IV-03'], ['FL-504', 'Floor', 'Imported marble, Botticino-look', 'MB-BOT-02']], [['2D', 'd-bath-stone.jpg', 4, 'Jaali concept']], []),
        room('Living & dining', 'shared', ['d-room-5.jpg', 'd-linen.jpg'], ['#EEE8DE', '#A47B54', '#556052', '#2C2A27'], [['CP-406', 'Panelling', 'Fluted oak veneer', 'VN-OAK-118']], [['3D', 'd-room-5.jpg', 6, 'v1']], [])
      ]),
      board('b-kapoor', 'p-kapoor', 'project', 'dz-kapoor', ['Living & dining', 'Kitchen & utility', 'Master bedroom', 'Bathrooms (4)'].map(function (n, i) { var ph = ['p-villa.jpg', 'p-kitchen2.jpg', 'd-bedroom.jpg', 'd-bath-oak.jpg'][i]; return room(n, 'approved', [ph, 'd-linen.jpg'], ['#EAE3D8', '#A88762', '#4E5A4A', '#2B2926'], [['CP-406', 'Panelling', 'Oak veneer', 'VN-OAK-118']], [['3D', ph, 70 - i * 3, 'Final']], [], 64 - i * 3); }))
    ];
    S.boards.forEach(function (bd) { bd.rooms.forEach(function (rm) { if (rm.decidedAt) A(rm.decidedAt, 'client', 'design', bd.token, 'approved', rm.name); }); });

    /* ---------------- vendor bids ---------------- */
    function boqLines(pid, cat) { var p = S.projects.filter(function (x) { return x.id === pid; })[0], q = S.quotes.filter(function (x) { return x.id === p.quoteId; })[0], v = q.versions[(q.sig ? q.sig.v : q.versions.length) - 1], g = {}; v.sections.forEach(function (s) { s.items.forEach(function (i) { if (i.cat !== cat || !i.mat) return; var o = g[i.code] || (g[i.code] = { code: i.code, desc: i.name, unit: i.unit, qty: 0, mat: i.mat, keys: [] }); o.qty += Math.round(MR.lineQty(i)); o.keys.push(i.key); }); }); return Object.keys(g).map(function (k) { return g[k]; }); }
    function bid(no, pid, cat, title, vendors, replies, status, daysAgo, winner) {
      var lines = boqLines(pid, cat), b = { id: 'bd-' + no, no: 'VB-2026-' + u.pad(no, 3), projectId: pid, trade: cat, title: title, lines: lines, vendors: vendors, quotes: {}, status: status, created: TS(daysAgo, 11), by: 'u-kabir', due: D(daysAgo - 5), winner: winner || null, awardedAt: null, poId: null };
      vendors.forEach(function (vid, j) {
        if (j >= replies) return;
        var f = [0.97, 1.04, 0.93, 1.08, 0.99][(no + j) % 5], vd = S.vendors.filter(function (x) { return x.id === vid; })[0];
        b.quotes[vid] = { at: TS(daysAgo - 2 - j, 16), lead: Math.max(3, Math.round(vd.lead * (0.8 + j * 0.15))), terms: vd.terms, valid: D(daysAgo - 20), note: ['Includes delivery and unloading at site.', 'Hardware extra at actuals. 5-year carcass warranty.', 'Prices hold for 15 days; 50% advance on order.'][j % 3], rates: lines.reduce(function (o, l, k) { o[l.code] = Math.round(l.mat * (f + ((k * 7 + j * 3) % 5 - 2) * 0.012)); return o; }, {}) };
      });
      S.bids.push(b); A(b.created, 'u-kabir', 'bid', b.no, 'sent', title + ' to ' + vendors.length + ' vendors');
      return b;
    }
    S.bids = [];
    var kb = bid(11, 'p-kestrel', 'False ceiling', 'Grid and gypsum ceiling, 5th floor', ['v-gypcraft', 'v-skyline', 'v-habitat'], 3, 'awarded', 70, 'v-gypcraft');
    kb.awardedAt = TS(64, 12); kb.poId = (S.pos.filter(function (o) { return o.projectId === 'p-kestrel' && o.vendorId === 'v-gypcraft'; })[0] || {}).id || null; kb.awardNote = 'Lowest on grid ceiling and fastest lead time; GRAP delay risk noted.';
    bid(14, 'p-iyer', 'Carpentry', 'Modular kitchen and wardrobes, Iyer residence', ['v-arora', 'v-woodcraft', 'v-sharma'], 3, 'received', 8);
    bid(15, 'p-iyer', 'Flooring', 'Vitrified and engineered flooring, Iyer residence', ['v-stonehouse', 'v-marbella', 'v-tilecraft'], 2, 'sent', 5);
    bid(16, 'p-arbor', 'Furniture & lighting', 'Acoustic panels and downlights, activity hall', ['v-loom', 'v-lumiere', 'v-teak'], 0, 'sent', 2);
    S.seq.bid = 16;

    /* ---------------- handover ---------------- */
    S.projects.forEach(function (p) {
      var items = S.config.checklist.map(function (t) { return { t: t, done: false, by: null, at: null }; });
      if (p.status === 'handed') items.forEach(function (it) { it.done = true; it.by = p.eng; it.at = p.handedAt + 'T16:00:00.000Z'; });
      if (p.status === 'snagging') items.forEach(function (it, i) { if (i === 1 || i === 3 || i === 4 || i === 5) { it.done = true; it.by = p.eng; it.at = TS(3 - (i % 3), 15); } });
      p.handover = { items: items, signedBy: p.status === 'handed' ? (S.clients.filter(function (c) { return c.id === p.clientId; })[0] || {}).contact : null, signedAt: p.status === 'handed' ? p.handedAt : null };
    });

    /* ---------------- notifications ---------------- */
    function N(ago, to, text, href, kind) { S.notifs.push({ id: u.uid('n'), at: TS(ago, 9 + Math.floor(R() * 8)), to: to, text: text, href: href, kind: kind || 'info', read: [] }); }
    N(0, ['owner', 'pm'], 'New lead from Instagram: Ananya Kulkarni, 3BHK in Sector 84. First response due in 12 minutes.', '#/leads?open=l-1', 'warn');
    N(0, ['owner', 'pm'], 'SLA missed: Rajat & Megha Bhalla have waited 2 hours for a first call.', '#/leads?open=l-2', 'bad');
    N(1, ['owner', 'pm', 'design'], 'Divya Iyer requested changes on the Kitchen design (2 pins).', '#/board/b-iyer?room=1', 'comment');
    N(1, ['owner', 'pm', 'accounts'], 'All 3 carpentry bids are in for the Iyer residence. Ready to compare.', '#/bid/bd-14', 'ok');
  };
})();
