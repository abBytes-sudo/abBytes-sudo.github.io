/* Marlow & Reed Studio OS: seeded demo data (fictional studio, clients and vendors). */
(function () {
  'use strict';
  var MR = window.MR, u = MR.u;

  MR.CATS = ['Civil & waterproofing', 'Plumbing', 'Electrical', 'False ceiling', 'Carpentry', 'Flooring', 'Painting', 'Furniture & lighting', 'Design & supervision'];
  MR.CAT_SHORT = { 'Civil & waterproofing': 'Civil', 'Plumbing': 'Plumbing', 'Electrical': 'Electrical', 'False ceiling': 'Ceiling', 'Carpentry': 'Carpentry', 'Flooring': 'Flooring', 'Painting': 'Painting', 'Furniture & lighting': 'Furniture', 'Design & supervision': 'Design' };
  MR.WASTAGE = { 'Flooring': 8, 'False ceiling': 5, 'Painting': 3, 'Civil & waterproofing': 5 };
  MR.SAC = { 'Furniture & lighting': '9403', 'Design & supervision': '998391' }; // default works contract 995472
  MR.UNITS = ['sqft', 'rft', 'nos', 'point', 'set', 'window', 'lot', 'month'];

  // code, category, name, unit, material, labour, margin %
  var RATES = [
    ['CV-101', 0, 'Dismantle existing false ceiling and fixtures', 'sqft', 0, 22, 41],
    ['CV-102', 0, 'Demolish non-load-bearing brick wall', 'sqft', 8, 62, 38],
    ['CV-103', 0, 'Brick partition 115 mm, plastered both sides', 'sqft', 98, 52, 36],
    ['CV-104', 0, 'Waterproofing, two-coat cementitious, wet areas', 'sqft', 52, 30, 36],
    ['CV-105', 0, 'Debris removal and disposal, per truck', 'lot', 0, 14500, 31],
    ['CV-106', 0, 'Floor screed and levelling, 40 mm', 'sqft', 34, 22, 36],
    ['PL-151', 1, 'CPVC supply and drainage rough-in, per bathroom', 'nos', 18500, 9500, 34],
    ['PL-152', 1, 'Concealed diverter with rain shower set', 'nos', 7800, 1400, 31],
    ['PL-153', 1, 'Sanitaryware set, wall-hung, installed', 'set', 39000, 3500, 28],
    ['PL-154', 1, 'Kitchen sink with pull-out mixer, installed', 'nos', 14800, 1200, 31],
    ['EL-201', 2, 'Light or fan point, concealed FR wiring', 'point', 640, 420, 36],
    ['EL-202', 2, 'Power point 6/16 A with modular plate', 'point', 880, 480, 36],
    ['EL-203', 2, 'AC point with dedicated MCB', 'point', 2100, 850, 34],
    ['EL-204', 2, 'Distribution board rewire, 12-way with RCBO', 'nos', 13500, 3200, 31],
    ['EL-205', 2, 'LED profile light, 3000 K, supply and fix', 'rft', 480, 140, 38],
    ['EL-206', 2, 'COB downlight 12 W, anti-glare', 'nos', 690, 160, 41],
    ['EL-207', 2, 'Data and TV point, Cat 6', 'point', 720, 380, 36],
    ['FC-301', 3, 'Gypsum false ceiling, plain', 'sqft', 58, 22, 34],
    ['FC-302', 3, 'Gypsum cove ceiling with peripheral drop', 'sqft', 82, 34, 34],
    ['FC-303', 3, 'Grid ceiling 600×600, mineral fibre tiles', 'sqft', 72, 16, 32],
    ['FC-304', 3, 'Wooden slat ceiling, veneer finish', 'sqft', 290, 90, 36],
    ['CP-401', 4, 'Modular kitchen, BWP ply carcass, acrylic shutters', 'sqft', 1520, 330, 38],
    ['CP-402', 4, 'Wardrobe, BWR ply, laminate shutters', 'sqft', 1050, 260, 38],
    ['CP-403', 4, 'Wardrobe, lacquered glass shutters, soft-close', 'sqft', 1480, 300, 38],
    ['CP-404', 4, 'TV unit with fluted back panel and storage', 'sqft', 1180, 340, 38],
    ['CP-405', 4, 'Study desk with overhead shelf', 'rft', 3300, 900, 36],
    ['CP-406', 4, 'Wall panelling, fluted oak veneer', 'sqft', 285, 85, 38],
    ['CP-407', 4, 'Queen bed with hydraulic storage', 'nos', 36500, 6500, 38],
    ['CP-408', 4, 'Flush door with frame and hardware', 'nos', 24500, 4800, 36],
    ['CP-409', 4, 'Shoe rack and foyer console', 'rft', 3600, 900, 38],
    ['CP-410', 4, 'Vanity unit, marine ply, quartz top', 'rft', 4200, 900, 36],
    ['CP-411', 4, 'Workstation, linear 1200 mm, with screen', 'nos', 15800, 2400, 34],
    ['CP-412', 4, 'Reception desk, solid-surface top', 'rft', 9800, 2600, 36],
    ['CP-413', 4, 'Crockery unit with fluted glass shutters', 'sqft', 1380, 320, 38],
    ['CP-414', 4, 'Storage cubbies, kids height, rounded edges', 'rft', 2900, 700, 38],
    ['FL-501', 5, 'Vitrified tile 800×800, supply and lay', 'sqft', 98, 38, 31],
    ['FL-502', 5, 'Engineered oak flooring, supply and lay', 'sqft', 238, 42, 34],
    ['FL-503', 5, 'Bathroom wall and floor tile, supply and lay', 'sqft', 112, 46, 31],
    ['FL-504', 5, 'Imported marble, laid and machine polished', 'sqft', 520, 120, 31],
    ['FL-505', 5, 'Skirting, 100 mm tile or MDF', 'rft', 58, 22, 34],
    ['FL-506', 5, 'Carpet tile, commercial grade', 'sqft', 92, 12, 32],
    ['FL-507', 5, 'Vinyl flooring, 3 mm, anti-skid', 'sqft', 118, 22, 34],
    ['PT-601', 6, 'Putty and two-coat emulsion, walls and ceiling', 'sqft', 14, 12, 34],
    ['PT-602', 6, 'Limewash feature wall', 'sqft', 52, 34, 36],
    ['PT-603', 6, 'PU lacquer on woodwork', 'sqft', 62, 46, 34],
    ['PT-604', 6, 'Enamel on grills and doors', 'sqft', 18, 16, 34],
    ['PT-605', 6, 'Wallpaper, supply and fix', 'nos', 4200, 650, 38],
    ['FN-701', 7, 'Sofa, three-seater, performance fabric', 'nos', 52000, 3000, 36],
    ['FN-702', 7, 'Dining table with six chairs', 'set', 64000, 2500, 36],
    ['FN-703', 7, 'Curtains with track, blackout lining', 'window', 10800, 1400, 38],
    ['FN-704', 7, 'Pendant light, hand-blown glass', 'nos', 11500, 600, 41],
    ['FN-705', 7, 'Rug, hand-tufted wool, 8×10 ft', 'nos', 38000, 0, 38],
    ['FN-706', 7, 'Task chair, ergonomic mesh', 'nos', 14500, 0, 31],
    ['FN-707', 7, 'Conference table, ten-seater', 'nos', 92000, 6000, 34],
    ['FN-708', 7, 'Acoustic wall panels, PET felt', 'sqft', 310, 60, 38],
    ['DS-901', 8, 'Design fee: 3D visuals and working drawings', 'sqft', 0, 70, 100],
    ['DS-902', 8, 'Site supervision', 'month', 0, 32000, 55],
    ['DS-903', 8, 'Project management and snagging', 'lot', 0, 26000, 50]
  ];
  // rate revisions this financial year: code -> [[daysAgo, matFactor, labFactor, marginDelta, note, by]]
  var REVS = {
    'CP-401': [[96, 1.06, 1, 0, 'BWP ply and acrylic up 6% (supplier circular)', 'u-ira']],
    'CP-402': [[96, 1.06, 1, 0, 'BWR ply up 6% (supplier circular)', 'u-ira']],
    'CP-403': [[96, 1.05, 1, 0, 'Lacquered glass and ply revision', 'u-ira'], [34, 1, 1.04, 0, 'Carpentry labour revised for festive season', 'u-ira']],
    'CP-404': [[34, 1, 1.04, 0, 'Carpentry labour revised for festive season', 'u-ira']],
    'FL-502': [[70, 1.04, 1, -1, 'Engineered oak import landed cost', 'u-kabir']],
    'EL-201': [[52, 1.08, 1, 0, 'Copper price hike, FR wire', 'u-ira']],
    'EL-202': [[52, 1.07, 1, 0, 'Copper price hike, FR wire', 'u-ira']],
    'FC-302': [[120, 1, 1.05, 0, 'Ceiling crew rate card 2026', 'u-ira'], [18, 1.03, 1, 1, 'Gypsum board price revision', 'u-kabir']],
    'PT-601': [[120, 1.03, 1.04, 0, 'Paint rate card 2026', 'u-ira']],
    'DS-901': [[150, 1, 1.12, 0, 'Design fee revised for FY 26-27', 'u-ira']]
  };

  function buildRates() {
    var start = u.addD(u.today(), -235);
    return RATES.map(function (r, i) {
      var cat = MR.CATS[r[1]], revs = REVS[r[0]] || [];
      // reconstruct the starting point by un-applying the revisions
      var mat = r[4], lab = r[5], mg = r[6];
      for (var k = revs.length - 1; k >= 0; k--) { mat = mat / revs[k][1]; lab = lab / revs[k][2]; mg = mg - revs[k][3]; }
      mat = Math.round(mat); lab = Math.round(lab);
      var hist = [{ v: 1, at: start, mat: mat, lab: lab, margin: mg, by: 'u-ira', note: 'FY 26-27 rate card' }];
      revs.forEach(function (rv, j) { hist.push({ v: j + 2, at: u.addD(u.today(), -rv[0]), mat: r[4] === 0 ? 0 : Math.round(hist[j].mat * rv[1]), lab: Math.round(hist[j].lab * rv[2]), margin: hist[j].margin + rv[3], by: rv[5], note: rv[4] }); });
      var last = hist[hist.length - 1];
      return { id: 'r' + (i + 1), code: r[0], cat: cat, name: r[2], unit: r[3], mat: last.mat, lab: last.lab, margin: last.margin, sac: MR.SAC[cat] || '995472', hist: hist, active: true };
    });
  }
  function rateAt(rate, date) { var h = rate.hist[0]; rate.hist.forEach(function (x) { if (x.at <= date) h = x; }); return h; }

  /* ---------------- room templates ---------------- */
  var ROOMS = {
    foyer: ['Foyer & passage', [['FL-501', 180], ['FC-301', 140], ['EL-201', 6], ['CP-409', 6], ['PT-601', 520]]],
    living: ['Living & dining', [['FC-302', 420], ['EL-201', 14], ['EL-202', 10], ['EL-203', 2], ['EL-205', 60], ['EL-206', 16], ['CP-404', 54], ['CP-406', 110], ['CP-413', 42], ['FL-502', 380], ['FL-505', 90], ['PT-601', 1400], ['PT-602', 120], ['FN-701', 1], ['FN-702', 1], ['FN-703', 3], ['FN-704', 2]]],
    kitchen: ['Kitchen & utility', [['CV-102', 40], ['CV-104', 60], ['PL-154', 1], ['EL-202', 12], ['EL-201', 5], ['CP-401', 95], ['FL-501', 120], ['PT-601', 380]]],
    master: ['Master bedroom', [['FC-302', 220], ['EL-201', 8], ['EL-202', 6], ['EL-203', 1], ['CP-403', 96], ['CP-407', 1], ['FL-502', 220], ['PT-601', 820], ['FN-703', 2]]],
    bed2: ['Bedroom 2', [['FC-301', 160], ['EL-201', 6], ['EL-202', 5], ['EL-203', 1], ['CP-402', 84], ['CP-405', 8], ['FL-501', 170], ['PT-601', 640], ['FN-703', 1]]],
    kids: ["Kids' room", [['FC-301', 150], ['EL-201', 6], ['EL-202', 5], ['EL-203', 1], ['CP-402', 72], ['CP-405', 10], ['PT-601', 600], ['PT-605', 3], ['FN-703', 1]]],
    bed3: ['Guest bedroom', [['FC-301', 150], ['EL-201', 5], ['EL-202', 4], ['EL-203', 1], ['CP-402', 70], ['CP-407', 1], ['FL-501', 160], ['PT-601', 600], ['FN-703', 1]]],
    baths: ['Bathrooms (3)', [['CV-104', 210], ['PL-151', 3], ['PL-152', 3], ['PL-153', 3], ['FL-503', 420], ['CP-410', 12]]],
    baths4: ['Bathrooms (4)', [['CV-104', 280], ['PL-151', 4], ['PL-152', 4], ['PL-153', 4], ['FL-503', 560], ['CP-410', 16]]],
    services: ['Whole-house services', [['CV-101', 600], ['EL-204', 1], ['EL-207', 6], ['CV-105', 2]]],
    design: ['Design & supervision', [['DS-901', 1650], ['DS-902', 4], ['DS-903', 1]]],
    designS: ['Design & supervision', [['DS-901', 700], ['DS-903', 1]]],
    kitchenOnly: ['Kitchen', [['CV-102', 30], ['CV-104', 50], ['PL-154', 1], ['EL-202', 10], ['EL-201', 4], ['CP-401', 110], ['FL-501', 130], ['PT-601', 420]]],
    wardrobes: ['Wardrobes (3 bedrooms)', [['CP-402', 150], ['CP-403', 90], ['EL-205', 24]]],
    refreshLiving: ['Living & dining', [['FC-302', 260], ['EL-201', 10], ['EL-206', 10], ['CP-404', 40], ['CP-406', 60], ['PT-601', 1300], ['PT-602', 90], ['FN-703', 3]]],
    refreshBeds: ['Bedrooms', [['EL-202', 8], ['CP-402', 90], ['PT-601', 1800], ['FN-703', 3]]],
    reception: ['Reception & waiting', [['FC-304', 180], ['EL-206', 12], ['CP-412', 14], ['CP-406', 140], ['FL-504', 260], ['PT-601', 600], ['FN-704', 3]]],
    workstations: ['Open workstations', [['FC-303', 2400], ['EL-202', 64], ['EL-207', 64], ['EL-205', 220], ['CP-411', 56], ['FL-506', 2200], ['FN-706', 56], ['PT-601', 3200]]],
    cabins: ['Cabins (4)', [['CV-103', 520], ['FC-301', 560], ['EL-201', 16], ['EL-202', 24], ['CP-405', 32], ['FL-506', 560], ['PT-601', 1800], ['FN-703', 4]]],
    conference: ['Conference room', [['FC-302', 320], ['EL-207', 6], ['EL-206', 14], ['CP-406', 160], ['FN-707', 1], ['FN-708', 180], ['FL-506', 320], ['FN-703', 2]]],
    pantry: ['Pantry', [['CV-104', 60], ['PL-154', 1], ['CP-401', 60], ['FL-501', 220], ['EL-202', 10]]],
    washrooms: ['Washrooms', [['CV-104', 220], ['PL-151', 2], ['PL-153', 4], ['FL-503', 600], ['CP-410', 10]]],
    mep: ['MEP & services', [['EL-204', 3], ['CV-105', 3]]],
    designC: ['Design & project management', [['DS-901', 4200], ['DS-902', 5], ['DS-903', 1]]],
    operatory: ['Operatories (3)', [['CV-103', 360], ['FC-301', 420], ['EL-201', 18], ['EL-202', 30], ['EL-203', 3], ['PL-151', 3], ['CP-410', 18], ['FL-507', 420], ['PT-601', 1500]]],
    steri: ['Sterilisation & lab', [['CV-104', 80], ['PL-151', 1], ['CP-401', 40], ['FL-507', 160], ['EL-202', 12]]],
    cabin1: ["Doctor's cabin", [['FC-302', 140], ['EL-206', 6], ['CP-405', 8], ['CP-406', 60], ['FL-502', 140], ['PT-601', 520]]],
    foh: ['Front of house seating', [['FC-304', 520], ['EL-206', 28], ['EL-205', 90], ['CP-406', 220], ['FL-501', 900], ['PT-602', 340], ['FN-704', 8]]],
    bar: ['Service counter & bar', [['CP-412', 22], ['EL-202', 18], ['PL-154', 2], ['FL-504', 120]]],
    classroom: ['Classrooms (4)', [['FC-301', 1600], ['EL-201', 32], ['EL-202', 24], ['EL-203', 4], ['CP-414', 96], ['FL-507', 1600], ['PT-601', 4800], ['FN-703', 8]]],
    activity: ['Activity hall', [['FC-302', 900], ['EL-206', 30], ['FL-507', 900], ['PT-602', 260], ['CP-414', 40]]],
    kidsWash: ['Washrooms (kids)', [['CV-104', 240], ['PL-151', 2], ['PL-153', 6], ['FL-503', 520], ['CP-410', 14]]],
    admin: ['Admin office', [['FC-301', 260], ['EL-202', 12], ['EL-207', 6], ['CP-405', 16], ['FL-506', 260], ['PT-601', 900]]]
  };
  var TPL = {
    full3: { name: '3BHK full interiors', rooms: ['foyer', 'living', 'kitchen', 'master', 'bed2', 'kids', 'baths', 'services', 'design'] },
    villa: { name: 'Villa full interiors', rooms: ['foyer', 'living', 'kitchen', 'master', 'bed2', 'kids', 'bed3', 'baths4', 'services', 'design'] },
    kitchen: { name: 'Kitchen and wardrobes', rooms: ['kitchenOnly', 'wardrobes', 'designS'] },
    refresh: { name: 'Apartment refresh', rooms: ['refreshLiving', 'refreshBeds', 'designS'] },
    living: { name: 'Living and dining makeover', rooms: ['living', 'designS'] },
    office: { name: 'Office floor fit-out', rooms: ['reception', 'workstations', 'cabins', 'conference', 'pantry', 'washrooms', 'mep', 'designC'] },
    clinic: { name: 'Clinic fit-out', rooms: ['reception', 'operatory', 'steri', 'cabin1', 'washrooms', 'mep', 'designS'] },
    cafe: { name: 'Café fit-out', rooms: ['foh', 'bar', 'pantry', 'washrooms', 'mep', 'designS'] },
    preschool: { name: 'Preschool fit-out', rooms: ['reception', 'classroom', 'activity', 'kidsWash', 'admin', 'mep', 'designC'] }
  };
  MR.TPL = TPL; MR.ROOMS = ROOMS;

  var KEYN = 0;
  function lineFrom(rate, qty, date) {
    var h = date ? rateAt(rate, date) : rate;
    var r = { mat: h.mat, lab: h.lab, margin: h.margin };
    return { id: u.uid('i'), key: 'k' + (++KEYN), rateId: rate.id, code: rate.code, cat: rate.cat, name: rate.name, unit: rate.unit, qty: qty, wst: MR.WASTAGE[rate.cat] || 0, rate: MR.sell(r), mat: r.mat, lab: r.lab, rv: h.v || rate.hist.length, disc: 0, note: '' };
  }
  MR.lineFrom = lineFrom;
  function buildSections(tplKey, scale, rates, date) {
    var byCode = {}; rates.forEach(function (r) { byCode[r.code] = r; });
    return TPL[tplKey].rooms.map(function (rk) {
      var room = ROOMS[rk];
      return { id: u.uid('s'), key: 's-' + rk, title: room[0], items: room[1].map(function (x) {
        var unitsFixed = /lot|month|set/.test(byCode[x[0]].unit) || (byCode[x[0]].unit === 'nos' && x[1] <= 4);
        var q = unitsFixed ? x[1] : Math.max(1, Math.round(x[1] * scale));
        return lineFrom(byCode[x[0]], q, date);
      }) };
    });
  }
  MR.buildSections = function (tplKey, scale) { return buildSections(tplKey, scale || 1, MR.S.rates, null); };
  function cloneSections(secs) { return JSON.parse(JSON.stringify(secs)).map(function (s) { s.id = u.uid('s'); s.items.forEach(function (i) { i.id = u.uid('i'); }); return s; }); }
  MR.cloneSections = cloneSections;

  /* ---------------- clients ---------------- */
  // id, name, kind, contact, email, phone, address, city, state, gstin, source, note
  var CLIENTS = [
    ['c-sethi', 'Sethi Dental Studio', 'Commercial', 'Dr Arjun Sethi', 'arjun@sethidental.example', '+91 98110 46213', 'M-21, Greater Kailash II', 'New Delhi', 'DL', '07AAKFS4417M1Z3', 'Instagram', 'Three-chair practice. Wants zero downtime on the adjacent clinic.'],
    ['c-malhotra', 'Ishaan Malhotra', 'Residential', 'Ishaan Malhotra', 'ishaan.m@example.com', '+91 98731 50288', 'Flat 704, Tower C, Sector 12', 'Dwarka, New Delhi', 'DL', '', 'Website enquiry', 'Rental flat refresh before new tenants.'],
    ['c-rao', 'Vikram & Leena Rao', 'Residential', 'Leena Rao', 'leena.rao@example.com', '+91 99100 38412', 'Tower B-1102, Sector 54', 'Gurugram', 'HR', '', 'Referral · Sethi Dental', 'Leena decides finishes; Vikram signs off budgets. Prefers WhatsApp voice notes.'],
    ['c-kapoor', 'Meenal & Sahil Kapoor', 'Residential', 'Meenal Kapoor', 'meenal.kapoor@example.com', '+91 98101 77290', 'B-14, Sushant Lok II', 'Gurugram', 'HR', '', 'Referral · Rao family', 'Four-bedroom villa. Elderly parents move in after handover, so bathrooms need grab rails.'],
    ['c-saxena', 'Kunal Saxena', 'Residential', 'Kunal Saxena', 'kunal@saxena.example', '+91 98186 02154', 'D-7 Penthouse, Vasant Vihar', 'New Delhi', 'DL', '', 'Architect referral', 'Travels Mon–Thu. Approvals over email only, copy his EA Ritu.'],
    ['c-kestrel', 'Kestrel Analytics Pvt Ltd', 'Commercial', 'Priya Nair (Admin head)', 'admin@kestrel.example', '+91 99582 11730', '5th floor, Tower A, Sector 62', 'Noida', 'UP', '09AAHCK7731R1ZP', 'Tender', '120-seat floor. Building allows noisy work only after 7 pm and on Sundays.'],
    ['c-arbor', 'Arbor Learning LLP', 'Commercial', 'Shalini Verma (Director)', 'shalini@arborlearning.example', '+91 98990 26614', 'Plot 18, Sector 57', 'Gurugram', 'HR', '06AAQFA2291H1Z8', 'Repeat client', 'Second centre with us. Must open for the January term.'],
    ['c-iyer', 'Rohan & Divya Iyer', 'Residential', 'Rohan Iyer', 'rohan.iyer@example.com', '+91 98185 64020', 'Tower 6-1503, Ahinsa Khand 2', 'Indirapuram, Ghaziabad', 'UP', '', 'Google search', 'First home. Budget-conscious; asked for a value-engineered v2 before signing.'],
    ['c-bansal', 'Nisha Bansal', 'Residential', 'Nisha Bansal', 'nisha.b@example.com', '+91 98714 20963', 'C-3/14, Vasant Kunj', 'New Delhi', 'DL', '', 'Instagram', ''],
    ['c-chawla', 'Parul Chawla', 'Residential', 'Parul Chawla', 'parul.chawla@example.com', '+91 98112 64810', 'H-22, DLF Phase 3', 'Gurugram', 'HR', '', 'Walk-in', ''],
    ['c-khanna', 'Tara Khanna', 'Residential', 'Tara Khanna', 'tara.khanna@example.com', '+91 98184 03375', 'B-4/9, Safdarjung Enclave', 'New Delhi', 'DL', '', 'Website enquiry', ''],
    ['c-verma', 'Studio Verma Hospitality', 'Commercial', 'Aman Verma', 'aman@studioverma.example', '+91 99716 48022', '31, Hauz Khas Village', 'New Delhi', 'DL', '07AAMFV8821C1ZK', 'Referral', ''],
    ['c-nambiar', 'Aditi Nambiar', 'Residential', 'Aditi Nambiar', 'aditi.n@example.com', '+91 98102 59731', 'Golf Course Road, Sector 42', 'Gurugram', 'HR', '', 'Instagram', ''],
    ['c-bhatia', 'Suresh & Pooja Bhatia', 'Residential', 'Pooja Bhatia', 'pooja.bhatia@example.com', '+91 98733 81406', 'Villa 23, Sector 16B', 'Greater Noida West', 'UP', '', 'Website enquiry', 'Duplex. Pooja wants a prayer room with a stone jaali.'],
    ['c-mehra', 'Dev Mehra', 'Residential', 'Dev Mehra', 'dev.mehra@example.com', '+91 98117 30528', 'Penthouse 2, Golf Course Extension Road, Sector 65', 'Gurugram', 'HR', '', 'Referral · Kunal Saxena', 'Reads every line. Responds fastest on comments in the quote link.'],
    ['c-sinha', 'Anya Sinha', 'Residential', 'Anya Sinha', 'anya.sinha@example.com', '+91 98183 12697', 'J-12, Saket', 'New Delhi', 'DL', '', 'Instagram', 'Studio apartment, works from home.'],
    ['c-gill', 'Gaurav & Simran Gill', 'Residential', 'Simran Gill', 'simran.gill@example.com', '+91 98999 47025', 'Tower 4-0802, Sector 150', 'Noida', 'UP', '', 'Website enquiry', ''],
    ['c-dutta', 'Mira Dutta', 'Residential', 'Mira Dutta', 'mira.dutta@example.com', '+91 98103 86214', 'E-118, Chittaranjan Park', 'New Delhi', 'DL', '', 'Referral', ''],
    ['c-saffron', 'Saffron Leaf Cafés LLP', 'Commercial', 'Rhea Oberoi (Partner)', 'rhea@saffronleaf.example', '+91 98736 22091', 'Shop 4, Khan Market', 'New Delhi', 'DL', '07AAKFS9930L1ZD', 'Instagram', 'Third outlet. Wants the bar to read from the street.'],
    ['c-northgate', 'Northgate Physio Clinic', 'Commercial', 'Dr Kavita Rao', 'kavita@northgatephysio.example', '+91 98186 77410', 'A-12, Lajpat Nagar II', 'New Delhi', 'DL', '07AAJFN5512P1Z2', 'Google search', ''],
    ['c-oberoi', 'Rhea & Nikhil Oberoi', 'Residential', 'Nikhil Oberoi', 'nikhil.oberoi@example.com', '+91 98109 52336', 'Pocket 2, Mayur Vihar Phase 1', 'New Delhi', 'DL', '', 'Referral', '']
  ];

  /* ---------------- quotes ---------------- */
  // id, no, client, project name, template, scale, created(daysAgo), owner, outcome, more
  var QUOTES = [
    { id: 'q-sethi', no: 1031, c: 'c-sethi', name: 'Sethi Dental, GK II clinic fit-out', tpl: 'clinic', sc: 1, created: 206, owner: 'u-naina', out: 'won', signed: 191, proj: { code: 11, start: 184, pm: 'u-naina', eng: 'u-deepak', handed: 96 } },
    { id: 'q-malhotra', no: 1033, c: 'c-malhotra', name: 'Malhotra 2BHK refresh, Dwarka', tpl: 'refresh', sc: 1.05, created: 181, owner: 'u-kabir', out: 'won', signed: 171, proj: { code: 12, start: 165, pm: 'u-kabir', eng: 'u-sana', handed: 112 } },
    { id: 'q-bansal', no: 1034, c: 'c-bansal', name: 'Bansal kitchen and wardrobes', tpl: 'kitchen', sc: 1, created: 172, owner: 'u-kabir', out: 'lost', lost: 158, lostWhy: 'Chose a modular-kitchen brand showroom' },
    { id: 'q-rao', no: 1036, c: 'c-rao', name: 'Rao residence, 3BHK full interiors', tpl: 'full3', sc: 0.95, created: 152, owner: 'u-naina', out: 'won', signed: 139, proj: { code: 14, start: 132, pm: 'u-naina', eng: 'u-deepak' } },
    { id: 'q-chawla', no: 1037, c: 'c-chawla', name: 'Chawla duplex, living and dining', tpl: 'living', sc: 1.2, created: 136, owner: 'u-naina', out: 'lost', lost: 124, lostWhy: 'Project postponed to next year' },
    { id: 'q-kapoor', no: 1039, c: 'c-kapoor', name: 'Kapoor villa, full interiors', tpl: 'villa', sc: 1.06, created: 124, owner: 'u-kabir', out: 'won', signed: 92, vers: 3, proj: { code: 15, start: 86, pm: 'u-kabir', eng: 'u-imran' } },
    { id: 'q-saxena', no: 1040, c: 'c-saxena', name: 'Saxena penthouse, Vasant Vihar', tpl: 'full3', sc: 1.9, created: 112, owner: 'u-naina', out: 'won', signed: 97, vers: 2, proj: { code: 16, start: 91, pm: 'u-naina', eng: 'u-imran' } },
    { id: 'q-kestrel', no: 1042, c: 'c-kestrel', name: 'Kestrel Analytics, Noida office floor', tpl: 'office', sc: 1, created: 88, owner: 'u-kabir', out: 'won', signed: 71, vers: 2, proj: { code: 17, start: 64, pm: 'u-kabir', eng: 'u-deepak' } },
    { id: 'q-khanna', no: 1043, c: 'c-khanna', name: 'Khanna kitchen remodel', tpl: 'kitchen', sc: 0.9, created: 84, owner: 'u-naina', out: 'lost', lost: 71, lostWhy: 'Lower bid from a local carpenter' },
    { id: 'q-arbor', no: 1044, c: 'c-arbor', name: 'Arbor Learning, Sector 57 preschool', tpl: 'preschool', sc: 1, created: 78, owner: 'u-naina', out: 'won', signed: 59, proj: { code: 18, start: 53, pm: 'u-naina', eng: 'u-sana' } },
    { id: 'q-verma', no: 1045, c: 'c-verma', name: 'Studio Verma café, Hauz Khas', tpl: 'cafe', sc: 1.1, created: 66, owner: 'u-kabir', out: 'lost', lost: 52, lostWhy: 'Landlord did not renew the lease' },
    { id: 'q-nambiar', no: 1047, c: 'c-nambiar', name: 'Nambiar living room makeover', tpl: 'living', sc: 0.8, created: 44, owner: 'u-naina', out: 'lost', lost: 29, lostWhy: 'Went with a lower bid (about 14% cheaper)' },
    { id: 'q-iyer', no: 1048, c: 'c-iyer', name: 'Iyer residence, 3BHK interiors', tpl: 'full3', sc: 1, created: 41, owner: 'u-kabir', out: 'won', signed: 16, vers: 2, proj: { code: 19, start: 10, pm: 'u-kabir', eng: 'u-imran' } },
    { id: 'q-mehra', no: 1049, c: 'c-mehra', name: 'Mehra penthouse, living and dining', tpl: 'living', sc: 1.55, created: 36, owner: 'u-kabir', out: 'viewed', vers: 3 },
    { id: 'q-oberoi', no: 1050, c: 'c-oberoi', name: 'Oberoi 2BHK refresh', tpl: 'refresh', sc: 1, created: 24, owner: 'u-naina', out: 'viewed' },
    { id: 'q-bhatia', no: 1051, c: 'c-bhatia', name: 'Bhatia duplex, full interiors', tpl: 'villa', sc: 1.2, created: 22, owner: 'u-kabir', out: 'review', vers: 2 },
    { id: 'q-northgate', no: 1052, c: 'c-northgate', name: 'Northgate Physio, Lajpat Nagar', tpl: 'clinic', sc: 0.8, created: 12, owner: 'u-naina', out: 'rejected' },
    { id: 'q-saffron', no: 1053, c: 'c-saffron', name: 'Saffron Leaf, Khan Market café', tpl: 'cafe', sc: 0.9, created: 8, owner: 'u-kabir', out: 'review' },
    { id: 'q-dutta', no: 1054, c: 'c-dutta', name: 'Dutta kitchen and wardrobes', tpl: 'kitchen', sc: 1, created: 6, owner: 'u-naina', out: 'sent' },
    { id: 'q-sinha', no: 1055, c: 'c-sinha', name: 'Sinha studio apartment', tpl: 'refresh', sc: 0.55, created: 4, owner: 'u-kabir', out: 'approved' },
    { id: 'q-gill', no: 1056, c: 'c-gill', name: 'Gill residence, 3BHK', tpl: 'full3', sc: 1.1, created: 2, owner: 'u-naina', out: 'draft' }
  ];

  /* ---------------- vendors ---------------- */
  var VENDORS = [
    ['v-balaji', 'Shree Balaji Ply & Laminates', 'Carpentry', 'Kirti Nagar, New Delhi', 'DL', '07ABEPB3318K1ZJ', 'Mahesh Agarwal', 'Net 30', 4.6, 5],
    ['v-arora', 'Arora Modular Works', 'Carpentry', 'IMT Manesar, Gurugram', 'HR', '06AAOFA6620G1Z4', 'Gurpreet Arora', 'Net 15', 4.4, 21],
    ['v-vardhman', 'Vardhman Electricals', 'Electrical', 'Bhagirath Palace, Delhi', 'DL', '07AAEFV2209D1ZW', 'Sunil Jain', 'Net 15', 4.7, 2],
    ['v-gypcraft', 'Gypcraft Ceiling Systems', 'False ceiling', 'Sector 37, Gurugram', 'HR', '06AAJFG4471B1Z1', 'Rafiq Ahmed', 'Net 15', 4.1, 4],
    ['v-stonehouse', 'Stonehouse Tiles & Marble', 'Flooring', 'Kishangarh Road, Rajasthan depot at Sultanpur', 'DL', '07AAKFS7106Q1ZB', 'Vikas Sharma', 'Net 30', 4.5, 7],
    ['v-colourline', 'Colourline Coatings', 'Painting', 'Sector 24, Faridabad', 'HR', '06AACFC5521N1Z6', 'Neeraj Kaushik', 'Net 15', 4.3, 2],
    ['v-hariom', 'Hari Om Sanitary House', 'Plumbing', 'Chawri Bazar, Delhi', 'DL', '07AAAFH1182J1ZR', 'Om Prakash Gupta', 'Advance', 4.0, 3],
    ['v-loom', 'Loom & Weave Furnishings', 'Furniture & lighting', 'GT Road, Panipat', 'HR', '06AADFL3392E1Z9', 'Anjali Rathi', 'Net 30', 4.8, 14],
    ['v-lumiere', 'Lumière Lighting Studio', 'Furniture & lighting', 'Sultanpur, MG Road, New Delhi', 'DL', '07AAGFL6630M1Z5', 'Kiran Bedi Malhotra', 'Net 15', 4.2, 10],
    ['v-teak', 'Thar Teakwood Furniture', 'Furniture & lighting', 'Basni Industrial Area, Jodhpur', 'RJ', '08AAIFT2284K1ZM', 'Prakash Bhati', '50% advance', 4.5, 28],
    ['v-aqua', 'AquaSeal Waterproofing', 'Civil & waterproofing', 'Sector 63, Noida', 'UP', '09AAMFA4419C1Z0', 'Deepa Saini', 'Net 15', 4.4, 2]
  ];
  var VENDOR_FOR = { 'Carpentry': 'v-arora', 'Electrical': 'v-vardhman', 'False ceiling': 'v-gypcraft', 'Flooring': 'v-stonehouse', 'Painting': 'v-colourline', 'Plumbing': 'v-hariom', 'Furniture & lighting': 'v-loom', 'Civil & waterproofing': 'v-aqua' };
  MR.VENDOR_FOR = VENDOR_FOR;

  /* ---------------- project phases ---------------- */
  // name, categories, start, end (relative days on a 95-day base plan), trade label
  MR.PHASES = [
    ['Design sign-off & mobilisation', ['Design & supervision'], 0, 10],
    ['Demolition & civil', ['Civil & waterproofing'], 8, 22],
    ['Services first fix', ['Electrical', 'Plumbing'], 18, 36],
    ['False ceiling', ['False ceiling'], 30, 46],
    ['Flooring & tiling', ['Flooring'], 40, 58],
    ['Carpentry: factory & install', ['Carpentry'], 14, 72],
    ['Painting & polish', ['Painting'], 60, 80],
    ['Furniture, lighting & styling', ['Furniture & lighting'], 76, 88],
    ['Snagging & handover', [], 86, 95]
  ];
  MR.SCHEDULES = {
    '40/30/25/5': [['Booking advance on signing', 40, 0], ['On completion of services and false ceiling', 30, 3], ['On carpentry installation', 25, 5], ['On handover', 5, 8]],
    '50/40/10': [['Booking advance on signing', 50, 0], ['On carpentry installation', 40, 5], ['On handover', 10, 8]],
    '30/30/30/10': [['Booking advance on signing', 30, 0], ['On completion of civil and services', 30, 2], ['On carpentry installation', 30, 5], ['On handover', 10, 8]]
  };
  MR.makeMilestones = function (sections, start, value) {
    var cats = {}; sections.forEach(function (s) { s.items.forEach(function (i) { cats[i.cat] = (cats[i.cat] || 0) + MR.lineAmt(i); }); });
    var f = Math.max(0.55, Math.min(1.35, Math.pow((value || 3.5e6) / 3.5e6, 0.35)));
    var ms = [];
    MR.PHASES.forEach(function (ph, i) {
      var has = !ph[1].length || ph[1].some(function (c) { return cats[c]; });
      if (!has) return;
      ms.push({ id: 'm' + i, ph: i, name: ph[0], start: u.addD(start, Math.round(ph[2] * f)), end: u.addD(start, Math.round(ph[3] * f)), progress: 0, value: ph[1].reduce(function (a, c) { return a + (cats[c] || 0); }, 0) });
    });
    return ms;
  };
  MR.makeSchedule = function (key, ms, value) {
    return MR.SCHEDULES[key].map(function (s, i) {
      var m = ms.filter(function (x) { return x.ph === s[2]; })[0] || ms.filter(function (x) { return x.ph >= s[2]; })[0] || ms[ms.length - 1];
      return { id: 'ps' + i + u.uid(''), label: s[0], pct: s[1], msId: m.id, amount: Math.round(value * s[1] / 100), invoiceId: null };
    });
  };

  /* ================================================================== */
  MR.seed = function () {
    var RID = u.rng(7), realUid = u.uid;
    u.uid = function (pf) { return (pf || 'x') + ('000000' + Math.floor(RID() * 2176782336).toString(36)).slice(-6); };
    try { return seedInner(); } finally { u.uid = realUid; }
  };
  function seedInner() {
    var R = u.rng(20261124), T = u.today();
    function D(n) { return u.addD(T, -n); }
    function TS(n, h) { var d = u.pd(D(n)); d.setHours(h == null ? 10 + Math.floor(R() * 8) : h, Math.floor(R() * 60)); return d.toISOString(); }
    function pick(a) { return a[Math.floor(R() * a.length)]; }
    KEYN = 0;
    var S = { v: 5, role: 'owner', seq: { q: 1056, p: 19, inv: 117, po: 230, co: 0, snag: 0, pay: 0 }, company: {
      name: 'Marlow & Reed Interiors LLP', short: 'Marlow & Reed', gstin: '06AAMFM4821K1ZQ', pan: 'AAMFM4821K', state: 'HR',
      addr: ['Plot 42, Udyog Vihar Phase IV', 'Sector 18, Gurugram, Haryana 122015'], email: 'studio@marlowreed.example', web: 'marlowreed.example',
      bank: { name: 'Northfield Bank, Golf Course Road branch', ac: '5020 0071 4482 96', ifsc: 'NFBK0001842' }, cash: 3860000
    } };
    S.rates = buildRates();
    var byCode = {}; S.rates.forEach(function (r) { byCode[r.code] = r; });
    S.clients = CLIENTS.map(function (c, i) {
      return { id: c[0], name: c[1], kind: c[2], contact: c[3], email: c[4], phone: c[5], addr: c[6], city: c[7], state: c[8], gstin: c[9], source: c[10], note: c[11], created: D(220 - i * 9 > 2 ? 220 - i * 9 : 3), owner: i % 2 ? 'u-naina' : 'u-kabir' };
    });
    QUOTES.forEach(function (q) { var c = S.clients.filter(function (x) { return x.id === q.c; })[0]; c.created = D(q.created + 6); c.owner = q.owner; });
    S.vendors = VENDORS.map(function (v) { return { id: v[0], name: v[1], cat: v[2], city: v[3], state: v[4], gstin: v[5], contact: v[6], terms: v[7], rating: v[8], lead: v[9], phone: '+91 98' + (110 + Math.floor(R() * 800)) + ' ' + (10000 + Math.floor(R() * 89999)) }; });
    S.quotes = []; S.projects = []; S.invoices = []; S.payments = []; S.pos = []; S.logs = []; S.snags = []; S.audit = []; S.notifs = [];

    function A(at, by, entity, ref, action, detail) { S.audit.push({ id: u.uid('a'), at: at, by: by, entity: entity, ref: ref, action: action, detail: detail || '' }); }
    function client(id) { return S.clients.filter(function (c) { return c.id === id; })[0]; }

    /* ---------- quotes ---------- */
    QUOTES.forEach(function (spec, n) {
      var c = client(spec.c), created = D(spec.created);
      var q = { id: spec.id, no: 'Q-' + spec.no, clientId: c.id, name: spec.name, tpl: spec.tpl, site: c.addr, city: c.city, state: c.state, owner: spec.owner,
        status: 'draft', created: TS(spec.created, 11), validDays: 30, token: 'mr' + spec.no, versions: [], approvals: [], comments: [], log: [], sig: null, projectId: null, lostWhy: '', terms: '40/30/25/5' };
      var v1 = { n: 1, created: q.created, by: spec.owner, sections: buildSections(spec.tpl, spec.sc, S.rates, created), discPct: 0, note: 'First cut from site measurement' };
      q.versions.push(v1);
      A(q.created, spec.owner, 'quote', q.no, 'created', 'v1 from template “' + TPL[spec.tpl].name + '”');
      var nv = spec.vers || 1;
      // version stories
      var stories = {
        'q-kapoor': [
          { note: 'Client asked to swap engineered oak for vitrified tile in two bedrooms and drop the guest-room bed', ops: function (s) { swapRate(s, 'Bedroom 2', 'FL-501', null); dropCode(s, 'Guest bedroom', 'CP-407'); scaleCode(s, "Kids' room", 'CP-402', 0.9); }, disc: 0, daysAfter: 9 },
          { note: 'Final: added grab rails and anti-skid tiles for parents; 3% goodwill discount', ops: function (s) { addCode(s, 'Bathrooms (4)', 'FL-507', 120); scaleCode(s, 'Living & dining', 'EL-206', 0.75); }, disc: 3, daysAfter: 16 }
        ],
        'q-saxena': [{ note: 'Upgraded living room to imported marble; added wallpaper in master', ops: function (s) { addCode(s, 'Living & dining', 'FL-504', 380); dropCode(s, 'Living & dining', 'FL-502'); addCode(s, 'Master bedroom', 'PT-605', 4); }, disc: 2, daysAfter: 8 }],
        'q-kestrel': [{ note: 'Revised seat count from 56 to 52; carpet tile instead of vinyl in cabins', ops: function (s) { scaleCode(s, 'Open workstations', 'CP-411', 52 / 56); scaleCode(s, 'Open workstations', 'FN-706', 52 / 56); }, disc: 4, daysAfter: 10 }],
        'q-iyer': [{ note: 'Value-engineered: laminate shutters in master, tile instead of oak, fewer profile lights', ops: function (s) { swapRate(s, 'Master bedroom', 'CP-402', 'CP-403'); swapRate(s, 'Living & dining', 'FL-501', 'FL-502'); swapRate(s, 'Master bedroom', 'FL-501', 'FL-502'); scaleCode(s, 'Living & dining', 'EL-205', 0.5); dropCode(s, 'Living & dining', 'FN-704'); }, disc: 2.5, daysAfter: 14 }],
        'q-mehra': [
          { note: 'Removed dining set (client sourcing their own); walnut veneer on TV wall', ops: function (s) { dropCode(s, 'Living & dining', 'FN-702'); scaleCode(s, 'Living & dining', 'CP-406', 1.2); }, disc: 0, daysAfter: 14 },
          { note: 'Trimmed lighting, added limewash on two walls, 2% discount for quick sign-off', ops: function (s) { scaleCode(s, 'Living & dining', 'EL-205', 0.7); scaleCode(s, 'Living & dining', 'PT-602', 1.8); dropCode(s, 'Living & dining', 'FN-704'); addCode(s, 'Living & dining', 'FN-705', 1); }, disc: 2, daysAfter: 15 }
        ],
        'q-bhatia': [{ note: 'Client changes: prayer room with stone jaali, fewer wardrobes, 4% discount', ops: function (s) { addSection(s, 'Prayer room', [['CP-406', 60], ['FL-504', 50], ['EL-206', 6], ['FC-302', 50]]); scaleCode(s, 'Bedroom 2', 'CP-402', 0.8); }, disc: 4, daysAfter: 13 }]
      };
      var vs = stories[q.id] || [];
      var vdate = spec.created;
      for (var k = 1; k < nv; k++) {
        var st = vs[k - 1]; vdate -= st.daysAfter;
        var secs = cloneSections(q.versions[k - 1].sections);
        st.ops(secs, D(vdate));
        q.versions.push({ n: k + 1, created: TS(vdate, 12), by: spec.owner, sections: secs, discPct: st.disc, note: st.note });
      }
      // statuses and timeline
      var o = spec.out, sentGap = 3;
      function sendVer(v, daysAgo, approver) {
        var at = TS(daysAgo, 15);
        q.approvals.push({ v: v.n, by: approver || 'u-ira', at: TS(daysAgo, 12), decision: 'approved', comment: '' });
        A(TS(daysAgo, 12), approver || 'u-ira', 'quote', q.no, 'approved', 'v' + v.n + ' approved for sending');
        v.sentAt = at; A(at, spec.owner, 'quote', q.no, 'sent', 'v' + v.n + ' sent to ' + c.contact);
      }
      // send each historical version
      q.versions.forEach(function (v, i) {
        var vAgo = Math.round((Date.now() - new Date(v.created)) / 864e5);
        var last = i === q.versions.length - 1;
        if (!last || ['won', 'lost', 'viewed', 'sent', 'review', 'rejected'].indexOf(o) > -1) {
          if (last && (o === 'review' || o === 'rejected')) return;
          sendVer(v, Math.max(1, vAgo - sentGap));
          var viewedAgo = Math.max(0, vAgo - sentGap - 1);
          if (!(last && o === 'sent')) { v.viewedAt = TS(viewedAgo, 20); A(v.viewedAt, 'client', 'quote', q.no, 'viewed', c.contact + ' opened v' + v.n); }
          if (!last) { A(TS(Math.max(0, viewedAgo - 1), 19), 'client', 'quote', q.no, 'changes requested', c.contact + ': ' + (q.versions[i + 1].note.split(';')[0])); }
        }
      });
      var lv = MR.ver(q);
      if (o === 'won') {
        q.status = 'signed';
        var sat = TS(spec.signed, 18);
        q.sig = { v: lv.n, name: c.contact.replace(/\s*\(.*\)/, '').replace(/^Dr\s+/, 'Dr '), mode: 'typed', at: sat, ip: 'client device' };
        A(sat, 'client', 'quote', q.no, 'signed', 'e-signed v' + lv.n + ' by ' + q.sig.name);
      } else if (o === 'lost') { q.status = 'lost'; q.lostWhy = spec.lostWhy; A(TS(spec.lost, 16), spec.owner, 'quote', q.no, 'marked lost', spec.lostWhy); }
      else if (o === 'viewed') q.status = 'viewed';
      else if (o === 'sent') q.status = 'sent';
      else if (o === 'review') { q.status = 'review'; lv.submittedAt = TS(1, 18); A(lv.submittedAt, spec.owner, 'quote', q.no, 'submitted', 'v' + lv.n + ' submitted for approval'); }
      else if (o === 'rejected') {
        q.status = 'rejected'; lv.submittedAt = TS(3, 17);
        A(lv.submittedAt, spec.owner, 'quote', q.no, 'submitted', 'v1 submitted for approval');
        q.approvals.push({ v: 1, by: 'u-ira', at: TS(2, 10), decision: 'rejected', comment: 'Margin on operatory carpentry is under our 18% floor, and we have not priced the lead-lined X-ray room the doctor mentioned. Re-price CP-410 and add a provisional sum before this goes out.' });
        A(TS(2, 10), 'u-ira', 'quote', q.no, 'rejected', 'Returned with comments');
        lv.sections[1].items.forEach(function (i) { if (i.code === 'CP-410') { i.rate = Math.round(i.rate * 0.9); } });
      } else if (o === 'approved') {
        lv.submittedAt = TS(1, 11); A(lv.submittedAt, spec.owner, 'quote', q.no, 'submitted', 'v1 submitted for approval');
        q.status = 'approved'; q.approvals.push({ v: 1, by: 'u-ira', at: TS(0, 9), decision: 'approved', comment: 'Good to go. Mention the 10-year ply warranty in the cover note.' }); A(TS(0, 9), 'u-ira', 'quote', q.no, 'approved', 'v1 approved');
      }
      if (q.id === 'q-saffron') lv.discPct = 9;
      if (q.id === 'q-bhatia') q.comments.push({ id: u.uid('cm'), v: 1, key: null, by: 'client', who: 'Pooja Bhatia', at: TS(17, 20), text: 'We love it overall. Can we add a small prayer room with a stone jaali, and reduce wardrobes in bedroom 2? Budget is the main concern.', kind: 'changes' });
      if (q.id === 'q-mehra') {
        var liv = lv.sections[0];
        var tv = liv.items.filter(function (i) { return i.code === 'CP-404'; })[0], dl = liv.items.filter(function (i) { return i.code === 'EL-206'; })[0];
        q.comments.push({ id: u.uid('cm'), v: 3, key: tv.key, by: 'client', who: 'Dev Mehra', at: TS(4, 21), text: 'Can the TV unit be in walnut instead of oak? Happy to pay the difference if it is reasonable.' });
        q.comments.push({ id: u.uid('cm'), v: 3, key: tv.key, by: 'u-kabir', who: 'Kabir Sood', at: TS(3, 10), text: 'Yes. Walnut veneer adds about ₹14,000 on this unit. I will reflect it in the next version if you confirm.' });
        q.comments.push({ id: u.uid('cm'), v: 3, key: dl.key, by: 'client', who: 'Dev Mehra', at: TS(2, 22), text: '16 downlights feels like a lot for this room. Could we do 10 and rely on the profile lights?' });
      }
      if (q.id === 'q-oberoi') q.followUp = D(-1);
      S.quotes.push(q);
    });

    function findItem(secs, room, code) { var s = secs.filter(function (x) { return x.title === room; })[0]; if (!s) return null; return { s: s, i: s.items.filter(function (i) { return i.code === code; })[0] }; }
    function dropCode(secs, room, code) { var f = findItem(secs, room, code); if (f && f.i) f.s.items.splice(f.s.items.indexOf(f.i), 1); }
    function scaleCode(secs, room, code, k) { var f = findItem(secs, room, code); if (f && f.i) f.i.qty = Math.max(1, Math.round(f.i.qty * k)); }
    function addCode(secs, room, code, qty) { var s = secs.filter(function (x) { return x.title === room; })[0]; if (s) s.items.push(lineFrom(byCode[code], qty, null)); }
    function swapRate(secs, room, toCode, fromCode) {
      var s = secs.filter(function (x) { return x.title === room; })[0]; if (!s) return;
      var cat = byCode[toCode].cat, idx = -1;
      s.items.forEach(function (i, j) { if ((fromCode && i.code === fromCode) || (!fromCode && i.cat === cat && i.code !== toCode && idx < 0)) idx = j; });
      if (idx < 0) return; var old = s.items[idx], nl = lineFrom(byCode[toCode], old.qty, null); nl.key = old.key; s.items[idx] = nl;
    }
    function addSection(secs, title, rows) { secs.splice(secs.length - 2, 0, { id: u.uid('s'), key: 's-' + title.toLowerCase().replace(/\W+/g, '-'), title: title, items: rows.map(function (r) { return lineFrom(byCode[r[0]], r[1], null); }) }); }

    /* ---------- projects, billing, procurement, site ---------- */
    var ENG_PHOTOS = { 0: ['s-office-shell.jpg', 's-shell.jpg'], 1: ['s-demolition.jpg', 's-shell.jpg'], 2: ['s-electrical.jpg', 's-services.jpg'], 3: ['s-gypsum-frame.jpg', 's-plaster-lights.jpg', 's-partition.jpg'], 4: ['s-tile.jpg'], 5: ['s-joinery.jpg', 's-marking.jpg', 's-niche.jpg'], 6: ['s-paint.jpg', 's-putty.jpg'], 7: ['s-kitchen-wrap.jpg'], 8: ['s-ladder.jpg'] };
    var COVERS = { 'q-sethi': 'p-studio.jpg', 'q-malhotra': 'p-lounge.jpg', 'q-rao': 'p-living.jpg', 'q-kapoor': 'p-villa.jpg', 'q-saxena': 'p-family.jpg', 'q-kestrel': 'p-office.jpg', 'q-arbor': 'p-kitchen2.jpg', 'q-iyer': 'p-kitchen.jpg' };
    var invList = [];
    QUOTES.filter(function (x) { return x.proj; }).forEach(function (spec) {
      var q = S.quotes.filter(function (x) { return x.id === spec.id; })[0], c = client(q.clientId), pj = spec.proj;
      var cv = MR.calc(q), start = D(pj.start);
      var p = { id: 'p-' + spec.id.slice(2), code: 'MR-P-26-' + u.pad(pj.code, 3), quoteId: q.id, clientId: c.id, name: q.name, site: q.site, city: q.city, state: q.state,
        pm: pj.pm, eng: pj.eng, start: start, value: Math.round(cv.taxable), cost: Math.round(cv.cost), status: 'active', cover: COVERS[q.id], terms: '40/30/25/5', cos: [], handedAt: null, created: TS(pj.start + 2, 11) };
      p.milestones = MR.makeMilestones(MR.ver(q).sections, start, p.value);
      p.end = p.milestones[p.milestones.length - 1].end;
      // progress at today
      var elapsed = pj.start;
      var lag = { 'q-saxena': 8, 'q-kestrel': 9, 'q-rao': 0, 'q-kapoor': 0, 'q-arbor': 2, 'q-iyer': 0 }[q.id] || 0;
      p.milestones.forEach(function (m) {
        var s0 = u.diffD(start, m.start), e0 = u.diffD(start, m.end), t = elapsed - lag;
        var pr = pj.handed ? 100 : t <= s0 ? 0 : t >= e0 ? 100 : Math.round((t - s0) / (e0 - s0) * 100);
        m.progress = Math.max(0, Math.min(100, Math.round(pr / 5) * 5));
        if (m.progress === 100) m.doneAt = u.addD(m.end, Math.round(lag / 2));
      });
      if (q.id === 'q-rao') { p.status = 'snagging'; var hm = p.milestones[p.milestones.length - 1]; hm.progress = 60; hm.doneAt = null; hm.start = D(8); hm.end = D(-6); p.end = hm.end; }
      if (q.id === 'q-kestrel') { p.milestones.forEach(function (m) { if (m.ph === 2) { m.progress = 80; m.doneAt = null; m.end = D(6); } if (m.ph === 3) { m.progress = Math.min(m.progress, 35); m.doneAt = null; } }); }
      if (q.id === 'q-saxena') { p.milestones.forEach(function (m) { if (m.ph === 5) { m.progress = 100; m.doneAt = D(2); } }); }
      if (pj.handed) { p.status = 'handed'; p.handedAt = D(pj.handed); p.milestones.forEach(function (m) { m.doneAt = m.doneAt || m.end; }); }
      p.schedule = MR.makeSchedule('40/30/25/5', p.milestones, p.value);
      q.projectId = p.id; q.status = 'converted';
      A(TS(pj.start + 2, 11), pj.pm, 'project', p.code, 'created', 'Converted from ' + q.no + ' v' + MR.ver(q).n + ' · ' + u.lakh(p.value) + ' + GST');
      S.projects.push(p);

      // invoices for schedule entries whose milestone is done (booking: on signing)
      p.schedule.forEach(function (ps, i) {
        var m = p.milestones.filter(function (x) { return x.id === ps.msId; })[0];
        var dt = i === 0 ? D(spec.signed - 1) : (m.progress === 100 ? (m.doneAt || m.end) : null);
        if (q.id === 'q-rao' && i === 3) dt = null;
        var ov = { 'q-saxena:1': 45, 'q-rao:2': 19 }[q.id + ':' + i]; if (ov && dt) dt = D(ov);
        if (q.id === 'q-saxena' && i === 2) dt = null;
        if (!dt || dt > T) return;
        invList.push({ p: p, ps: ps, date: dt, kind: 'stage', idx: i });
      });
      // change orders
      var cos = {
        'q-kapoor': [{ title: 'Engineered oak in bedrooms 2 and kids', reason: 'Client upgrade after seeing the master bedroom mock-up', rows: [['FL-502', 320]], status: 'approved', at: 41 }],
        'q-saxena': [{ title: 'Imported marble in powder room', reason: 'Client request during site visit', rows: [['FL-504', 90], ['CV-106', 90]], status: 'rejected', at: 30 }],
        'q-arbor': [
          { title: 'Additional storage cubbies in classrooms', reason: 'Director wants one cubby per child (24 per room)', rows: [['CP-414', 52]], status: 'approved', at: 26 },
          { title: 'Acoustic panels in activity hall', reason: 'Echo measured at 1.9 s RT60 after ceiling install; target under 0.8 s', rows: [['FN-708', 520], ['EL-206', 8]], status: 'sent', at: 3 }
        ],
        'q-kestrel': [{ title: 'Two phone booths near workstations', reason: 'Client request after seat count reduction', rows: [['CV-103', 160], ['FN-708', 140], ['EL-202', 4], ['EL-206', 4]], status: 'draft', at: 1 }]
      }[q.id] || [];
      cos.forEach(function (co, k) {
        var items = co.rows.map(function (r) { return lineFrom(byCode[r[0]], r[1], null); });
        var amt = Math.round(items.reduce(function (a, i) { return a + MR.lineAmt(i); }, 0));
        var o = { id: u.uid('co'), projectId: p.id, no: 'CO-' + u.pad(k + 1, 2), title: co.title, reason: co.reason, items: items, amount: amt, status: co.status, created: TS(co.at + 2, 12), by: p.pm, token: 'co' + p.code.slice(-3) + (k + 1) };
        A(o.created, p.pm, 'change order', p.code + ' ' + o.no, 'created', co.title + ' · ' + u.lakh(amt));
        if (co.status !== 'draft') { o.sentAt = TS(co.at + 1, 16); A(o.sentAt, p.pm, 'change order', p.code + ' ' + o.no, 'sent', 'Sent to client for approval'); }
        if (co.status === 'approved' || co.status === 'rejected') { o.decidedAt = TS(co.at, 20); o.signedBy = c.contact.replace(/\s*\(.*\)/, ''); A(o.decidedAt, 'client', 'change order', p.code + ' ' + o.no, co.status, (co.status === 'approved' ? 'Approved' : 'Declined') + ' by ' + o.signedBy); }
        if (co.status === 'rejected') o.clientNote = 'Let us hold this for now. We will revisit after Diwali.';
        p.cos.push(o);
        if (co.status === 'approved') {
          var ps = { id: u.uid('ps'), label: o.no + ': ' + o.title + ' (100% on approval)', pct: null, msId: null, amount: amt, invoiceId: null, coId: o.id };
          p.schedule.push(ps);
          invList.push({ p: p, ps: ps, date: D(co.at - 1), kind: 'co' });
        }
      });
      S.seq.co += cos.length;

      // procurement: one PO per trade with material from BOQ
      var trades = {};
      MR.ver(q).sections.forEach(function (s) { s.items.forEach(function (i) { if (i.mat > 0) { (trades[i.cat] = trades[i.cat] || []).push({ s: s, i: i }); } }); });
      var order = ['Electrical', 'Civil & waterproofing', 'Plumbing', 'False ceiling', 'Carpentry', 'Flooring', 'Painting', 'Furniture & lighting'];
      order.forEach(function (cat) {
        var rows = trades[cat]; if (!rows) return;
        var ph = MR.PHASES.map(function (x) { return x[1].indexOf(cat) > -1; }).indexOf(true);
        var m = p.milestones.filter(function (x) { return x.ph === ph; })[0]; if (!m) return;
        var issueDate = u.addD(m.start, -6), vendor = VENDOR_FOR[cat];
        if (issueDate > T) return;
        var grouped = {}; rows.forEach(function (r) { var g = grouped[r.i.code]; if (!g) grouped[r.i.code] = g = { code: r.i.code, desc: r.i.name, unit: r.i.unit, qty: 0, rate: Math.round(r.i.mat * (0.94 + R() * 0.1)), keys: [], rooms: [] }; g.qty += Math.round(MR.lineQty(r.i)); g.keys.push(r.i.key); g.rooms.push(r.s.title); });
        var lines = Object.keys(grouped).map(function (k) { var g = grouped[k]; return { id: u.uid('pl'), code: g.code, desc: g.desc, unit: g.unit, qty: g.qty, rate: g.rate, keys: g.keys, rooms: g.rooms, recd: 0 }; });
        var vd = S.vendors.filter(function (x) { return x.id === vendor; })[0];
        var expected = u.addD(issueDate, Math.min(vd.lead, 24));
        var po = { id: u.uid('po'), no: 'MR-PO-' + (++S.seq.po), vendorId: vendor, projectId: p.id, date: issueDate, expected: expected, lines: lines, status: 'issued', deliveries: [], by: p.pm, note: '' };
        A(TS(u.diffD(issueDate, T), 11), p.pm, 'purchase order', po.no, 'issued', vd.name + ' · ' + p.code);
        // deliveries
        var late = q.id === 'q-kestrel' && cat === 'False ceiling';
        if (late) { po.expected = D(4); po.note = 'Vendor says gypsum boards are held at the Bahadurgarh depot due to GRAP truck restrictions.'; }
        if (pj.handed || (expected < D(2) && !late)) {
          var dd = expected < T ? expected : D(1);
          po.lines.forEach(function (l) { l.recd = l.qty; });
          po.deliveries.push({ id: u.uid('dl'), date: dd, by: p.eng, note: 'Received in full. Checked against challan.', qtys: po.lines.map(function (l) { return l.qty; }) });
          po.status = 'delivered'; A(TS(u.diffD(dd, T), 15), p.eng, 'purchase order', po.no, 'delivery', 'Full delivery received at site');
        } else if (!late && issueDate < D(4) && cat === 'Carpentry') {
          po.lines.forEach(function (l, j) { l.recd = j % 2 ? 0 : Math.round(l.qty * 0.6); });
          po.deliveries.push({ id: u.uid('dl'), date: D(3), by: p.eng, note: 'First lot of carcasses. Shutters next week.', qtys: po.lines.map(function (l) { return l.recd; }) });
          po.status = 'partial'; A(TS(3, 16), p.eng, 'purchase order', po.no, 'delivery', 'Part delivery received');
        }
        if (po.status === 'issued' && po.expected < T && !late) po.expected = D(-3 - Math.floor(R() * 6));
        S.pos.push(po);
      });

      // site logs and snags for live projects
      var eng = pj.eng;
      if (!pj.handed) {
        var days = Math.min(pj.start, q.id === 'q-iyer' ? 9 : 14);
        for (var d = days; d >= 1; d--) {
          var date = D(d), wd = u.pd(date).getDay(); if (wd === 0) continue;
          var t = pj.start - d - lag;
          var active = p.milestones.filter(function (m) { var s0 = u.diffD(start, m.start), e0 = u.diffD(start, m.end); return t >= s0 && t <= e0 && m.ph !== 0; });
          if (!active.length) active = [p.milestones[0]];
          var focus = active[active.length - 1];
          var trade = MR.PHASES[focus.ph];
          var smog = d <= 9 && d >= 4;
          var log = { id: u.uid('lg'), projectId: p.id, date: date, by: eng, at: TS(d, 18), weather: smog ? 'Smog · AQI ' + (300 + Math.floor(R() * 80)) : pick(['Clear', 'Clear', 'Hazy', 'Cool morning']),
            crew: { carpenters: focus.ph === 5 ? 4 + Math.floor(R() * 4) : Math.floor(R() * 2), electricians: focus.ph === 2 ? 3 : Math.floor(R() * 2), painters: focus.ph === 6 ? 4 + Math.floor(R() * 3) : 0, masons: focus.ph <= 1 || focus.ph === 4 ? 3 : 0, helpers: 2 + Math.floor(R() * 3) },
            work: workText(focus.ph, active, R), issues: '', photos: [] };
          var pool = ENG_PHOTOS[focus.ph] || ENG_PHOTOS[0];
          if (R() < 0.75) log.photos.push(pool[Math.floor(R() * pool.length)]);
          if (R() < 0.35) { var p2 = pool[Math.floor(R() * pool.length)]; if (log.photos.indexOf(p2) < 0) log.photos.push(p2); }
          if (smog && d === 7) log.issues = 'GRAP Stage III in force: no cutting or grinding outside the flat. Wet cutting only; dust screens up on balcony.';
          if (q.id === 'q-kestrel' && d === 4) log.issues = 'Gypsum boards not delivered (PO held at depot). Ceiling crew moved to cabin partitions.';
          if (q.id === 'q-saxena' && d === 2) log.issues = 'Client asked to hold painting in master until the wallpaper swatch is approved.';
          S.logs.push(log);
        }
      }
      var snagSets = {
        'q-rao': [['Wardrobe shutter misaligned, 3 mm gap at top', 'Master bedroom', 'Carpentry', 'medium', 'open', 6], ['Paint touch-up behind switchboards', 'Living & dining', 'Painting', 'low', 'open', 6], ['Kitchen sink mixer leaking at base', 'Kitchen & utility', 'Plumbing', 'high', 'progress', 5], ['Cove light flicker, one driver', 'Living & dining', 'Electrical', 'medium', 'closed', 9], ['Grout stains on bathroom 2 floor', 'Bathrooms (3)', 'Flooring', 'low', 'closed', 10]],
        'q-kapoor': [['Door frame out of plumb, bedroom 2', 'Bedroom 2', 'Carpentry', 'medium', 'open', 3], ['Hairline crack in ceiling joint near AC duct', 'Living & dining', 'False ceiling', 'low', 'closed', 8]],
        'q-saxena': [['Marble lippage over 1 mm near balcony door', 'Living & dining', 'Flooring', 'high', 'open', 4], ['Socket height wrong behind bed (needs 450 mm)', 'Master bedroom', 'Electrical', 'medium', 'progress', 6], ['Scratch on lacquered glass shutter', 'Master bedroom', 'Carpentry', 'medium', 'open', 1]],
        'q-kestrel': [['Floor trench cover rocking at desk row C', 'Open workstations', 'Electrical', 'medium', 'open', 2]],
        'q-arbor': [['Sharp edge on cubby, classroom 2', 'Classrooms (4)', 'Carpentry', 'high', 'closed', 7], ['Ceiling access panel missing in activity hall', 'Activity hall', 'False ceiling', 'low', 'open', 2]],
        'q-sethi': [['Chair-side outlet not on UPS circuit', 'Operatories (3)', 'Electrical', 'high', 'closed', 100]]
      }[q.id] || [];
      snagSets.forEach(function (sn) {
        var o = { id: u.uid('sn'), no: 'SN-' + u.pad(++S.seq.snag, 3), projectId: p.id, title: sn[0], room: sn[1], trade: sn[2], sev: sn[3], status: sn[4], raised: TS(sn[5], 13), by: eng, assignee: sn[2], due: D(sn[5] - 4), photo: (ENG_PHOTOS[MR.PHASES.map(function (x) { return x[1].indexOf(sn[2]) > -1; }).indexOf(true)] || ['s-ladder.jpg'])[0], closeNote: '', closePhoto: '' };
        if (sn[4] === 'closed') { o.closedAt = TS(Math.max(0, sn[5] - 3), 17); o.closeNote = 'Rectified and checked with client representative.'; o.closePhoto = 's-niche.jpg'; A(o.closedAt, eng, 'snag', o.no, 'closed', o.title); }
        A(o.raised, eng, 'snag', o.no, 'raised', o.title + ' · ' + sn[1]);
        S.snags.push(o);
      });
    });

    // number invoices chronologically, generate payments
    invList.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    invList.forEach(function (x) {
      var p = x.p, c = client(p.clientId), commercial = c.kind === 'Commercial';
      var no = 'MR/' + u.fy(x.date) + '/' + u.pad(++S.seq.inv, 4);
      var lines = x.kind === 'co' ? [{ desc: x.ps.label, sac: '995472', amt: x.ps.amount }] : [{ desc: x.ps.label + ' (' + x.ps.pct + '% of contract value ' + u.inr(p.value) + ')', sac: '995472', amt: x.ps.amount }];
      var t = MR.invTotals(lines, p.state);
      var iv = { id: u.uid('iv'), no: no, projectId: p.id, clientId: c.id, date: x.date, due: u.addD(x.date, commercial ? 15 : 7), lines: lines, taxable: t.taxable, cgst: t.cgst, sgst: t.sgst, igst: t.igst, total: t.total, state: p.state, psId: x.ps.id, by: 'u-rakesh', note: '' };
      x.ps.invoiceId = iv.id;
      S.invoices.push(iv);
      A(TS(u.diffD(x.date, T), 12), 'u-rakesh', 'invoice', no, 'raised', p.code + ' · ' + u.inr(t.total));
      // payments
      var pid = p.id, last = x.date, story = null;
      if (pid === 'p-saxena' && x.idx === 1) story = 'unpaid';
      if (pid === 'p-sethi' && x.idx === 3) story = 'unpaid';
      if (pid === 'p-rao' && x.idx === 2) story = 'part';
      if (pid === 'p-iyer' && x.idx === 0) story = 'split';
      if (pid === 'p-kapoor' && x.kind === 'co') story = u.diffD(x.date, T) < 8 ? 'unpaid' : null;
      var tds = commercial ? Math.round(t.taxable * 0.02) : 0;
      function pay(amount, dAfter, mode, tdsAmt) {
        var date = u.addD(last, dAfter); if (date > T) date = T;
        var o = { id: u.uid('pm'), invoiceId: iv.id, clientId: c.id, projectId: p.id, date: date, amount: amount, tds: tdsAmt || 0, mode: mode, ref: utr(mode, R), by: 'u-rakesh', note: '' };
        S.payments.push(o); A(TS(u.diffD(date, T), 16), 'u-rakesh', 'payment', no, 'recorded', u.inr(amount) + ' via ' + mode + (tdsAmt ? ' (TDS ' + u.inr(tdsAmt) + ')' : ''));
      }
      if (story === 'unpaid') return;
      if (story === 'part') { pay(Math.round(t.total * 0.7), 6, 'NEFT'); return; }
      if (story === 'split') { pay(500000, 1, 'UPI'); pay(t.total - 500000, 5, 'RTGS'); return; }
      var gap = 2 + Math.floor(R() * (commercial ? 12 : 6));
      if (u.addD(last, gap) > T) { if (u.diffD(x.date, T) > 3) pay(t.total - tds, u.diffD(x.date, T) - 1, commercial ? 'RTGS' : 'NEFT', tds); return; }
      pay(t.total - tds, gap, commercial ? 'RTGS' : pick(['NEFT', 'NEFT', 'IMPS', 'Cheque']), tds);
    });
    S.seq.pay = S.payments.length;

    /* collection remarks: what was said on the last follow-up (shown first on every card) */
    function inv(pid, idx) { var p = S.projects.filter(function (x) { return x.id === pid; })[0]; var ps = p && p.schedule[idx]; return ps && ps.invoiceId && S.invoices.filter(function (i) { return i.id === ps.invoiceId; })[0]; }
    function rm(iv, list) { if (!iv) return; iv.remarks = list.map(function (r) { return { id: u.uid('rm'), at: TS(r[0], r[1]), by: 'u-rakesh', outcome: r[2], note: r[3], next: r[4] == null ? null : D(r[4]), promise: r[5] == null ? null : D(r[5]) }; }); }
    rm(inv('p-saxena', 1), [[30, 11, 'promised', 'Ritu (Kunal’s EA) confirmed it is in the payment run on the 15th.', 23, 23], [9, 16, 'callback', 'Kunal is travelling. Ritu says he wants to see the master-bedroom paint patch before releasing. Call Thursday.', 2]]);
    rm(inv('p-rao', 2), [[8, 18, 'dispute', 'Vikram paid 70%. Holding ₹2.98 L until the kitchen mixer leak (SN-003) is fixed.', -2]]);
    rm(inv('p-sethi', 3), [[40, 12, 'dispute', 'Dr Sethi is holding the 5% retention until the defect period ends in December.', 21], [6, 10, 'noanswer', 'Clinic reception says he is in surgery till 6 pm.', -1]]);
    S.discReqs = [
      { id: 'dr1', quoteId: 'q-mehra', by: 'u-kabir', pct: 3, at: TS(0, 10), reason: 'Dev will sign this week if we land under ₹14 L. He is comparing us with one other studio; walnut on the TV wall is already in v3.', status: 'pending' },
      { id: 'dr2', quoteId: 'q-oberoi', by: 'u-naina', pct: 2, at: TS(1, 17), reason: 'Referral from the Rao family. Asking for 2% as a referral thank-you; no scope change.', status: 'pending' }
    ];
    S.projects.forEach(function (p) {
      (p.cos || []).forEach(function (co) { if (co.status === 'draft') { co.internal = 'pending'; co.submittedAt = TS(0, 12); } });
      p.siteContact = { 'p-kapoor': 'Meenal Kapoor (owner)', 'p-saxena': 'Ritu Anand, Kunal’s EA', 'p-kestrel': 'Priya Nair, admin head', 'p-rao': 'Leena Rao', 'p-sethi': 'Dr Arjun Sethi', 'p-malhotra': 'Ishaan Malhotra' }[p.id] || '';
    });
    [['p-kapoor', 'Sofa and rug delivery Thursday 10 am; lift booked 9–11. Keep the dining wall clear for the pendant crew.'], ['p-saxena', 'Hold painting in the master until Kunal approves the wallpaper swatch. Marble lippage near the balcony still open.']].forEach(function (x) { var l = S.logs.filter(function (g) { return g.projectId === x[0]; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0]; if (l) l.next = x[1]; });
    S.clients.forEach(function (c) { if (c.id === 'c-northgate') c.gstin = ''; if (c.id === 'c-gill') c.email = ''; if (c.id === 'c-oberoi') c.phone = ''; });

    // finished projects: mark handed-over, seed a final daily log
    S.projects.forEach(function (p) { if (p.status === 'handed') { S.logs.push({ id: u.uid('lg'), projectId: p.id, date: p.handedAt, by: p.eng, at: p.handedAt + 'T17:30:00.000Z', weather: 'Clear', crew: { carpenters: 1, electricians: 1, painters: 1, masons: 0, helpers: 2 }, work: 'Final clean, handover walk-through with client, keys and warranty folder handed over.', issues: '', photos: [p.cover] }); } });

    // notifications
    function N(daysAgo, to, text, href, kind, readBy) { S.notifs.push({ id: u.uid('n'), at: TS(daysAgo, 9 + Math.floor(R() * 9)), to: to, text: text, href: href, kind: kind || 'info', read: readBy || [] }); }
    N(0, ['owner'], 'Kabir submitted Q-1051 v2 (Bhatia duplex) for your approval', '#/quote/q-bhatia', 'approve');
    N(0, ['owner'], 'Saffron Leaf quote has a 9% discount, above the 7.5% policy limit', '#/quote/q-saffron', 'warn');
    N(0, ['owner', 'pm'], 'Dev Mehra commented on 2 lines of Q-1049 v3', '#/quote/q-mehra', 'comment');
    N(1, ['owner', 'pm', 'accounts'], 'Arbor Learning has not approved CO-02 (acoustic panels) yet', '#/project/p-arbor?tab=cos', 'warn');
    N(1, ['owner', 'accounts'], 'MR/' + u.fy(T) + ' invoice for Saxena penthouse is overdue', '#/receivables', 'bad');
    N(2, ['pm', 'site', 'owner'], 'Gypsum boards for Kestrel are 4 days late (MR-PO held at depot)', '#/project/p-kestrel?tab=purchase', 'warn');
    N(3, ['owner', 'accounts'], 'Iyer residence: ₹5,00,000 received by UPI', '#/payments', 'ok', ['owner']);
    N(4, ['site'], 'GRAP Stage III in Delhi NCR: wet cutting only, dust screens on all sites', '#/site', 'warn');
    N(5, ['owner', 'pm'], 'Rate change: FC-302 gypsum cove ceiling v3 (board price +3%)', '#/rates?q=FC-302', 'info', ['owner']);
    N(6, ['site'], 'New snag assigned to you: marble lippage near balcony door (Saxena)', '#/snags', 'bad');
    if (MR.seedCRM) MR.seedCRM(S, T);
    S.notifs.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    S.audit.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    return S;
  }

  function workText(ph, active, R) {
    var T = {
      0: ['Site handed over by client; measured all rooms and checked levels.', 'Protected flooring with corrugated sheet; set up site store and labour rota.'],
      1: ['Demolished kitchen partition; debris bagged and taken down via service lift.', 'Waterproofing first coat in two bathrooms; ponding test started.'],
      2: ['Chasing and conduit for living room points; DB location shifted per drawing E-02.', 'CPVC rough-in done in bathroom 1, pressure test held at 8 kg for 2 hours.', 'Wiring pulled for master bedroom; switchboard heights marked at 1200 mm.'],
      3: ['Gypsum framing in living room 70% done; cove drop marked with laser.', 'Boarding started in bedroom 2; jointing tape and first coat of compound on framed areas.'],
      4: ['Tile layout dry-laid for client sign-off; spacers 2 mm.', 'Marble laying in living room, 220 sqft done today.'],
      5: ['Kitchen carcasses installed and levelled; hinges adjusted.', 'Wardrobe shutters fitted in master; soft-close tested on all doors.', 'TV wall fluted panelling: first half fixed, grain matched to the approved board.'],
      6: ['Putty second coat in living and passage; sanding tomorrow.', 'Primer on ceilings done; limewash test panels for client.'],
      7: ['Curtain tracks fixed in all rooms; pendants hung over dining.', 'Sofa and rug delivered and placed; styling with client.'],
      8: ['Snag walk with client; list shared on the system.', 'Deep clean in progress; final touch-ups scheduled.']
    };
    var a = T[active[active.length - 1].ph] || T[0];
    var s = a[Math.floor(R() * a.length)];
    if (active.length > 1 && R() < 0.6) { var b = T[active[0].ph]; if (b) s += ' ' + b[Math.floor(R() * b.length)]; }
    return s;
  }
  function utr(mode, R) {
    var d = function (n) { var s = ''; for (var i = 0; i < n; i++) s += Math.floor(R() * 10); return s; };
    if (mode === 'UPI') return 'UPI ' + d(4) + ' ' + d(4) + ' ' + d(4);
    if (mode === 'Cheque') return 'Chq ' + d(6);
    if (mode === 'RTGS') return 'NFBKR5' + d(4) + ' ' + d(4) + ' ' + d(4);
    return 'NFBKN6' + d(4) + ' ' + d(4) + ' ' + d(4);
  }
})();
