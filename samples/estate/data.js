/* Fieldwise — seed data for Amaltas Estates (fictional). Deterministic: the same seed gives the same brokerage every time. */
(function () {
  'use strict';
  var CK = window.CK = window.CK || {};

  /* ---------- geography (stylised; coordinates are real-ish lat/lng, drawn on our own map) ---------- */
  CK.REGIONS = {
    sd: { name: 'South Delhi', lat: [28.515, 28.594], lng: [77.148, 77.258], w: 1000, h: 820, kmW: 10.8, kmH: 8.8,
      office: { name: 'Amaltas office · Green Park', lat: 28.5585, lng: 77.2045 } },
    ggn: { name: 'Gurugram', lat: [28.398, 28.470], lng: [77.052, 77.118], w: 1000, h: 1000, kmW: 6.5, kmH: 8.0,
      office: { name: 'Site desk · Sector 54', lat: 28.4380, lng: 77.1000 } }
  };
  CK.AREAS = [
    { id: 'VV', name: 'Vasant Vihar', short: 'Vasant Vihar', r: 'sd', lat: 28.5600, lng: 77.1600, tier: 1.55 },
    { id: 'AN', name: 'Anand Niketan', short: 'Anand Niketan', r: 'sd', lat: 28.5790, lng: 77.1680, tier: 1.5 },
    { id: 'SN', name: 'Shanti Niketan', short: 'Shanti Niketan', r: 'sd', lat: 28.5740, lng: 77.1775, tier: 1.6 },
    { id: 'JB', name: 'Jor Bagh', short: 'Jor Bagh', r: 'sd', lat: 28.5880, lng: 77.2170, tier: 1.9 },
    { id: 'SE', name: 'Safdarjung Enclave', short: 'Safdarjung Encl.', r: 'sd', lat: 28.5640, lng: 77.1930, tier: 1.15 },
    { id: 'GP', name: 'Green Park', short: 'Green Park', r: 'sd', lat: 28.5595, lng: 77.2075, tier: 1.1 },
    { id: 'HK', name: 'Hauz Khas', short: 'Hauz Khas', r: 'sd', lat: 28.5495, lng: 77.2010, tier: 1.2 },
    { id: 'SV', name: 'Sarvodaya Enclave', short: 'Sarvodaya Encl.', r: 'sd', lat: 28.5420, lng: 77.1990, tier: 1.15 },
    { id: 'PP', name: 'Panchsheel Park', short: 'Panchsheel Park', r: 'sd', lat: 28.5420, lng: 77.2170, tier: 1.4 },
    { id: 'DC', name: 'Defence Colony', short: 'Defence Colony', r: 'sd', lat: 28.5735, lng: 77.2320, tier: 1.3 },
    { id: 'LN', name: 'Lajpat Nagar', short: 'Lajpat Nagar', r: 'sd', lat: 28.5665, lng: 77.2440, tier: 0.8 },
    { id: 'G1', name: 'Greater Kailash I', short: 'GK I', r: 'sd', lat: 28.5485, lng: 77.2355, tier: 1.3 },
    { id: 'G2', name: 'Greater Kailash II', short: 'GK II', r: 'sd', lat: 28.5310, lng: 77.2430, tier: 1.15 },
    { id: 'CR', name: 'Chittaranjan Park', short: 'CR Park', r: 'sd', lat: 28.5385, lng: 77.2500, tier: 0.9 },
    { id: 'MN', name: 'Malviya Nagar', short: 'Malviya Nagar', r: 'sd', lat: 28.5335, lng: 77.2090, tier: 0.72 },
    { id: 'SK', name: 'Saket', short: 'Saket', r: 'sd', lat: 28.5235, lng: 77.2060, tier: 0.95 },
    { id: 'VK', name: 'Vasant Kunj', short: 'Vasant Kunj', r: 'sd', lat: 28.5225, lng: 77.1580, tier: 0.85 },
    { id: 'S42', name: 'Sector 42, Gurugram', short: 'Sector 42', r: 'ggn', lat: 28.4570, lng: 77.0960, tier: 1.0 },
    { id: 'S43', name: 'Sector 43, Gurugram', short: 'Sector 43', r: 'ggn', lat: 28.4590, lng: 77.0820, tier: 0.95 },
    { id: 'S54', name: 'Sector 54, Gurugram', short: 'Sector 54', r: 'ggn', lat: 28.4360, lng: 77.1040, tier: 1.15 },
    { id: 'S57', name: 'Sector 57, Gurugram', short: 'Sector 57', r: 'ggn', lat: 28.4220, lng: 77.0800, tier: 0.8 },
    { id: 'S65', name: 'Sector 65, Gurugram', short: 'Sector 65', r: 'ggn', lat: 28.4070, lng: 77.0720, tier: 1.05 }
  ];

  /* ---------- people ---------- */
  CK.AGENTS = [
    { id: 'A1', name: 'Meher Kapoor', role: 'admin', title: 'Founder · Admin', hue: 18 },
    { id: 'A2', name: 'Arjun Sethi', role: 'manager', title: 'Sales manager', hue: 210 },
    { id: 'A3', name: 'Pooja Nair', role: 'telecaller', title: 'Telecaller', hue: 330 },
    { id: 'A4', name: 'Imran Qureshi', role: 'telecaller', title: 'Telecaller', hue: 160 },
    { id: 'A5', name: 'Simran Kaur', role: 'telecaller', title: 'Telecaller', hue: 280 },
    { id: 'A6', name: 'Kabir Malhotra', role: 'field', title: 'Field agent · West', hue: 30, zone: 'sd' },
    { id: 'A7', name: 'Rohit Yadav', role: 'field', title: 'Field agent · East', hue: 120, zone: 'sd' },
    { id: 'A8', name: 'Deepak Rawat', role: 'field', title: 'Field agent · Gurugram', hue: 190, zone: 'ggn' },
    { id: 'A9', name: 'Sana Mirza', role: 'field', title: 'Field agent · South', hue: 350, zone: 'sd' },
    { id: 'A10', name: 'Nikhil Bisht', role: 'field', title: 'Field agent · Verifications', hue: 60, zone: 'sd' }
  ];
  CK.PARTNERS_SEED = [
    { id: 'PT1', name: 'Harpreet Singh', firm: 'Singh Property Point', area: 'G1', since: '2025-03', split: 35, hue: 40 },
    { id: 'PT2', name: 'Tanvi Arora', firm: 'Arora Homes Desk', area: 'SK', since: '2025-11', split: 30, hue: 300 },
    { id: 'PT3', name: 'Mohan Lal Chauhan', firm: 'Chauhan & Sons Realty', area: 'CR', since: '2024-08', split: 40, hue: 100 },
    { id: 'PT4', name: 'Ritika Bansal', firm: 'Bansal Leasing', area: 'S54', since: '2026-02', split: 30, hue: 230 }
  ];

  var FIRST = ['Aarav', 'Anoushka', 'Rahul', 'Priya', 'Vikram', 'Neha', 'Siddharth', 'Kavya', 'Aditya', 'Ishita', 'Karan', 'Riya', 'Rohan', 'Sneha', 'Varun', 'Megha', 'Tanya', 'Abhinav', 'Shreya', 'Manish', 'Aisha', 'Gaurav', 'Pallavi', 'Yash', 'Nandini', 'Harsh', 'Divya', 'Kunal', 'Sakshi', 'Arnav', 'Mira', 'Dev', 'Radhika', 'Sameer', 'Zoya', 'Pranav', 'Kriti', 'Vivek', 'Lakshmi', 'Farhan', 'Aditi', 'Jatin', 'Naina', 'Ravi', 'Akash', 'Bhavna', 'Tushar', 'Ira', 'Anirudh', 'Shalini', 'Mehul', 'Tara', 'Kartik', 'Nisha', 'Rehan', 'Gayatri', 'Omar', 'Sunaina', 'Devika', 'Jaspreet', 'Anjali', 'Raghav', 'Ishaan', 'Prerna', 'Hari', 'Malini', 'Sahil', 'Fatima', 'Rustom', 'Ayesha', 'Venkat', 'Bhumika', 'Dhruv', 'Leela', 'Parth', 'Rukmini', 'Naveen', 'Tenzin', 'Esha', 'Keshav', 'Lavanya', 'Mohit', 'Sharmila', 'Arpita', 'Joel', 'Natasha', 'Aman', 'Shivani', 'Zubin', 'Priyanka', 'Sourav', 'Chitra', 'Yusuf', 'Payal', 'Ritwik', 'Aparna', 'Nikita', 'Bilal', 'Mrinal', 'Sonal'];
  var LAST = ['Sharma', 'Mehta', 'Iyer', 'Chopra', 'Khanna', 'Bhatia', 'Gupta', 'Reddy', 'Malik', 'Verma', 'Saxena', 'Pillai', 'Sood', 'Banerjee', 'Kohli', 'Rao', 'Ahuja', 'Grover', 'Das', 'Menon', 'Chawla', 'Bose', 'Kapur', 'Joshi', 'Tandon', 'Agarwal', 'Sinha', 'Dutta', 'Bajaj', 'Siddiqui', 'Mathur', 'Vohra', 'Nair', 'Kulkarni', 'Deshpande', 'Ghosh', 'Mukherjee', 'Chatterjee', 'Sen', 'Hegde', 'Shetty', 'Kamath', 'Naidu', 'Krishnan', 'Subramaniam', 'Varghese', 'Thomas', 'Fernandes', 'Lobo', 'Gill', 'Sandhu', 'Bedi', 'Ahluwalia', 'Arora', 'Talwar', 'Ansari', 'Hussain', 'Rizvi', 'Baig', 'Parekh', 'Shah', 'Desai', 'Patel', 'Kothari', 'Jain', 'Goyal', 'Mittal', 'Bhargava', 'Tiwari', 'Pandey', 'Negi'];
  var OWNER_LAST = ['Bhalla', 'Wadhwa', 'Khurana', 'Trust', 'Anand', 'Chadha', 'Puri', 'Bakshi', 'Mehra', 'Kaul', 'Dhingra', 'Marwah', 'Sabharwal', 'Kalra', 'Chhabra', 'Dua', 'Bahl', 'Tuli', 'Sachdeva', 'Grewal', 'Mongia', 'Sawhney', 'Luthra', 'Ohri', 'Kakkar', 'Batra', 'Seth', 'Uppal', 'Nanda', 'Bawa'];
  var OWNER_FIRST = ['Col. Rajinder', 'Sushma', 'Ashok', 'Kamla', 'Dr. Naresh', 'Veena', 'Surinder', 'Anita', 'Prakash', 'Usha', 'Brig. Harish', 'Rekha', 'Satish', 'Madhu', 'Jagdish', 'Shobha', 'Ramesh', 'Neelam', 'Om Prakash', 'Sunita', 'Vinod', 'Asha', 'Rakesh', 'Kiran', 'Devendra', 'Poonam', 'Subhash', 'Lata', 'Mahesh', 'Nirmala'];

  /* ---------- PRNG ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  CK.rng = rng;

  var DAY = 864e5;
  function dayStart(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
  CK.DAY = DAY; CK.dayStart = dayStart;

  CK.PHOTOS = {
    ext: ['ext-01', 'ext-02', 'ext-04', 'ext-05', 'ext-06', 'ext-07', 'ext-08', 'ext-09', 'ext-10', 'ext-11', 'ext-12', 'ext-13', 'ext-14', 'ext-15', 'ext-16', 'ext-17', 'ext-18', 'ext-19', 'ext-20', 'ext-21', 'ext-22'],
    liv: ['liv-01', 'liv-02', 'liv-03', 'liv-04', 'liv-05', 'liv-06', 'liv-07', 'liv-08', 'liv-09', 'liv-10', 'liv-11', 'liv-12', 'liv-13', 'liv-14'],
    bed: ['bed-01', 'bed-02', 'bed-03', 'bed-04', 'bed-05', 'bed-06', 'bed-07', 'bed-08'],
    kit: ['kit-01', 'kit-03', 'kit-04', 'kit-06', 'kit-07', 'kit-08'],
    bal: ['bal-01', 'bal-02', 'bal-03', 'bal-04'],
    bath: ['bath-01'],
    off: ['off-01', 'off-02', 'off-03']
  };
  /* apartment-tower exteriors vs low-rise house exteriors */
  var EXT_TOWER = ['ext-01', 'ext-02', 'ext-05', 'ext-06', 'ext-07', 'ext-17', 'ext-19', 'ext-20', 'ext-21', 'ext-18'];
  var EXT_HOUSE = ['ext-04', 'ext-08', 'ext-09', 'ext-10', 'ext-11', 'ext-12', 'ext-13', 'ext-14', 'ext-15', 'ext-16', 'ext-22'];

  CK.SOURCES = ['Basera', 'KeyHaat', 'Website', 'WhatsApp', 'Walk-in', 'Partner'];
  CK.SOURCE_NOTE = { Basera: 'Listing portal', KeyHaat: 'Listing portal', Website: 'amaltas-estates website form', WhatsApp: 'Click-to-chat from a listing', 'Walk-in': 'Visited the Green Park office', Partner: 'Referred by a field partner' };
  CK.FOUND = ['Google search', 'Instagram', 'Basera', 'KeyHaat', 'A friend', 'Society notice board', 'Office signboard'];
  CK.LEAD_STAGES = [
    { id: 'new', label: 'New' }, { id: 'contacted', label: 'Contacted' }, { id: 'requirement', label: 'Requirement' },
    { id: 'matched', label: 'Matched' }, { id: 'visit', label: 'Visit' }, { id: 'deal', label: 'Deal' }
  ];
  CK.DEAL_STAGES_RENT = ['shortlist', 'negotiation', 'token', 'agreement', 'movein'];
  CK.DEAL_STAGES_SALE = ['shortlist', 'negotiation', 'token', 'agreement', 'registry'];
  CK.DEAL_LABEL = { shortlist: 'Shortlist', negotiation: 'Negotiation', token: 'Token', agreement: 'Agreement', movein: 'Move-in', registry: 'Registry', closed: 'Closed', lost: 'Lost' };
  CK.REJECT_REASONS = ['Too small', 'Over budget', 'Poor light', 'Floor too high', 'No parking', 'Noisy road', 'Old fittings', 'Owner terms', 'Far from office'];
  CK.CHECKLIST = [
    { id: 'owner', label: 'Met the owner or caretaker', hint: 'Name and relation noted' },
    { id: 'config', label: 'Rooms match the listing', hint: 'BHK, baths, balconies' },
    { id: 'photos', label: 'At least 6 photos taken', hint: 'Every room, the view, the entrance' },
    { id: 'price', label: 'Price confirmed with the owner', hint: 'Rent or ask, negotiable or firm' },
    { id: 'avail', label: 'Availability date confirmed', hint: 'Keys and move-in' },
    { id: 'geo', label: 'Pin dropped at the gate', hint: 'Within 150 m of the listing pin' },
    { id: 'docs', label: 'Ownership proof seen', hint: 'Sale deed / allotment letter' },
    { id: 'parking', label: 'Parking and power backup checked', hint: 'Covered, open, none' }
  ];

  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function int(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function shuffle(r, a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function round(n, step) { return Math.round(n / step) * step; }
  CK.pick = pick; CK.int = int; CK.shuffle = shuffle;
  function area(id) { for (var i = 0; i < CK.AREAS.length; i++) if (CK.AREAS[i].id === id) return CK.AREAS[i]; }
  CK.area = area;

  var SOC_SD = ['', '', '', ''];
  var SOC_GGN = ['Kesar Greens', 'Palash Towers', 'Neelgiri Residency', 'Silver Oak Heights', 'Gulmohar Crest', 'Arjun Vihar CGHS', 'Sapphire Court'];
  var SOC_VK = ['Pocket B, Sector C', 'Pocket 4, Sector B', 'Pocket 1, Sector D'];

  /* ---------- the generator ---------- */
  CK.seed = function (now) {
    var r = rng(20261124);
    var today = dayStart(now || Date.now());
    function daysAgo(n, h, m) { return today - n * DAY + ((h || 11) * 60 + (m || 0)) * 6e4; }
    CK.TODAY = today;
    var S = { v: 5, today: today, settings: { rentWindow: 30, saleWindow: 45, missedCallRetryH: 2, maxMisses: 3, visitMinutes: 20, quietFrom: 19, quietTo: 9 },
      agents: CK.AGENTS.map(function (a) { var o = {}; for (var k in a) o[k] = a[k]; return o; }),
      owners: [], props: [], leads: [], trips: [], deals: [], tasks: [], audit: [], partners: [], queues: [], issues: [], notes: [], msgs: [], eod: [], seq: { L: 2140, P: 0, T: 141, D: 318, K: 900, O: 60 } };

    /* owners: 6 portfolio owners + singles */
    var ownerCount = 30;
    for (var i = 0; i < ownerCount; i++) {
      var on = OWNER_FIRST[i] + ' ' + OWNER_LAST[i];
      S.owners.push({ id: 'O' + (i + 1), name: on, phone: '98' + int(r, 100, 999) + ' XX' + int(r, 100, 999), portfolio: i < 6, lang: pick(r, ['Hindi', 'English', 'Punjabi', 'Hindi']), pref: pick(r, ['Calls after 11 am', 'WhatsApp first', 'Only weekends', 'Via son (Gaurav)', 'Calls any time']), since: 2019 + int(r, 0, 6), comms: [], requests: [] });
    }
    S.owners[0].name = 'Col. Rajinder Bhalla (retd.)'; S.owners[1].name = 'Sushma Wadhwa'; S.owners[2].name = 'Ashok Khurana'; S.owners[3].name = 'Kamla Devi Trust'; S.owners[4].name = 'Dr. Naresh Anand'; S.owners[5].name = 'Veena Chadha';

    /* properties */
    var plan = [ // area, count
      ['VV', 6], ['AN', 3], ['SN', 3], ['JB', 2], ['SE', 5], ['GP', 4], ['HK', 4], ['SV', 3], ['PP', 3], ['DC', 3], ['LN', 3], ['G1', 5], ['G2', 5], ['CR', 4], ['MN', 3], ['SK', 4], ['VK', 3],
      ['S42', 2], ['S43', 2], ['S54', 3], ['S57', 2], ['S65', 3]
    ];
    var pIdx = 0, portfolioCursor = 0;
    plan.forEach(function (pc) {
      var a = area(pc[0]);
      for (var k = 0; k < pc[1]; k++) {
        pIdx++;
        var isG = a.r === 'ggn';
        var office = (pIdx % 17 === 0);
        var type = office ? 'Office' : isG ? (r() < .8 ? 'Apartment' : 'Independent floor') : a.id === 'VK' ? 'Apartment' : pick(r, ['Builder floor', 'Builder floor', 'Builder floor', 'Independent house', 'Apartment', 'Studio']);
        if (type === 'Independent house' && a.tier < 1.1) type = 'Builder floor';
        var deal = r() < 0.7 ? 'rent' : 'sale';
        if (type === 'Studio') deal = 'rent';
        var bhk = type === 'Office' ? 0 : type === 'Studio' ? 1 : type === 'Independent house' ? int(r, 4, 6) : int(r, 2, 4);
        var sqft = type === 'Office' ? int(r, 9, 30) * 100 : type === 'Studio' ? int(r, 4, 6) * 100 : round(bhk * int(r, 520, 760), 50);
        var rent = deal === 'rent' ? round((type === 'Office' ? sqft * 140 : (bhk * 24000 + sqft * 18)) * a.tier * (0.85 + r() * .3), 1000) : 0;
        var sale = deal === 'sale' ? round((type === 'Office' ? sqft * 26000 : sqft * 23000) * a.tier * a.tier * (0.85 + r() * .3), 500000) : 0;
        var price = deal === 'rent' ? rent : sale;
        var floors = ['Ground', 'First', 'Second', 'Third', 'Fourth'];
        var floor = type === 'Apartment' ? (int(r, 2, 19) + 'th') : type === 'Independent house' ? 'Full house' : pick(r, floors);
        if (/^(2|3)th$/.test(floor)) floor = floor === '2th' ? '2nd' : '3rd';
        var tower = type === 'Apartment' || type === 'Office' || type === 'Studio';
        var cover = type === 'Office' ? pick(r, CK.PHOTOS.off) : tower ? pick(r, EXT_TOWER) : pick(r, EXT_HOUSE);
        var gallery = type === 'Office' ? shuffle(r, CK.PHOTOS.off) : [pick(r, CK.PHOTOS.liv), pick(r, CK.PHOTOS.bed), pick(r, CK.PHOTOS.kit), pick(r, CK.PHOTOS.liv), pick(r, CK.PHOTOS.bal), pick(r, CK.PHOTOS.bed), 'bath-01'];
        gallery = gallery.filter(function (x, i, arr) { return arr.indexOf(x) === i; }).slice(0, int(r, 4, 7));
        var ownerId;
        if (portfolioCursor < 30 && (pIdx % 2 === 0)) { ownerId = 'O' + ((portfolioCursor % 6) + 1); portfolioCursor++; }
        else ownerId = 'O' + int(r, 7, ownerCount);
        var plotNo = (pick(r, ['A', 'B', 'C', 'D', 'E', 'F', 'K', 'M', 'N', 'S', 'W']) + '-' + int(r, 2, 480));
        var society = isG ? pick(r, SOC_GGN) : a.id === 'VK' ? pick(r, SOC_VK) : '';
        var ageV = r() < .72 ? int(r, 0, 28) : int(r, 29, 60);
        var pending = pIdx % 8 === 3; // new, never verified
        var created = pending ? daysAgo(int(r, 0, 3), int(r, 9, 10), int(r, 0, 59)) : daysAgo(int(r, 40, 400));
        var hist = [];
        if (deal === 'rent') { hist.push({ at: created, price: round(price * (1 + (r() < .5 ? .06 : 0)), 1000) }); if (r() < .5) hist.push({ at: created + int(r, 15, 120) * DAY, price: round(price * 1.03, 1000) }); }
        else { hist.push({ at: created, price: round(price * 1.08, 500000) }); if (r() < .6) hist.push({ at: created + int(r, 20, 200) * DAY, price: round(price * 1.03, 500000) }); }
        hist.push({ at: Math.max(created, today - int(r, 5, 35) * DAY), price: price });
        hist = hist.filter(function (h) { return h.at <= today; });
        var j = (r() - .5) * 0.0046, jj = (r() - .5) * 0.0050;
        var code = a.id + '-' + (100 + pIdx * 3 + int(r, 0, 2));
        var furn = pick(r, ['Unfurnished', 'Semi-furnished', 'Semi-furnished', 'Fully furnished']);
        var p = {
          id: 'P' + pIdx, code: code, area: a.id, r: a.r, type: type, deal: deal, bhk: bhk, sqft: sqft, floor: floor, price: price, hist: hist,
          addr: plotNo + (society ? ', ' + society : '') + ', ' + a.name, plot: plotNo, society: society,
          ownerId: ownerId, photos: [cover].concat(gallery), lat: a.lat + j, lng: a.lng + jj,
          furn: furn, facing: pick(r, ['Park facing', 'East facing', 'North facing', 'Corner plot', 'Main road', 'Inner lane']),
          parking: pick(r, ['1 covered', '2 covered', 'Stilt parking', 'Open, on the lane', '1 covered + 1 open']),
          backup: pick(r, ['Full power backup', 'Inverter points', 'Lift + common backup', 'None']),
          pref: deal === 'rent' ? pick(r, ['Families', 'Any', 'Any', 'Families', 'Working professionals', 'Expats preferred']) : '',
          pets: r() < .45, availFrom: today + int(r, -10, 45) * DAY,
          status: 'available', holdFor: null, holdUntil: null, created: created, src: pick(r, ['Owner direct', 'Owner direct', 'Partner', 'Magazine import', 'Walk-in owner']),
          maint: deal === 'rent' ? pick(r, [0, 0, 2500, 3500, 5000]) : 0,
          baths: Math.max(1, bhk + (r() < .5 ? 0 : 1) - (bhk > 3 ? 1 : 0)), balconies: int(r, 0, 3),
          ver: pending ? { status: 'pending', at: null, by: null, checks: {}, geo: null, photos: 0, reject: null }
            : { status: 'verified', at: today - ageV * DAY - int(r, 1, 8) * 36e5, by: pick(r, ['A6', 'A7', 'A9', 'A10', 'A10']), checks: { owner: 1, config: 1, photos: 1, price: 1, avail: 1, geo: 1, docs: r() < .6 ? 1 : 0, parking: 1 }, geo: { m: int(r, 4, 60) }, photos: int(r, 6, 14), reject: null },
          ownerLastReply: today - int(r, 1, 50) * DAY, views: int(r, 40, 900), enquiries: int(r, 0, 26)
        };
        if (type === 'Office') { p.bhk = 0; p.pref = ''; }
        S.props.push(p);
      }
    });
    S.seq.P = pIdx;
    /* the six homes the product story and the guided tour lean on: 3 BHK rentals around Vasant Vihar */
    var story = S.props.filter(function (p) { return ['VV', 'SN', 'AN', 'SE'].indexOf(p.area) >= 0 && p.type !== 'Office'; }).slice(0, 7);
    var sp = [[118000, 'Builder floor', 'Second', 'Families'], [104000, 'Builder floor', 'First', 'Any'], [112000, 'Apartment', '6th', 'Families'], [96000, 'Builder floor', 'Third', 'Any'], [125000, 'Builder floor', 'Ground', 'Families'], [99000, 'Builder floor', 'First', 'Working professionals'], [109000, 'Apartment', '9th', 'Any']];
    var off = [[0.0024, -0.0046], [-0.0034, 0.0016], [0.0006, 0.0052], [-0.0012, -0.0058], [0.0040, 0.0030], [-0.0040, -0.0020], [0.0030, -0.0010]];
    story.forEach(function (p, i) { var o = sp[i]; var a0 = CK.area(p.area); p.lat = a0.lat + off[i][0]; p.lng = a0.lng + off[i][1]; p.deal = 'rent'; p.bhk = 3; p.sqft = 1650 + i * 120; p.price = o[0]; p.type = o[1]; p.floor = o[2]; p.pref = o[3]; p.story = true; p.availFrom = today + (i * 3 - 4) * DAY; p.hist = [{ at: p.created, price: o[0] + 6000 }, { at: today - (8 + i * 3) * DAY, price: o[0] }]; p.maint = i % 2 ? 0 : 3500; p.baths = 3; p.pets = i !== 2;
      if (p.ver.status === 'pending' && i !== 4) p.ver = { status: 'verified', at: today - (3 + i * 2) * DAY, by: 'A10', checks: { owner: 1, config: 1, photos: 1, price: 1, avail: 1, geo: 1, docs: 1, parking: 1 }, geo: { m: 12 + i }, photos: 9, reject: null };
      if (i === 4) { p.ver = { status: 'pending', at: null, by: null, checks: {}, geo: null, photos: 0, reject: null }; p.created = today - DAY + 15 * 36e5; p.hist = [{ at: p.created, price: o[0] }]; }
      if (p.ver.status === 'verified') p.ver.at = today - (2 + i * 3) * DAY; });
    /* a few let out / sold / on hold */
    [7, 19, 33].forEach(function (n) { var p = S.props[n]; p.status = p.deal === 'rent' ? 'let' : 'sold'; });
    S.props[44].status = 'inactive';

    /* ---------- leads ---------- */
    var stagePlan = [['new', 12], ['contacted', 13], ['requirement', 13], ['matched', 10], ['visit', 14], ['deal', 12], ['lost', 6]];
    var telecallers = ['A3', 'A4', 'A5'], fieldAgents = ['A6', 'A7', 'A9', 'A8'];
    var li = 0;
    var notesPool = ['Wants a park-facing floor, two kids, school in Vasant Vihar.', 'Moving from Bengaluru in January. Needs a study.', 'Works in Cyber City; cab drop matters.', 'Parents live in GK II, wants to stay close.', 'Pet dog (labrador). Lift is a must.', 'NRI buyer; decision with brother in Dubai.', 'Corporate lease, company pays rent up to budget.', 'First home purchase; home loan pre-approved.', 'Doctor at a hospital in Saket, night shifts.', 'Prefers ground floor for elderly mother.', 'Startup founder; wants a home office corner.', 'Looking to upgrade from 2 to 3 BHK in same colony.'];
    stagePlan.forEach(function (sp) {
      for (var k = 0; k < sp[1]; k++) {
        li++;
        var nm = FIRST[(li * 7) % FIRST.length] + ' ' + LAST[(li * 5 + 2) % LAST.length];
        var intent = r() < .68 ? 'rent' : 'buy';
        var region = r() < .8 ? 'sd' : 'ggn';
        var choices = CK.AREAS.filter(function (x) { return x.r === region; });
        var home = pick(r, choices);
        var near = choices.slice().sort(function (x, y) { return dist(home, x) - dist(home, y); }).slice(0, int(r, 2, 4)).map(function (x) { return x.id; });
        var bhk = pick(r, [2, 3, 3, 3, 4]);
        var base = intent === 'rent' ? (bhk * 24000 + bhk * 640 * 18) * home.tier : bhk * 640 * 23000 * home.tier * home.tier;
        var bud = intent === 'rent' ? round(base * (0.85 + r() * .3), 5000) : round(base * (0.85 + r() * .3), 2500000);
        var src = sp[0] === 'new' && k < 3 ? ['WhatsApp', 'Basera', 'Website'][k] : pick(r, ['Basera', 'Basera', 'KeyHaat', 'Website', 'Website', 'WhatsApp', 'WhatsApp', 'Walk-in', 'Partner']);
        var created = sp[0] === 'new' ? today + ((9 * 60 + 5 + k * 23) * 6e4) - (k > 7 ? DAY : 0) : daysAgo(int(r, 3, 48), int(r, 9, 19), int(r, 0, 59));
        if (sp[0] === 'new' && k === 0) created = today + (10 * 60 + 2) * 6e4;
        var L = {
          id: 'L-' + (2000 + li), name: nm, phone: '9' + int(r, 7, 9) + int(r, 1, 9) + 'XX XX' + int(r, 100, 999), intent: intent, src: src,
          found: src === 'Basera' || src === 'KeyHaat' ? src : pick(r, CK.FOUND),
          partnerId: src === 'Partner' ? pick(r, ['PT1', 'PT2', 'PT3', 'PT4']) : null,
          stage: sp[0] === 'lost' ? 'lost' : sp[0], lostReason: sp[0] === 'lost' ? pick(r, ['Went with another broker', 'Budget too low for the area', 'Plan postponed to next year', 'Not reachable after 3 tries']) : null,
          req: { r: region, bhk: [bhk], budget: bud, sectors: near, moveIn: today + int(r, 7, 75) * DAY, type: intent === 'buy' ? pick(r, ['Builder floor', 'Apartment', 'Any']) : 'Any', furn: pick(r, ['Any', 'Any', 'Semi-furnished', 'Fully furnished']), family: pick(r, ['Family', 'Family', 'Couple', 'Working professionals', 'Corporate lease']), note: pick(r, notesPool) },
          reqDone: sp[0] !== 'new' && sp[0] !== 'contacted',
          owner: telecallers[li % 3], field: fieldAgents[li % 4], score: 0, created: created,
          last: sp[0] === 'new' ? null : daysAgo(int(r, 0, 5), int(r, 10, 18)), next: null, shortlist: [], tl: [], misses: 0, hot: false, tags: []
        };
        if (region === 'ggn') L.field = 'A8';
        if (L.req.bhk[0] === 3 && r() < .3) L.req.bhk.push(4);
        if (r() < .18) L.tags.push('NRI');
        if (L.req.family === 'Corporate lease') L.tags.push('Corporate');
        if (r() < .2) L.tags.push('Pets');
        S.leads.push(L);
      }
    });
    S.leads[0].name = 'Ananya Iyer'; S.leads[0].req = { r: 'sd', bhk: [3], budget: 110000, sectors: ['VV', 'SN', 'AN', 'SE'], moveIn: today + 21 * DAY, type: 'Any', furn: 'Semi-furnished', family: 'Family', note: 'Relocating from Bengaluru with two kids; school in Vasant Vihar. Wants light and a park view.' };
    S.leads[0].stage = 'requirement'; S.leads[0].tags = []; S.leads[0].intent = 'rent'; S.leads[0].src = 'WhatsApp'; S.leads[0].found = 'Instagram'; S.leads[0].reqDone = true; S.leads[0].owner = 'A3'; S.leads[0].field = 'A6';

    S.seq.L = 2000 + li;
    return S;
  };

  function dist(a, b) { var R = CK.REGIONS[a.r || 'sd']; var dx = (a.lng - b.lng) / (R.lng[1] - R.lng[0]) * R.kmW, dy = (a.lat - b.lat) / (R.lat[1] - R.lat[0]) * R.kmH; return Math.sqrt(dx * dx + dy * dy); }
  CK.km = dist;

  /* One Tuesday, minute by minute (minutes after midnight). Names, briefs and homes come from the seed;
     trips are routed with the app's own matching and trip planner when the day is played. */
  CK.TUESDAY = {
    name: 'Tuesday', from: 540, to: 1140, show: 905,
    trips: [
      { id: 'TR-201', agent: 'A7', lead: 'L-2028', plan: 590, start: 660, pick: 3, outcomes: ['liked', 'short', 'rejected:Floor too high'] },
      { id: 'TR-202', agent: 'A10', kind: 'verify', plan: 725, start: 740, codes: ['GP-168', 'SV-190', 'SK-272', 'G1-227'], outcomes: ['verified', 'verified', 'notavail', 'verified'] },
      { id: 'TR-203', agent: 'A6', lead: 'L-2001', plan: 675, start: 870, pick: 3, outcomes: ['liked', 'rejected:Poor light', 'short'] }
    ],
    beats: [[602, 'Ananya messages on WhatsApp'], [631, 'Matched to 6 verified homes'], [675, 'A trip, planned on a map'], [870, 'Three visits, logged at the gate'], [1120, 'Token paid. Home blocked.']],
    events: [
      [552, 'lead', 'L-2003'], [559, 'call', 'L-2003', 'connected', 'Wants to see homes this weekend'],
      [574, 'lead', 'L-2004'], [583, 'call', 'L-2004', 'noanswer'],
      [602, 'lead', 'L-2001', 'Hi! Saw your Vasant Vihar listing. We need a 3 BHK by mid-December, two kids, school nearby. Budget around 1.1 lakh.'],
      [603, 'assign', 'L-2001'], [609, 'call', 'L-2001', 'connected', 'Two kids, school in Vasant Vihar; light and a park view matter most'],
      [624, 'brief', 'L-2001'], [631, 'match', 'L-2001', 6],
      [641, 'lead', 'L-2006'], [649, 'call', 'L-2006', 'connected', 'Budget is firm; needs covered parking'],
      [683, 'lead', 'L-2007'], [693, 'call', 'L-2007', 'callback', 'Asked for a call after 1 pm'],
      [704, 'call', 'L-2004', 'connected', 'Works in Saket; wants a short commute'],
      [718, 'lead', 'L-2008'], [728, 'call', 'L-2008', 'connected', 'Moving in January; two cars'],
      [767, 'lead', 'L-2009'], [778, 'call', 'L-2009', 'noanswer'],
      [790, 'call', 'L-2007', 'connected', 'Prefers a ground floor for her mother'],
      [816, 'lead', 'L-2010'], [825, 'call', 'L-2010', 'connected', 'Relocating from Pune; office in Okhla'],
      [858, 'lead', 'L-2011'], [866, 'call', 'L-2011', 'connected', 'Only Shanti Niketan or Anand Niketan'],
      [898, 'call', 'L-2009', 'connected', 'Will visit on Saturday'],
      [927, 'lead', 'L-2013'], [935, 'call', 'L-2013', 'connected', 'Looking at GK II this week'],
      [1004, 'lead', 'L-2015'], [1012, 'call', 'L-2015', 'connected', 'Needs a lift; elderly parents'],
      [1025, 'nego', 'L-2001', '{first} wants {home}; the owner asks {ask}'],
      [1068, 'nego', 'L-2001', 'Owner agrees at {price}; police verification and the agreement next'],
      [1072, 'lead', 'L-2017'], [1080, 'call', 'L-2017', 'connected', 'Company lease; HR pays the rent'],
      [1120, 'token', 'L-2001', 55000]
    ]
  };

  /* schools, used for "near a school" in a brief */
  CK.POIS = [
    { k: 'school', lat: 28.5585, lng: 77.1655 }, { k: 'school', lat: 28.5545, lng: 77.1560 }, { k: 'school', lat: 28.5772, lng: 77.1716 }, { k: 'school', lat: 28.5658, lng: 77.1982 },
    { k: 'school', lat: 28.5507, lng: 77.2058 }, { k: 'school', lat: 28.5371, lng: 77.2121 }, { k: 'school', lat: 28.5452, lng: 77.2291 }, { k: 'school', lat: 28.5301, lng: 77.2404 },
    { k: 'school', lat: 28.5251, lng: 77.2109 }, { k: 'school', lat: 28.5212, lng: 77.1622 }, { k: 'school', lat: 28.5705, lng: 77.2365 },
    { k: 'school', lat: 28.4561, lng: 77.0981 }, { k: 'school', lat: 28.4382, lng: 77.1022 }, { k: 'school', lat: 28.4081, lng: 77.0752 }
  ];
})();
