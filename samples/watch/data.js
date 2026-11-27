/* Ghatika: catalogue, boutiques, journal and the seeded back-office records. */
(function () {
  'use strict';
  var MODELS = {
    prahar: {
      id: 'prahar', name: 'Prahar', ref: 'GH-01.39', line: 'Hand-wound · small seconds', price: 385000,
      tagline: 'The quietest watch we make.',
      desc: 'A prahar is a watch of the day: three hours, eight to a day and night. Prahar keeps hours, minutes and a small seconds at six on a lehariya dial cut by hand, and asks only that you wind it each morning.',
      img: 'img/prahar.webp', sig: { dial: 'pichola', metal: 'steel', strap: 'cognac' },
      specs: [['Case', '39 mm × 9.8 mm · 904L steel, brushed flanks'], ['Movement', 'Calibre GH-01 · hand-wound · 21 jewels'], ['Frequency', '21,600 vph (3 Hz)'], ['Power reserve', '72 hours'], ['Dial', 'Lehariya guilloché, cut on a 1931 rose engine'], ['Crystal', 'Domed sapphire, anti-reflective inside'], ['Caseback', 'Sapphire display, individually numbered'], ['Water resistance', '50 m'], ['Lug width', '20 mm'], ['Edition', '300 a year']],
      story: 'Prahar began as a single question from our first client: could we make a watch that does nothing but tell the time, beautifully? It took eleven months. The answer is 39 millimetres of brushed steel, a dial with 120 waves cut one pass at a time, and a movement you can watch breathe through the back.'
    },
    nimisha: {
      id: 'nimisha', name: 'Nimisha', ref: 'GH-03.36', line: 'Automatic · tithi moon', price: 465000,
      tagline: 'The moon over Pichola, on your wrist.',
      desc: 'Nimisha means the blink of an eye. Its moon disc follows the tithi, the lunar day of the Indian calendar, so Purnima and Amavasya arrive on your wrist the evening they rise over the lake.',
      img: 'img/nimisha.webp', sig: { dial: 'sandstone', metal: 'rose', strap: 'ink' },
      specs: [['Case', '36 mm × 10.4 mm'], ['Movement', 'Calibre GH-03 · automatic · 27 jewels'], ['Frequency', '28,800 vph (4 Hz)'], ['Power reserve', '52 hours'], ['Complication', 'Tithi moon, accurate to one day in 122 years'], ['Dial', 'Jaali guilloché, after the carved screens of the City Palace'], ['Crystal', 'Domed sapphire, anti-reflective inside'], ['Caseback', 'Sapphire display, 22k gold rotor'], ['Water resistance', '50 m'], ['Lug width', '18 mm']],
      story: 'The moon disc is painted by hand in our studio with powdered lapis and gold leaf, then set behind an aperture shaped like the arch of a jharokha. Wear it for a month and you will start looking up.'
    },
    yantra: {
      id: 'yantra', name: 'Yantra', ref: 'GH-02.41', line: 'Automatic · GMT', price: 525000,
      tagline: 'Two time zones, one sundial.',
      desc: 'Yantra reads a second time zone on a 24-hour ring, with a sunray dial that borrows the shadow lines of an eighteenth-century stone sundial. Made for the people who live between Udaipur and everywhere else.',
      img: 'img/yantra.webp', sig: { dial: 'monsoon', metal: 'steel', strap: 'bracelet' },
      specs: [['Case', '41 mm × 11.2 mm'], ['Movement', 'Calibre GH-02 · automatic GMT · 25 jewels'], ['Frequency', '28,800 vph (4 Hz)'], ['Power reserve', '60 hours'], ['Complication', 'Second time zone, 24-hour hand set independently'], ['Dial', 'Sunray, 360 lines'], ['Crystal', 'Domed sapphire, anti-reflective inside'], ['Caseback', 'Sapphire display'], ['Water resistance', '100 m'], ['Lug width', '21 mm']],
      story: 'Every Yantra is set at the atelier to Udaipur time on the main hands and to the time zone you choose on the 24-hour hand, so it arrives ready for the flight home.'
    }
  };
  var DIALS = [
    { id: 'pichola', name: 'Pichola blue', note: 'the lake at nine at night', c: '#28477a' },
    { id: 'sandstone', name: 'Sandstone', note: 'a salmon dial, like Jaisalmer at dusk', c: '#d39a78' },
    { id: 'monsoon', name: 'Monsoon slate', note: 'the sky before the first rain', c: '#4a5058' },
    { id: 'ivory', name: 'Ivory grand feu', note: 'fired enamel, smooth as porcelain', c: '#ece4d3' },
    { id: 'aravalli', name: 'Aravalli green', note: 'the hills after August', c: '#2a5343' }
  ];
  var METALS = [
    { id: 'steel', name: '904L steel', add: 0, c: '#cfd2d5' },
    { id: 'titanium', name: 'Grade 5 titanium', add: 45000, c: '#a6a39c' },
    { id: 'rose', name: '18k rose gold', add: 420000, c: '#e3ae94' },
    { id: 'yellow', name: '18k yellow gold', add: 395000, c: '#e9c57e' }
  ];
  var STRAPS = [
    { id: 'cognac', name: 'Cognac calf', note: 'vegetable-tanned, hand-stitched in Jodhpur', add: 0, c: '#7a3f1c' },
    { id: 'ink', name: 'Ink alligator-grain', note: 'embossed calf, no exotic skins', add: 18000, c: '#1f2433' },
    { id: 'sand', name: 'Sand suede', note: 'soft, unlined, for summer', add: 0, c: '#a88e6d' },
    { id: 'bracelet', name: 'Rann bracelet', note: 'five-link, steel and titanium only', add: 85000, c: '#c3c6c9', metals: ['steel', 'titanium'] }
  ];
  var BOUTIQUES = [
    { id: 'udaipur', city: 'Udaipur', name: 'The Atelier', area: 'Lal Ghat, by Lake Pichola', addr: 'Haveli No. 14, Lal Ghat Road, Udaipur, Rajasthan 313001', hours: 'Tue–Sun · 11:00–19:30', note: 'Our workshop and flagship. Watch the benches through a glass wall; the rose engine runs on Thursdays.', img: 'img/bq-udaipur.jpg', services: ['Viewing', 'Bench tour', 'Service drop-off', 'Strap fitting'] },
    { id: 'mumbai', city: 'Mumbai', name: 'Kala Ghoda', area: 'Rampart Row, Fort', addr: '2nd floor, 11 Rampart Row, Kala Ghoda, Mumbai 400001', hours: 'Mon–Sat · 11:00–20:00', note: 'A first-floor salon above the bookshops, with a watchmaker in residence on Saturdays.', img: 'img/bq-mumbai.jpg', services: ['Viewing', 'Service drop-off', 'Strap fitting'] },
    { id: 'delhi', city: 'New Delhi', name: 'Mehrauli', area: 'Kalka Das Marg', addr: 'Ground floor, 7 Kalka Das Marg, Mehrauli, New Delhi 110030', hours: 'Tue–Sun · 12:00–20:00', note: 'A courtyard room facing the Qutub skyline. Evening appointments until nine on request.', img: 'img/bq-delhi.jpg', services: ['Viewing', 'Service drop-off'] },
    { id: 'bengaluru', city: 'Bengaluru', name: 'Lavelle Road', area: 'Ashok Nagar', addr: '3 Lavelle Road, Ashok Nagar, Bengaluru 560001', hours: 'Mon–Sat · 11:00–19:30', note: 'Our newest room: a deep sofa, two lamps and every dial we make, on a quiet street by the park.', img: 'img/bq-bengaluru.jpg', services: ['Viewing', 'Strap fitting'] }
  ];
  var PURPOSES = ['Private viewing', 'Configure a commission', 'Service or repair', 'Strap fitting', 'Bench tour (Udaipur only)'];
  var SLOTS = ['11:00', '12:00', '13:30', '15:00', '16:30', '18:00'];

  var JOURNAL = [
    { id: 'rose-engine', cat: 'Craft', date: '2026-11-08', read: 6, img: 'img/j-rose-engine.jpg', alt: 'A watchmaker’s hands setting a wheel with tweezers', title: 'Why we still cut dials on a 1931 rose engine',
      dek: 'A machine older than Indian independence, a lever moved by hand, and 120 passes for a single lehariya dial.',
      body: [
        ['p', 'The rose engine at the back of our atelier arrived from a closing workshop in the Jura in 2019, in four crates and with no manual. It is a lathe that rocks: a set of brass cams, called rosettes, push the spindle side to side as it turns, and a cutter held still against the blank traces that movement as a line. Cut one line, index the blank a fraction of a degree, cut the next. A pattern is nothing more than patience, repeated.'],
        ['p', 'Our lehariya dial takes 120 passes. Each wave on the Prahar dial is one pass of the cutter, with the phase shifted by a few hundredths of a turn so the ripples drift outward like dye moving through cloth. A CNC machine could do this in four minutes. It would also do it perfectly, and that is the problem: a hand-cut dial has a living edge, a slight variation of depth from line to line that catches light differently as you turn your wrist.'],
        ['h2', 'What the hand gives the light'],
        ['p', 'Under a loupe, a stamped dial shows a pattern pressed into soft metal; the lines are rounded at the bottom. An engine-turned line is a cut, with a flat floor and two crisp walls. The walls are what you see. They work like tiny mirrors, so the dial glows from inside rather than reflecting a single highlight.'],
        ['q', 'A CNC machine would do it perfectly. That is the problem.'],
        ['p', 'Mehul, who runs the machine, can cut four dials on a good day. The blanks are solid silver; after cutting they are galvanised in a colour bath, lacquered nine times, and only then printed. If a single pass slips, the dial is melted down and the silver goes back into the next batch.'],
        ['h2', 'Why it costs what it costs'],
        ['p', 'About a fifth of the price of a Prahar is its dial. We could halve that. We have decided not to, because the first thing you see when you look at your wrist should be the part that took longest to make.']
      ] },
    { id: 'ghati', cat: 'History', date: '2026-10-21', read: 5, img: 'img/j-ghati.jpg', alt: 'A white palace on Lake Pichola in Udaipur, with a boat crossing the water', title: 'The ghati: India’s twenty-four-minute clock',
      dek: 'Before clock towers, temples and courts measured the day with a copper bowl and a bucket of water. We named the maison after it.',
      body: [
        ['p', 'A ghati is a small copper bowl with a hole in its base no wider than a hair. Set it floating in a tub of water and it fills slowly, then sinks. The time it takes to sink is one ghatika: twenty-four minutes, a sixtieth of a day and night. A servant would lift it out, empty it, set it floating again, and strike a gong.'],
        ['p', 'For centuries the ghati kept official time across the subcontinent, from temple rituals to the watches of a city’s guards. Astronomical texts describe how to make one: the bowl’s weight, the diameter of the hole, even the gold wire used to drill it so the hole would not corrode wider over time.'],
        ['q', 'A watch is the same idea, made small: energy released at a steady rate and counted.'],
        ['h2', 'Why the name'],
        ['p', 'We wanted a name that meant time as something made by hand and kept by attention. A ghati only works if someone watches it. A hand-wound watch only works if you wind it. Both are rituals of care, and both reward you with a quiet, exact rhythm.'],
        ['p', 'The bowl appears on every Ghatika caseback, engraved around the edge of the sapphire, and in the monogram on the crown: a circle with a single point at its base.']
      ] },
    { id: 'lehariya', cat: 'Design', date: '2026-09-30', read: 4, img: 'img/j-lehariya.jpg', alt: 'Folds of dyed fabric in warm colours', title: 'Lehariya, from turban to dial',
      dek: 'How a Rajasthani tie-dye became the pattern on our first watch.',
      body: [
        ['p', 'Lehariya means wave. Dyers in Jodhpur and Jaipur roll a length of thin cotton diagonally, tie it at intervals and dip it, so the colour runs in ripples when the cloth is opened. It is the pattern of the monsoon turban, worn when the rains arrive.'],
        ['p', 'We spent three months translating that ripple into a rosette for the rose engine. The first version looked like a fingerprint. The fifth looked like water. We kept the fourteen crests per turn because, under the hands at ten past ten, they frame the wordmark like a ripple frames a stone.'],
        ['h2', 'The colours'],
        ['p', 'Each dial colour is named after a place: Pichola blue for the lake at night, Sandstone for Jaisalmer at dusk, Monsoon slate for the sky before rain, Aravalli green for the hills after August. Ivory grand feu is the exception, an enamel fired at 820 degrees with no guilloché at all, for people who prefer silence.']
      ] },
    { id: 'winding', cat: 'Care', date: '2026-09-12', read: 3, img: 'img/j-winding.jpg', alt: 'The hand-finished calibre GH-01 seen through a sapphire caseback: striped bridges, rubies and blued screws', title: 'How to wind a hand-wound watch (and why it is worth it)',
      dek: 'Thirty turns, once a day, at the same time. A short guide from the bench.',
      body: [
        ['p', 'Wind your Prahar in the morning, off the wrist, so you are not pulling the crown at an angle. Turn the crown clockwise with the pad of your thumb and forefinger. You will feel the mainspring take up tension; after about thirty turns the crown will resist. Stop there. Never force it.'],
        ['p', 'Seventy-two hours of power means a fully wound Prahar will run through a weekend in the drawer. Winding daily keeps the spring in the flattest part of its torque curve, where timekeeping is most stable.'],
        ['h2', 'Setting the time'],
        ['p', 'Pull the crown to its second position and move the hands forward, never backward, past the time you want and then to it. This takes up the slack in the motion works and makes the minute hand land precisely on its index.'],
        ['p', 'Your watch should visit us every five to seven years for a full service. Book it from the Care page; we collect from anywhere in India.']
      ] },
    { id: 'bench', cat: 'Atelier', date: '2026-08-27', read: 5, img: 'img/j-bench.jpg', alt: 'A watchmaker at a workbench under a lamp', title: 'Thirty-eight days at one bench',
      dek: 'Every Ghatika is assembled, regulated and cased by one watchmaker. Here is what those days look like.',
      body: [
        ['p', 'Our watchmakers do not work on a line. Each watch is assigned to one person from the moment its movement parts are inspected to the moment it is cased and signed. That person’s initials are engraved inside the caseback, under the sapphire, where only a service watchmaker will ever see them.'],
        ['p', 'Days one to nine are finishing. Every bridge is bevelled by hand at forty-five degrees with a file, then polished with diamond paste on a stick of gentian wood until the edge is a mirror. Côtes de Genève stripes go on next, then perlage on the main plate, a few thousand overlapping circles laid down one by one.'],
        ['q', 'The watch is regulated in five positions over six days. It has to earn its dial.'],
        ['p', 'Assembly takes about a week. Then come six days of regulation in five positions and at two temperatures, until the watch keeps time within four seconds a day. Only after that does it receive its dial and hands, and only after a final seventy-two-hour run on a winding machine is it cased.']
      ] }
  ];

  // ---------------------------------------------------------- seed records for the back office
  // a client book big enough that each list has its own people; a few appear twice, as real clients do (bought, then serviced)
  var FIRST = ['Aarav', 'Ishaan', 'Riya', 'Kabir', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Zoya', 'Dev', 'Tara', 'Rohan', 'Naina', 'Aditya', 'Sana', 'Kunal', 'Priya', 'Neil', 'Farah', 'Siddharth', 'Leela', 'Omar', 'Gauri', 'Harsh', 'Ira', 'Jai', 'Mahira', 'Nikhil', 'Pooja', 'Rehan', 'Shreya', 'Tanvir', 'Uma', 'Varun', 'Yash', 'Aisha', 'Bhavna', 'Cyrus', 'Divya', 'Eshan', 'Fatima', 'Gaurav', 'Hiral', 'Irfan', 'Jasleen', 'Karan', 'Lavanya', 'Manav'];
  var LAST = ['Mehta', 'Kapoor', 'Desai', 'Malhotra', 'Iyer', 'Rathore', 'Shekhawat', 'Nair', 'Merchant', 'Khanna', 'Menon', 'Bhatia', 'Sethi', 'Rao', 'Qureshi', 'Jain', 'Raghavan', 'D’Souza', 'Kazmi', 'Goenka', 'Bhandari', 'Chatterjee', 'Dutta', 'Fernandes', 'Gill', 'Hegde', 'Joshi', 'Kulkarni', 'Lobo', 'Mistry', 'Naidu', 'Oberoi', 'Pillai', 'Reddy', 'Sahni', 'Talwar', 'Vaidya', 'Wadia', 'Zaveri', 'Bose', 'Chauhan', 'Dhillon', 'Grewal', 'Kamath', 'Mathur', 'Parekh', 'Saxena', 'Thakkar'];
  var NAMES = (function () { var out = [], seen = {}; for (var i = 0; out.length < 96; i++) { var n = FIRST[(i * 5 + 1) % 48] + ' ' + LAST[(i * 7 + 3 + Math.floor(i / 48) * 5) % 48]; if (!seen[n]) { seen[n] = 1; out.push(n); } } return out; })();
  var CITIES = ['Mumbai', 'New Delhi', 'Bengaluru', 'Udaipur', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Gurugram', 'Kochi'];
  var STAFF = ['Mehul Soni', 'Kavya Paliwal', 'Rafiq Khan', 'Anjali Purohit'];
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function dayISO(offset, h, m) { var d = new Date(); d.setHours(h || 11, m || 0, 0, 0); d.setDate(d.getDate() + offset); return d.toISOString(); }
  function emailOf(n) { return n.toLowerCase().replace(/[’'.]/g, '').split(' ').join('.') + '@example.in'; }
  function phoneOf(r) { return '+91 9' + (Math.floor(r() * 9) + 1) + '••• •' + String(Math.floor(r() * 900) + 100); }

  function price(cfg) {
    var m = MODELS[cfg.model] || MODELS.prahar;
    var me = METALS.filter(function (x) { return x.id === cfg.metal; })[0] || METALS[0];
    var st = STRAPS.filter(function (x) { return x.id === cfg.strap; })[0] || STRAPS[0];
    return m.price + me.add + st.add;
  }
  function seed() {
    var r = rnd(20261124), orders = [], appts = [], service = [], warranty = [];
    var OST = ['new', 'paid', 'atelier', 'qc', 'dispatched', 'delivered'];
    for (var i = 0; i < 26; i++) {
      var model = pick(r, ['prahar', 'prahar', 'nimisha', 'yantra']), sig = MODELS[model].sig;
      var cfg = { model: model, dial: r() < 0.5 ? sig.dial : pick(r, DIALS).id, metal: r() < 0.7 ? sig.metal : pick(r, METALS).id, strap: r() < 0.6 ? sig.strap : pick(r, STRAPS).id };
      if (cfg.strap === 'bracelet' && (cfg.metal === 'rose' || cfg.metal === 'yellow')) cfg.strap = 'cognac';
      var name = NAMES[i], age = Math.floor(i * 1.6 + r() * 2);
      var st = age < 2 ? pick(r, ['new', 'paid']) : age < 8 ? pick(r, ['paid', 'atelier', 'qc']) : age < 20 ? pick(r, ['atelier', 'qc', 'dispatched']) : 'delivered';
      orders.push({ id: 'GH-O-' + (24180 - i), at: dayISO(-age, 10 + Math.floor(r() * 9), Math.floor(r() * 60)), customer: name, email: emailOf(name), phone: phoneOf(r), city: pick(r, CITIES), items: [Object.assign({ qty: 1, engraving: r() < 0.35 ? pick(r, ['For A., 12.01.2027', 'Twenty-four minutes', 'Papa, 60', 'Ek ghadi aur', 'R & M', 'Hold the hour']) : '' }, cfg)], total: price(cfg), pay: pick(r, ['UPI', 'Card', 'EMI · 12 mo', 'Bank transfer']), delivery: pick(r, ['Insured courier', 'Boutique pick-up', 'Insured courier']), status: st, owner: pick(r, STAFF), note: r() < 0.3 ? pick(r, ['Gift: hand-written card, no invoice in the box', 'Wants delivery before Diwali', 'Collector: owns Prahar No. 0041', 'Call before dispatch, office reception closes at 6']) : '' });
    }
    var AST = ['requested', 'confirmed', 'confirmed', 'visited', 'no-show', 'cancelled'];
    for (var j = 0; j < 20; j++) {
      var off = j - 8, b = pick(r, BOUTIQUES), nm = j % 9 === 4 ? NAMES[j] : NAMES[26 + j]; // two booked a viewing before they ordered
      appts.push({ id: 'GH-A-' + (5120 + j), boutique: b.id, at: dayISO(off, 11 + Math.floor(r() * 7), pick(r, [0, 30])), customer: nm, email: emailOf(nm), phone: phoneOf(r), purpose: pick(r, PURPOSES.slice(0, 4)), interest: pick(r, ['prahar', 'nimisha', 'yantra']), guests: 1 + Math.floor(r() * 2), status: off < 0 ? pick(r, ['visited', 'visited', 'no-show']) : off < 2 ? pick(r, ['confirmed', 'requested']) : pick(r, ['requested', 'confirmed']), host: pick(r, STAFF), note: r() < 0.4 ? pick(r, ['Prefers Hindi', 'Bringing father, birthday gift', 'Comparing with a Swiss three-hander', 'Wants to see ivory enamel in daylight', 'Left-handed, wants crown at 9']) : '' });
    }
    var SST = ['received', 'diagnosis', 'quote', 'approved', 'service', 'qc', 'ready', 'returned'];
    for (var k = 0; k < 16; k++) {
      var nm2 = k % 2 ? NAMES[46 + 33 - k] : NAMES[80 + k / 2], /* half are owners already registered for warranty */ md = pick(r, ['prahar', 'prahar', 'nimisha', 'yantra']);
      var typ = pick(r, ['Full service', 'Running slow', 'Moisture under crystal', 'Crown stiff', 'Strap replacement', 'Polish and pressure test']);
      service.push({ id: 'GH-S-' + (880 + k), at: dayISO(-Math.floor(k * 2.3 + r() * 3), 12), customer: nm2, email: emailOf(nm2), phone: phoneOf(r), model: md, serial: 'GH' + String(MODELS[md].ref.slice(3, 5)) + '-' + String(40 + Math.floor(r() * 260)).padStart(4, '0'), issue: typ, detail: pick(r, ['Loses about 40 seconds a day since a flight', 'Stopped after a swim, has been dry since', 'Fine, five years old, due for service', 'Hand slipped when setting time', 'Strap cracked at the buckle hole']), stage: SST[Math.min(SST.length - 1, Math.floor(r() * SST.length))], warranty: r() < 0.55, quote: typ === 'Strap replacement' ? 9500 : typ === 'Full service' ? 38000 : Math.round((8 + r() * 20)) * 1000, logistics: pick(r, ['Courier pick-up', 'Boutique drop-off · Mumbai', 'Boutique drop-off · Udaipur']), tech: pick(r, STAFF), due: dayISO(Math.floor(r() * 18) - 3, 18) });
    }
    for (var w = 0; w < 34; w++) {
      var nm3 = NAMES[46 + w], md3 = pick(r, ['prahar', 'prahar', 'nimisha', 'yantra']), dd = -Math.floor(w * 11 + r() * 9);
      warranty.push({ id: 'GH-W-' + (3300 + w), serial: 'GH' + String(MODELS[md3].ref.slice(3, 5)) + '-' + String(1 + w * 7).padStart(4, '0'), model: md3, customer: nm3, email: emailOf(nm3), city: pick(r, CITIES), bought: dayISO(dd), boutique: pick(r, BOUTIQUES).id, registered: dayISO(dd + Math.floor(r() * 20)), years: r() < 0.8 ? 8 : 5, status: r() < 0.12 ? 'pending' : 'verified' });
    }
    return { orders: orders, appts: appts, service: service, warranty: warranty };
  }
  window.GH_DATA = { MODELS: MODELS, DIALS: DIALS, METALS: METALS, STRAPS: STRAPS, BOUTIQUES: BOUTIQUES, PURPOSES: PURPOSES, SLOTS: SLOTS, JOURNAL: JOURNAL, STAFF: STAFF, price: price, seed: seed };
})();
