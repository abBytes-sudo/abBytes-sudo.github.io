/* Stockroom · master data for Halden Supply (fictional) and a deterministic 90-day demo history.
   HALDEN_SKUS is the shared catalogue: Lumen CRM Pro uses the same 20 sku + name pairs (see demo-bridge in engine.js). */
(function () {
  'use strict';

  var SUPPLIERS = [
    { id: 'SUP-KW', name: 'Kaveri Woodcraft', city: 'Mysuru', lead: 9, terms: 'Net 30', contact: 'orders@kaveri.example' },
    { id: 'SUP-TT', name: 'Thar Timber Co.', city: 'Jodhpur', lead: 12, terms: 'Net 45', contact: 'sales@thartimber.example' },
    { id: 'SUP-UP', name: 'Upholstery House', city: 'Bengaluru', lead: 14, terms: 'Net 30', contact: 'trade@uphouse.example' },
    { id: 'SUP-MB', name: 'Moradabad Brass Guild', city: 'Moradabad', lead: 10, terms: 'Net 30', contact: 'guild@mbbrass.example' },
    { id: 'SUP-KC', name: 'Khurja Clayworks', city: 'Khurja', lead: 8, terms: 'Advance', contact: 'hello@clayworks.example' },
    { id: 'SUP-AO', name: 'Arc Optic Lighting', city: 'Pune', lead: 6, terms: 'Net 15', contact: 'b2b@arcoptic.example' },
    { id: 'SUP-PH', name: 'Panipat Handloom', city: 'Panipat', lead: 7, terms: 'Net 30', contact: 'looms@panipat.example' }
  ];

  // uom = sales/stock unit; buy = purchase unit and how many stock units it holds
  // vel = average units sold per day in the demo history (drives the simulation)
  var SKUS = [
    { sku: 'HS-CH-001', name: 'Oak dining chair', family: 'Tove dining chair', variant: { Finish: 'Natural oak' }, category: 'Seating', uom: 'each', buy: { unit: 'carton', per: 2 }, supplier: 'SUP-KW', cost: 6200, price: 9800, rop: 30, roq: 48, bin: 'A-01', dims: '46 × 52 × 80 cm', kg: 6.4, vel: 2.1 },
    { sku: 'HS-CH-002', name: 'Walnut dining chair', family: 'Tove dining chair', variant: { Finish: 'Smoked walnut' }, category: 'Seating', uom: 'each', buy: { unit: 'carton', per: 2 }, supplier: 'SUP-KW', cost: 7400, price: 11600, rop: 16, roq: 24, bin: 'A-02', dims: '46 × 52 × 80 cm', kg: 6.6, vel: 0.9 },
    { sku: 'HS-CH-003', name: 'Cane bar stool', family: 'Cane bar stool', variant: { Height: '75 cm' }, category: 'Seating', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-KW', cost: 4900, price: 7900, rop: 12, roq: 24, bin: 'A-02', dims: '40 × 40 × 75 cm', kg: 4.1, vel: 0.7 },
    { sku: 'HS-CH-004', serial: true, name: 'Bouclé lounge chair', family: 'Mara lounge chair', variant: { Fabric: 'Cream bouclé' }, category: 'Seating', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-UP', cost: 18500, price: 29000, rop: 6, roq: 10, bin: 'A-03', dims: '78 × 82 × 74 cm', kg: 17, vel: 0.3 },
    { sku: 'HS-TB-005', serial: true, name: 'Oak dining table, 180 cm', family: 'Arden dining table', variant: { Length: '180 cm' }, category: 'Tables', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-TT', cost: 32000, price: 52000, rop: 5, roq: 8, bin: 'A-04', dims: '180 × 90 × 75 cm', kg: 38, vel: 0.28 },
    { sku: 'HS-TB-006', serial: true, name: 'Oak dining table, 220 cm', family: 'Arden dining table', variant: { Length: '220 cm' }, category: 'Tables', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-TT', cost: 39000, price: 63000, rop: 3, roq: 5, bin: 'A-04', dims: '220 × 95 × 75 cm', kg: 46, vel: 0.14 },
    { sku: 'HS-TB-007', serial: true, name: 'Travertine coffee table', family: 'Sol coffee table', variant: { Stone: 'Honed travertine' }, category: 'Tables', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-TT', cost: 26000, price: 42000, rop: 2, roq: 4, bin: 'A-05', dims: '110 × 60 × 35 cm', kg: 52, vel: 0.03 },
    { sku: 'HS-SF-008', serial: true, name: 'Linen 3-seat sofa, Sand', family: 'Odin 3-seat sofa', variant: { Colour: 'Sand' }, category: 'Sofas', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-UP', cost: 48000, price: 78000, rop: 4, roq: 6, bin: 'A-06', dims: '220 × 95 × 82 cm', kg: 61, vel: 0.2 },
    { sku: 'HS-SF-009', serial: true, name: 'Linen 3-seat sofa, Moss', family: 'Odin 3-seat sofa', variant: { Colour: 'Moss' }, category: 'Sofas', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-UP', cost: 48000, price: 78000, rop: 3, roq: 4, bin: 'A-06', dims: '220 × 95 × 82 cm', kg: 61, vel: 0.1 },
    { sku: 'HS-ST-010', serial: true, name: 'Teak sideboard', family: 'Lund sideboard', variant: { Width: '160 cm' }, category: 'Storage', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-TT', cost: 34000, price: 55000, rop: 2, roq: 3, bin: 'A-07', dims: '160 × 45 × 78 cm', kg: 48, vel: 0.03 },
    { sku: 'HS-ST-011', name: 'Oak bookshelf', family: 'Lund shelving', variant: { Height: '190 cm' }, category: 'Storage', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-KW', cost: 15500, price: 24900, rop: 6, roq: 10, bin: 'A-08', dims: '90 × 35 × 190 cm', kg: 29, vel: 0.3 },
    { sku: 'HS-ST-012', name: 'Cane bedside cabinet', family: 'Cane bedside', variant: { Drawers: '1 drawer' }, category: 'Storage', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-KW', cost: 8800, price: 13900, rop: 10, roq: 20, bin: 'A-08', dims: '45 × 40 × 55 cm', kg: 9, vel: 0.5 },
    { sku: 'HS-LT-013', name: 'Opal globe pendant', family: 'Ilse pendant', variant: { Shade: 'Opal glass' }, category: 'Lighting', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-AO', cost: 3900, price: 6400, rop: 20, roq: 40, bin: 'B-01', dims: 'Ø 30 cm', kg: 2.2, vel: 1.15 },
    { sku: 'HS-LT-014', name: 'Brass pendant lamp', family: 'Ilse pendant', variant: { Shade: 'Spun brass' }, category: 'Lighting', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-MB', cost: 5600, price: 8900, rop: 15, roq: 30, bin: 'B-02', dims: 'Ø 32 cm', kg: 1.9, vel: 0.95 },
    { sku: 'HS-LT-015', name: 'Linen floor lamp', family: 'Vela floor lamp', variant: { Shade: 'Natural linen' }, category: 'Lighting', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-AO', cost: 7200, price: 11500, rop: 8, roq: 12, bin: 'B-03', dims: 'Ø 45 × 160 cm', kg: 5.5, vel: 0.45 },
    { sku: 'HS-LT-016', name: 'Ceramic table lamp', family: 'Kiln table lamp', variant: { Glaze: 'Ash white' }, category: 'Lighting', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-KC', cost: 3400, price: 5600, rop: 14, roq: 24, bin: 'B-04', dims: 'Ø 28 × 46 cm', kg: 2.8, vel: 0.85 },
    { sku: 'HS-LT-017', name: 'Brass wall sconce', family: 'Ilse sconce', variant: { Finish: 'Aged brass' }, category: 'Lighting', uom: 'each', buy: { unit: 'each', per: 1 }, supplier: 'SUP-MB', cost: 2900, price: 4700, rop: 20, roq: 40, bin: 'B-05', dims: '14 × 18 × 26 cm', kg: 0.9, vel: 1.3 },
    { sku: 'HS-LT-018', name: 'LED track spot, 4-pack', family: 'Rail track spot', variant: { Colour: 'Matte black' }, category: 'Lighting', uom: 'pack', buy: { unit: 'pack', per: 1 }, supplier: 'SUP-AO', cost: 5200, price: 8400, rop: 10, roq: 20, bin: 'B-06', dims: '4 × Ø 6 × 12 cm', kg: 1.6, vel: 0.55 },
    { sku: 'HS-RG-019', name: 'Jute rug, 200 × 300 cm', family: 'Weft jute rug', variant: { Size: '200 × 300 cm' }, category: 'Textiles', uom: 'each', buy: { unit: 'roll', per: 1 }, supplier: 'SUP-PH', cost: 9600, price: 15800, rop: 5, roq: 8, bin: 'C-01', dims: '200 × 300 cm', kg: 11, vel: 0.24 },
    { sku: 'HS-TX-020', name: 'Linen cushion cover', family: 'Linen cushion cover', variant: { Size: '50 × 50 cm' }, category: 'Textiles', uom: 'each', buy: { unit: 'box', per: 10 }, supplier: 'SUP-PH', cost: 450, price: 890, rop: 60, roq: 120, bin: 'C-02', dims: '50 × 50 cm', kg: 0.2, vel: 3.6 }
  ];
  SKUS.forEach(function (s) { var f = s.sku.toLowerCase() + '.jpg'; s.photo = 'photos/m/' + f; s.thumb = 'photos/t/' + f; });
  // HSN code (4 digits) and GST rate for each SKU: furniture 9401 / 9403, lamps 9405, textiles 6304, rugs 5702
  var TAX = { 'HS-CH-001': ['9401', 18], 'HS-CH-002': ['9401', 18], 'HS-CH-003': ['9401', 18], 'HS-CH-004': ['9401', 18], 'HS-TB-005': ['9403', 18], 'HS-TB-006': ['9403', 18], 'HS-TB-007': ['9403', 18],
    'HS-SF-008': ['9401', 18], 'HS-SF-009': ['9401', 18], 'HS-ST-010': ['9403', 18], 'HS-ST-011': ['9403', 18], 'HS-ST-012': ['9403', 18], 'HS-LT-013': ['9405', 18], 'HS-LT-014': ['9405', 18],
    'HS-LT-015': ['9405', 18], 'HS-LT-016': ['9405', 18], 'HS-LT-017': ['9405', 18], 'HS-LT-018': ['9405', 18], 'HS-RG-019': ['5702', 12], 'HS-TX-020': ['6304', 12] };
  SKUS.forEach(function (s) { s.hsn = TAX[s.sku][0]; s.gst = TAX[s.sku][1]; });

  // the legal entity on every paper: one GSTIN per state of dispatch (placeholder bodies)
  var COMPANY = { name: 'Halden Supply Pvt Ltd', trade: 'Halden Supply', cin: 'U51909MH2019PTC000000', pan: 'AAECH0000X',
    addr: 'Gala 14, Sarvoday Industrial Park, Anjurphata', city: 'Bhiwandi, Thane', state: 'Maharashtra', code: '27', pin: '421302', gstin: '27AAECH0000X1Z5',
    mail: 'accounts@haldensupply.example', phone: '98XXX XX214', bank: 'Bank account and IFSC on request' };
  var WH_ADDR = {
    BHW: { name: 'Bhiwandi DC', addr: 'Gala 14, Sarvoday Industrial Park, Anjurphata', city: 'Bhiwandi, Thane', state: 'Maharashtra', code: '27', pin: '421302', gstin: '27AAECH0000X1Z5', lat: 19.30, lon: 73.06 },
    BLR: { name: 'Hoskote DC', addr: 'Plot 31, KIADB Industrial Area', city: 'Hoskote, Bengaluru Rural', state: 'Karnataka', code: '29', pin: '562114', gstin: '29AAECH0000X1Z3', lat: 13.07, lon: 77.80 }
  };
  // supplier details: address, state, PIN, GSTIN (placeholder bodies), contact
  var SUP_X = {
    'SUP-KW': { person: 'Naveen Gowda', phone: '98XXX XX410', addr: '12, Belavadi Industrial Estate', state: 'Karnataka', code: '29', pin: '570018', gstin: '29AAFCK0000A1Z7', lat: 12.30, lon: 76.65 },
    'SUP-TT': { person: 'Pratap Rathore', phone: '98XXX XX355', addr: 'Plot 8, Boranada Industrial Area', state: 'Rajasthan', code: '08', pin: '342012', gstin: '08AAFCT0000B1Z2', lat: 26.24, lon: 73.02 },
    'SUP-UP': { person: 'Shalini Rao', phone: '98XXX XX672', addr: '44, Peenya 2nd Stage', state: 'Karnataka', code: '29', pin: '560058', gstin: '29AAFCU0000C1Z9', lat: 13.03, lon: 77.52 },
    'SUP-MB': { person: 'Imran Qureshi', phone: '98XXX XX128', addr: 'Katghar Industrial Area, Lakri Fazalpur', state: 'Uttar Pradesh', code: '09', pin: '244001', gstin: '09AAFCM0000D1Z4', lat: 28.84, lon: 78.77 },
    'SUP-KC': { person: 'Rekha Sharma', phone: '98XXX XX903', addr: 'Pottery Cluster, G T Road', state: 'Uttar Pradesh', code: '09', pin: '203131', gstin: '09AAFCK0000E1Z6', lat: 28.25, lon: 77.85 },
    'SUP-AO': { person: 'Vikram Joshi', phone: '98XXX XX246', addr: 'Gat 112, Chakan MIDC Phase 2', state: 'Maharashtra', code: '27', pin: '410501', gstin: '27AAFCA0000F1Z1', lat: 18.76, lon: 73.86 },
    'SUP-PH': { person: 'Gurpreet Singh', phone: '98XXX XX587', addr: 'Handloom Cluster, Samalkha Road', state: 'Haryana', code: '06', pin: '132103', gstin: '06AAFCP0000G1Z3', lat: 29.39, lon: 76.97 }
  };
  SUPPLIERS.forEach(function (s) { var x = SUP_X[s.id]; for (var k in x) s[k] = x[k]; });
  var BUYERS = {
    'Asha Interiors': { person: 'Asha Menon', addr: '7, Linking Road, Khar West', city: 'Mumbai', state: 'Maharashtra', code: '27', pin: '400052', gstin: '27AAHCA0000H1Z8', lat: 19.07, lon: 72.84 },
    'Kora Hotels': { person: 'Purchase desk', addr: 'Kora Towers, Residency Road', city: 'Bengaluru', state: 'Karnataka', code: '29', pin: '560025', gstin: '29AAHCK0000J1Z5', lat: 12.97, lon: 77.60 },
    'Studio Meridian': { person: 'Rhea Kapoor', addr: '3rd Floor, Meridian House, Baner Road', city: 'Pune', state: 'Maharashtra', code: '27', pin: '411045', gstin: '27AAHCS0000K1Z2', lat: 18.56, lon: 73.78 },
    'Ember & Oak Cafés': { person: 'Dev Arora', addr: '21, Fort Market, Colaba', city: 'Mumbai', state: 'Maharashtra', code: '27', pin: '400001', gstin: '27AAHCE0000L1Z9', lat: 18.92, lon: 72.83 },
    'Saffron Residences': { person: 'Site office', addr: 'Saffron Residences, Sector 18', city: 'Gurugram', state: 'Haryana', code: '06', pin: '122015', gstin: '06AAHCS0000M1Z6', lat: 28.46, lon: 77.03 },
    'Lattice Workspaces': { person: 'Facilities', addr: 'Lattice Park, Madhapur', city: 'Hyderabad', state: 'Telangana', code: '36', pin: '500081', gstin: '36AAHCL0000N1Z3', lat: 17.44, lon: 78.39 },
    'Indigo Bay Resort': { person: 'Reservations office', addr: 'Indigo Bay, Candolim Beach Road', city: 'Candolim', state: 'Goa', code: '30', pin: '403515', gstin: '30AAHCI0000P1Z0', lat: 15.52, lon: 73.76 },
    'Mulberry Homes': { person: 'Anita Shah', addr: '14, Mulberry Lane, Thane West', city: 'Thane', state: 'Maharashtra', code: '27', pin: '400601', gstin: '27AAHCM0000Q1Z7', lat: 19.20, lon: 72.97 },
    'Common Room Co-work': { person: 'Operations', addr: '5th Cross, Indiranagar', city: 'Bengaluru', state: 'Karnataka', code: '29', pin: '560038', gstin: '29AAHCC0000R1Z4', lat: 12.97, lon: 77.64 },
    'Dune Boutique Hotel': { person: 'Front office', addr: 'Dune House, Beach Walk, Vagator', city: 'Vagator', state: 'Goa', code: '30', pin: '403509', gstin: '30AAHCD0000S1Z1', lat: 15.60, lon: 73.74 },
    'Teal House Architects': { person: 'Studio manager', addr: '9, Studio Row, Bandra East', city: 'Mumbai', state: 'Maharashtra', code: '27', pin: '400051', gstin: '27AAHCT0000T1Z8', lat: 19.06, lon: 72.87 },
    'Pause Wellness Spa': { person: 'Spa manager', addr: 'Pause Retreat, Sector 4, Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', code: '08', pin: '302021', gstin: '08AAHCP0000U1Z5', lat: 26.91, lon: 75.74 }
  };

  // two warehouses, same rack plan: A = pallet racking (furniture), B = shelving (lighting), C = textiles
  var WAREHOUSES = [
    { id: 'BHW', name: 'Bhiwandi DC', short: 'Bhiwandi', city: 'Mumbai region', main: true },
    { id: 'BLR', name: 'Hoskote DC', short: 'Hoskote', city: 'Bengaluru', main: false }
  ];
  var ZONES = [
    { id: 'A', name: 'Pallet racking', bins: 8 },
    { id: 'B', name: 'Shelving', bins: 6 },
    { id: 'C', name: 'Textiles', bins: 4 }
  ];
  var BINS = [];
  WAREHOUSES.forEach(function (w) {
    ZONES.forEach(function (z) {
      for (var i = 1; i <= z.bins; i++) BINS.push({ id: w.id + '-' + z.id + '-' + (i < 10 ? '0' : '') + i, wh: w.id, zone: z.id, n: i });
    });
  });

  // Hoskote is a smaller satellite DC that carries the fast movers only
  var BLR_RANGE = ['HS-CH-001', 'HS-CH-002', 'HS-CH-003', 'HS-ST-012', 'HS-TX-020', 'HS-LT-013', 'HS-LT-016', 'HS-LT-017', 'HS-LT-014', 'HS-LT-018', 'HS-RG-019'];
  var CUSTOMERS = ['Asha Interiors', 'Kora Hotels', 'Studio Meridian', 'Ember & Oak Cafés', 'Saffron Residences', 'Lattice Workspaces', 'Indigo Bay Resort', 'Mulberry Homes', 'Common Room Co-work', 'Dune Boutique Hotel', 'Teal House Architects', 'Pause Wellness Spa'];

  window.HALDEN = { COMPANY: COMPANY, WH_ADDR: WH_ADDR, BUYERS: BUYERS, BLR_RANGE: BLR_RANGE, SUPPLIERS: SUPPLIERS, SKUS: SKUS, WAREHOUSES: WAREHOUSES, ZONES: ZONES, BINS: BINS, CUSTOMERS: CUSTOMERS };
  // the shared catalogue other Halden demos can read: sku → { name, price }
  window.HALDEN_SKUS = SKUS.map(function (s) { return { sku: s.sku, name: s.name, category: s.category, price: s.price }; });

  /* ---------- 90-day history, replayed through the real engine so every balance and FIFO layer is consistent ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 0x100000000; }; }
  function poisson(r, lam) { var L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }

  window.HALDEN.seed = function (E) {
    var r = rng(20261124), DAY = 864e5;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var T0 = today.getTime() - 90 * DAY;
    function at(d, h, m) { return T0 + d * DAY + (h * 60 + (m || 0)) * 6e4; }
    // stop restocking these near the end so today's screen has real work in it
    var holdFrom = { 'HS-CH-001': 73, 'HS-LT-013': 52, 'HS-TX-020': 74, 'HS-LT-017': 76, 'HS-ST-012': 81 };
    var boost = { 'HS-LT-013': 1.6, 'HS-CH-001': 1.25 };

    // opening stock (older, slightly cheaper FIFO layer), split ~70/30 across the two DCs
    E.clock(at(0, 9));
    SKUS.forEach(function (s) {
      var days = s.sku === 'HS-TB-007' ? 520 : s.sku === 'HS-ST-010' ? 330 : 24;
      var q = Math.max(4, Math.round(s.vel * days + s.rop));
      if (s.buy.per > 1) q = Math.ceil(q / s.buy.per) * s.buy.per;
      var blr = BLR_RANGE.indexOf(s.sku) < 0 ? 0 : Math.floor(q * 0.3 / s.buy.per) * s.buy.per;
      E.post({ type: 'receipt', sku: s.sku, wh: 'BHW', bin: 'BHW-' + s.bin, qty: q - blr, cost: Math.round(s.cost * 0.95), ref: 'OPENING', note: 'Opening balance' });
      if (blr) E.post({ type: 'receipt', sku: s.sku, wh: 'BLR', bin: 'BLR-' + s.bin, qty: blr, cost: Math.round(s.cost * 0.95), ref: 'OPENING', note: 'Opening balance' });
    });

    var pending = []; // [{po, due, parts}]
    var toDispatch = [];
    for (var d = 1; d <= 89; d++) {
      // 09:30 dispatch yesterday's orders
      E.clock(at(d, 9, 30));
      toDispatch.splice(0).forEach(function (so) { E.startPicking(so.id); E.pickAll(so.id); E.dispatch(so.id); });
      // 11:00 receive what's due (some suppliers deliver in two parts)
      pending = pending.filter(function (p) {
        if (p.due > d) return true;
        E.clock(at(d, 11, Math.floor(r() * 50)));
        var po = E.po(p.po);
        var lines = po.lines.map(function (l) { var left = l.pq - l.recv; var q = p.parts === 2 ? Math.ceil(left * 0.6) : left; return { sku: l.sku, pq: q }; });
        E.receive(po.id, lines, po.wh);
        if (p.parts === 2) { p.parts = 1; p.due = d + 3; return true; }
        return false;
      });
      // daytime demand, bundled into 1–4 orders
      var demand = [];
      SKUS.forEach(function (s) {
        var lam = s.vel * (boost[s.sku] && d > 60 ? boost[s.sku] : 1) * (d % 7 === 0 ? 0.4 : 1.1);
        var q = poisson(r, lam);
        if (s.sku === 'HS-TB-007') q = d === 23 ? 1 : 0;        // slow movers: a sale or two in 90 days
        if (s.sku === 'HS-ST-010') q = d === 19 || d === 26 ? 1 : 0;
        if (q) demand.push({ sku: s.sku, qty: q });
      });
      var nOrders = Math.max(1, Math.min(4, Math.ceil(demand.length / 3)));
      for (var o = 0; o < nOrders && demand.length; o++) {
        E.clock(at(d, 12 + o, Math.floor(r() * 59)));
        var lines = demand.splice(0, Math.ceil(demand.length / (nOrders - o)));
        var wh = r() < 0.68 || lines.some(function (l) { return BLR_RANGE.indexOf(l.sku) < 0; }) ? 'BHW' : 'BLR';
        var so = E.createSO({ customer: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)], wh: wh, lines: lines, source: 'direct', partial: false });
        if (!so) continue;
        if (r() < 0.35) { E.clock(at(d, 17, 10)); E.startPicking(so.id); E.pickAll(so.id); E.dispatch(so.id); }
        else toDispatch.push(so);
      }
      // every other Monday: rebalance fast movers to Hoskote
      if (d % 14 === 3) {
        E.clock(at(d, 15, 20));
        window.HALDEN.BLR_RANGE.forEach(function (k) {
          var s = E.item(k), have = E.available(k, 'BHW'), want = Math.max(2, Math.round(s.vel * 8)), gap = want - E.onHand(k, 'BLR');
          if (gap > 0 && have > gap + s.rop * 0.6) E.transfer({ sku: k, fromWh: 'BHW', toWh: 'BLR', qty: gap, note: 'Top up Hoskote' });
        });
      }
      // cycle counts and the odd damaged item
      if (d % 9 === 5) {
        E.clock(at(d, 16, 40));
        var pick = SKUS[Math.floor(r() * SKUS.length)];
        var dq = r() < 0.7 ? -1 : 1;
        if (E.onHand(pick.sku, 'BHW') > 2) E.post({ type: 'adjustment', sku: pick.sku, wh: 'BHW', bin: 'BHW-' + pick.bin, qty: dq, ref: 'CC-' + (300 + d), note: dq < 0 ? 'Cycle count: 1 short' : 'Cycle count: found 1' });
      }
      if (d === 38) { E.clock(at(d, 14, 5)); E.post({ type: 'adjustment', sku: 'HS-LT-016', wh: 'BHW', bin: 'BHW-B-04', qty: -2, ref: 'DMG-118', note: 'Damaged in transit: cracked glaze' }); }
      // 18:00 reorder: anything at or under its reorder point gets a PO (the planner approves same day)
      E.clock(at(d, 18));
      SKUS.forEach(function (s) {
        if (holdFrom[s.sku] && d >= holdFrom[s.sku]) return;
        var proj = E.available(s.sku) + E.onOrder(s.sku);
        if (proj > s.rop) return;
        var sup = SUPPLIERS.filter(function (x) { return x.id === s.supplier; })[0];
        var units = Math.max(s.roq, s.rop * 2 - proj);
        var pq = Math.ceil(units / s.buy.per);
        var jitter = 1 + (r() - 0.45) * 0.08;
        var po = E.createPO({ supplier: s.supplier, wh: 'BHW', lines: [{ sku: s.sku, pq: pq, cost: Math.round(s.cost * jitter) }] });
        E.approvePO(po.id);
        pending.push({ po: po.id, due: d + sup.lead + Math.floor(r() * 3), parts: r() < 0.3 ? 2 : 1 });
      });
    }

    // today: leave real work on the floor
    E.clock(at(90, 8, 45));
    // yesterday's orders: some picked and staged, some mid-pick, some still waiting
    toDispatch.forEach(function (so, i) { if (i % 3 === 2) return; E.startPicking(so.id); if (i % 3 === 0) E.pickAll(so.id); });
    // one van already left this morning
    E.clock(at(90, 8, 5));
    var early = E.createSO({ customer: 'Teal House Architects', wh: 'BHW', lines: [{ sku: 'HS-LT-016', qty: 3 }, { sku: 'HS-RG-019', qty: 1 }], partial: false });
    if (early) { E.clock(at(90, 8, 20)); E.startPicking(early.id); E.pickAll(early.id); E.clock(at(90, 8, 40)); E.dispatch(early.id); }
    [['Common Room Co-work', 'BLR', [['HS-CH-002', 6], ['HS-TX-020', 12]], 2], ['Indigo Bay Resort', 'BHW', [['HS-SF-008', 2], ['HS-TB-005', 1], ['HS-RG-019', 1]], 0], ['Mulberry Homes', 'BHW', [['HS-CH-002', 4], ['HS-TB-005', 1], ['HS-LT-016', 2]], 1], ['Pause Wellness Spa', 'BLR', [['HS-TX-020', 16], ['HS-LT-017', 6]], 1], ['Lattice Workspaces', 'BHW', [['HS-ST-011', 3], ['HS-LT-018', 4], ['HS-CH-003', 6]], 0], ['Dune Boutique Hotel', 'BHW', [['HS-RG-019', 2], ['HS-LT-015', 2]], 0]].forEach(function (o, i) {
      E.clock(at(90, 9, 10 + i * 17));
      var so = E.createSO({ customer: o[0], wh: o[1], lines: o[2].map(function (x) { return { sku: x[0], qty: x[1] }; }), partial: true });
      if (so && o[3]) E.startPicking(so.id);
      if (so && o[3] === 2) E.pickAll(so.id);
    });
    // a purchase order that arrived half-full yesterday, the rest due in two days
    E.clock(at(86, 9, 40));
    var open = E.createPO({ supplier: 'SUP-AO', wh: 'BHW', lines: [{ sku: 'HS-LT-013', pq: 40, cost: 3960 }, { sku: 'HS-LT-018', pq: 12, cost: 5150 }] });
    E.clock(at(86, 10)); E.approvePO(open.id);
    E.clock(at(89, 11, 20)); E.receive(open.id, [{ sku: 'HS-LT-013', pq: 0 }, { sku: 'HS-LT-018', pq: 12 }], 'BHW');
    E.setEta(open.id, today.getTime() + 2 * DAY);
    pending.forEach(function (p) { E.setEta(p.po, T0 + p.due * DAY + 11 * 36e5); });
    // one supplier is running late
    if (pending.length) E.setEta(pending[0].po, today.getTime() - DAY + 11 * 36e5);
    // a won deal that came through Lumen CRM earlier (demo seed), already reserved
    E.clock(at(89, 16, 5));
    E.createSO({ customer: 'Kora Hotels', wh: 'BHW', source: 'crm', crmId: 'seed-kora', ref: 'Lumen deal · Kora Hotels lobby refit', lines: [{ sku: 'HS-CH-004', qty: 4 }, { sku: 'HS-LT-014', qty: 6 }, { sku: 'HS-TB-007', qty: 1 }], partial: true });
    // delivery notes from sales (shown first in pick mode: context before the form)
    var NOTES = ['Fragile glass: wrap each pendant on its own.', 'Deliver after 8 pm via the service lane; call the duty manager first.', 'Goods lift booked 2–4 pm, 4th floor. Bring floor protection.',
      'Quiet hours at the spa: deliver before 10 am.', 'Rugs travel rolled, never folded.', 'Site is sea-facing: shrink-wrap upholstery against humidity.', 'Call Ritu at reception on arrival.'];
    var ni = 0;
    E.sos().forEach(function (so) { if ((so.status === 'reserved' || so.status === 'picking' || so.status === 'picked') && !so.note) so.note = NOTES[ni++ % NOTES.length]; });
    // cycle-count history: every bin holding stock was last counted sometime in the past six weeks; two bins are flagged
    E.bins().forEach(function (b) { if (E.binQty(b.id).length) E.setCounted(b.id, today.getTime() - Math.floor(2 + r() * 42) * DAY); });
    E.state().countFlags['BHW-B-02'] = today.getTime() - DAY + 15 * 36e5;
    E.state().countFlags['BHW-A-08'] = today.getTime() - 2 * DAY + 11 * 36e5;
    E.clock(null);
  };
})();
