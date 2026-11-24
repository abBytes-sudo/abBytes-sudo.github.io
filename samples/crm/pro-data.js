/* Lumen CRM Pro — seed data (v2): users and roles, 15 companies, 60+ contacts, ~40 deals in two pipelines,
   associations, line items (Halden Supply SKUs), activities, tasks, tickets, quotes, custom fields, audit history,
   automation, sequences, scoring and saved views. Everything is fictional and simulated. Stored as S.pro. */
(function () {
  'use strict';
  var C = window.CRM, H = 3600e3, D = 864e5;

  var PIPES0 = {
    sales: { id: 'sales', label: 'Sales', stages: [
      { id: 'qualified', label: 'Qualified', p: 10, color: '#98A0B3' },
      { id: 'visit', label: 'Site visit', p: 25, color: '#717C95' },
      { id: 'design', label: 'Design', p: 40, color: '#4F5B78' },
      { id: 'proposal', label: 'Proposal', p: 60, color: '#4F46E5' },
      { id: 'negotiation', label: 'Negotiation', p: 80, color: '#4338CA' },
      { id: 'won', label: 'Won', p: 100, color: '#1F9D57', won: true },
      { id: 'lost', label: 'Lost', p: 0, color: '#B9BDC6', lost: true }] },
    partner: { id: 'partner', label: 'Partnerships', stages: [
      { id: 'intro', label: 'Intro', p: 10, color: '#98A0B3' },
      { id: 'pilot', label: 'Pilot project', p: 40, color: '#717C95' },
      { id: 'agreement', label: 'Agreement', p: 70, color: '#4F46E5' },
      { id: 'active', label: 'Active partner', p: 100, color: '#1F9D57', won: true },
      { id: 'paused', label: 'Paused', p: 0, color: '#B9BDC6', lost: true }] }
  };
  C.PIPES = JSON.parse(JSON.stringify(PIPES0));
  C.pstage = function (pipe, id) { var p = C.PIPES[pipe]; return p ? p.stages.filter(function (s) { return s.id === id; })[0] : null; };

  // deal fields that gates and workflows check (kept for older modules; the editable schema is P.fields.deal)
  C.DFIELDS = {
    visitOutcome: { label: 'Site-visit outcome', kind: 'select', opts: ['Measured — client keen', 'Measured — needs revised scope', 'Visited — decision maker absent', 'Not feasible'] },
    advance: { label: 'Token advance received', kind: 'money' },
    pilotReview: { label: 'Pilot review notes', kind: 'text' },
    handover: { label: 'Handover status', kind: 'select', opts: ['Not started', 'Pending', 'Scheduled', 'Done'] },
    priority: { label: 'Priority', kind: 'select', opts: ['Normal', 'High', 'Urgent'] }
  };
  C.EXTRA_SOURCES = { referral: { label: 'Referral', color: '#B5485D', icon: 'user' }, walkin: { label: 'Showroom walk-in', color: '#5B7A3A', icon: 'pin' } };

  var COS = [
    // id, name, industry, city, size, domain, owner, gstin, annual budget (₹), credit terms
    ['CO-101', 'Skyline Habitats', 'Real-estate developer', 'Gurugram', '201–500', 'skylinehabitats.example', 'Aarav Khanna', '06AAXCS4417K1Z2', 9000000, '30 days'],
    ['CO-102', 'Arcform Architects', 'Architecture studio', 'New Delhi', '11–50', 'arcform.example', 'Meera Joshi', '07AAKFA2210B1Z9', 0, 'Advance'],
    ['CO-103', 'Meridian Cowork', 'Workspace operator', 'Noida', '51–200', 'meridiancowork.example', 'Kabir Anand', '09AAJCM8812Q1Z4', 6500000, '30 days'],
    ['CO-104', 'Greenleaf Residency RWA', 'Housing society', 'Dwarka', '1–10', 'greenleafrwa.example', 'Isha Bedi', '', 800000, 'Advance'],
    ['CO-105', 'Tavira Hotels', 'Hospitality', 'Gurugram', '201–500', 'tavirahotels.example', 'Meera Joshi', '06AAFCT3390N1Z7', 12000000, '45 days'],
    ['CO-106', 'Studio Mahal', 'Interior architects', 'Saket', '11–50', 'studiomahal.example', 'Aarav Khanna', '07ABDFS6621M1Z1', 0, 'Advance'],
    ['CO-107', 'Brightpath School', 'Education', 'Faridabad', '51–200', 'brightpath.example', 'Isha Bedi', '06AAATB1287L1Z6', 1500000, '30 days'],
    ['CO-108', 'Kestrel Fintech', 'Corporate office', 'Gurugram', '51–200', 'kestrel.example', 'Kabir Anand', '06AAICK7743F1Z3', 5000000, '30 days'],
    ['CO-109', 'Orchid Clinics', 'Healthcare', 'Noida', '51–200', 'orchidclinics.example', 'Meera Joshi', '09AACCO5528H1Z8', 2200000, '15 days'],
    ['CO-110', 'Terrace Café Co.', 'Food and beverage', 'Vasant Kunj', '11–50', 'terracecafe.example', 'Kabir Anand', '07AAMFT9931C1Z5', 900000, 'Advance'],
    ['CO-111', 'Cedar Lane Developers', 'Real-estate developer', 'Noida', '201–500', 'cedarlane.example', 'Aarav Khanna', '09AAECC1186D1Z2', 15000000, '45 days'],
    ['CO-112', 'Bluepeak Offices', 'Corporate office', 'Noida', '11–50', 'bluepeak.example', 'Kabir Anand', '09AAHCB4471E1Z0', 1800000, '15 days'],
    ['CO-113', 'Saffron Table Restaurants', 'Food and beverage', 'Gurugram', '51–200', 'saffrontable.example', 'Isha Bedi', '06AAQFS2235G1Z1', 3500000, '30 days'],
    ['CO-114', 'Willow Dental Studio', 'Healthcare', 'Saket', '11–50', 'willowdental.example', 'Meera Joshi', '07AAVFW7710J1Z4', 1200000, '15 days'],
    ['CO-115', 'Kora Co-living', 'Co-living operator', 'Gurugram', '51–200', 'koracoliving.example', 'Kabir Anand', '06AALCK9902P1Z6', 8000000, '30 days']
  ];
  var PEOPLE = [
    ['Nikhil Arora', 'CO-101', 'Head of customer experience', 'Hindi'], ['Payal Sood', 'CO-101', 'Procurement manager', 'English'], ['Vivek Chandra', 'CO-101', 'Project director', 'Hindi'],
    ['Ritika Malhotra', 'CO-102', 'Principal architect', 'English'], ['Arjun Batra', 'CO-102', 'Associate architect', 'English'],
    ['Sahil Grover', 'CO-103', 'Facilities lead', 'Punjabi'], ['Ankita Das', 'CO-103', 'Finance controller', 'Bengali'], ['Mehul Shah', 'CO-103', 'Head of expansion', 'Gujarati'],
    ['Ramesh Batra', 'CO-104', 'Secretary', 'Hindi'], ['Kusum Lal', 'CO-104', 'Treasurer', 'Hindi'],
    ['Elena D’Souza', 'CO-105', 'General manager', 'English'], ['Varun Khurana', 'CO-105', 'Projects head', 'Hindi'], ['Prerna Singh', 'CO-105', 'Purchase manager', 'Hindi'],
    ['Farah Siddiqui', 'CO-106', 'Founder', 'Urdu'], ['Dhruv Kapoor', 'CO-106', 'Design lead', 'English'],
    ['Sunita Rawal', 'CO-107', 'Administrator', 'Hindi'], ['Mr. Joseph Thomas', 'CO-107', 'Principal', 'Malayalam'],
    ['Aditi Menon', 'CO-108', 'Head of operations', 'Malayalam'], ['Rahul Khosla', 'CO-108', 'CFO', 'Punjabi'], ['Tanya Arora', 'CO-108', 'Office manager', 'English'],
    ['Kiran Shetty', 'CO-109', 'Medical director', 'Kannada'], ['Pallavi Jain', 'CO-109', 'Admin manager', 'Hindi'],
    ['Jai Oberoi', 'CO-110', 'Owner', 'Punjabi'], ['Simone Fernandes', 'CO-110', 'Operations manager', 'English'],
    ['Ishaan Kapoor', 'CO-111', 'Sales head', 'Hindi'], ['Maya Fernandes', 'CO-111', 'Design manager', 'English'], ['Rakesh Gupta', 'CO-111', 'Director', 'Hindi'],
    ['Ankit Bhalla', 'CO-112', 'Admin lead', 'Punjabi'], ['Shreya Nair', 'CO-112', 'HR and workplace', 'Malayalam'],
    ['Karan Sachdeva', 'CO-113', 'Founder', 'Punjabi'], ['Leena Dutta', 'CO-113', 'Brand manager', 'Bengali'],
    ['Dr. Anjali Rao', 'CO-114', 'Founder and dentist', 'Telugu'], ['Sameer Wadhwa', 'CO-114', 'Practice manager', 'Hindi'],
    ['Aman Chawla', 'CO-115', 'COO', 'Punjabi'], ['Nisha Pillai', 'CO-115', 'Property lead', 'Tamil'], ['Rohit Mehra', 'CO-115', 'Procurement', 'Hindi']
  ];
  var REFERRALS = [['Harleen Kaur', 'Gurugram', 'Punjabi'], ['Vikas Bansal', 'Noida', 'Hindi'], ['Anushka Iyer', 'Saket', 'Tamil'], ['Rajeev Khanna', 'Dwarka', 'Hindi'], ['Fatima Sheikh', 'Gurugram', 'Urdu'], ['Siddhant Goel', 'Noida', 'Hindi']];
  var KIT = {
    'Modular kitchen': [['HS-CH-003', 3], ['HS-LT-014', 2], ['HS-LT-018', 1]],
    'Full-home interiors': [['HS-SF-008', 1], ['HS-TB-005', 1], ['HS-CH-001', 6], ['HS-ST-010', 1], ['HS-LT-014', 3], ['HS-RG-019', 1], ['HS-TX-020', 6]],
    'Wardrobes & storage': [['HS-LT-018', 2], ['HS-ST-012', 2]],
    'Bathroom remodel': [['HS-LT-017', 2]],
    'Painting & polish': [],
    'Smart lighting': [['HS-LT-018', 3], ['HS-LT-013', 4], ['HS-LT-017', 4]]
  };
  var SVC = { 'Modular kitchen': 'Kitchen design and execution', 'Full-home interiors': 'Full-home design and execution', 'Wardrobes & storage': 'Wardrobe carpentry and install', 'Bathroom remodel': 'Bathroom remodel works', 'Painting & polish': 'Painting and polish works', 'Smart lighting': 'Electrical and automation works' };
  var PTYPE = { 'Real-estate developer': 'Residential', 'Corporate office': 'Office', 'Workspace operator': 'Office', Hospitality: 'Hospitality', Healthcare: 'Healthcare', 'Food and beverage': 'Retail and F&B', Education: 'Institutional', 'Housing society': 'Residential', 'Co-living operator': 'Residential' };
  var OUT = C.DFIELDS.visitOutcome.opts;

  function items(list) { return list.map(function (x) { var s = C.sku(x[0]); return { sku: x[0], name: s.name, qty: x[1], price: s.price }; }); }
  function skuTot(a) { return a.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }

  C.proSeed = function (S) {
    var R = C.rng(77), t = Date.now(), n = 0, pick = function (a) { return a[Math.floor(R() * a.length)]; };
    var uid = function (p) { n++; return p + (t + n).toString(36).slice(-5) + n; };
    var P = { v: 2, companies: [], contacts: [], deals: [], acts: [], files: [], runs: [], gateLog: [], links: [], tickets: [], quotes: [], audit: [], notifs: [], tick: 0 };
    P.pipes = JSON.parse(JSON.stringify(PIPES0)); C.PIPES = P.pipes;
    var TEAM = C.TEAM;

    // ---- users, roles ---------------------------------------------------------------------
    P.users = [
      { name: 'Aarav Khanna', role: 'admin', team: 'Commercial', title: 'Founder', email: 'aarav@lumenhomes.example', active: true },
      { name: 'Meera Joshi', role: 'manager', team: 'Residential', title: 'Residential sales lead', email: 'meera@lumenhomes.example', active: true },
      { name: 'Kabir Anand', role: 'agent', team: 'Commercial', title: 'Commercial sales', email: 'kabir@lumenhomes.example', active: true },
      { name: 'Isha Bedi', role: 'agent', team: 'Residential', title: 'Residential sales', email: 'isha@lumenhomes.example', active: true }
    ];
    P.me = 'Aarav Khanna';
    P.roles = {
      admin: { scope: 'all', editOthers: true, delete: true, bulk: true, import: true, export: true, automation: true, reports: true, settings: true, discount: 100 },
      manager: { scope: 'team', editOthers: true, delete: true, bulk: true, import: true, export: true, automation: true, reports: true, settings: false, discount: 15 },
      agent: { scope: 'own', editOthers: false, delete: false, bulk: false, import: false, export: false, automation: false, reports: false, settings: false, discount: 5 }
    };

    // ---- field schema (built-in + custom) ---------------------------------------------------
    var LIFE = ['Lead', 'Qualified', 'Opportunity', 'Customer', 'Partner'];
    P.fields = {
      contact: [
        { key: 'name', label: 'Name', type: 'text', sys: true, path: 'rec' }, { key: 'email', label: 'Email', type: 'email', sys: true, path: 'rec' },
        { key: 'phone', label: 'Phone', type: 'phone', sys: true, path: 'rec' }, { key: 'role', label: 'Job title', type: 'text', sys: true, path: 'rec' },
        { key: 'city', label: 'City', type: 'text', sys: true, path: 'rec' }, { key: 'owner', label: 'Owner', type: 'user', sys: true, path: 'rec' },
        { key: 'life', label: 'Lifecycle stage', type: 'select', opts: LIFE, sys: true, path: 'rec' },
        { key: 'tags', label: 'Tags', type: 'multi', opts: ['Decision maker', 'Influencer', 'High value', 'Architect referral', 'Repeat customer', 'Imported'], sys: true, path: 'rec' },
        { key: 'lang', label: 'Preferred language', type: 'select', opts: ['English', 'Hindi', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Urdu'] },
        { key: 'bestTime', label: 'Best time to call', type: 'select', opts: ['Morning', 'Lunch hour', 'After 6 pm', 'Weekends only'] },
        { key: 'waOptIn', label: 'WhatsApp opt-in', type: 'select', opts: ['Yes', 'No'] }
      ],
      company: [
        { key: 'name', label: 'Name', type: 'text', sys: true, path: 'rec' }, { key: 'industry', label: 'Industry', type: 'select', opts: ['Real-estate developer', 'Architecture studio', 'Workspace operator', 'Housing society', 'Hospitality', 'Interior architects', 'Education', 'Corporate office', 'Healthcare', 'Food and beverage', 'Co-living operator', '—'], sys: true, path: 'rec' },
        { key: 'city', label: 'City', type: 'text', sys: true, path: 'rec' }, { key: 'size', label: 'Employees', type: 'select', opts: ['1–10', '11–50', '51–200', '201–500', '500+', '—'], sys: true, path: 'rec' },
        { key: 'domain', label: 'Website', type: 'text', sys: true, path: 'rec' }, { key: 'owner', label: 'Owner', type: 'user', sys: true, path: 'rec' },
        { key: 'gstin', label: 'GSTIN', type: 'text' }, { key: 'budget', label: 'Annual fit-out budget', type: 'currency' }, { key: 'terms', label: 'Credit terms', type: 'select', opts: ['Advance', '15 days', '30 days', '45 days'] }
      ],
      deal: [
        { key: 'name', label: 'Deal name', type: 'text', sys: true, path: 'rec' }, { key: 'close', label: 'Expected close', type: 'date', sys: true, path: 'rec' },
        { key: 'owner', label: 'Owner', type: 'user', sys: true, path: 'rec' },
        { key: 'visitOutcome', label: 'Site-visit outcome', type: 'select', opts: OUT, sys: true, path: 'fields' },
        { key: 'advance', label: 'Token advance received', type: 'currency', sys: true, path: 'fields' },
        { key: 'priority', label: 'Priority', type: 'select', opts: ['Normal', 'High', 'Urgent'], sys: true, path: 'fields' },
        { key: 'handover', label: 'Handover status', type: 'select', opts: ['Not started', 'Pending', 'Scheduled', 'Done'], sys: true, path: 'fields' },
        { key: 'pilotReview', label: 'Pilot review notes', type: 'textarea', sys: true, path: 'fields' },
        { key: 'ptype', label: 'Project type', type: 'select', opts: ['Residential', 'Office', 'Hospitality', 'Healthcare', 'Retail and F&B', 'Institutional'] },
        { key: 'possession', label: 'Possession date', type: 'date' },
        { key: 'competitor', label: 'Competing quotes', type: 'number' }
      ]
    };
    P.hours = { on: true, days: [1, 2, 3, 4, 5, 6], start: 570, end: 1170, tz: 'IST (UTC+5:30)' };
    P.sources = Object.keys(C.SOURCES).filter(function (k) { return !C.EXTRA_SOURCES[k]; }).map(function (k) { return { key: k, label: C.SOURCES[k].label, color: C.SOURCES[k].color, on: true }; })
      .concat([{ key: 'referral', label: 'Referral', color: '#B5485D', on: true, custom: true }, { key: 'walkin', label: 'Showroom walk-in', color: '#5B7A3A', on: true, custom: true }]);

    // ---- companies + contacts ------------------------------------------------------------------
    COS.forEach(function (c, i) { P.companies.push({ id: c[0], name: c[1], industry: c[2], city: c[3], size: c[4], domain: c[5], owner: c[6], created: t - (40 + i * 5) * D, cf: { gstin: c[7], budget: c[8], terms: c[9] } }); });
    var pid = 301, coById = function (id) { return P.companies.filter(function (c) { return c.id === id; })[0]; };
    PEOPLE.forEach(function (p, i) {
      var co = coById(p[1]), slug = p[0].toLowerCase().replace(/^(mr|dr)\. /, '').replace(/[^a-z ]/g, '').split(' ')[0];
      P.contacts.push({ id: 'P-' + (pid++), name: p[0], co: p[1], role: p[2], phone: '+91 ' + pick(['98', '99', '97', '88']) + '••• ••' + (210 + i * 7), email: slug + '@' + co.domain, city: co.city, owner: co.owner, leadId: null, created: co.created + (2 + i % 4) * D,
        life: co.industry === 'Architecture studio' || co.industry === 'Interior architects' ? 'Partner' : pick(['Qualified', 'Opportunity', 'Customer']), source: pick(['referral', 'web', 'phone', 'walkin']), tags: /CFO|Founder|Director|Owner|Principal|COO|General manager|Medical/.test(p[2]) ? ['Decision maker'] : i % 3 === 1 ? ['Influencer'] : [], cf: { lang: p[3], bestTime: pick(['Morning', 'Lunch hour', 'After 6 pm']), waOptIn: R() < .8 ? 'Yes' : 'No' } });
    });
    S.leads.filter(function (l) { return ['site', 'quote', 'won', 'contacted'].indexOf(l.status) > -1; }).forEach(function (l, i) {
      if (l.status === 'contacted' && i % 3 === 2) return;
      P.contacts.push({ id: 'P-' + (pid++), name: l.name, co: null, role: 'Homeowner', phone: l.phone, email: l.email, city: l.loc, owner: l.owner, leadId: l.id, created: l.created + 2 * H,
        life: l.status === 'won' ? 'Customer' : l.status === 'contacted' ? 'Qualified' : 'Opportunity', source: l.source, tags: l.budget >= 10 ? ['High value'] : [], cf: { lang: pick(['Hindi', 'English', 'Punjabi']), bestTime: pick(['After 6 pm', 'Weekends only', 'Lunch hour']), waOptIn: 'Yes' } });
    });
    REFERRALS.forEach(function (r, i) {
      P.contacts.push({ id: 'P-' + (pid++), name: r[0], co: null, role: 'Homeowner', phone: '+91 9' + (7 + i % 3) + '••• ••' + (330 + i * 13), email: r[0].toLowerCase().split(' ')[0] + '.' + r[0].toLowerCase().split(' ')[1] + '@example.com', city: r[1], owner: TEAM[1 + i % 3], leadId: null, created: t - (12 + i * 4) * D,
        life: i % 2 ? 'Lead' : 'Qualified', source: 'referral', tags: ['Architect referral'], cf: { lang: r[2], bestTime: 'After 6 pm', waOptIn: 'Yes' } });
    });

    var did = 2041;
    function deal(o) {
      var d = { id: 'D-' + (did++), name: o.name, pipe: o.pipe || 'sales', stage: o.stage, items: o.items || [], amount: o.amount || 0, close: o.close, owner: o.owner, c: o.c || null, co: o.co || null, leadId: o.leadId || null, created: o.created, moved: o.moved || o.created, wonAt: o.wonAt || null, fields: o.fields || {}, prob: null, cf: o.cf || {} };
      P.deals.push(d); return d;
    }
    function act(type, text, at, by, ref) { P.acts.push({ id: uid('A'), t: Math.round(at), type: type, text: text, by: by, c: ref.c || null, co: ref.co || null, d: ref.d || null }); }
    function cOf(name) { return P.contacts.filter(function (c) { return c.name === name; })[0]; }
    function aud(at, who, a, ref, f, from, to) { P.audit.push({ t: Math.round(at), who: who, act: a, ref: ref, field: f || '', from: from || '', to: to || '' }); }

    // company deals (sales): company, contact, project, stage, items, service ₹, close in days, outcome, age days
    var CD = [
      ['Kestrel Fintech', 'Aditi Menon', '3rd-floor office fit-out', 'negotiation', [['HS-CH-001', 24], ['HS-TB-006', 2], ['HS-LT-018', 10], ['HS-LT-013', 12], ['HS-ST-011', 6]], 2200000, 12, OUT[0], 34],
      ['Kestrel Fintech', 'Tanya Arora', '2nd-floor breakout zone', 'won', [['HS-CH-004', 6], ['HS-TB-007', 2], ['HS-RG-019', 2], ['HS-LT-015', 4]], 380000, -26, OUT[0], 70],
      ['Meridian Cowork', 'Sahil Grover', 'Sector 62 members’ lounge', 'proposal', [['HS-SF-009', 3], ['HS-CH-004', 10], ['HS-TB-007', 4], ['HS-LT-014', 16], ['HS-RG-019', 4], ['HS-TX-020', 24]], 650000, 20, OUT[1], 22],
      ['Meridian Cowork', 'Mehul Shah', 'Sector 18 phone booths', 'lost', [['HS-LT-017', 12]], 420000, -18, OUT[1], 55],
      ['Tavira Hotels', 'Varun Khurana', '24-room lighting refresh', 'design', [['HS-LT-017', 48], ['HS-LT-015', 24], ['HS-LT-016', 24], ['HS-ST-012', 24]], 480000, 35, OUT[0], 18],
      ['Terrace Café Co.', 'Jai Oberoi', 'Rooftop seating and lights', 'visit', [['HS-CH-002', 14], ['HS-TB-005', 4], ['HS-LT-013', 8]], 260000, 18, '', 6],
      ['Orchid Clinics', 'Kiran Shetty', 'Reception and waiting area', 'qualified', [['HS-SF-008', 2], ['HS-LT-014', 6]], 320000, 45, '', 4],
      ['Brightpath School', 'Sunita Rawal', 'Library reading corner', 'qualified', [['HS-ST-011', 12], ['HS-RG-019', 3], ['HS-CH-004', 4]], 0, 60, '', 3],
      ['Skyline Habitats', 'Nikhil Arora', 'Show flat, Tower B', 'won', [['HS-SF-008', 1], ['HS-TB-005', 1], ['HS-CH-001', 6], ['HS-ST-012', 2], ['HS-LT-014', 3], ['HS-RG-019', 1], ['HS-ST-010', 1]], 950000, -9, OUT[0], 52],
      ['Greenleaf Residency RWA', 'Ramesh Batra', 'Clubhouse lounge', 'lost', [['HS-SF-009', 2], ['HS-TB-007', 2], ['HS-LT-015', 6]], 180000, -14, OUT[1], 40],
      ['Cedar Lane Developers', 'Ishaan Kapoor', 'Two show flats, Phase 2', 'proposal', [['HS-SF-008', 2], ['HS-TB-006', 2], ['HS-CH-002', 12], ['HS-ST-010', 2], ['HS-LT-013', 8], ['HS-RG-019', 2]], 1650000, 16, OUT[0], 26],
      ['Bluepeak Offices', 'Ankit Bhalla', 'Reception refresh', 'visit', [['HS-SF-009', 1], ['HS-TB-007', 1], ['HS-LT-016', 4]], 210000, 28, OUT[2], 9],
      ['Saffron Table Restaurants', 'Karan Sachdeva', 'Second outlet, Cyber Hub', 'negotiation', [['HS-CH-002', 40], ['HS-CH-003', 12], ['HS-LT-013', 20], ['HS-TB-005', 8]], 1400000, 9, OUT[0], 30],
      ['Willow Dental Studio', 'Dr. Anjali Rao', 'Clinic interiors, Saket', 'design', [['HS-SF-008', 1], ['HS-LT-014', 4], ['HS-LT-017', 6]], 560000, 30, OUT[0], 15],
      ['Kora Co-living', 'Aman Chawla', '40-room furnishing, Sector 49', 'proposal', [['HS-CH-001', 40], ['HS-ST-012', 40], ['HS-LT-016', 40], ['HS-RG-019', 10], ['HS-TX-020', 80]], 1100000, 24, OUT[0], 20]
    ];
    CD.forEach(function (r, ix) {
      var co = P.companies.filter(function (c) { return c.name === r[0]; })[0], ct = cOf(r[1]), it = items(r[4]);
      if (r[5]) it.push({ sku: null, name: 'Design and execution', qty: 1, price: r[5] });
      var created = t - r[8] * D, won = r[3] === 'won', lost = r[3] === 'lost';
      var d = deal({ name: co.name + ' — ' + r[2], stage: r[3], items: it, close: t + r[6] * D, owner: co.owner, c: ct.id, co: co.id, created: created, moved: t - Math.max(1, r[8] / 4) * D, wonAt: won ? t + r[6] * D : null,
        fields: { visitOutcome: r[7], advance: won ? Math.round(skuTot(it) * .1 / 1000) * 1000 + 100000 : 0, priority: r[3] === 'negotiation' ? 'High' : 'Normal', handover: won ? (ix % 2 ? 'Done' : 'Scheduled') : '' },
        cf: { ptype: PTYPE[co.industry] || 'Office', possession: t + (r[6] + 40) * D, competitor: 1 + ix % 3 } });
      var ref = { c: ct.id, co: co.id, d: d.id }, by = co.owner, span = Math.max(2, r[8]);
      aud(created, by, 'create', { t: 'deal', id: d.id, name: d.name });
      act('system', 'Deal created in Sales · Qualified', created, by, ref);
      act('call', 'Discovery call with ' + ct.name.replace(/^(Mr|Dr)\. /, '').split(' ')[0] + ' — 14:20 · scope, budget band and timeline confirmed', created + .1 * span * D, by, ref);
      act('wa', 'WhatsApp: shared three reference projects and a site-visit slot', created + .2 * span * D, by, ref);
      var order = P.pipes.sales.stages.map(function (s) { return s.id; }), k = order.indexOf(r[3]), steps = [['qualified', 'visit', .34], ['visit', 'design', .5], ['design', 'proposal', .64], ['proposal', 'negotiation', .78], ['negotiation', 'won', .95]];
      steps.forEach(function (st, si) {
        if ((k >= si + 1 && !lost) || (lost && si < 3)) {
          var lab = function (id) { return C.pstage('sales', id).label; };
          act('stage', 'Stage: ' + lab(st[0]) + ' → ' + lab(st[1]), created + st[2] * span * D, by, ref); aud(created + st[2] * span * D, by, 'stage', { t: 'deal', id: d.id, name: d.name }, 'Stage', lab(st[0]), lab(st[1]));
        }
      });
      if (k >= 1 || lost) act('visit', 'Site visit: ' + (r[7] || 'scheduled') + (r[7] ? ' · measurements uploaded' : ''), created + .35 * span * D, by, ref);
      if ((k >= 3 && !lost) || lost) act('email', 'Email: proposal v' + (k >= 4 ? 2 : 1) + ' with Halden Supply line items and GST', created + .66 * span * D, by, ref);
      if (k >= 4 && !lost) act('note', pick(['Asked for 5% off on furniture; holding firm on execution. Offered a free cove lighting upgrade instead.', 'Finance wants milestone billing: 40/40/20. Fine if the advance clears before material orders.', 'Competing quote from a Gurugram studio is 8% lower but excludes loose furniture.']), created + .8 * span * D, by, ref);
      if (won) { act('stage', 'Token advance received · ' + C.inr(d.fields.advance), created + .96 * span * D, by, ref); aud(created + .96 * span * D, by, 'update', { t: 'deal', id: d.id, name: d.name }, 'Token advance received', '', C.inr(d.fields.advance)); }
      if (lost) { act('stage', 'Stage: Proposal → Lost · ' + pick(['budget moved to next financial year', 'went with the building’s empanelled vendor']), created + .9 * span * D, by, ref); }
      if (ix % 4 === 1) aud(created + .3 * span * D, 'Aarav Khanna', 'assign', { t: 'deal', id: d.id, name: d.name }, 'Owner', 'Meera Joshi', by);
    });

    // homeowner deals from leads
    P.contacts.filter(function (c) { return c.leadId; }).forEach(function (c, i) {
      var l = S.leads.filter(function (x) { return x.id === c.leadId; })[0];
      if (l.status === 'contacted') return;
      var it = items(KIT[l.service]), budget = l.budget * 1e5, rest = Math.max(budget - skuTot(it), budget * .25);
      it.push({ sku: null, name: SVC[l.service], qty: 1, price: Math.round(rest / 1000) * 1000 });
      var stage = l.status === 'site' ? (i % 3 === 0 ? 'design' : 'visit') : l.status === 'quote' ? (i % 2 ? 'negotiation' : 'proposal') : 'won';
      var wonEv = l.tl.filter(function (e) { return e.type === 'status'; }).pop();
      var d = deal({ name: l.name.split(' ').slice(-1)[0] + ' residence — ' + l.service, stage: stage, items: it, close: stage === 'won' ? wonEv.t : t + (6 + (i * 7) % 34) * D, owner: l.owner, c: c.id, leadId: l.id, created: l.created + 3 * H,
        moved: t - (1 + i % 9) * D, wonAt: stage === 'won' ? wonEv.t : null,
        fields: { visitOutcome: stage === 'visit' ? (i % 2 ? '' : OUT[2]) : OUT[i % 2], advance: stage === 'won' ? Math.round(budget * .1 / 1000) * 1000 : 0, priority: l.budget >= 15 ? 'High' : 'Normal', handover: stage === 'won' ? pick(['Pending', 'Scheduled', 'Done']) : '' },
        cf: { ptype: 'Residential', possession: t + (20 + i * 9) * D, competitor: i % 3 } });
      act('system', 'Deal created from lead ' + l.id, d.created, l.owner, { c: c.id, d: d.id });
      aud(d.created, l.owner, 'create', { t: 'deal', id: d.id, name: d.name }, 'from lead', '', l.id);
      if (stage !== 'visit') act('meeting', 'Design presentation at the Lumen studio, Sector 44 (1 h)', d.created + 6 * D, l.owner, { c: c.id, d: d.id });
    });
    // referral homeowners: early deals
    P.contacts.filter(function (c) { return c.source === 'referral' && !c.co && !c.leadId; }).forEach(function (c, i) {
      var svc = ['Full-home interiors', 'Modular kitchen', 'Wardrobes & storage', 'Full-home interiors', 'Smart lighting', 'Modular kitchen'][i], it = items(KIT[svc]), budget = [22, 7, 3.5, 18, 2.4, 6][i] * 1e5;
      it.push({ sku: null, name: SVC[svc], qty: 1, price: Math.round(Math.max(budget - skuTot(it), budget * .3) / 1000) * 1000 });
      var d = deal({ name: c.name.split(' ').slice(-1)[0] + ' residence — ' + svc, stage: ['qualified', 'visit', 'qualified', 'design', 'visit', 'qualified'][i], items: it, close: t + (25 + i * 6) * D, owner: c.owner, c: c.id, co: null, created: c.created + D, fields: { priority: 'Normal', visitOutcome: i === 3 ? OUT[0] : '' }, cf: { ptype: 'Residential', competitor: 1 } });
      act('system', 'Deal created · referred by Arcform Architects', d.created, c.owner, { c: c.id, d: d.id });
    });

    // partnerships
    [['Arcform Architects', 'Ritika Malhotra', 'Referral partnership', 'agreement', 1800000, 25, 30],
     ['Studio Mahal', 'Farah Siddiqui', 'White-label execution', 'pilot', 1200000, 40, 20],
     ['Skyline Habitats', 'Payal Sood', 'Buyer handover packages', 'active', 4000000, -30, 80],
     ['Meridian Cowork', 'Ankita Das', 'Preferred vendor, three centres', 'intro', 2500000, 55, 7],
     ['Greenleaf Residency RWA', 'Ramesh Batra', 'Resident offers', 'paused', 400000, 90, 60],
     ['Tavira Hotels', 'Elena D’Souza', 'Annual refresh contract', 'intro', 1500000, 70, 3],
     ['Cedar Lane Developers', 'Rakesh Gupta', 'Furnished-flat programme', 'pilot', 6000000, 45, 18]].forEach(function (r) {
      var co = P.companies.filter(function (c) { return c.name === r[0]; })[0], ct = cOf(r[1]);
      var d = deal({ name: co.name + ' — ' + r[2], pipe: 'partner', stage: r[3], amount: r[4], close: t + r[5] * D, owner: co.owner, c: ct.id, co: co.id, created: t - r[6] * D, moved: t - r[6] / 3 * D, wonAt: r[3] === 'active' ? t - 20 * D : null, fields: { pilotReview: r[3] === 'agreement' || r[3] === 'active' ? 'Pilot delivered on time; two referrals converted.' : '', priority: 'Normal' }, cf: { ptype: PTYPE[co.industry] || 'Residential' } });
      var ref = { c: ct.id, co: co.id, d: d.id };
      act('system', 'Deal created in Partnerships', d.created, co.owner, ref); aud(d.created, co.owner, 'create', { t: 'deal', id: d.id, name: d.name });
      act('email', 'Email: partner deck and referral terms shared', d.created + 2 * D, co.owner, ref);
      if (r[3] !== 'intro') act('meeting', 'Partner review at their office (45 min)', d.created + 6 * D, co.owner, ref);
    });

    // extra associations (many-to-many)
    var L = function (t1, i1, t2, i2, lab) { P.links.push({ a: t1 + ':' + i1, b: t2 + ':' + i2, label: lab }); };
    var dk = function (nm) { return P.deals.filter(function (d) { return d.name.indexOf(nm) > -1; })[0]; };
    L('deal', dk('3rd-floor').id, 'contact', cOf('Rahul Khosla').id, 'Approver');
    L('deal', dk('3rd-floor').id, 'contact', cOf('Tanya Arora').id, 'Day-to-day contact');
    L('deal', dk('members’ lounge').id, 'contact', cOf('Ankita Das').id, 'Finance');
    L('deal', dk('Show flat, Tower B').id, 'contact', cOf('Payal Sood').id, 'Procurement');
    L('deal', dk('24-room').id, 'company', 'CO-106', 'Design partner');
    L('deal', dk('24-room').id, 'contact', cOf('Prerna Singh').id, 'Purchase');
    L('deal', dk('Two show flats').id, 'contact', cOf('Maya Fernandes').id, 'Design sign-off');
    L('deal', dk('Two show flats').id, 'contact', cOf('Rakesh Gupta').id, 'Approver');
    L('deal', dk('Second outlet').id, 'contact', cOf('Leena Dutta').id, 'Brand sign-off');
    L('deal', dk('40-room').id, 'contact', cOf('Nisha Pillai').id, 'Property lead');
    L('contact', cOf('Ritika Malhotra').id, 'company', 'CO-106', 'Former colleague');
    P.deals.filter(function (d) { return d.c && C.contact ? true : true; }).forEach(function (d) { var c = P.contacts.filter(function (x) { return x.id === d.c; })[0]; if (c && c.source === 'referral' && !c.co) { L('deal', d.id, 'company', 'CO-102', 'Referred by'); L('deal', d.id, 'contact', cOf('Ritika Malhotra').id, 'Referring architect'); } });
    P.deals.filter(function (d) { return d.leadId && d.cf.ptype === 'Residential'; }).slice(0, 4).forEach(function (d) { L('deal', d.id, 'company', 'CO-102', 'Architect on record'); });

    // extra contact-level activity so timelines feel lived in
    P.contacts.forEach(function (c, i) {
      var by = c.owner, at = t - ((i * 37) % 26 + 1) * D - (i % 9) * H;
      if (i % 2 === 0) act(pick(['call', 'call', 'wa']), pick(['Check-in call — no change in timeline', 'Called back: confirmed Saturday visit slot', 'WhatsApp: sent catalogue of Halden Supply lighting', 'Missed call returned within 10 min', 'WhatsApp: shared progress photos from site']), at, by, { c: c.id, co: c.co });
      if (i % 5 === 0) act('note', pick(['Prefers WhatsApp voice notes over long messages.', 'Decision needs sign-off from the spouse; schedule calls after 7 pm.', 'Very price-aware; anchor on lifetime value, not discount.', 'Wants everything before the Diwali family visit.']), at - 2 * D, by, { c: c.id, co: c.co });
    });
    P.companies.forEach(function (co, i) { act('note', ['Prefers WhatsApp over email for approvals.', 'Accounts team pays within 30 days of invoice.', 'Ask for the building’s fit-out rules before any site work.', 'Two more floors planned next year.', 'Security needs a vendor gate pass 24 h before any visit.'][i % 5], co.created + 5 * D, co.owner, { co: co.id }); });
    P.acts.sort(function (a, b) { return b.t - a.t; });

    // files (demo only: names and sizes, nothing stored)
    P.deals.filter(function (d) { return d.co && d.pipe === 'sales'; }).slice(0, 9).forEach(function (d, i) {
      var tag = d.name.split(' — ')[0].split(' ')[0].toLowerCase();
      P.files.push({ id: uid('F'), d: d.id, c: d.c, co: d.co, name: 'site-photos-' + tag + '.zip', size: 18e6 + i * 7e6, kind: 'zip', t: d.created + 3 * D, by: d.owner });
      P.files.push({ id: uid('F'), d: d.id, c: d.c, co: d.co, name: 'floor-plan-' + tag + '.pdf', size: 2.4e6 + i * 4e5, kind: 'pdf', t: d.created + 4 * D, by: d.owner });
      if (i < 5) P.files.push({ id: uid('F'), d: d.id, c: d.c, co: d.co, name: 'moodboard-v' + (1 + i % 2) + '-' + tag + '.pdf', size: 6.1e6, kind: 'pdf', t: d.created + 7 * D, by: d.owner });
    });

    // tasks linked to records
    var td = new Date(); td.setHours(0, 0, 0, 0); var at = function (dd, h, m) { var x = new Date(td); x.setDate(x.getDate() + dd); x.setHours(h, m || 0, 0, 0); return x.getTime(); };
    [[dk('3rd-floor'), 'Send revised furniture schedule to Aditi', at(0, 17, 30), 30],
     [dk('Rooftop'), 'Log the site-visit outcome for the rooftop', at(-1, 16), 0],
     [dk('members’ lounge'), 'Walk Sahil through proposal v2 on a call', at(1, 11), 60],
     [dk('24-room'), 'Share sconce samples with Varun', at(2, 12), 0],
     [dk('Reception and waiting'), 'Book a site visit with Dr Shetty', at(0, 19), 15],
     [dk('Show flat, Tower B'), 'Kick-off meeting with the site supervisor', at(3, 10), 0],
     [dk('Two show flats'), 'Chase design sign-off from Maya', at(1, 15), 30],
     [dk('Second outlet'), 'Confirm 8% discount approval with Aarav', at(0, 13), 15],
     [dk('Clinic interiors'), 'Send dental-chair clearance drawing', at(-2, 12), 0],
     [dk('40-room'), 'Get Kora’s room-mix sheet', at(4, 11), 0],
     [dk('Reception refresh'), 'Re-visit Bluepeak with the admin lead present', at(2, 16), 60]].forEach(function (r, i) {
      if (!r[0]) return;
      S.tasks.push({ id: 'T-P' + (500 + i), leadId: null, ref: { t: 'deal', id: r[0].id }, text: r[1], due: r[2], done: i === 5, doneAt: i === 5 ? t - 3 * H : null, owner: r[0].owner, remind: r[3] || null, reminded: false });
    });
    var ct0 = cOf('Jai Oberoi');
    S.tasks.push({ id: 'T-P520', leadId: null, ref: { t: 'contact', id: ct0.id }, text: 'Call Jai about the rooftop visit slot', due: t + 9 * 6e4, done: false, owner: 'Kabir Anand', remind: 10, reminded: false });
    S.tasks.push({ id: 'T-P521', leadId: null, ref: { t: 'company', id: 'CO-115' }, text: 'Send Kora our vendor registration form', due: at(1, 10), done: false, owner: 'Kabir Anand', remind: null, reminded: false });

    // ---- tickets (after-sales service) ---------------------------------------------------------------
    var TK = [['Drawer channel loose in kitchen island', 'High', 'open', 'whatsapp'], ['Pendant lamp flickering in dining', 'Normal', 'pending', 'phone'], ['Dent on sofa armrest at delivery', 'High', 'open', 'whatsapp'],
      ['Wardrobe shutter misaligned', 'Normal', 'closed', 'whatsapp'], ['GSTIN correction on invoice', 'Low', 'closed', 'email'], ['Wall sconce wiring check', 'Normal', 'pending', 'phone'], ['Bookshelf wall-anchor request', 'Low', 'open', 'email'],
      ['Grout discolouration in shower', 'Normal', 'closed', 'whatsapp'], ['Rug colour different from the swatch', 'High', 'pending', 'email'], ['Extra cushion covers to order', 'Low', 'closed', 'whatsapp'], ['Touch-up paint after AC install', 'Normal', 'open', 'phone'], ['Track spot not dimming', 'Urgent', 'open', 'whatsapp']];
    var wonD = P.deals.filter(function (d) { return d.pipe === 'sales' && d.stage === 'won'; });
    TK.forEach(function (k, i) {
      var d = wonD[i % wonD.length], cr = t - (1 + (i * 3) % 18) * D - i * H;
      P.tickets.push({ id: 'TK-' + (301 + i), subj: k[0], prio: k[1], status: k[2], ch: k[3], d: d.id, c: d.c, co: d.co, owner: d.owner, created: cr, updated: cr + (k[2] === 'open' ? 2 * H : D) });
      act('ticket', 'Ticket TK-' + (301 + i) + ' opened via ' + { whatsapp: 'WhatsApp', phone: 'phone', email: 'email' }[k[3]] + ': ' + k[0], cr, d.owner, { c: d.c, co: d.co, d: d.id });
      if (k[2] === 'closed') act('ticket', 'Ticket TK-' + (301 + i) + ' closed · fixed on site', cr + D, d.owner, { c: d.c, co: d.co, d: d.id });
    });

    // ---- quotes ------------------------------------------------------------------------------------
    var qn = 31;
    P.deals.filter(function (d) { return d.pipe === 'sales' && ['proposal', 'negotiation', 'won', 'lost'].indexOf(d.stage) > -1; }).forEach(function (d, i) {
      var st = d.stage === 'won' ? 'accepted' : d.stage === 'lost' ? 'declined' : d.stage === 'negotiation' ? 'sent' : (i % 3 ? 'sent' : 'draft');
      var ver = d.stage === 'negotiation' || d.stage === 'won' ? 2 : 1, made = d.created + (d.stage === 'won' ? .7 : .6) * (Date.now() - d.created);
      if (ver === 2) P.quotes.push({ id: 'Q-2026-0' + (qn++), d: d.id, ver: 1, status: 'superseded', items: JSON.parse(JSON.stringify(d.items)), disc: 0, gst: 18, valid: made - 5 * D + 15 * D, created: made - 5 * D, sentAt: made - 5 * D, by: d.owner, note: '' });
      P.quotes.push({ id: 'Q-2026-0' + (qn++), d: d.id, ver: ver, status: i === 3 && st === 'sent' ? 'expired' : st, items: JSON.parse(JSON.stringify(d.items)), disc: ver === 2 ? [3, 5, 4][i % 3] : 0, gst: 18, valid: made + 15 * D, created: made, sentAt: st === 'draft' ? null : made + H, by: d.owner, note: 'Prices include delivery within Delhi NCR. Installation by Lumen Homes. 40% advance, 40% on material delivery, 20% on handover.' });
      act('quote', 'Quote ' + P.quotes[P.quotes.length - 1].id + ' v' + ver + ' ' + (st === 'draft' ? 'drafted' : 'sent on WhatsApp and email'), made, d.owner, { c: d.c, co: d.co, d: d.id });
    });

    // audit for contacts and settings history
    P.contacts.slice(0, 40).forEach(function (c, i) { aud(c.created, c.owner, i % 6 === 5 ? 'import' : 'create', { t: 'contact', id: c.id, name: c.name }, i % 6 === 5 ? 'CSV import' : ''); if (i % 7 === 2) aud(c.created + 3 * D, c.owner, 'update', { t: 'contact', id: c.id, name: c.name }, 'Lifecycle stage', 'Lead', c.life); });
    aud(t - 20 * D, 'Aarav Khanna', 'settings', null, 'Business hours', 'Mon–Fri 10 am–7 pm', 'Mon–Sat 9:30 am–7:30 pm');
    aud(t - 16 * D, 'Aarav Khanna', 'settings', null, 'Custom field added (deals)', '', 'Possession date');
    aud(t - 11 * D, 'Aarav Khanna', 'settings', null, 'Role permissions · Agent', 'Export CSV: on', 'Export CSV: off');
    aud(t - 4 * D, 'Meera Joshi', 'settings', null, 'Workflow', 'Big WhatsApp enquiries go to a senior', 'turned on');
    P.audit.sort(function (a, b) { return b.t - a.t; });
    P.notifs = [
      { t: t - 40 * 6e4, text: 'SLA breach: Neha Gupta has waited over 15 business minutes', href: '#/routing', icon: 'clock', seen: false, kind: 'sla' },
      { t: t - 3 * H, text: 'Deal won: Kestrel Fintech — 2nd-floor breakout zone', href: '#/deals/' + dk('2nd-floor').id, icon: 'check', seen: false, kind: 'won' },
      { t: t - 26 * H, text: 'Aarav assigned you Saffron Table — Second outlet, Cyber Hub', href: '#/deals/' + dk('Second outlet').id, icon: 'user', seen: true, kind: 'assign' }
    ];
    P.views = {
      contacts: [{ id: 'cv1', name: 'Decision makers', f: { tag: 'Decision maker' } }, { id: 'cv2', name: 'Homeowners', f: { kind: 'home' } }, { id: 'cv3', name: 'Gurugram', f: { q: 'Gurugram' } }],
      deals: [{ id: 'dv1', name: 'Closing this month', f: { closeIn: 30 } }, { id: 'dv2', name: 'High priority', f: { priority: 'High' } }, { id: 'dv3', name: 'Over ₹10 L', f: { minValue: 1000000 } }]
    };

    // ---- automation -------------------------------------------------------
    P.wf = [
      { id: 'WF-1', name: 'First reply for every new lead', on: true, when: { ev: 'lead.created' }, conds: [], acts: [{ type: 'assign', v: 'round-robin' }, { type: 'template', v: 'intro' }, { type: 'task', v: 'Call back and qualify the requirement', due: 15 }], runs: 0 },
      { id: 'WF-2', name: 'Big WhatsApp enquiries go to a senior', on: true, when: { ev: 'lead.created' }, conds: [{ f: 'source', op: 'is', v: 'whatsapp' }, { f: 'budget', op: 'gte', v: '8' }], acts: [{ type: 'assign', v: 'Meera Joshi' }, { type: 'field', f: 'priority', v: 'Urgent' }, { type: 'notify', v: 'Aarav Khanna' }], runs: 0 },
      { id: 'WF-3', name: 'Nurture leads we could not reach', on: true, when: { ev: 'lead.created' }, conds: [{ f: 'source', op: 'not', v: 'phone' }], acts: [{ type: 'sequence', v: 'SQ-1' }], runs: 0 },
      { id: 'WF-4', name: 'Moodboard after the site visit', on: true, when: { ev: 'deal.stage', stage: 'design' }, conds: [], acts: [{ type: 'task', v: 'Share the first moodboard', due: 2880 }, { type: 'template', v: 'moodboard' }, { type: 'sequence', v: 'SQ-2' }], runs: 0 },
      { id: 'WF-5', name: 'Won deal: hand over and reserve stock', on: true, when: { ev: 'deal.won' }, conds: [], acts: [{ type: 'field', f: 'handover', v: 'Pending' }, { type: 'task', v: 'Schedule the project kick-off', due: 1440 }, { type: 'reserve', v: 'stockroom' }, { type: 'notify', v: 'Operations' }], runs: 0 },
      { id: 'WF-6', name: 'Big proposals need a manager', on: false, when: { ev: 'deal.stage', stage: 'proposal' }, conds: [{ f: 'value', op: 'gte', v: '2000000' }], acts: [{ type: 'notify', v: 'Aarav Khanna' }, { type: 'task', v: 'Manager review of the proposal', due: 240 }], runs: 0 }
    ];
    P.gates = [
      { id: 'G-1', pipe: 'sales', stage: 'proposal', field: 'visitOutcome', on: true, why: 'A proposal is only as good as its measurements. Log what the site visit found before quoting.' },
      { id: 'G-2', pipe: 'sales', stage: 'won', field: 'advance', on: true, why: 'Work is scheduled only after the token advance, so record it before closing.' },
      { id: 'G-3', pipe: 'partner', stage: 'agreement', field: 'pilotReview', on: false, why: 'Agree terms only after the pilot project has been reviewed.' }
    ];
    // run history
    var runNames = ['Neha Gupta', 'Arjun Malhotra', 'Pooja Verma', 'Harsh Vardhan', 'Lavanya Pillai', 'Mohit Rawat', 'Zoya Hussain', 'Aisha Khan'];
    runNames.forEach(function (nm, i) {
      var l = S.leads.filter(function (x) { return x.name === nm; })[0]; if (!l) return;
      P.runs.push({ id: uid('R'), t: l.created + 2e3, wf: 'WF-1', rec: { t: 'lead', id: l.id, name: l.name }, ok: true, steps: ['Assigned to ' + l.owner + ' (round-robin)', 'Sent WhatsApp template “First reply”', 'Created task “Call back and qualify the requirement”, due in 15 min'] });
      if (l.source !== 'phone') P.runs.push({ id: uid('R'), t: l.created + 4e3, wf: 'WF-3', rec: { t: 'lead', id: l.id, name: l.name }, ok: true, steps: ['Enrolled in sequence “New enquiry nurture”'] });
      P.runs.push({ id: uid('R'), t: l.created + 3e3, wf: 'WF-2', rec: { t: 'lead', id: l.id, name: l.name }, ok: false, skip: true, steps: [l.source === 'whatsapp' ? 'Budget ₹' + l.budget + ' L is under ₹8 L — skipped' : 'Source is ' + C.SOURCES[l.source].label + ', not WhatsApp — skipped'] });
    });
    P.deals.filter(function (d) { return d.stage === 'won' && d.pipe === 'sales'; }).slice(0, 3).forEach(function (d) {
      P.runs.push({ id: uid('R'), t: d.wonAt || t - 5 * D, wf: 'WF-5', rec: { t: 'deal', id: d.id, name: d.name }, ok: true, steps: ['Handover status set to Pending', 'Created task “Schedule the project kick-off”', 'Reserved ' + d.items.filter(function (x) { return x.sku; }).length + ' SKUs in Stockroom', 'Notified Operations'] });
    });
    P.runs.sort(function (a, b) { return b.t - a.t; });
    P.wf.forEach(function (w) { w.runs = P.runs.filter(function (r) { return r.wf === w.id && !r.skip; }).length + (w.id === 'WF-4' ? 6 : 0); });
    P.gateLog = [{ t: t - 3 * D, d: 'Terrace Café Co. — Rooftop seating and lights', gate: 'G-1', by: 'Kabir Anand', res: 'blocked' }, { t: t - 6 * D, d: 'Meridian Cowork — Sector 62 members’ lounge', gate: 'G-1', by: 'Kabir Anand', res: 'passed' }, { t: t - 9 * D, d: 'Skyline Habitats — Show flat, Tower B', gate: 'G-2', by: 'Aarav Khanna', res: 'passed' }];

    // ---- templates and sequences -------------------------------------------
    P.tpls = [
      { id: 'intro', ch: 'wa', name: 'First reply', body: 'Hi {{first_name}}, this is {{owner}} from Lumen Homes. Thanks for your enquiry about {{service}}. Is now a good time for a 5-minute call?' },
      { id: 'process', ch: 'email', name: 'How we work', subject: 'How a Lumen project runs, step by step', body: 'Hi {{first_name}},\n\nHere is how a project with us runs: a free site visit, a moodboard in 48 hours, a fixed quote with line items, and weekly photo updates on WhatsApp.\n\n{{owner}}, Lumen Homes' },
      { id: 'slots', ch: 'wa', name: 'Site-visit slots', body: 'Hi {{first_name}}, we have free site-visit slots on Saturday at 11 am and 4 pm. Reply 1 or 2 and we will confirm. — {{owner}}' },
      { id: 'lookbook', ch: 'email', name: 'Lookbook', subject: '12 kitchens we finished this year', body: 'Hi {{first_name}},\n\nA short lookbook of recent projects in {{city}} and nearby. Reply with the ones you like and we will price a similar layout.\n\n{{owner}}' },
      { id: 'moodboard', ch: 'wa', name: 'Moodboard ready', body: 'Hi {{first_name}}, thanks for having us over. Your first moodboard will be with you within 48 hours. — {{owner}}' },
      { id: 'quotewalk', ch: 'wa', name: 'Quote walk-through', body: 'Hi {{first_name}}, would a 15-minute call help to go through the quote line by line? — {{owner}}' },
      { id: 'partner', ch: 'email', name: 'Partner intro', subject: 'Execution partner for your projects', body: 'Hi {{first_name}},\n\nWe execute interiors for architects across NCR with fixed timelines and weekly site reports. Could we do one pilot project together?\n\n{{owner}}' }
    ];
    var hc = P.contacts.filter(function (c) { return c.leadId; }), cc = P.contacts.filter(function (c) { return c.co; });
    function enrol(list, steps, seed) {
      var ER = C.rng(seed);
      return list.map(function (c, i) {
        var done = Math.min(steps, 1 + Math.floor(ER() * steps)), log = [], st = 'active', base = t - (done + 1) * D;
        for (var k = 0; k < done; k++) { var op = ER() < .68, rp = op && ER() < .22; log.push({ step: k, t: base + k * D + 4 * H, opened: op, clicked: op && ER() < .3, replied: rp }); if (rp) { st = 'replied'; break; } }
        if (st === 'active' && log.length >= steps) st = 'finished';
        if (st === 'active' && i % 7 === 3) st = 'paused';
        return { c: c.id, step: log.length, status: st, at: base, next: st === 'active' ? t + (1 + i % 3) * H * 7 : null, log: log };
      });
    }
    P.seqs = [
      { id: 'SQ-1', name: 'New enquiry nurture', on: true, exitOnReply: true, steps: [{ ch: 'wa', wait: 0, tpl: 'intro' }, { ch: 'email', wait: 1, tpl: 'process' }, { ch: 'wa', wait: 2, tpl: 'slots' }, { ch: 'email', wait: 4, tpl: 'lookbook' }], enr: enrol(hc.slice(0, 11), 4, 3) },
      { id: 'SQ-2', name: 'After the site visit', on: true, exitOnReply: true, steps: [{ ch: 'wa', wait: 0, tpl: 'moodboard' }, { ch: 'email', wait: 2, tpl: 'process' }, { ch: 'wa', wait: 3, tpl: 'quotewalk' }], enr: enrol(hc.slice(4, 10), 3, 8) },
      { id: 'SQ-3', name: 'Architect partner intro', on: false, exitOnReply: true, steps: [{ ch: 'email', wait: 0, tpl: 'partner' }, { ch: 'email', wait: 3, tpl: 'lookbook' }], enr: enrol(cc.filter(function (c) { return /Architect|Founder|Principal/.test(c.role); }), 2, 2) }
    ];

    // ---- scoring and routing ---------------------------------------------
    P.score = [
      { id: 'S1', label: 'Budget is ₹10 L or more', f: 'budget', op: 'gte', v: '10', pts: 25, on: true },
      { id: 'S2', label: 'Budget is ₹5 L or more', f: 'budget', op: 'gte', v: '5', pts: 10, on: true },
      { id: 'S3', label: 'Came on WhatsApp or by phone', f: 'source', op: 'in', v: 'whatsapp,phone', pts: 15, on: true },
      { id: 'S4', label: 'Full-home project', f: 'service', op: 'is', v: 'Full-home interiors', pts: 15, on: true },
      { id: 'S5', label: 'Area we serve fastest', f: 'loc', op: 'in', v: 'Gurugram,Noida,Saket', pts: 5, on: true },
      { id: 'S6', label: 'First reply within 15 minutes', f: 'resp', op: 'lte', v: '15', pts: 10, on: true },
      { id: 'S7', label: 'Site visit booked or done', f: 'reached', op: 'gte', v: '2', pts: 20, on: true },
      { id: 'S8', label: 'Still unanswered after 24 hours', f: 'stale', op: 'is', v: 'yes', pts: -15, on: true }
    ];
    P.route = { mode: 'rr', sla: 15, ptr: 1, pool: [{ name: 'Aarav Khanna', on: false, cap: 6 }, { name: 'Meera Joshi', on: true, cap: 10 }, { name: 'Kabir Anand', on: true, cap: 10 }, { name: 'Isha Bedi', on: true, cap: 8 }] };
    P.spend = { web: 30000, google: 120000, meta: 180000, whatsapp: 15000, chatbot: 5000, phone: 0 };
    P.dash = [{ id: 'forecast', w: 2 }, { id: 'funnel', w: 1 }, { id: 'roi', w: 1 }, { id: 'board', w: 1 }, { id: 'stages', w: 1 }, { id: 'activity', w: 2 }];
    return P;
  };

  // add the extra lead sources and any renamed labels to the shared source table
  function applySources(P) {
    Object.keys(C.EXTRA_SOURCES).forEach(function (k) { if (!C.SOURCES[k]) C.SOURCES[k] = C.EXTRA_SOURCES[k]; });
    (P.sources || []).forEach(function (s) { if (!C.SOURCES[s.key]) C.SOURCES[s.key] = { label: s.label, color: s.color || '#667085', icon: 'flag' }; else { C.SOURCES[s.key].label = s.label; C.SOURCES[s.key].color = s.color || C.SOURCES[s.key].color; } });
  }
  C.applySources = applySources;
  C.proEnsure = function (S) {
    if (!S.pro || S.pro.v !== 2) S.pro = C.proSeed(S);
    C.PIPES = S.pro.pipes; applySources(S.pro);
    (C.seeders || []).forEach(function (fn) { try { fn(S.pro, S); } catch (e) { if (window.console) console.error(e); } });
  };
})();
