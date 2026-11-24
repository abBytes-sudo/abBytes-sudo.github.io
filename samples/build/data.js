/* Sthira Design-Build (fictional) · seeded demo data shared by every page. Nothing here is real. */
window.STHIRA = (function () {
  'use strict';
  // the build timeline shown on the home page; p = position on the 0..1 scroll timeline, day = calendar day on site
  var STAGES = [
    { key: 'drawing', n: '00', name: 'The drawing', p: [0, 0.06], day: [0, 0], trade: 'Architects, structural engineer, quantity surveyor', dur: '10 weeks before day 1', qc: 'Plan sanction, soil report and a priced BOQ signed off before a single trench is dug', lead: 'Every line here is already priced. The site plan, the column grid and all 1,412 elements of this building exist before we break ground.' },
    { key: 'foundation', n: '01', name: 'Foundation', p: [0.06, 0.2], day: [1, 42], trade: 'Excavation crew · bar benders · RCC gang', dur: '42 days', qc: 'Plate-load test 220 kN/m² · footing cubes M25, 31.4 N/mm² at 28 days', lead: 'Twelve isolated footings on PCC, tied by plinth beams. We dig to the soil report, not to a habit.' },
    { key: 'columns', n: '02', name: 'Columns', p: [0.2, 0.34], day: [43, 63], trade: 'Shuttering carpenters · bar benders', dur: '21 days, ground floor', qc: 'Plumb within 5 mm per storey · 40 mm cover blocks checked before every pour', lead: 'Rebar cages first, inspected and photographed, then steel shutters and the pour. The lift and stair core rises with them.' },
    { key: 'slabs', n: '03', name: 'Slabs', p: [0.34, 0.52], day: [64, 147], trade: 'RCC gang · concrete pump crew', dur: '4 slabs on a 21-day cycle', qc: 'Slump 100 ± 25 mm at the pump · props stay 14 days · 6 cubes per pour', lead: 'Props, beams, then the slab is poured in one go. On site the columns and slabs climb together, one floor every three weeks.' },
    { key: 'walls', n: '04', name: 'Walls', p: [0.52, 0.68], day: [148, 196], trade: 'Masons · AAC blockwork', dur: '49 days', qc: 'Line and level on every course · 3 mm thin-bed joints · lintels over every opening', lead: 'Lightweight AAC blocks, course by course, floor by floor. Openings are checked against the window schedule before the lintel goes in.' },
    { key: 'glazing', n: '05', name: 'Glazing & facade', p: [0.68, 0.84], day: [197, 262], trade: 'Facade and aluminium glazing · carpenters · painters', dur: '66 days (MEP and finishes run inside)', qc: '15-minute hose test on every opening, zero leaks · DGU 6-12-6 · paint DFT checked', lead: 'Frames, then double-glazed units, then the timber fins and the paint. Inside, the plumbers, electricians and tilers are already at work.' },
    { key: 'landscape', n: '06', name: 'Landscape & handover', p: [0.84, 1], day: [263, 320], trade: 'Landscape team · snagging crew', dur: '58 days to the keys', qc: '112-point snag walk with the client · drip lines pressure-tested · as-built drawings issued', lead: 'The crane leaves, the garden goes in, and the lights come on. Keys on day 320, with a ten-year structural warranty.' },
  ];
  function dayAt(p) {
    for (var i = 0; i < STAGES.length; i++) { var s = STAGES[i]; if (p <= s.p[1] || i === STAGES.length - 1) { var t = Math.max(0, Math.min(1, (p - s.p[0]) / (s.p[1] - s.p[0]))); return Math.round(s.day[0] + (s.day[1] - s.day[0]) * t); } }
    return 320;
  }
  function pAt(day) {
    for (var i = 1; i < STAGES.length; i++) { var s = STAGES[i]; if (day <= s.day[1]) { var t = (day - s.day[0]) / Math.max(1, s.day[1] - s.day[0]); return s.p[0] + (s.p[1] - s.p[0]) * Math.max(0, t); } }
    return 1;
  }

  // the live project used for the "today" marker, the client portal and the back office
  var LIVE = {
    id: 'STH-2611', name: 'Rao Residence', plot: 'Plot 14, 27th Main, HSR Layout, Bengaluru', client: 'Ananya and Vikram Rao',
    type: 'G+3 home with two rental floors', area: 8370, value: 23300000, start: '2026-06-07', day: 171, total: 320,
    stage: 'walls', stagePct: 47, handover: '2027-04-23', pm: 'Farah Siddiqui', se: 'Karthik Gowda', architect: 'Meera Pillai',
  };

  var SERVICES = [
    { id: 'residential', n: '01', name: 'Residential', short: 'Homes, villas and owner-plus-rental buildings, G to G+4.', from: '₹2,150 / sq ft', time: '9 to 14 months',
      body: 'Most of our work is a family building the house they will live in for thirty years. We design it with you, get the plan sanctioned, and build it on a fixed price with payments tied to stages, not dates.',
      items: ['Independent homes and villas', 'Owner floors with rental units', 'Duplexes and row houses', 'Rebuilds on an existing plot', 'Basements and stilt parking', 'Rainwater harvesting and solar as standard'] },
    { id: 'commercial', n: '02', name: 'Commercial', short: 'Offices, clinics, showrooms and warehouses up to 60,000 sq ft.', from: '₹2,300 / sq ft', time: '8 to 18 months',
      body: 'Commercial clients care about one date: the day the doors open. We plan backwards from it, with long-lead items (lifts, transformers, facade glass) ordered the week the contract is signed.',
      items: ['Office buildings to G+5', 'Clinics and day-care hospitals', 'Showrooms and retail', 'Pre-engineered warehouses', 'Fire NOC and occupancy support', 'Shell, warm shell or plug-and-play'] },
    { id: 'interiors', n: '03', name: 'Interiors fit-out', short: 'Offices and homes, designed and fitted out by one team.', from: '₹1,450 / sq ft', time: '6 to 16 weeks',
      body: 'Our joinery shop in Bommasandra builds wardrobes, kitchens and reception desks to the millimetre, so what you approve in the drawing is what gets installed. Offices are fitted out after hours when the floor is live.',
      items: ['Office fit-outs, 3,000 to 40,000 sq ft', 'Modular kitchens and wardrobes', 'Joinery from our own workshop', 'HVAC, data and lighting design', 'After-hours work on live floors', 'Furniture procurement'] },
    { id: 'turnkey', n: '04', name: 'Turnkey', short: 'From an empty plot to a furnished home, with one contract.', from: '₹3,350 / sq ft', time: '12 to 18 months',
      body: 'One contract covers design, approvals, construction, interiors and landscaping. You get one project manager, one schedule and one number to call, and the keys to a house that is ready to live in.',
      items: ['Architecture and structural design', 'Plan sanction and utility connections', 'Construction to handover', 'Full interiors and loose furniture', 'Landscape and lighting', 'Move-in deep clean and snag list'] },
  ];

  // cfg drives the three.js renders used in the before-and-after sliders (same camera, two days)
  var PROJECTS = [
    { id: 'menon-residence', name: 'Menon Residence', type: 'residential', city: 'Bengaluru', loc: 'Whitefield', year: 2025, area: 4850, floors: 'G+2', months: 11, value: '₹1.42 Cr', photo: 'home-1',
      tag: 'A courtyard home on a 40 × 60 plot', summary: 'A three-generation home planned around a courtyard that pulls light and air into the middle of a narrow plot.',
      challenge: 'The plot sat 1.4 m below the road with black cotton soil to 2.1 m. The family also wanted the grandparents’ rooms on the ground floor with no steps anywhere.',
      solution: 'We went down to firm strata with isolated footings on a 300 mm sand cushion, raised the plinth to road level and used a ramped entry under the car porch. The courtyard doubles as the stack for cross-ventilation.',
      facts: [['Built-up', '4,850 sq ft'], ['Structure', 'RCC frame, AAC walls'], ['Duration', '11 months, 6 days early'], ['Variation over contract', '+2.1%']],
      quote: ['We changed our minds about the kitchen twice. Both times we had a revised drawing and a price in two days, and the handover date didn’t move.', 'Lakshmi Menon'],
      ba: { a: 0.47, b: 1, cfg: { floors: 3, baysX: 3, baysZ: 2, fins: true, balcony: true, seed: 3 } }, gallery: ['home-1', 'site-frame', 'fitout-home'] },
    { id: 'banyan-court', name: 'Banyan Court', type: 'commercial', city: 'Pune', loc: 'Baner', year: 2025, area: 38200, floors: 'G+4', months: 16, value: '₹9.8 Cr', photo: 'office-1',
      tag: 'An office building for four tenants', summary: 'A warm-shell office block with a shaded street front and floor plates that split cleanly for up to four tenants.',
      challenge: 'Two anchor tenants had signed for a fit-out start in month 13, so the shell had to be handed over floor by floor while the floors above were still being built.',
      solution: 'We sequenced the facade bottom-up and sealed each floor before moving on, gave tenants their own goods lift, and ran a separate safety zone for fit-out crews.',
      facts: [['Built-up', '38,200 sq ft'], ['Floors handed over early', '2 of 5'], ['Duration', '16 months'], ['Lost-time injuries', '0 in 412,000 man-hours']],
      quote: ['Our tenants started their fit-outs while Sthira was still on the roof, and nobody tripped over anybody.', 'Rohit Kulkarni, owner'],
      ba: { a: 0.6, b: 0.93, cfg: { floors: 5, baysX: 4, baysZ: 2, fins: true, balcony: false, seed: 11 } }, gallery: ['office-1', 'site-crane', 'fitout-office'] },
    { id: 'house-of-courtyards', name: 'House of Courtyards', type: 'turnkey', city: 'Hyderabad', loc: 'Jubilee Hills', year: 2024, area: 6400, floors: 'G+1', months: 15, value: '₹3.1 Cr', photo: 'home-2',
      tag: 'Turnkey, from empty plot to furnished home', summary: 'A low, wide villa with three courtyards, built, furnished and landscaped under one contract.',
      challenge: 'The owners lived in Singapore for the whole build and wanted to make every decision remotely.',
      solution: 'Weekly portal reports with photos from fixed camera points, video walk-throughs at each hold point and a material library couriered to them twice. They visited the site once, for the snag walk.',
      facts: [['Built-up', '6,400 sq ft'], ['Site visits by the client', '1'], ['Duration', '15 months'], ['Snags at handover', '23, closed in 9 days']],
      quote: ['We built a house from 3,000 km away and the only surprise was how close it was to the drawings.', 'Sanjana and Arvind Reddy'],
      ba: { a: 0.35, b: 1, cfg: { floors: 2, baysX: 4, baysZ: 2, fins: true, balcony: true, seed: 5 } }, gallery: ['home-2', 'landscape-1', 'fitout-home'] },
    { id: 'saanjh-cafe', name: 'Saanjh All-Day Caf\u00e9', type: 'interiors', city: 'Mysuru', loc: 'Vijayanagar', year: 2026, area: 3400, floors: 'Ground floor', months: 2, value: '₹62 L', photo: 'fitout-clinic',
      tag: 'A caf\u00e9 fit-out in nine weeks', summary: 'A 64-cover all-day caf\u00e9 in a former bank branch: a long window counter, rattan lights made in Channapatna and a kitchen built around one chef\u2019s workflow.',
      challenge: 'A bank strong-room in the middle of the plan, a landlord who wanted the structure untouched, and an opening date already printed on the menus.',
      solution: 'We kept the strong-room and made it the bakery, ran the kitchen exhaust through the old light well, and built the counter and banquettes in our workshop while the site was stripped.',
      facts: [['Area', '3,400 sq ft'], ['Covers', '64'], ['Duration', '9 weeks'], ['Opened', 'On the printed date']],
      quote: ['The strong-room was the problem everyone warned us about. Now it\u2019s the first thing people photograph.', 'Kiran Urs, owner'],
      ba: { a: 0.62, b: 0.92, cfg: { floors: 2, baysX: 3, baysZ: 2, fins: false, balcony: false, seed: 9 } }, gallery: ['fitout-clinic', 'site-plaster', 'drawings'] },
    { id: 'northlight-studio', name: 'Northlight Studio', type: 'interiors', city: 'Bengaluru', loc: 'Koramangala', year: 2026, area: 9100, floors: '3rd floor', months: 2.5, value: '₹1.18 Cr', photo: 'fitout-office',
      tag: 'An office fit-out in ten weeks', summary: 'A 9,100 sq ft office for a design studio of 70: open studio, two client rooms, a model shop and a kitchen that seats twenty.',
      challenge: 'The tenant’s lease on their old office ended in ten weeks, and the building allowed noisy work only after 7 pm.',
      solution: 'Joinery was built in our workshop in parallel with demolition, so the site only saw installation. Night shifts did the drilling; day shifts did the quiet work.',
      facts: [['Area', '9,100 sq ft'], ['Duration', '10 weeks'], ['Joinery built off-site', '84%'], ['Night shifts', '31']],
      quote: ['We moved in on a Monday morning and nothing smelled of paint.', 'Ishaan Batra, studio lead'],
      ba: { a: 0.7, b: 1, cfg: { floors: 4, baysX: 3, baysZ: 2, fins: true, balcony: false, seed: 13 } }, gallery: ['fitout-office', 'team-studio', 'drawings'] },
    { id: 'saffron-row', name: 'Saffron Row', type: 'residential', city: 'Bengaluru', loc: 'Sarjapur Road', year: 2024, area: 15600, floors: '6 × G+2', months: 14, value: '₹4.4 Cr', photo: 'home-3',
      tag: 'Six townhouses for one family trust', summary: 'Six identical townhouses for one extended family, built as a single site with shared gardens and one service road.',
      challenge: 'Six families, six sets of preferences for kitchens, bathrooms and finishes, and one shared budget.',
      solution: 'One structure, one shell spec, and a priced menu of 40 options per house that each family chose from in a single workshop. Changes after the workshop were priced the same day.',
      facts: [['Built-up', '15,600 sq ft'], ['Options chosen from', '40 per house'], ['Duration', '14 months'], ['Budget variance', '−1.4%']],
      quote: ['Six families agreed on one contractor. That alone should tell you something.', 'Thomas Varghese, for the family trust'],
      ba: { a: 0.52, b: 1, cfg: { floors: 3, baysX: 2, baysZ: 2, fins: true, balcony: true, seed: 21 } }, gallery: ['home-3', 'site-blockwork', 'landscape-1'] },
    { id: 'halli-mane', name: 'Halli Mane', type: 'residential', city: 'Bengaluru', loc: 'Kanakapura Road', year: 2023, area: 3200, floors: 'G', months: 9, value: '₹96 L', photo: 'home-4',
      tag: 'A single-storey farmhouse', summary: 'A single-storey weekend home on a mango orchard, with deep verandahs and walls of compressed earth block from the site’s own soil.',
      challenge: 'No mains water or power on the site, and a client who wanted to cut as few trees as possible.',
      solution: 'We moved the footprint 6 m to save four mango trees, ran the site on a borewell and a solar-diesel hybrid, and made the walls from the excavated soil.',
      facts: [['Built-up', '3,200 sq ft'], ['Trees saved', '4 of 4'], ['Duration', '9 months'], ['Wall material from site', '71%']],
      quote: ['They moved the house to save our trees and didn’t charge us for it.', 'Nandini Rao'],
      ba: { a: 0.56, b: 1, cfg: { floors: 1, baysX: 4, baysZ: 2, fins: true, balcony: false, seed: 17 } }, gallery: ['home-4', 'site-excavation', 'landscape-1'] },
    { id: 'kondapur-works', name: 'Kondapur Works', type: 'commercial', city: 'Hyderabad', loc: 'Kondapur', year: 2026, area: 21400, floors: 'G+3', months: 12, value: '₹5.6 Cr', photo: 'office-2',
      tag: 'An owner-occupied tech office', summary: 'Headquarters for a 220-person engineering firm, with a ground-floor café open to the street and a roof terrace.',
      challenge: 'The owners wanted to move in during the monsoon, with the facade still the long-lead item.',
      solution: 'We ordered the glazing in week two, closed the building in before the first rain and finished the interiors in the dry.',
      facts: [['Built-up', '21,400 sq ft'], ['Building closed in', 'Day 201'], ['Duration', '12 months'], ['Water ingress at first rain', 'None']],
      quote: ['It rained for three weeks straight the month we moved in. We didn’t lose a day.', 'Aditi Sharma, COO'],
      ba: { a: 0.68, b: 0.93, cfg: { floors: 4, baysX: 4, baysZ: 2, fins: true, balcony: false, seed: 25 } }, gallery: ['office-2', 'site-glazing', 'fitout-office'] },
  ];

  var CITIES = [
    { id: 'blr', name: 'Bengaluru', k: 1.0 }, { id: 'pune', name: 'Pune', k: 0.96 }, { id: 'hyd', name: 'Hyderabad', k: 0.95 },
    { id: 'chn', name: 'Chennai', k: 0.97 }, { id: 'mys', name: 'Mysuru', k: 0.88 }, { id: 'mum', name: 'Mumbai (MMR)', k: 1.2 }, { id: 'ncr', name: 'Delhi NCR', k: 1.08 },
  ];
  var TIERS = [
    { id: 'essential', name: 'Essential', rate: 2150, int: 1150, note: 'Fe 550D steel, AAC walls, vitrified tiles, UPVC windows, branded CP fittings at the mid range' },
    { id: 'signature', name: 'Signature', rate: 2750, int: 1650, note: 'Italian-finish tiles, engineered wood in bedrooms, aluminium windows with DGU, concealed cisterns, home automation-ready' },
    { id: 'bespoke', name: 'Bespoke', rate: 3650, int: 2400, note: 'Natural stone, solid timber, slim-profile glazing, VRF air-conditioning, architect-designed lighting' },
  ];
  // share of the construction cost by trade (used by the estimator)
  var TRADES = [['Structure (RCC, steel, formwork)', 0.36], ['Masonry and plaster', 0.11], ['Plumbing, electrical, fire', 0.16], ['Flooring, tiling, finishes', 0.16], ['Doors, windows, glazing', 0.1], ['Facade and painting', 0.06], ['Site, prelims and supervision', 0.05]];

  var JOBS = [
    { id: 'se-blr', title: 'Site Engineer, Civil', city: 'Bengaluru', team: 'Construction', exp: '2 to 5 years', type: 'Full-time', pay: '₹5.5–8 L',
      about: 'Run day-to-day work on a G+3 residential site: rebar checks before every pour, labour planning with the contractor’s foreman, and the weekly photo report our clients read every Friday.',
      must: ['B.E./B.Tech or diploma in Civil Engineering', 'Two or more RCC framed buildings, start to handover', 'Can read structural drawings and a BBS without help', 'Two-wheeler and a licence'], nice: ['AutoCAD or Revit', 'Kannada'] },
    { id: 'pm-pune', title: 'Project Manager, Residential', city: 'Pune', team: 'Construction', exp: '8+ years', type: 'Full-time', pay: '₹16–22 L',
      about: 'Own three to four homes at a time from contract to handover: schedule, cost, quality, client and the site teams. You will be the one name on the client’s phone.',
      must: ['Eight or more years on residential or small commercial buildings', 'Managed a budget above ₹5 Cr', 'MS Project or Primavera'], nice: ['PMP', 'Marathi'] },
    { id: 'qs-blr', title: 'Quantity Surveyor', city: 'Bengaluru', team: 'Pre-construction', exp: '3 to 6 years', type: 'Full-time', pay: '₹7–11 L',
      about: 'Take off quantities from drawings, build BOQs and price variations the same day a client asks for them.',
      must: ['B.E. Civil or a QS qualification', 'Rate analysis to IS 1200 / DSR', 'Excel that other people can read'], nice: ['CostX or Candy'] },
    { id: 'mep-hyd', title: 'MEP Coordinator', city: 'Hyderabad', team: 'Construction', exp: '4 to 7 years', type: 'Full-time', pay: '₹8–12 L',
      about: 'Coordinate plumbing, electrical, HVAC and fire contractors across two commercial sites, and run the clash checks before ceilings close.',
      must: ['B.E. Mechanical or Electrical', 'Commercial MEP on at least two buildings', 'Testing and commissioning sign-offs'], nice: ['Navisworks', 'Telugu'] },
    { id: 'hse-blr', title: 'Safety Officer', city: 'Bengaluru', team: 'Safety', exp: '3+ years', type: 'Full-time', pay: '₹6–9 L',
      about: 'Lead the 8:15 toolbox talk, inspect and tag scaffolding every Monday, run permits for work at height and keep our zero lost-time record honest.',
      must: ['ADIS or an equivalent diploma in industrial safety', 'Construction site experience', 'Comfortable stopping work when it isn’t safe'], nice: ['NEBOSH IGC', 'First-aid trainer'] },
    { id: 'id-blr', title: 'Interior Designer, Fit-out', city: 'Bengaluru', team: 'Design', exp: '2 to 5 years', type: 'Full-time', pay: '₹6–10 L',
      about: 'Design office and home interiors that our own workshop then builds, from mood board to shop drawings.',
      must: ['Degree in interior design or architecture', 'Shop drawings for joinery', 'SketchUp and a renderer'], nice: ['Lighting design'] },
    { id: 'sup-mys', title: 'Site Supervisor', city: 'Mysuru', team: 'Construction', exp: '5+ years', type: 'Full-time', pay: '₹3.6–5 L',
      about: 'Supervise masonry, plaster and finishing gangs on a clinic and two homes, and keep the daily log.',
      must: ['Diploma or ITI with site experience', 'Five years supervising finishing work'], nice: ['Kannada and Hindi'] },
    { id: 'gte-27', title: 'Graduate Trainee Engineer, 2027', city: 'All offices', team: 'Graduate programme', exp: 'Final year', type: 'Graduate', pay: '₹4.8 L',
      about: 'Eighteen months across three sites and the estimating desk, with a mentor and a structured sign-off at every stage of a building.',
      must: ['B.E./B.Tech Civil, graduating in 2027', 'Willing to work on site, in any of our three cities'], nice: ['An internship on a live site'] },
  ];

  var WEEKS = [
    { w: 24, day: 167, date: '2026-11-20', photo: 'site-blockwork', crew: 34, weather: 'Dry, 27°', title: 'Second-floor blockwork at 70%', done: ['Blockwork on the second floor, grid lines A–B complete', 'Lintels cast over W7 to W12', 'Electrical conduits chased into ground-floor walls'], next: ['Finish second-floor blockwork', 'Start third floor on Thursday', 'Plumbing sleeves through the terrace slab'], note: 'Window W9 in the master bedroom was 40 mm narrow against the drawing. Corrected the same day; see snag S-118.' },
    { w: 23, day: 160, date: '2026-11-13', photo: 'site-scaffold', crew: 31, weather: 'Showers Tue–Wed', title: 'First floor closed, scaffolding up', done: ['First-floor blockwork complete and checked for line and level', 'External scaffolding up to the third floor, tagged', 'Sunken slabs in both first-floor baths waterproofed'], next: ['Second-floor blockwork', 'Lintels over the balcony openings'], note: 'Two days of rain. Masons moved inside to the stair core, so we lost no time.' },
    { w: 22, day: 153, date: '2026-11-06', photo: 'site-engineer', crew: 29, weather: 'Dry, 26°', title: 'Window schedule frozen', done: ['Ground-floor blockwork complete', 'Window schedule frozen with Meera (architect) and ordered', 'Roof slab props struck after 14 days'], next: ['First-floor blockwork', 'Waterproofing of sunken slabs'], note: 'Aluminium windows are a 9-week lead item. Ordered this week to arrive by day 225.' },
    { w: 21, day: 146, date: '2026-10-30', photo: 'site-frame', crew: 27, weather: 'Dry, 28°', title: 'Blockwork begins', done: ['First AAC block delivery (2,400 blocks) checked: density and dimensions', 'Ground-floor blockwork started on grids 1–2', 'Column C2 base repaired (snag S-112 closed)'], next: ['Complete ground-floor blockwork', 'Freeze the window schedule'], note: 'The frame is complete. From here the building starts to look like a home.' },
    { w: 20, day: 139, date: '2026-10-23', photo: 'site-pour', crew: 38, weather: 'Dry, 29°', title: 'Roof slab poured', done: ['Roof slab poured, 34 m³ in 6 hours', '6 cubes taken; 7-day result 21.8 N/mm²', 'Headroom and water-tank walls marked out'], next: ['Cure the roof slab for 14 days', 'Blockwork deliveries'], note: 'Last big pour. Thanks for coming to watch it, Vikram.' },
    { w: 19, day: 132, date: '2026-10-16', photo: 'site-rebar', crew: 33, weather: 'Showers Fri', title: 'Roof slab reinforcement checked', done: ['Roof slab and beam steel tied and checked against the BBS', 'Cover blocks and chairs checked by the structural engineer', 'Conduits for terrace lights placed'], next: ['Pour the roof slab on Monday'], note: '' },
    { w: 18, day: 125, date: '2026-10-09', photo: 'site-formwork', crew: 30, weather: 'Dry, 28°', title: 'Third-floor columns cast', done: ['Third-floor columns cast', 'Roof slab shuttering and props', 'Sunken areas marked for the terrace garden'], next: ['Roof slab reinforcement'], note: '' },
    { w: 17, day: 118, date: '2026-10-02', photo: 'site-crane', crew: 28, weather: 'Dry, 30°', title: 'Third-floor slab cured', done: ['Third-floor slab: 28-day cubes 32.6 N/mm²', 'Column steel for the third floor'], next: ['Cast third-floor columns'], note: '' },
  ];

  var PAYMENTS = [
    { n: 1, name: 'Contract signing and mobilisation', pct: 10, status: 'paid', date: '2026-06-02' },
    { n: 2, name: 'Foundation and footings complete', pct: 10, status: 'paid', date: '2026-07-21' },
    { n: 3, name: 'Plinth beams and ground slab', pct: 8, status: 'paid', date: '2026-08-04' },
    { n: 4, name: 'First-floor slab', pct: 8, status: 'paid', date: '2026-08-27' },
    { n: 5, name: 'Second-floor slab', pct: 8, status: 'paid', date: '2026-09-17' },
    { n: 6, name: 'Third-floor slab', pct: 8, status: 'paid', date: '2026-10-09' },
    { n: 7, name: 'Roof slab', pct: 8, status: 'paid', date: '2026-10-30' },
    { n: 8, name: 'Blockwork, ground and first floor', pct: 4, status: 'due', date: '2026-11-30' },
    { n: 9, name: 'Blockwork, second and third floor', pct: 4, status: 'upcoming', date: '2026-12-14' },
    { n: 10, name: 'Plaster, MEP rough-in and windows', pct: 10, status: 'upcoming', date: '2027-01-25' },
    { n: 11, name: 'Flooring, tiling and painting', pct: 10, status: 'upcoming', date: '2027-03-08' },
    { n: 12, name: 'Handover and keys', pct: 9, status: 'upcoming', date: '2027-04-23' },
    { n: 13, name: 'Retention, after 12-month defects period', pct: 3, status: 'upcoming', date: '2028-04-23' },
  ];

  var SNAGS = [
    { id: 'S-118', title: 'Window opening W9 is 40 mm narrower than drawn', where: 'Second floor · master bedroom', trade: 'Masonry', by: 'Karthik (site)', date: '2026-11-21', status: 'fixed', fix: 'Block cut back and lintel recast the same day. Re-measured 1,500 mm.' },
    { id: 'S-117', title: 'Sunken slab in bath B3 is 230 mm deep, drawing says 250', where: 'Second floor · bath B3', trade: 'RCC', by: 'Meera (architect)', date: '2026-11-18', status: 'open', fix: 'Floor trap to be changed to a low-height model. Proposal sent to client.' },
    { id: 'S-116', title: 'Honeycombing at the base of column C4', where: 'Third floor · grid C/4', trade: 'RCC', by: 'Structural engineer', date: '2026-10-16', status: 'fixed', fix: 'Chipped and repaired with polymer-modified mortar, signed off by the structural engineer.' },
    { id: 'S-115', title: 'Electrical sleeve missing in roof slab near the water tank', where: 'Roof', trade: 'Electrical', by: 'Karthik (site)', date: '2026-10-27', status: 'fixed', fix: 'Core-cut 50 mm and sealed with non-shrink grout.' },
    { id: 'S-114', title: 'Can the balcony railing be moved 150 mm outward?', where: 'First floor · living balcony', trade: 'Design', by: 'Ananya Rao', date: '2026-11-11', status: 'review', fix: 'Possible with a 150 mm slab extension. Structural check under way; we will price it on Friday.' },
    { id: 'S-112', title: 'Column C2 base: surface voids after deshuttering', where: 'Ground floor · grid C/2', trade: 'RCC', by: 'Karthik (site)', date: '2026-08-18', status: 'fixed', fix: 'Repaired and cured; cube results unaffected.' },
  ];

  var CHANGES = [
    { id: 'CO-09', title: 'Wall-hung WC with concealed cistern in all four bathrooms', amount: 38400, days: 0, status: 'pending', note: 'Needs a 150 mm stud wall behind each WC. No change to the programme.' },
    { id: 'CO-08', title: 'Extra power points and data for a home office on the third floor', amount: 21600, days: 0, status: 'pending', note: 'Six sockets, two data points and a dedicated circuit.' },
    { id: 'CO-07', title: 'Terrace garden waterproofing upgraded to a root-barrier membrane', amount: 64500, days: 2, status: 'approved', note: 'Approved 3 Nov by Vikram.' },
    { id: 'CO-06', title: 'Delete the servant’s toilet on the stilt floor', amount: -42000, days: 0, status: 'approved', note: 'Credit applied to milestone 8.' },
  ];

  var DOCS = [
    { name: 'Architectural drawings, Rev F', kind: 'Drawings', size: '42 sheets', date: '2026-10-30' },
    { name: 'Structural drawings and BBS, Rev C', kind: 'Drawings', size: '31 sheets', date: '2026-07-02' },
    { name: 'Contract and specification', kind: 'Contract', size: '47 pages', date: '2026-06-02' },
    { name: 'Bill of quantities (priced)', kind: 'Cost', size: '612 lines', date: '2026-06-02' },
    { name: 'Cube test register', kind: 'Quality', size: '84 results', date: '2026-11-06' },
    { name: 'Plan sanction (BBMP)', kind: 'Approvals', size: '3 pages', date: '2026-05-19' },
  ];

  var MESSAGES = [
    { from: 'Farah Siddiqui', role: 'Project manager', at: '2026-11-20T18:10', text: 'Weekly report is up. Second floor walls are at 70%; we start the third floor on Thursday. One open item for you: the floor trap in bath B3 (S-117).' },
    { from: 'Vikram Rao', role: 'Client', at: '2026-11-21T21:42', text: 'Thanks for fixing W9 so fast. Can we see the balcony railing option on Saturday?' },
    { from: 'Karthik Gowda', role: 'Site engineer', at: '2026-11-22T09:05', text: 'Saturday 11 am works. I’ll have the railing line marked on the slab edge so you can stand there and see it.' },
  ];

  // back office: enquiry -> survey -> quote -> project
  var LEADS = [
    { id: 'L-2311', name: 'Deepa Krishnan', city: 'Bengaluru', loc: 'JP Nagar 7th Phase', type: 'Residential', area: 3600, floors: 'G+2', budget: '₹95 L – 1.1 Cr', stage: 'enquiry', source: 'Estimator', at: '2026-11-24T09:12', next: 'Call back to book a site survey', due: '2026-11-24T12:00', owner: 'Farah', note: 'Used the estimator: Signature tier, 3,600 sq ft. Wants to start after Pongal.' },
    { id: 'L-2310', name: 'Mohammed Irfan', city: 'Hyderabad', loc: 'Tolichowki', type: 'Commercial', area: 12000, floors: 'G+3', budget: '₹3 – 3.5 Cr', stage: 'enquiry', source: 'Website form', at: '2026-11-23T16:40', next: 'Ask for the plot sketch and the soil report', due: '2026-11-24T11:00', owner: 'Nikhil', note: 'Ground-floor showroom with offices above. Has a sanctioned plan from another architect.' },
    { id: 'L-2309', name: 'Priya and Sameer Joshi', city: 'Pune', loc: 'Bavdhan', type: 'Turnkey', area: 4200, floors: 'G+1', budget: '₹1.6 Cr', stage: 'enquiry', source: 'Referral', at: '2026-11-22T11:05', next: 'Send the turnkey brochure and a portal walkthrough', due: '2026-11-23T17:00', owner: 'Rhea', note: 'Referred by the Kulkarnis (Banyan Court). Living in Dubai until March.' },
    { id: 'L-2308', name: 'Sunil Bhat', city: 'Mysuru', loc: 'Bogadi', type: 'Residential', area: 2400, floors: 'G+1', budget: '₹55 – 65 L', stage: 'enquiry', source: 'Walk-in', at: '2026-11-21T15:30', next: 'Second call: confirm budget and plot size', due: '2026-11-26T11:00', owner: 'Farah', note: '' },
    { id: 'L-2306', name: 'Anjali Nair', city: 'Bengaluru', loc: 'Hennur', type: 'Interiors', area: 2800, floors: 'Apartment', budget: '₹38 – 45 L', stage: 'survey', source: 'Instagram', at: '2026-11-18T10:20', next: 'Site survey', due: '2026-11-25T10:30', owner: 'Rhea', survey: { when: '2026-11-25T10:30', who: 'Rhea Fernandes' }, note: 'Bare-shell 4 BHK, handover from the developer on 1 Dec.' },
    { id: 'L-2305', name: 'Gurpreet Sandhu', city: 'Bengaluru', loc: 'Yelahanka', type: 'Residential', area: 5400, floors: 'G+2', budget: '₹1.5 Cr', stage: 'survey', source: 'Website form', at: '2026-11-16T13:00', next: 'Survey done: write up findings', due: '2026-11-22T18:00', owner: 'Karthik', survey: { when: '2026-11-21T09:00', who: 'Karthik Gowda' }, note: 'Corner plot, 60 × 90. Old house to be demolished.' },
    { id: 'L-2304', name: 'Lata Venkatesh', city: 'Chennai', loc: 'Adyar', type: 'Residential', area: 3100, floors: 'G+1', budget: '₹1 Cr', stage: 'survey', source: 'Referral', at: '2026-11-14T12:10', next: 'Site survey', due: '2026-11-28T11:00', owner: 'Nikhil', survey: { when: '2026-11-28T11:00', who: 'Nikhil Menon' }, note: 'Rebuild of her parents’ house. Wants to keep the old teak doors.' },
    { id: 'L-2301', name: 'Rajesh Agarwal', city: 'Bengaluru', loc: 'Bommasandra', type: 'Commercial', area: 42000, floors: 'PEB', budget: '₹6.2 Cr', stage: 'quote', source: 'Tender', at: '2026-11-03T09:00', next: 'Quote follow-up call', due: '2026-11-25T15:00', owner: 'Nikhil', quote: { total: 61800000, sent: '2026-11-19', valid: '2026-12-19', version: 2 }, note: 'Warehouse with a 2,000 sq ft office. Comparing three bids; ours is the middle one.' },
    { id: 'L-2299', name: 'Kavya and Arjun Shetty', city: 'Bengaluru', loc: 'Sahakar Nagar', type: 'Residential', area: 4100, floors: 'G+2', budget: '₹1.2 Cr', stage: 'quote', source: 'Estimator', at: '2026-10-28T19:30', next: 'Revise quote: drop basement, add lift', due: '2026-11-24T18:00', owner: 'Farah', quote: { total: 11650000, sent: '2026-11-12', valid: '2026-12-12', version: 1 }, note: 'Asked to see the Menon Residence. Visit done 15 Nov; they loved the courtyard.' },
    { id: 'L-2297', name: 'Dr. Meenakshi Iyer', city: 'Mysuru', loc: 'Kuvempunagar', type: 'Commercial', area: 6200, floors: 'G+1', budget: '₹1.9 Cr', stage: 'quote', source: 'Referral', at: '2026-10-21T10:00', next: 'Waiting for her board meeting (30 Nov)', due: '2026-12-01T11:00', owner: 'Rhea', quote: { total: 18900000, sent: '2026-11-08', valid: '2026-12-08', version: 1 }, note: 'Dental hospital. Referred by Kiran Urs (Saanjh Caf\u00e9).' },
    { id: 'L-2290', name: 'Ananya and Vikram Rao', city: 'Bengaluru', loc: 'HSR Layout', type: 'Residential', area: 8370, floors: 'G+3', budget: '₹2.3 Cr', stage: 'project', source: 'Referral', at: '2026-03-02T11:00', next: 'Weekly report due Friday', due: '2026-11-27T18:00', owner: 'Farah', project: { code: 'STH-2611', day: 171, total: 320, stage: 'Walls', pct: 47 }, note: 'Live in the client portal. Open item: floor trap in B3 (S-117).' },
    { id: 'L-2284', name: 'Kondapur Works LLP', city: 'Hyderabad', loc: 'Kondapur', type: 'Commercial', area: 21400, floors: 'G+3', budget: '₹5.6 Cr', stage: 'project', source: 'Tender', at: '2025-09-14T11:00', next: 'Defects-period check, month 3', due: '2026-12-04T11:00', owner: 'Nikhil', project: { code: 'STH-2584', day: 365, total: 365, stage: 'Defects period', pct: 100 }, note: 'Handed over 30 Aug. Retention release in Aug 2027.' },
    { id: 'L-2302', name: 'Harish Patil', city: 'Pune', loc: 'Wakad', type: 'Residential', area: 2600, floors: 'G+1', budget: '₹60 L', stage: 'lost', source: 'Website form', at: '2026-11-05T14:00', next: '', due: '', owner: 'Rhea', lost: 'Went with a contractor quoting ₹1,650 / sq ft', note: '' },
  ];

  var TEAM = ['Farah', 'Nikhil', 'Rhea', 'Karthik'];

  function inr(n, opt) {
    if (n == null || isNaN(n)) return '—';
    var neg = n < 0; n = Math.abs(n);
    var s;
    if (opt === 'full') { s = '₹' + Math.round(n).toLocaleString('en-IN'); }
    else if (n >= 1e7) s = '₹' + (n / 1e7).toFixed(n >= 1e8 ? 1 : 2).replace(/\.?0+$/, '') + ' Cr';
    else if (n >= 1e5) s = '₹' + (n / 1e5).toFixed(n >= 1e6 ? 1 : 2).replace(/\.?0+$/, '') + ' L';
    else s = '₹' + Math.round(n).toLocaleString('en-IN');
    return (neg ? '−' : '') + s;
  }

  return { STAGES: STAGES, dayAt: dayAt, pAt: pAt, LIVE: LIVE, SERVICES: SERVICES, PROJECTS: PROJECTS, CITIES: CITIES, TIERS: TIERS, TRADES: TRADES, JOBS: JOBS, WEEKS: WEEKS, PAYMENTS: PAYMENTS, SNAGS: SNAGS, CHANGES: CHANGES, DOCS: DOCS, MESSAGES: MESSAGES, LEADS: LEADS, TEAM: TEAM, inr: inr };
})();
