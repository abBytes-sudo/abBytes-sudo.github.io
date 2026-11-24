/* Revv inspection report: 150 real checkpoints (demo data, stable per listing), sticky vehicle + score gauge with hotspots,
   honest findings first, segmented bars, expandable categories, inspector card, seal, verify modal, printable A4. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA, $ = R.$, $$ = R.$$;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- checkpoint library: [name, value kind, finding?] ----------
  // finding = [what was found, what was done, 'fixed'|'advisory', measured before, after]
  var C = {
    bike: {
      'Exterior and paint': [['Paint depth, tank left', 'paint'], ['Paint depth, tank right', 'paint'], ['Paint depth, tail left', 'paint', ['Touched-up scuff on the left tail panel, 168 µm against a 120 µm average', 'Blended and machine-polished by the dealer before listing', 'fixed', '168 µm', '131 µm']], ['Paint depth, tail right', 'paint'], ['Paint depth, front mudguard', 'paint'], ['Paint depth, fairing or headlamp cowl', 'paint'], ['Frame welds and paint', ''], ['Frame corrosion', 'none'], ['Swingarm finish', ''], ['Subframe straightness', 'align'], ['Screen or flyscreen', ''], ['Mirrors and stalks', ''], ['Headlamp lens', ''], ['Tail-lamp lens', ''], ['Bar ends and levers', '', ['Light scuff on the left bar end from a parking tip-over', 'Cosmetic only. Disclosed and left as is', 'advisory', 'Scuffed', 'As is']], ['Footpegs and hangers', ''], ['Seat cover and stitching', ''], ['Tank cap seal', ''], ['Body fasteners, complete', 'count'], ['Crash-damage signs', 'none'], ['Frame number matches papers', 'vin'], ['Engine number matches papers', 'vin'], ['Number-plate bracket', ''], ['Underside and belly pan', '']],
      'Engine and transmission': [['Cold start', ''], ['Idle speed', 'rpm'], ['Compression, cylinder 1', 'comp'], ['Compression, cylinder 2', 'comp'], ['Oil level and condition', 'oil'], ['Oil leaks', 'none'], ['Coolant level and condition', '', ['Coolant brown and past its change interval', 'Flushed and refilled with OEM coolant', 'fixed', 'Due', 'Fresh']], ['Radiator and hoses', ''], ['Air filter', ''], ['Spark plugs', ''], ['Valve-train noise', ''], ['Cam-chain tensioner', ''], ['Exhaust headers and gaskets', ''], ['Exhaust silencer mounts', ''], ['Throttle response', ''], ['Throttle cable or ride-by-wire', ''], ['Clutch engagement', ''], ['Clutch free play', 'mm2'], ['Gearbox, all gears', ''], ['Neutral finder', ''], ['Quickshifter', ''], ['Chain slack', 'chain', ['Chain slack 42 mm against a 25–35 mm spec', 'Adjusted to spec, cleaned and lubed', 'fixed', '42 mm', '30 mm']], ['Chain wear', 'pct'], ['Sprocket teeth', ''], ['Engine mounts', ''], ['Fuel pump and lines', ''], ['Operating temperature', 'temp'], ['Stored fault codes (OBD)', 'obd']],
      'Brakes': [['Front pads', 'pad', ['Front pads at 40%', "Replaced before listing, at the dealer's cost", 'fixed', '40%', '100%']], ['Rear pads', 'pad'], ['Front disc thickness', 'disc'], ['Front disc run-out', 'runout'], ['Rear disc thickness', 'disc'], ['Front calipers', ''], ['Rear caliper', ''], ['Brake fluid moisture', 'fluid', ['Brake fluid at 3.1% water content', 'Flushed and bled with fresh DOT 4', 'fixed', '3.1%', '0.4%']], ['Front lines and banjos', ''], ['Rear line', ''], ['Front lever feel', ''], ['Rear pedal feel', ''], ['ABS self-test', ''], ['Emergency stop, 60–0 km/h', 'stop']],
      'Suspension and steering': [['Fork seals', '', ['Light weep on the left fork seal', 'Both seals replaced and fork oil changed', 'fixed', 'Weep', 'Dry']], ['Fork oil', ''], ['Fork stanchions, pitting', 'none'], ['Front sag', 'sag'], ['Rear sag', 'sag'], ['Rear shock damping', ''], ['Rear shock leaks', 'none'], ['Steering-head bearings', ''], ['Steering lock to lock', ''], ['Steering damper', ''], ['Swingarm bearings', ''], ['Linkage bearings', ''], ['Wheel bearings, front', ''], ['Wheel bearings, rear', ''], ['Wheel alignment', 'align'], ['Triple clamp bolts torqued', ''], ['Handlebar straightness', 'align'], ['Preload and damping set to owner', '']],
      'Tyres and wheels': [['Front tread depth', 'tread'], ['Rear tread depth', 'tread', ['Rear tyre at 3.1 mm, roughly 2,000 km left', 'Disclosed and reflected in the price. Not replaced', 'advisory', '3.1 mm', 'As is']], ['Front tyre age', 'age'], ['Rear tyre age', 'age'], ['Tyre pressures', 'psi'], ['Sidewall cracks', 'none'], ['Front rim run-out', 'runout'], ['Rear rim run-out', 'runout'], ['Rim damage', 'none'], ['Valve stems', ''], ['Spokes or casting', ''], ['Wheel balance', '']],
      'Electricals': [['Battery health', 'batt', ['Battery at 78% capacity', 'Charged and load-tested; replacement advised within a year', 'advisory', '78%', '78%']], ['Charging voltage', 'volt'], ['Starter motor', ''], ['Headlamp, low and high', ''], ['Headlamp aim', ''], ['Indicators, all four', ''], ['Brake light, both switches', ''], ['Tail light', ''], ['Horn', ''], ['Dash, all segments', ''], ['Warning lights', ''], ['Kill switch', ''], ['Side-stand cut-out', ''], ['Ignition key and spare', 'keys'], ['Immobiliser', ''], ['Riding modes', ''], ['Traction control', ''], ['USB or 12 V socket', ''], ['Wiring loom, chafe', 'none'], ['Fuse box', '']],
      'Cabin and controls': [['Clutch lever', '', ['Clutch lever bent at the tip', 'Replaced with an OEM lever', 'fixed', 'Bent', 'New']], ['Brake lever', ''], ['Lever span adjusters', ''], ['Switchgear, left', ''], ['Switchgear, right', ''], ['Throttle return', ''], ['Gear lever and linkage', ''], ['Rear brake pedal', ''], ['Seat lock', ''], ['Under-seat storage', ''], ['Tank bag or luggage mounts', ''], ['Grab rails', ''], ['Side stand and spring', ''], ['Centre stand', ''], ['Mirrors adjust and hold', ''], ['Owner manual and toolkit', '']],
      'Road test': [['Distance logged', 'km'], ['Cold to hot behaviour', ''], ['Pull-away and clutch take-up', ''], ['Gear changes up and down', ''], ['Straight-line stability', ''], ['Hands-off tracking', ''], ['Cornering, both directions', ''], ['Braking, front only', ''], ['Braking, rear only', ''], ['ABS on a loose surface', ''], ['Quickshifter under load', ''], ['Highway cruise, 100 km/h', ''], ['Vibration at cruise', ''], ['Idle stability when hot', '', ['Idle hunting slightly once hot', 'Throttle bodies synchronised', 'fixed', '± 400 rpm', '± 50 rpm']], ['Fan cut-in', ''], ['Unusual noises', 'none'], ['Speedometer accuracy', 'speedo'], ['Post-ride leak check', 'none']]
    },
    car: {
      'Exterior and paint': [['Paint depth, bonnet', 'paint'], ['Paint depth, roof', 'paint'], ['Paint depth, front-left door', 'paint'], ['Paint depth, front-right door', 'paint'], ['Paint depth, rear-left door or quarter', 'paint'], ['Paint depth, rear-right door or quarter', 'paint'], ['Paint depth, boot lid', 'paint'], ['Paint depth, front bumper', 'paint', ['Front bumper repainted for stone chips, 186 µm', 'Disclosed. Colour match checked under daylight lamps', 'advisory', '186 µm', 'Repaint']], ['Paint depth, rear bumper', 'paint'], ['Paint depth, front wings', 'paint'], ['Panel gaps, all doors', 'gap'], ['Panel gaps, bonnet and boot', 'gap'], ['Windscreen chips', 'none'], ['Side and rear glass', ''], ['Mirrors and housings', ''], ['Headlamp lenses', ''], ['Tail-lamp lenses', ''], ['Wiper blades', '', ['Wiper blades smearing', 'Both blades replaced', 'fixed', 'Smearing', 'New']], ['Door seals', ''], ['Underbody corrosion', 'none'], ['Sills and jacking points', ''], ['Badges and trim', ''], ['Chassis number matches papers', 'vin'], ['Accident-repair signs', 'none']],
      'Engine and transmission': [['Cold start', ''], ['Idle speed', 'rpm'], ['Compression, all cylinders', 'comp'], ['Oil level and condition', 'oil'], ['Oil leaks', 'none'], ['Coolant level and condition', ''], ['Radiator and hoses', ''], ['Drive belt', ''], ['Timing chain or belt record', ''], ['Air filter', ''], ['Turbo boost and shaft play', 'boost'], ['Intercooler pipes', ''], ['Engine mounts', ''], ['Gearbox mounts', ''], ['Exhaust system', '', ['Blowing gasket at the exhaust manifold', 'Gasket replaced', 'fixed', 'Blowing', 'Sealed']], ['Catalytic converter efficiency', ''], ['Throttle response', ''], ['Clutch bite or torque converter', ''], ['Gearbox, all gears', ''], ['Transmission fluid', '', ['Transmission fluid dark and over interval', 'Fluid and filter changed', 'fixed', 'Dark', 'Fresh']], ['Differential', ''], ['Drive shafts and CV joints', ''], ['Fuel system', ''], ['Operating temperature', 'temp'], ['Stored fault codes (OBD)', 'obd', ['One stored code for an intake air-temperature sensor', 'Sensor replaced and code cleared', 'fixed', '1 code', '0 codes']], ['Emissions (PUC) reading', 'puc'], ['Engine bay cleanliness', ''], ['Under-bonnet fluid levels', '']],
      'Brakes': [['Front pads', 'pad'], ['Rear pads', 'pad'], ['Front disc thickness', 'disc'], ['Rear disc condition', 'disc', ['Rear discs lipped at the edge', 'Discs skimmed within service limits', 'fixed', 'Lipped', 'Skimmed']], ['Front calipers', ''], ['Rear calipers', ''], ['Brake fluid moisture', 'fluid'], ['Brake lines and hoses', ''], ['Handbrake or e-brake', ''], ['Pedal feel', ''], ['ABS self-test', ''], ['ESC self-test', ''], ['Brake assist', ''], ['Emergency stop, 80–0 km/h', 'stop']],
      'Suspension and steering': [['Front shock absorbers', ''], ['Rear shock absorbers', ''], ['Springs', ''], ['Front control-arm bushes', ''], ['Rear bushes', '', ['Rear lower-arm bushes perished', 'Both bushes replaced', 'fixed', 'Cracked', 'New']], ['Anti-roll bar links', ''], ['Ball joints', ''], ['Track-rod ends', ''], ['Steering rack', ''], ['Power steering', ''], ['Steering wheel centred', ''], ['Wheel alignment', 'align', ['Toe slightly out, car pulled left', 'Four-wheel alignment set after inspection', 'fixed', '+0.4°', '0.0°']], ['Ride height, level', 'mm2'], ['Wheel bearings, front', ''], ['Wheel bearings, rear', ''], ['Subframe mounts', ''], ['Air or adaptive suspension', ''], ['Noise over speed bumps', 'none']],
      'Tyres and wheels': [['Front-left tread', 'tread'], ['Front-right tread', 'tread'], ['Rear-left tread', 'tread', ['Rear-left tyre at 3.4 mm', 'Both rear tyres replaced as a pair', 'fixed', '3.4 mm', '7.8 mm']], ['Rear-right tread', 'tread'], ['Tyre age', 'age'], ['Tyre pressures', 'psi'], ['Even wear', ''], ['Sidewall cracks', 'none'], ['Rim damage', 'none', ['Kerbed rim, front left', 'Refurbished by the dealer', 'fixed', 'Kerbed', 'Refinished']], ['Spare or repair kit', ''], ['Locking wheel nut', ''], ['Wheel balance', '']],
      'Electricals': [['12 V battery', 'volt', ['12 V battery weak on a load test', 'Battery replaced', 'fixed', '11.9 V', '12.7 V']], ['Charging system', 'volt'], ['Starter motor', ''], ['Headlamps and aim', ''], ['Daytime running lights', ''], ['Indicators and hazards', ''], ['Brake lights', ''], ['Reverse lights and camera', ''], ['Parking sensors', ''], ['Central locking', ''], ['Keys and spare', 'keys'], ['Power windows', ''], ['Mirrors, fold and heat', ''], ['Infotainment and phone link', ''], ['Speakers', ''], ['Instrument cluster', ''], ['Warning lights', ''], ['Driver-assist cameras', ''], ['Airbag system', ''], ['Interior lights', '']],
      'Cabin and controls': [['Driver seat bolster', '', ['Driver seat bolster worn', 'Disclosed. Leather conditioned', 'advisory', 'Worn', 'As is']], ['Seat adjustment', ''], ['Seat belts, all', ''], ['Steering wheel and controls', ''], ['Pedals and pedal rubbers', ''], ['Gear selector', ''], ['Air conditioning', 'ac', ['A/C vent temperature 11 °C', 'Re-gassed and cabin filter replaced', 'fixed', '11 °C', '5 °C']], ['Cabin filter', ''], ['Headliner', '', ['Small sag in the headliner above the rear seat', 'Disclosed. Re-glued; a faint line remains', 'advisory', 'Sagging', 'Re-glued']], ['Carpets and mats', ''], ['Odour', 'none'], ['Boot floor and spare well', ''], ['Glovebox and storage', ''], ['Sunroof seals', ''], ['Owner manual and service book', ''], ['Floor dampness', 'none']],
      'Road test': [['Distance logged', 'km'], ['Cold to hot behaviour', ''], ['Pull-away', ''], ['Gear changes, up and down', ''], ['Kick-down response', ''], ['Straight-line stability', ''], ['Steering self-centring', ''], ['Cornering, both directions', ''], ['Braking, straight and true', ''], ['ABS on a loose surface', ''], ['Highway cruise, 100 km/h', ''], ['Wind and road noise', ''], ['Vibration at cruise', ''], ['Cruise control', ''], ['Climate control on the move', ''], ['Unusual noises', 'none'], ['Speedometer accuracy', 'speedo'], ['Post-drive leak check', 'none']]
    }
  };
  // electric drivetrains swap the engine checks
  var EV = [['Battery state of health', 'soh'], ['Cell voltage spread', 'cells'], ['Insulation resistance', 'insul'], ['High-voltage cabling', ''], ['Battery coolant', ''], ['Battery housing and mounts', ''], ['Motor noise under load', ''], ['Inverter temperature', 'temp'], ['Reduction gear', ''], ['Regenerative braking', ''], ['On-board charger', ''], ['DC fast-charge test', 'kw'], ['AC charge test', ''], ['Charge port and flap', ''], ['Charging cable', ''], ['Thermal management', ''], ['Pre-conditioning', ''], ['Range estimate vs history', 'range'], ['Software version', 'sw'], ['Drive modes', ''], ['Pedestrian warning sound', ''], ['Motor mounts', ''], ['Drive shafts', ''], ['12 V system', 'volt'], ['DC-DC converter', ''], ['Charging history', ''], ['Stored fault codes (OBD)', 'obd'], ['Cooling pump', '']];

  function valFor(kind, r, l) {
    var n = function (a, b, dp) { return (a + r() * (b - a)).toFixed(dp || 0); };
    switch (kind) {
      case 'paint': return n(l.type === 'car' ? 104 : 94, l.type === 'car' ? 132 : 128) + ' µm';
      case 'tread': return n(5.2, 7.4, 1) + ' mm';
      case 'pad': return n(68, 96) + '%';
      case 'disc': return n(0.1, 0.4, 1) + ' mm wear';
      case 'runout': return n(0.02, 0.09, 2) + ' mm';
      case 'fluid': return n(0.3, 1.4, 1) + '% water';
      case 'comp': return n(168, 184) + ' psi';
      case 'rpm': return n(l.type === 'bike' ? 1150 : 700, l.type === 'bike' ? 1400 : 850) + ' rpm';
      case 'oil': return 'Clean · at max';
      case 'temp': return n(84, 96) + ' °C';
      case 'obd': return '0 stored';
      case 'chain': return n(26, 34) + ' mm';
      case 'pct': return n(8, 32) + '% worn';
      case 'mm2': return n(2, 4) + ' mm';
      case 'sag': return n(28, 36) + ' mm';
      case 'align': return 'Within spec';
      case 'age': return 'Week ' + n(10, 48) + ', ' + Math.max(l.year, new Date().getFullYear() - 2);
      case 'psi': return l.type === 'bike' ? '36 / 42 psi' : '35 psi all round';
      case 'batt': return n(88, 99) + '%';
      case 'volt': return n(12.5, 12.8, 1) + ' V';
      case 'keys': return '2 keys';
      case 'km': return n(16, 24) + ' km';
      case 'stop': return n(l.type === 'bike' ? 17 : 26, l.type === 'bike' ? 20 : 31, 1) + ' m';
      case 'speedo': return '+' + n(2, 5) + '% (normal)';
      case 'gap': return n(3.6, 4.4, 1) + ' mm, even';
      case 'boost': return 'Within spec';
      case 'puc': return 'Pass · CO ' + n(0.1, 0.3, 2) + '%';
      case 'soh': return (l.spec.battery && /(\d+)% health/.exec(l.spec.battery) ? /(\d+)% health/.exec(l.spec.battery)[1] : '96') + '%';
      case 'cells': return n(6, 14) + ' mV';
      case 'insul': return n(480, 900) + ' MΩ';
      case 'kw': return n(110, 150) + ' kW peak';
      case 'range': return n(94, 99) + '% of new';
      case 'sw': return 'Current';
      case 'ac': return n(4, 6) + ' °C at vent';
      case 'vin': return 'Matches';
      case 'count': return 'All present';
      case 'none': return 'None found';
      default: return '';
    }
  }

  R.inspection = function (l) {
    var r = R.rng(l.id + 'insp'), lib = C[l.type] || C.car, ev = l.fuel === 'Electric';
    var groups = D.GROUPS.map(function (g) {
      var list = lib[g[0]].slice(0, g[1]);
      if (ev && g[0] === 'Engine and transmission') list = EV.slice(0, g[1]);
      return { name: ev && g[0] === 'Engine and transmission' ? 'Motor, battery and drive' : g[0], key: g[0], total: g[1], items: list.map(function (c) { return { name: c[0], val: valFor(c[1], r, l), find: c[2] || null, st: 'pass' }; }) };
    });
    // choose which candidate findings this vehicle actually had: exactly 150 - score of them
    var cands = []; groups.forEach(function (g, gi) { g.items.forEach(function (it, ii) { if (it.find) cands.push([gi, ii]); }); });
    var rr = R.rng(l.id + 'finds'); cands.sort(function () { return rr() - 0.5; });
    var misses = Math.max(0, Math.min(cands.length, 150 - (l.score || 148)));
    cands.slice(0, misses).forEach(function (c) { var it = groups[c[0]].items[c[1]]; it.st = it.find[2]; it.val = it.find[3] + (it.find[4] && it.find[4] !== it.find[3] ? ' → ' + it.find[4] : ''); });
    groups.forEach(function (g) { g.ok = g.items.filter(function (i) { return i.st === 'pass'; }).length; g.fixed = g.items.filter(function (i) { return i.st === 'fixed'; }).length; g.adv = g.items.filter(function (i) { return i.st === 'advisory'; }).length; });
    var ok = groups.reduce(function (s, g) { return s + g.ok; }, 0);
    var insp = [['A. Menon', 'RV-INS-0412', 9, 2140], ['R. Iyer', 'RV-INS-0277', 7, 1680], ['S. Khanna', 'RV-INS-0538', 5, 1210], ['D. Pillai', 'RV-INS-0190', 11, 2790], ['N. Shaikh', 'RV-INS-0613', 4, 940]][Math.floor(r() * 5)];
    var date = new Date(Date.now() - (3 + Math.floor(r() * 20)) * 864e5);
    var id = 'RV-' + l.id.replace(/[^a-z0-9]/g, '').slice(0, 4).toUpperCase() + '-' + (1000 + Math.floor(r() * 9000));
    var vin = String(10 + Math.floor(r() * 89));
    var NOTES = { 'Exterior and paint': 'Paint gauge readings are consistent panel to panel; no hidden filler.', 'Engine and transmission': 'Starts clean from cold, no smoke, no leaks after the road test.', 'Motor, battery and drive': 'Battery health matches the charging history; no isolation faults.', 'Brakes': 'Strong, even braking; no judder through the lever or pedal.', 'Suspension and steering': 'Tracks straight; no knocks over our speed-bump loop.', 'Tyres and wheels': 'Matched brands, even wear; no repairs or plugs.', 'Electricals': 'Every switch and lamp works; no intermittent faults.', 'Cabin and controls': 'Controls are tight and complete; no water ingress.', 'Road test': 'Logged on our standard city and highway loop with a data logger.' };
    groups.forEach(function (g) { g.note = NOTES[g.name] || ''; });
    return { groups: groups, ok: ok, findings: [].concat.apply([], groups.map(function (g) { return g.items.filter(function (i) { return i.st !== 'pass'; }).map(function (i) { return { g: g.name, it: i }; }); })), inspector: insp[0], inspId: insp[1], years: insp[2], count: insp[3], date: date, id: id, vin: vin };
  };

  // ---------- render ----------
  R.renderReport = function (l) {
    var sec = $('#report'); if (!sec) return;
    var rep = R.inspection(l), title = R.title(l), d = R.dealer(l.dealer);
    var F = (D.FOCUS && D.FOCUS[l.img]) || { box: [0, 0, 1, 1] }, H = (D.HOT && D.HOT[l.img]) || {};
    var SPOT = { 'Exterior and paint': ['body', 'Paint and panels'], 'Engine and transmission': ['eng', 'Engine'], 'Motor, battery and drive': ['eng', 'Motor and battery'], 'Brakes': ['fw', 'Front disc and calipers'], 'Suspension and steering': ['fw', l.type === 'bike' ? 'Forks and steering head' : 'Front suspension'], 'Tyres and wheels': ['fw', 'Tyres and rims'], 'Electricals': ['lamp', 'Lamps and electrics'], 'Cabin and controls': ['cab', l.type === 'bike' ? 'Cockpit and controls' : 'Cabin'], 'Road test': [null, 'Whole vehicle, 18 km loop'] };
    var fmt = function (dt) { return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); };
    var nFind = rep.findings.length, nFixed = rep.findings.filter(function (f) { return f.it.st === 'fixed'; }).length;
    var pctBetter = Math.max(40, Math.min(99, Math.round(100 * (1 - Math.pow((150 - l.score) / 25, 1.3)))));
    $('#ir-intro').textContent = 'Inspected by ' + rep.inspector + ' on ' + fmt(rep.date) + '. ' + (nFind ? nFind + ' of 150 checks fell short; ' + nFixed + (nFixed === 1 ? ' was' : ' were') + ' fixed before listing and the rest are disclosed below.' : 'Every check passed.');
    $('#ir-ctx').innerHTML = '<b>Better than ' + pctBetter + '%</b> of ' + R.esc(l.make + ' ' + l.model) + ' reports on Revv';

    // vehicle photo + hotspot
    var media = $('#ir-media'), im = $('#ir-img');
    im.src = R.img(l); im.alt = l.color + ' ' + title + ', with the inspected area marked';
    function place() {
      var b = media.getBoundingClientRect(), nw = im.naturalWidth || 1600, nh = im.naturalHeight || 1000, r = F.box;
      var s = Math.min(b.width / ((r[2] - r[0]) * nw), b.height / ((r[3] - r[1]) * nh)) * 0.92; s = Math.min(s, 1);
      var w = nw * s, h = nh * s, cx = (r[0] + r[2]) / 2 * w, cy = (r[1] + r[3]) / 2 * h;
      var tx = w > b.width ? Math.min(0, Math.max(b.width - w, b.width / 2 - cx)) : (b.width - w) / 2, ty = h > b.height ? Math.min(0, Math.max(b.height - h, b.height / 2 - cy)) : (b.height - h) / 2;
      im.style.width = nw + 'px'; im.style.height = nh + 'px'; im.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
      place.m = { tx: tx, ty: ty, w: w, h: h }; spot(active, true);
    }
    var hot = $('#ir-hot'), active = -1;
    function spot(i, instant) {
      if (i < 0 || !place.m) return; var g = rep.groups[i], sp = SPOT[g.name] || [null, g.name], pt = sp[0] && H[sp[0]];
      var m = place.m, x = pt ? m.tx + pt[0] * m.w : m.tx + m.w / 2, y = pt ? m.ty + pt[1] * m.h : m.ty + m.h / 2;
      hot.style.transition = instant || reduce ? 'none' : '';
      hot.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
      hot.classList.toggle('wide', !pt); hot.classList.toggle('miss', g.ok < g.total);
      $('#ir-hot-l').innerHTML = '<span>' + R.esc(sp[1]) + '</span><b>' + g.ok + '/' + g.total + '</b>';
    }
    function setActive(i) { if (i === active) return; active = i; spot(i); $$('.ir-cat').forEach(function (c, k) { c.classList.toggle('act', k === i); }); $$('#ir-chips button').forEach(function (c, k) { c.setAttribute('aria-pressed', k === i); }); }
    if (im.complete && im.naturalWidth) place(); else im.addEventListener('load', place, { once: true });
    new ResizeObserver(function () { if (im.naturalWidth) place(); }).observe(media);

    // score ring: one tick per checkpoint, misses in signal orange
    var ticks = [], k = 0; rep.groups.forEach(function (g) { g.items.forEach(function (it) { ticks.push(it.st); }); });
    var svg = '<circle cx="100" cy="100" r="80" class="ir-ring-bg"/>';
    ticks.forEach(function (st, i) { var a = (i / 150) * Math.PI * 2 - Math.PI / 2, r1 = 84, r2 = 96, c = Math.cos(a), s = Math.sin(a);
      svg += '<line x1="' + (100 + c * r1).toFixed(2) + '" y1="' + (100 + s * r1).toFixed(2) + '" x2="' + (100 + c * r2).toFixed(2) + '" y2="' + (100 + s * r2).toFixed(2) + '" class="' + (st === 'pass' ? 'p' : 'f') + '" style="transition-delay:' + (reduce ? 0 : (i * 9)) + 'ms"/>'; });
    $('#ir-ring').innerHTML = svg;
    $('#ir-mini').innerHTML = '<b id="ir-mn">' + rep.ok + '</b><span>/150 passed</span><i>' + nFind + ' finding' + (nFind === 1 ? '' : 's') + ' · ' + nFixed + ' fixed</i><a href="#ir-cats" class="ul" tabindex="-1">Checks</a>';
    $('#ir-sub').textContent = nFind ? nFind + ' finding' + (nFind === 1 ? '' : 's') + ' · ' + nFixed + ' fixed before listing' : 'Clean report';

    // findings first
    $('#ir-adv').innerHTML = rep.findings.length ? '<p class="k">What we found, and what was done</p><div class="ir-advs">' + rep.findings.map(function (f) {
      var it = f.it, fx = it.find; return '<article class="ir-ad ' + it.st + '"><p class="ir-ad-k"><span>' + R.esc(f.g) + '</span><em>' + (it.st === 'fixed' ? 'Fixed before listing' : 'Disclosed · not fixed') + '</em></p>' +
        '<h3>' + R.esc(fx[0]) + '</h3><p class="ir-ad-m"><span class="b">' + R.esc(fx[3]) + '</span>' + (it.st === 'fixed' ? '<span class="ar" aria-hidden="true">→</span><span class="a">' + R.esc(fx[4]) + '</span>' : '') + '</p><p class="ir-ad-d">' + R.esc(fx[1]) + '.</p></article>';
    }).join('') + '</div>' : '<p class="k">No findings</p><p>Every one of the 150 checks passed on the day.</p>';

    // chips (mobile) + categories (accordion)
    $('#ir-chips').innerHTML = rep.groups.map(function (g, i) { return '<button type="button" data-cat="' + i + '" aria-pressed="false">' + R.esc(g.name.split(' and ')[0].split(',')[0]) + ' <small class="' + (g.ok < g.total ? 'm' : '') + '">' + g.ok + '/' + g.total + '</small></button>'; }).join('');
    var ICON = { pass: '<span class="ic-p" aria-label="Pass">✓</span>', fixed: '<span class="ic-f" aria-label="Fixed">↻</span>', advisory: '<span class="ic-a" aria-label="Advisory">!</span>' };
    $('#ir-cats').innerHTML = rep.groups.map(function (g, i) {
      var tk = g.items.map(function (it, j) { return '<i class="' + (it.st === 'pass' ? 'p' : 'f') + '" style="--d:' + (j * 16) + 'ms"></i>'; }).join('');
      return '<li class="ir-cat" data-i="' + i + '"><h3 class="sr">' + R.esc(g.name) + '</h3><button type="button" class="ir-ch" aria-expanded="false" aria-controls="ir-p' + i + '" id="ir-b' + i + '"><span class="ir-cn">' + R.esc(g.name) + '</span><span class="ir-cc' + (g.ok < g.total ? ' m' : '') + '">' + g.ok + '<small>/' + g.total + '</small></span><span class="ir-tk" aria-hidden="true">' + tk + '</span><span class="ir-chev" aria-hidden="true"></span></button>' +
        '<div class="ir-pn" id="ir-p' + i + '" role="region" aria-labelledby="ir-b' + i + '" hidden><ul>' + g.items.map(function (it) { return '<li class="' + it.st + '">' + ICON[it.st] + '<span class="nm">' + R.esc(it.name) + '</span><span class="vl">' + R.esc(it.val || (it.st === 'pass' ? 'Pass' : '')) + '</span></li>'; }).join('') + '</ul><p class="ir-note"><b>' + R.esc(rep.inspector) + ':</b> ' + R.esc(g.note) + '</p></div></li>';
    }).join('');
    function toggle(i, open) { var b = $('#ir-b' + i), p = $('#ir-p' + i); if (!b) return; var o = open == null ? b.getAttribute('aria-expanded') !== 'true' : open; b.setAttribute('aria-expanded', o); p.hidden = !o; if (o) { setActive(i); if (!reduce) { p.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }); } } }
    $('#ir-cats').addEventListener('click', function (e) { var b = e.target.closest('.ir-ch'); if (b) toggle(+b.closest('.ir-cat').dataset.i); });
    $('#ir-cats').addEventListener('mouseover', function (e) { var c = e.target.closest('.ir-cat'); if (c && matchMedia('(min-width: 1001px)').matches) setActive(+c.dataset.i); });
    $('#ir-cats').addEventListener('focusin', function (e) { var c = e.target.closest('.ir-cat'); if (c) setActive(+c.dataset.i); });
    $('#ir-chips').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; var i = +b.dataset.cat; toggle(i, true); var c = $('.ir-cat[data-i="' + i + '"]'); var y = c.getBoundingClientRect().top + scrollY - 150; scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); });
    // the category crossing the middle of the screen drives the hotspot
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setActive(+e.target.dataset.i); }); }, { rootMargin: '-45% 0px -50% 0px' }); $$('.ir-cat').forEach(function (c) { io.observe(c); }); }
    var firstMiss = -1; rep.groups.forEach(function (g, i) { if (firstMiss < 0 && g.ok < g.total) firstMiss = i; });
    setActive(firstMiss < 0 ? 0 : firstMiss);

    // inspector + actions
    var ini = rep.inspector.replace(/[^A-Z]/g, '').slice(0, 2);
    $('#ir-insp').innerHTML = '<span class="av" aria-hidden="true">' + ini + '</span><div><b>' + R.esc(rep.inspector) + '</b><span>Inspector ' + rep.inspId + ' · ' + rep.years + ' years · ' + rep.count.toLocaleString('en-IN') + ' inspections</span></div>' +
      '<dl><div><dt>Inspected</dt><dd>' + fmt(rep.date) + '</dd></div><div><dt>Odometer</dt><dd>' + R.km(l.km) + ' <span class="ok">✓ verified</span></dd></div><div><dt>Where</dt><dd>' + R.esc(d.name) + ', ' + R.esc(d.city) + '</dd></div><div><dt>Report</dt><dd class="mono">' + rep.id + '</dd></div></dl>';
    $('#ir-seal').innerHTML = '<span>Revv<br>certified<br><b>' + l.score + '/150</b></span>';
    $('#ir-verify-b').addEventListener('click', function () {
      $('#ir-vbody').innerHTML = '<p class="ir-vok"><span>✓</span> Report ' + rep.id + ' is genuine</p><dl class="facts" style="grid-template-columns:1fr 1fr"><div><dt>Vehicle</dt><dd>' + R.esc(title) + '</dd></div><div><dt>VIN</dt><dd>ending ••' + rep.vin + '</dd></div><div><dt>Inspected</dt><dd>' + fmt(rep.date) + '</dd></div><div><dt>Inspector</dt><dd>' + R.esc(rep.inspector) + ' · ' + rep.inspId + '</dd></div><div><dt>Odometer then</dt><dd>' + R.km(l.km) + '</dd></div><div><dt>Issued to</dt><dd>' + R.esc(d.name) + '</dd></div></dl><p class="k" style="margin-top:16px">Unchanged since issue · matched against the Revv report register</p>';
      $('#ir-verify').showModal();
    });
    function openAll() { $$('.ir-ch').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); }); $$('.ir-pn').forEach(function (pn) { pn.hidden = false; pn.getAnimations().forEach(function (an) { an.finish(); }); }); }
    $('#ir-print').addEventListener('click', function () { openAll(); setTimeout(function () { window.print(); }, 60); });
    $('#ir-rid').textContent = rep.id;

    // entrance: ring ticks fill, score counts up, seal stamps once (all final immediately under reduced motion)
    var n = $('#ir-n');
    function run() {
      sec.classList.add('on');
      if (reduce) { n.textContent = rep.ok; return; }
      var t0 = performance.now(), dur = 1500;
      (function tick(t) { var u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * u); n.textContent = Math.round(rep.ok * (u >= 1 ? 1 : e)); if (u < 1) requestAnimationFrame(tick); })(t0);
    }
    addEventListener('beforeprint', function () { sec.classList.add('on'); n.textContent = rep.ok; openAll(); });
    if (reduce || !('IntersectionObserver' in window)) run();
    else { var once = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { once.disconnect(); run(); } }, { threshold: 0.25 }); once.observe($('#ir-score')); }
    return rep;
  };
})();
