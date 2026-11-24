/* Forge: shared demo data + local store (no network). Used by every page. All people, prices and numbers are invented (demo). */
(function () {
  'use strict';
  var F = window.Forge = window.Forge || {};

  F.branches = {
    saket: { id: 'saket', name: 'Saket', area: 'South Delhi', addr: 'Plot 14, Press Enclave Road, Saket', hours: '05:30 – 22:30', since: '2019',
      photo: 'photos/floor-wide.jpg', size: '1,050 m²',
      blurb: 'A converted print warehouse with 14 lifting platforms, a 40 m sled lane, the sauna and two plunge tubs. The windows face east, so the 06:00 class trains in the first light.',
      feats: ['14 platforms, calibrated plates', '40 m sled lane', 'Sauna (80 °C) + 2 plunge tubs', 'Physio room', 'Basement parking'] },
    gurugram: { id: 'gurugram', name: 'Gurugram', area: 'Golf Course Road', addr: 'Rooftop, Tower B, Sector 54, Gurugram', hours: '05:30 – 22:00', since: '2023',
      photo: 'photos/branch-gurugram.jpg', size: '1,400 m² incl. turf',
      blurb: 'A rooftop turf with a 60 m run loop, an erg bay of ski, row and bike, and the full HYROX simulation lane. It’s a 6-minute walk from the Rapid Metro.',
      feats: ['60 m rooftop run loop', '24-machine erg bay', 'Full HYROX station lane', 'Timing mats for simulations', 'Showers + lockers'] }
  };

  F.types = {
    strength: { id: 'strength', name: 'Strength', video: 'video/strength.mp4', poster: 'photos/strength.jpg', perWeek: 3, mins: 60, intent: 'Squat, hinge, press, pull. Heavy, slow and written down. The base everything else stands on.' },
    engine: { id: 'engine', name: 'Engine', video: 'video/engine.mp4', poster: 'photos/engine.jpg', perWeek: 2, mins: 45, intent: 'Intervals on the run loop and the ergs, scaled by heart rate. You build the aerobic base quietly, then use it loudly.' },
    hyrox: { id: 'hyrox', name: 'HYROX', video: 'video/hyrox.mp4', poster: 'photos/hyrox.jpg', perWeek: 1, mins: 75, intent: 'Eight stations, eight runs. Pacing, transitions, and the sled when your legs have already gone.' },
    recovery: { id: 'recovery', name: 'Recovery', video: 'video/recovery.mp4', poster: 'photos/recovery.jpg', perWeek: 1, mins: 40, intent: 'Mobility, breath work, sauna and plunge. It’s the session that makes the other five possible.' }
  };

  F.coaches = [
    { id: 'kofi', name: 'Kofi Mensah', role: 'Head of Strength', photo: 'photos/coach-kofi.jpg', branch: 'saket', spec: ['Barbell technique', 'Powerlifting meets', 'Returning from injury'], years: 11,
      stats: [['290 kg', 'Competition deadlift'], ['11 yrs', 'Coaching'], ['3', 'Members to national meets']],
      bio: 'Kofi coached university rugby in Kumasi and Leeds before he moved to Delhi in 2019 to open the Saket floor. He writes every Strength block at both branches and keeps a spreadsheet of every member’s top sets. Yes, he will ask you to film your squat.',
      quote: 'Most people don’t need a harder programme. They need the same one for longer.', certs: ['NSCA-CSCS', 'Level 2 weightlifting coach'], off: 'Off the floor: slow-cooks jollof on Sundays and brings it on Mondays.' },
    { id: 'tenzin', name: 'Tenzin Dolma', role: 'HYROX lead', photo: 'photos/coach-tenzin.jpg', branch: 'gurugram', spec: ['HYROX race prep', 'Pacing strategy', 'Wall balls and sled'], years: 7,
      stats: [['1:04', 'HYROX Pro, best'], ['11', 'Races finished'], ['1st', 'Club podium, Mumbai']],
      bio: 'Tenzin grew up running the hills above Dharamshala, found HYROX in 2021, and has raced eleven events since. She built the Gurugram simulation lane, coaches the Race Team, and runs the Saturday simulation with a stopwatch and no mercy.',
      quote: 'Race day is won on the sled, but it’s lost on run four.', certs: ['HYROX-accredited trainer', 'Precision Nutrition L1'], off: 'Off the floor: momos, strong opinions about momos.' },
    { id: 'mateo', name: 'Mateo Rios', role: 'Engine & conditioning', photo: 'photos/coach-mateo.jpg', branch: 'gurugram', spec: ['Running economy', 'Erg intervals', 'Heart-rate zones'], years: 9,
      stats: [['1:51', '800 m, his best'], ['9 yrs', 'Coaching'], ['140', 'Tempo Run Club regulars']],
      bio: 'A former 800 m runner from Valencia, Mateo programmes the Engine sessions and started the Tuesday Tempo Run Club with six people. There are now 140. He believes in easy days that are actually easy, and he will check your heart-rate strap to prove it.',
      quote: 'Zone two is boring. That’s the point.', certs: ['UESCA running coach', 'CrossFit L2'], off: 'Off the floor: learning Hindi from his members, badly.' },
    { id: 'meera', name: 'Meera Sethi', role: 'Mobility & recovery', photo: 'photos/coach-meera.jpg', branch: 'saket', spec: ['Mobility screens', 'Breath work', 'Contrast therapy'], years: 8,
      stats: [['1,900+', 'Movement screens done'], ['8 yrs', 'Physiotherapy'], ['0', 'Members who skipped week-one screen']],
      bio: 'Meera is a physiotherapist who screens every new member in their first week, at both branches. She runs Recovery, writes the return-to-lifting plans, and has the final say on when you go back to heavy. Nobody argues with Meera twice.',
      quote: 'You adapt when you rest. Training only asks the question.', certs: ['BPT, MIAP', 'FRC mobility specialist'], off: 'Off the floor: Hindustani classical vocals, Thursday nights.' },
    { id: 'zoya', name: 'Zoya Rahman', role: 'Head coach, Gurugram', photo: 'photos/coach-zoya.jpg', branch: 'gurugram', spec: ['Kettlebell sport', 'Doubles racing', 'Coaching new coaches'], years: 10,
      stats: [['24 kg', 'Kettlebell snatch, 10 min set'], ['10 yrs', 'Coaching'], ['6', 'Coaches she has trained']],
      bio: 'Zoya opened the Gurugram rooftop in 2023 after ten years coaching in Bengaluru. She runs Kettlebell Club and Doubles Day, and she trains every new Forge coach before they’re allowed to run a class alone.',
      quote: 'Good coaching is mostly noticing. The shouting is optional.', certs: ['IKFF CKT Level 2', 'NASM-CPT'], off: 'Off the floor: restores old Royal Enfields with her father.' },
    { id: 'aren', name: 'Aren Lepcha', role: 'Strength coach', photo: 'photos/coach-aren.jpg', branch: 'saket', spec: ['Olympic lifting', 'Beginner barbell', 'Shoulder health'], years: 6,
      stats: [['130 kg', 'Clean & jerk'], ['6 yrs', 'Coaching'], ['400+', 'Foundations graduates']],
      bio: 'Aren lifted for Sikkim at the national games, then started coaching because he kept fixing other people’s technique for free. He runs Barbell Foundations, the six-week course that most members start with, and he is very patient about it.',
      quote: 'Light weights, done well, become heavy weights, done well.', certs: ['Weightlifting Federation L2', 'Functional Range Conditioning'], off: 'Off the floor: brews his own kombucha and gives it away.' }
  ];
  F.coach = function (id) { return F.coaches.filter(function (c) { return c.id === id; })[0]; };

  F.classes = [
    { id: 'heavy-hour', name: 'Heavy Hour', type: 'strength', mins: 60, cap: 12, coach: 'kofi', level: 'All levels, barbell basics required', photo: 'photos/strength.jpg', video: 'video/strength.mp4',
      lede: 'One main lift, worked up to a heavy set, then two accessories. Your numbers go on the whiteboard and into the app, so next week starts where this one ended.',
      why: 'Strength is the cheapest insurance in fitness. Three Heavy Hours a week is the backbone of every Forge programme.',
      blocks: [['10′', 'Warm-up and bar-path drills'], ['30′', 'Main lift: squat, deadlift, bench or press, on a 4-week rotation'], ['15′', 'Accessory superset'], ['5′', 'Log the numbers, cool down']],
      bring: ['Flat shoes or lifting shoes', 'Your training log (or the app)', 'Chalk is on us'] },
    { id: 'foundations', name: 'Barbell Foundations', type: 'strength', mins: 60, cap: 8, coach: 'aren', level: 'Beginners, and anyone coming back', photo: 'photos/class-chalk.jpg', video: 'video/strength.mp4',
      lede: 'Six weeks to learn the squat, deadlift, press and bench properly. A small group, a lot of coaching, and weights light enough to get it right before they get heavy.',
      why: 'Most injuries we see started as bad habits nobody corrected. Foundations corrects them before they exist.',
      blocks: [['10′', 'Mobility for the day’s lift'], ['35′', 'Technique ladder with video feedback'], ['15′', 'Carries and trunk work']],
      bring: ['Flat shoes', 'Patience', 'Questions, lots of them'] },
    { id: 'kettlebell-club', name: 'Kettlebell Club', type: 'strength', mins: 45, cap: 14, coach: 'zoya', level: 'All levels: you’ll be taught the swing first', photo: 'photos/class-kettlebell.jpg', video: 'video/strength.mp4',
      lede: 'Swings, cleans, presses and long sets that teach you to breathe under load. Strength and conditioning, from one ball of iron.',
      why: 'The kettlebell builds the hips and grip that HYROX quietly tests, at a fraction of the joint cost of running.',
      blocks: [['8′', 'Hip hinge and breathing drills'], ['25′', 'Technique sets, then a timed long cycle'], ['12′', 'Get-ups and carries']],
      bring: ['Flat shoes', 'A towel (you’ll need it)'] },
    { id: 'engine-room', name: 'Engine Room', type: 'engine', mins: 45, cap: 14, coach: 'mateo', level: 'All levels: you pace off your own heart rate', photo: 'photos/engine.jpg', video: 'video/engine.mp4',
      lede: 'Intervals across the ski erg, row erg, bike and run loop. Scaled by heart-rate zone, not by ego, so the person beside you can be faster and you both get the work.',
      why: 'A bigger engine makes every other session feel easier, and it’s the single best predictor of a good HYROX time.',
      blocks: [['8′', 'Ramp warm-up'], ['30′', 'Intervals: 4 rounds across 4 machines'], ['7′', 'Flush and breathe down']],
      bring: ['Running shoes', 'A heart-rate strap (we lend them)', 'Water'] },
    { id: 'erg-lab', name: 'Erg Lab', type: 'engine', mins: 40, cap: 12, coach: 'mateo', level: 'All levels', photo: 'photos/class-erg.jpg', video: 'video/engine.mp4',
      lede: 'Rowing and ski erg technique first, then a test piece every fourth week. You leave knowing your 500 m split and what to do about it.',
      why: 'Two of the eight HYROX stations are ergs. Technique is free speed.',
      blocks: [['10′', 'Stroke drills with video'], ['22′', 'Pace work or a test piece'], ['8′', 'Split review']],
      bring: ['Flat trainers', 'Water'] },
    { id: 'tempo-run', name: 'Tempo Run Club', type: 'engine', mins: 50, cap: 20, coach: 'mateo', level: 'You can run 5 km without stopping', photo: 'photos/engine.jpg', video: 'video/engine.mp4',
      lede: 'Tuesday nights on the Gurugram loop. Three pace groups, one honest tempo block, then coffee from the cart downstairs.',
      why: 'Eight kilometres of every HYROX race is running. The club makes the running social, and so it happens.',
      blocks: [['10′', 'Drills and strides'], ['30′', 'Tempo block in pace groups'], ['10′', 'Cool-down jog and stretch']],
      bring: ['Running shoes', 'A light layer in winter'] },
    { id: 'hyrox-sim', name: 'HYROX Simulation', type: 'hyrox', mins: 75, cap: 16, coach: 'tenzin', level: 'Intermediate: you know the eight stations', photo: 'photos/class-sled.jpg', video: 'video/hyrox.mp4',
      lede: 'A half or full race simulation with real station standards, timing mats and a coach on your transitions. Splits are emailed to you before you’ve showered.',
      why: 'You can’t pace a race you’ve never felt. Simulations turn race day into a rerun.',
      blocks: [['12′', 'Race warm-up'], ['50′', 'Simulation: runs plus stations, in heats'], ['13′', 'Splits review and mobility']],
      bring: ['Race shoes', 'Gloves for the sled (optional)', 'Something with electrolytes'] },
    { id: 'stations', name: 'Station Skills', type: 'hyrox', mins: 60, cap: 12, coach: 'tenzin', level: 'All levels, and first-time racers', photo: 'photos/hyrox.jpg', video: 'video/hyrox.mp4',
      lede: 'One or two stations per session: sled push and pull, burpee broad jumps, lunges, wall balls. Learn the efficient way before you learn the hard way.',
      why: 'Most first-timers lose more time to bad technique on the sled than to fitness.',
      blocks: [['10′', 'Warm-up'], ['35′', 'Station technique and pacing reps'], ['15′', 'Short compromised run']],
      bring: ['Trainers with grip', 'Knee sleeves for lunges (optional)'] },
    { id: 'doubles', name: 'Doubles Day', type: 'hyrox', mins: 60, cap: 16, coach: 'zoya', level: 'All levels: bring a partner or we’ll pair you', photo: 'photos/method.jpg', video: 'video/method.mp4',
      lede: 'Partner workouts built around HYROX Doubles: one works, one rests, and both of you go faster than you would alone.',
      why: 'Half our members race in pairs. Learning to split the work is a skill, and it’s the most fun hour of the week.',
      blocks: [['10′', 'Partner warm-up'], ['40′', 'Split-the-work intervals'], ['10′', 'Stretch, and high fives']],
      bring: ['A partner (optional)', 'Trainers with grip'] },
    { id: 'mobility', name: 'Mobility & Breath', type: 'recovery', mins: 40, cap: 14, coach: 'meera', level: 'Everyone, especially after race weekends', photo: 'photos/class-mobility.jpg', video: 'video/recovery.mp4',
      lede: 'Hips, thoracic spine and ankles, finished with ten minutes of guided breathing on the floor. You leave looser than you came in, and usually calmer.',
      why: 'Range of motion you don’t use, you lose. Forty minutes a week keeps it.',
      blocks: [['10′', 'Joint screen'], ['20′', 'Mobility flow'], ['10′', 'Box breathing, lying down']],
      bring: ['Comfortable clothes', 'Socks (no shoes on the mats)'] },
    { id: 'contrast', name: 'Sauna + Plunge', type: 'recovery', mins: 45, cap: 6, coach: 'meera', level: 'Members, after a medical form', photo: 'photos/recovery.jpg', video: 'video/recovery.mp4',
      lede: 'Three rounds of sauna and cold plunge, timed and supervised. Saket only, six people at a time, and phones stay in the lockers.',
      why: 'Contrast therapy won’t replace sleep, but it’s the best forty-five minutes of downtime in Delhi.',
      blocks: [['15′', 'Sauna, 80 °C'], ['3′', 'Plunge, 6–8 °C'], ['×3', 'Rounds, with rest between']],
      bring: ['Swimwear', 'Flip-flops', 'A towel is provided'] }
  ];
  F.cls = function (id) { return F.classes.filter(function (c) { return c.id === id; })[0]; };

  /* weekly template per branch: [day 0=Mon..6=Sun] -> [time, classId] */
  var TS = [
    [['06:00', 'heavy-hour'], ['07:00', 'foundations'], ['12:30', 'mobility'], ['17:30', 'kettlebell-club'], ['18:30', 'heavy-hour'], ['19:30', 'foundations'], ['20:30', 'contrast']],
    [['06:00', 'engine-room'], ['07:00', 'heavy-hour'], ['12:30', 'erg-lab'], ['18:00', 'heavy-hour'], ['19:00', 'stations'], ['20:00', 'mobility']],
    [['06:00', 'heavy-hour'], ['07:00', 'kettlebell-club'], ['12:30', 'mobility'], ['17:30', 'foundations'], ['18:30', 'heavy-hour'], ['19:30', 'engine-room'], ['20:30', 'contrast']],
    [['06:00', 'foundations'], ['07:00', 'engine-room'], ['12:30', 'heavy-hour'], ['18:00', 'heavy-hour'], ['19:00', 'doubles'], ['20:00', 'mobility']],
    [['06:00', 'heavy-hour'], ['07:00', 'erg-lab'], ['12:30', 'mobility'], ['17:30', 'kettlebell-club'], ['18:30', 'heavy-hour'], ['20:00', 'contrast']],
    [['08:00', 'heavy-hour'], ['09:00', 'foundations'], ['10:00', 'stations'], ['11:00', 'contrast'], ['12:00', 'contrast']],
    [['09:00', 'mobility'], ['10:00', 'contrast'], ['11:00', 'kettlebell-club']]
  ];
  var TG = [
    [['06:30', 'engine-room'], ['07:30', 'kettlebell-club'], ['13:00', 'erg-lab'], ['18:00', 'stations'], ['19:00', 'heavy-hour'], ['20:00', 'engine-room']],
    [['06:30', 'heavy-hour'], ['07:30', 'erg-lab'], ['13:00', 'kettlebell-club'], ['18:00', 'doubles'], ['19:00', 'tempo-run'], ['20:00', 'mobility']],
    [['06:30', 'stations'], ['07:30', 'engine-room'], ['13:00', 'heavy-hour'], ['18:00', 'engine-room'], ['18:30', 'hyrox-sim'], ['20:00', 'kettlebell-club']],
    [['06:30', 'engine-room'], ['07:30', 'heavy-hour'], ['13:00', 'erg-lab'], ['18:00', 'kettlebell-club'], ['19:00', 'stations'], ['20:00', 'mobility']],
    [['06:30', 'heavy-hour'], ['07:30', 'stations'], ['13:00', 'engine-room'], ['18:00', 'erg-lab'], ['19:00', 'doubles']],
    [['07:00', 'hyrox-sim'], ['09:00', 'doubles'], ['10:00', 'kettlebell-club'], ['11:00', 'mobility']],
    [['07:00', 'tempo-run'], ['08:30', 'engine-room'], ['10:00', 'mobility']]
  ];

  F.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  F.iso = function (d) { return d.getFullYear() + '-' + F.pad(d.getMonth() + 1) + '-' + F.pad(d.getDate()); };
  F.DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  F.DAYS_L = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  F.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  F.dow = function (d) { return (d.getDay() + 6) % 7; };
  F.nice = function (iso) { var d = new Date(iso + 'T00:00'); return F.DAYS[F.dow(d)] + ' ' + d.getDate() + ' ' + F.MONTHS[d.getMonth()]; };
  function hash(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
  F.hash = hash;

  /* ---------- store (localStorage, try/catch) ---------- */
  F.get = function (k, def) { try { var v = localStorage.getItem('forge:' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  F.set = function (k, v) { try { localStorage.setItem('forge:' + k, JSON.stringify(v)); } catch (e) {} };
  F.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  /* sessions for a date (Date object), both branches, sorted by time */
  F.sessions = function (date) {
    var iso = F.iso(date), now = new Date(), bookings = F.get('bookings', []), dw = F.dow(date), out = [];
    [['saket', TS], ['gurugram', TG]].forEach(function (pair) {
      pair[1][dw].forEach(function (r) {
        var c = F.cls(r[1]), id = iso + '|' + pair[0] + '|' + r[0] + '|' + r[1];
        var hr = +r[0].slice(0, 2), peak = (hr >= 18 && hr <= 19) || hr === 7 || dw === 5;
        var base = Math.min(c.cap, Math.round(c.cap * ((peak ? 0.62 : 0.38) + (hash(id) % 38) / 100)));
        var mine = bookings.filter(function (b) { return b.slot === id; }).length;
        var booked = Math.min(c.cap, base + mine);
        var start = new Date(iso + 'T' + r[0]);
        out.push({ id: id, date: iso, time: r[0], branch: pair[0], cls: c, coach: F.coach(c.coach), cap: c.cap, booked: booked, left: c.cap - booked, mine: mine, past: start < now, live: start <= now && now < new Date(start.getTime() + c.mins * 6e4) });
      });
    });
    return out.sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : a.branch < b.branch ? 1 : -1; });
  };
  F.nextSession = function () {
    var d = new Date();
    for (var i = 0; i < 7; i++) { var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      var s = F.sessions(day).filter(function (x) { return !x.past && x.left > 0; });
      if (s.length) return s[0]; }
    return null;
  };
  F.weekCount = function () { var n = 0; TS.concat(TG).forEach(function (d) { n += d.length; }); return n; };

  F.book = function (session, person) {
    var list = F.get('bookings', []);
    var rec = { id: F.uid(), slot: session.id, date: session.date, time: session.time, branch: session.branch, cls: session.cls.id, name: person.name, phone: person.phone, at: new Date().toISOString(), checkedIn: false, source: 'website' };
    list.push(rec); F.set('bookings', list); return rec;
  };
  F.cancel = function (slotId) {
    var list = F.get('bookings', []), i = -1;
    list.forEach(function (b, k) { if (b.slot === slotId) i = k; });
    if (i > -1) { list.splice(i, 1); F.set('bookings', list); return true; }
    return false;
  };
  F.addLead = function (lead) {
    var list = F.get('leads', null) || F.seedLeads();
    lead.id = F.uid(); lead.stage = 'new'; lead.at = new Date().toISOString(); lead.source = 'Website'; lead.web = true; lead.notes = [];
    list.unshift(lead); F.set('leads', list); return lead;
  };

  /* ---------- seeds for the staff dashboard (demo) ---------- */
  function daysFrom(n, h, m) { var d = new Date(); d.setDate(d.getDate() + n); if (h != null) d.setHours(h, m || 0, 0, 0); return d.toISOString(); }
  function dayIso(n) { return F.iso(new Date(Date.now() + n * 864e5)); }
  F.seedLeads = function () {
    var L = [
      ['Ritika Bansal', 'saket', 'Get strong for a Himalayan trek in April', 1, 'new', 0, 8, 40, 'Instagram', ''],
      ['Aman Khurana', 'gurugram', 'First HYROX in February', 2, 'new', -1, 19, 5, 'Website', 'Race Team'],
      ['Devika Iyer', 'saket', 'Postnatal, cleared by doctor', 3, 'new', -1, 11, 50, 'Referral · Meera', ''],
      ['Kabir Sood', 'gurugram', 'Lose the desk back', 1, 'new', 0, 7, 15, 'Google', 'Club'],
      ['Sana Qureshi', 'saket', 'Back pain, want to lift safely', 0, 'contacted', -2, 11, 20, 'Google', '', 'Called. Booked Foundations, today 17:30.'],
      ['Arjun Mehta', 'gurugram', 'Doubles race with his brother', 2, 'contacted', -2, 21, 0, 'Instagram', 'Race Team', 'WhatsApp sent, brother is coming too.'],
      ['Nandini Rao', 'saket', 'Squat her bodyweight', 1, 'contacted', -3, 9, 30, 'Walk-in', '', 'Prefers early mornings.'],
      ['Neil D’Souza', 'gurugram', 'Run a sub-50 10 km', -1, 'trial', -4, 9, 0, 'Referral · Tenzin', 'Club', 'Came to Tempo Run Club and loved it.'],
      ['Priya Menon', 'saket', 'General fitness after a long break', -3, 'trial', -6, 17, 45, 'Walk-in', '', 'Screen done: tight hips, asked about pricing.'],
      ['Rehan Ali', 'gurugram', 'Get back to rugby shape', -2, 'trial', -5, 12, 10, 'Google', 'Open Gym', 'Wants off-peak hours.'],
      ['Ishaan Kapoor', 'saket', 'Strength for cricket', -4, 'trial', -7, 18, 0, 'Instagram', '', ''],
      ['Harsh Vardhan', 'gurugram', 'HYROX Doubles with partner', -5, 'joined', -9, 10, 10, 'Website', 'Race Team', 'Joined Race Team, yearly.'],
      ['Mehak Arora', 'saket', 'Lose the desk back', -7, 'joined', -12, 13, 0, 'Instagram', 'Club', 'Joined Club, monthly.'],
      ['Tara Bhatia', 'gurugram', 'First race in March', -6, 'joined', -10, 8, 20, 'Referral · Zoya', 'Club', 'Joined Club, yearly.'],
      ['Vikas Jain', 'saket', 'Train around night shifts', -8, 'joined', -13, 15, 40, 'Google', 'Off-Peak', 'Joined Off-Peak.']
    ];
    return L.map(function (l, i) {
      return { id: 's' + i, name: l[0], phone: '+91 9' + (i % 9) + '••• ••' + (100 + i * 37 % 900), branch: l[1], goal: l[2], day: dayIso(l[3]), stage: l[4], at: daysFrom(l[5], l[6], l[7]), source: l[8], plan: l[9], notes: l[10] ? [l[10]] : [] };
    });
  };
  F.members = function () {
    return [
      { name: 'Karan Malhotra', plan: 'Club', branch: 'saket', renews: daysFrom(1), streak: 14, since: 'Mar 2022' },
      { name: 'Ishita Rao', plan: 'Race Team', branch: 'gurugram', renews: daysFrom(1), streak: 22, since: 'Jan 2024' },
      { name: 'Farhan Siddiqui', plan: 'Open Gym', branch: 'saket', renews: daysFrom(2), streak: 3, since: 'Aug 2025' },
      { name: 'Ananya Gupta', plan: 'Club', branch: 'gurugram', renews: daysFrom(3), streak: 9, since: 'Oct 2023' },
      { name: 'Rohit Chawla', plan: 'Club', branch: 'saket', renews: daysFrom(4), streak: 0, since: 'May 2024' },
      { name: 'Simran Kohli', plan: 'Off-Peak', branch: 'saket', renews: daysFrom(5), streak: 11, since: 'Feb 2025' },
      { name: 'Dev Arora', plan: 'Race Team', branch: 'gurugram', renews: daysFrom(6), streak: 18, since: 'Jun 2024' },
      { name: 'Nisha Pillai', plan: 'Club', branch: 'gurugram', renews: daysFrom(6), streak: 2, since: 'Sep 2025' }
    ];
  };
  F.atRisk = function () {
    return [
      { name: 'Rohit Chawla', plan: 'Club', branch: 'saket', last: 19, usual: '3× / week' },
      { name: 'Gaurav Nair', plan: 'Open Gym', branch: 'gurugram', last: 16, usual: '2× / week' },
      { name: 'Pallavi Sen', plan: 'Club', branch: 'saket', last: 15, usual: '4× / week' },
      { name: 'Nisha Pillai', plan: 'Club', branch: 'gurugram', last: 14, usual: '3× / week' }
    ];
  };
  F.checkinSeed = function () {
    var names = ['Karan M.', 'Ishita R.', 'Devika S.', 'Arjun P.', 'Zoya K.', 'Nikhil B.', 'Rhea T.', 'Vivek J.', 'Pooja L.', 'Sameer A.', 'Anika V.', 'Rahul D.', 'Meher G.', 'Yash S.', 'Tanvi C.', 'Imran H.', 'Sneha W.', 'Kunal R.', 'Leela M.', 'Aditya N.', 'Fatima Z.', 'Gautam P.', 'Riya B.', 'Omar S.', 'Bhavna K.', 'Siddharth T.', 'Ayesha F.', 'Varun L.'];
    var slots = [[6, 0], [6, 5], [6, 10], [6, 32], [6, 41], [7, 2], [7, 8], [7, 30], [7, 44], [8, 15], [9, 20], [10, 5], [11, 40], [12, 22], [12, 28], [13, 5], [14, 40], [16, 10], [17, 21], [17, 26], [17, 52], [18, 2], [18, 11], [18, 24], [18, 49], [19, 3], [19, 18], [20, 6]];
    var out = [], d = new Date(), what = ['Heavy Hour', 'Engine Room', 'Open gym', 'Kettlebell Club', 'Mobility', 'Open gym', 'Erg Lab'];
    for (var i = 0; i < names.length; i++) { var t = new Date(d); t.setHours(slots[i][0], slots[i][1], 0, 0); if (t > d) continue;
      out.push({ name: names[i], branch: i % 3 ? 'saket' : 'gurugram', at: t.toISOString(), what: what[i % what.length] }); }
    return out;
  };
  F.sources = function () { return [['Instagram', 31, 9], ['Google', 24, 8], ['Referral', 18, 11], ['Walk-in', 12, 4], ['Website', 27, 10]]; };

  F.plans = [
    { id: 'offpeak', name: 'Off-Peak', m: 2900, tag: 'For shift workers, students and early retirees', note: 'Floor and classes 10:00–17:00, Mon–Fri',
      feats: { floor: '10:00–17:00, weekdays', classes: '4 / month', branches: 'Home branch', programme: false, screen: true, recovery: false, coach: false, race: false } },
    { id: 'open', name: 'Open Gym', m: 3900, tag: 'You know what you’re doing', note: 'All hours, your own programme',
      feats: { floor: '05:30–22:30', classes: '2 / month', branches: 'Home branch', programme: false, screen: true, recovery: false, coach: false, race: false } },
    { id: 'club', name: 'Club', m: 6500, tag: 'The one most people pick', note: 'Everything, coached', best: true,
      feats: { floor: '05:30–22:30', classes: 'Unlimited', branches: 'Both branches', programme: true, screen: true, recovery: '2 / month', coach: 'Quarterly', race: false } },
    { id: 'race', name: 'Race Team', m: 9800, tag: 'For a HYROX on the calendar', note: 'Club, plus a coach who knows your splits',
      feats: { floor: '05:30–22:30', classes: 'Unlimited', branches: 'Both branches', programme: true, screen: true, recovery: 'Unlimited', coach: 'Monthly 1:1', race: true } }
  ];
  F.planRows = [['floor', 'Open floor hours'], ['classes', 'Coached classes'], ['branches', 'Branch access'], ['programme', 'Written weekly programme'], ['screen', 'Week-one movement screen with a physio'], ['recovery', 'Sauna + plunge'], ['coach', '1:1 coach check-in'], ['race', 'HYROX race plan + simulation entry']];
  /* responsive image helpers: variants were generated next to each photo (-640 portrait, -800 wide, -th 160px square) */
  var WIDE = { 'class-': 1400, 'branch-': 1600, 'floor-': 1600 }, TALL = { 'coach-': 900, 'member-': 800 };
  F.ss = function (src, sizes) {
    var f = src.split('/').pop(), b = src.replace(/\.jpg$/, ''), k;
    for (k in WIDE) if (f.indexOf(k) === 0) return ' srcset="' + b + '-800.jpg 800w, ' + src + ' ' + WIDE[k] + 'w" sizes="' + (sizes || '100vw') + '"';
    for (k in TALL) if (f.indexOf(k) === 0) return ' srcset="' + b + '-640.jpg 640w, ' + src + ' ' + TALL[k] + 'w" sizes="' + (sizes || '100vw') + '"';
    return '';
  };
  F.th = function (src) { return src.replace(/\.jpg$/, '-th.jpg'); };
  F.small = function (src) { var s = F.ss(src); return s ? s.match(/srcset="([^ ]+)/)[1] : src; };
  /* ---------- member app + back-office records (demo, localStorage) ---------- */
  F.DEMO_MEMBER = { memberNo: 'FM-20417', name: 'Aanya Kapoor', phone: '+91 98••• ••417', plan: 'Club', planId: 'club', cycle: 'm', home: 'saket', start: '2024-03-04', since: '2024-03-04', renews: F.iso(new Date(Date.now() + 9 * 864e5)), ref: 'AANYA-7Q2' };
  F.member = function () { return F.get('session', null); };
  F.waitlist = function () { return F.get('waitlist', []); };
  F.joinWaitlist = function (s, m) { var l = F.waitlist(); var pos = l.filter(function (w) { return w.slot === s.id && !w.promoted; }).length + 1; var rec = { id: F.uid(), slot: s.id, date: s.date, time: s.time, branch: s.branch, cls: s.cls.id, name: m.name, memberNo: m.memberNo || '', phone: m.phone || '', pos: pos, at: new Date().toISOString(), promoted: false }; l.push(rec); F.set('waitlist', l); return rec; };
  F.leaveWaitlist = function (slot, name) { F.set('waitlist', F.waitlist().filter(function (w) { return !(w.slot === slot && w.name === name && !w.promoted); })); };
  F.seedPRs = function () {
    var mk = function (lift, unit, pts) { return pts.map(function (p) { return { lift: lift, unit: unit, date: p[0], value: p[1], reps: p[2] || 1 }; }); };
    var m = function (k) { var d = new Date(); d.setMonth(d.getMonth() - k); return F.iso(d); };
    return [].concat(
      mk('Back squat', 'kg', [[m(12), 60, 3], [m(10), 67.5, 3], [m(8), 72.5, 3], [m(6), 80, 2], [m(4), 85, 1], [m(2), 90, 1], [m(0), 92.5, 1]]),
      mk('Deadlift', 'kg', [[m(12), 80, 3], [m(9), 95, 3], [m(6), 110, 1], [m(3), 122.5, 1], [m(1), 130, 1]]),
      mk('Bench press', 'kg', [[m(11), 40, 3], [m(7), 47.5, 2], [m(4), 52.5, 1], [m(1), 57.5, 1]]),
      mk('Strict press', 'kg', [[m(10), 30, 3], [m(6), 35, 1], [m(2), 40, 1]]),
      mk('HYROX sim', 'min', [[m(9), 101], [m(6), 96], [m(3), 91], [m(1), 88]])
    );
  };
  F.rupees = function (n) { return '₹' + n.toLocaleString('en-IN'); };
})();
