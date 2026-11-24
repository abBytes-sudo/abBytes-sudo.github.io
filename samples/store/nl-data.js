/* Northlane commerce core (design sample). ONE demo database shared by the storefront (store/) and the back office (orders/).
   Everything lives in this browser's localStorage under "nl-db-v2" (uploaded images under "nl-media"). Nothing is sent anywhere.
   Load after catalog.js. Exposes window.NL. Fires a window "nl:change" event after every write (and when another tab writes). */
(function () {
  'use strict';
  var KEY = 'nl-db-v2', MEDIA = 'nl-media', SESS = 'nl-session', VER = 3, H = 36e5, DAY = 864e5, MIN = 6e4;
  var ROOT = /\/orders\//.test(location.pathname) ? '../store/' : '';
  var BASE = (window.NLCAT && window.NLCAT.P) || [];

  /* ───────── formatting ───────── */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function money(n, o) { n = Math.round((+n || 0) * 100) / 100; var neg = n < 0; n = Math.abs(n);
    var s = '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); return (neg ? '−' : '') + s; }
  function compact(n) { return n >= 1e7 ? '₹' + (n / 1e7).toFixed(2) + ' Cr' : n >= 1e5 ? '₹' + (n / 1e5).toFixed(n >= 1e6 ? 1 : 2) + ' L' : money(n); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dayStart(ts) { var d = new Date(ts == null ? Date.now() : ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function fD(ts) { var d = new Date(ts); return WD[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function fDs(ts) { var d = new Date(ts); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function fT(ts) { var d = new Date(ts), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'am' : 'pm'); }
  function fDT(ts) { return fD(ts) + ' · ' + fT(ts); }
  function rel(ts) { var t0 = dayStart(), d = Math.round((dayStart(ts) - t0) / DAY);
    if (d === 0) return 'Today, ' + fT(ts); if (d === -1) return 'Yesterday, ' + fT(ts); if (d === 1) return 'Tomorrow'; if (d > -7 && d < 0) return WD[new Date(ts).getDay()] + ', ' + fT(ts); return fD(ts); }
  function ago(ts) { var m = Math.round((Date.now() - ts) / MIN); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; if (m < 1440) return Math.round(m / 60) + 'h ago'; var d = Math.round(m / 1440); return d < 30 ? d + 'd ago' : Math.round(d / 30) + 'mo ago'; }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function wpick(r, pairs) { var s = 0, i; for (i = 0; i < pairs.length; i++) s += pairs[i][1]; var x = r() * s; for (i = 0; i < pairs.length; i++) { x -= pairs[i][1]; if (x <= 0) return pairs[i][0]; } return pairs[pairs.length - 1][0]; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function maskPhone(p) { p = String(p || ''); return p ? '+91 ' + p.slice(0, 2) + '••• ••' + p.slice(-3) : ''; }

  /* ───────── geography: customer cities, pincodes, carrier hubs ───────── */
  // name: [state, region, zone, lat, lon, [[locality, pin], ...]]
  var CITY = {
    'Mumbai': ['Maharashtra', 'W', 'metro', 19.076, 72.878, [['Bandra West', '400050'], ['Andheri West', '400058'], ['Powai', '400076'], ['Colaba', '400005'], ['Juhu', '400049']]],
    'Bengaluru': ['Karnataka', 'S', 'metro', 12.972, 77.595, [['Indiranagar', '560038'], ['Koramangala', '560034'], ['Jayanagar', '560041'], ['Whitefield', '560066'], ['HSR Layout', '560102']]],
    'New Delhi': ['Delhi', 'N', 'metro', 28.614, 77.209, [['Hauz Khas', '110016'], ['Defence Colony', '110024'], ['Vasant Kunj', '110070'], ['Greater Kailash', '110048'], ['Rajouri Garden', '110027']]],
    'Gurugram': ['Haryana', 'N', 'metro', 28.459, 77.027, [['Sector 28', '122002'], ['Sector 56', '122011'], ['Golf Course Road', '122009']]],
    'Pune': ['Maharashtra', 'W', 'metro', 18.52, 73.857, [['Koregaon Park', '411001'], ['Baner', '411045'], ['Kothrud', '411038'], ['Viman Nagar', '411014']]],
    'Hyderabad': ['Telangana', 'S', 'metro', 17.385, 78.487, [['Banjara Hills', '500034'], ['Jubilee Hills', '500033'], ['Gachibowli', '500032'], ['Kondapur', '500084']]],
    'Chennai': ['Tamil Nadu', 'S', 'metro', 13.083, 80.271, [['Adyar', '600020'], ['Alwarpet', '600018'], ['Anna Nagar', '600040'], ['Besant Nagar', '600090']]],
    'Kolkata': ['West Bengal', 'E', 'metro', 22.573, 88.364, [['Ballygunge', '700019'], ['Salt Lake', '700091'], ['Alipore', '700027']]],
    'Jaipur': ['Rajasthan', 'N', 'local', 26.912, 75.787, [['C-Scheme', '302001'], ['Malviya Nagar', '302017'], ['Vaishali Nagar', '302021']]],
    'Ahmedabad': ['Gujarat', 'W', 'tier', 23.023, 72.571, [['Bodakdev', '380054'], ['Navrangpura', '380009'], ['Satellite', '380015']]],
    'Kochi': ['Kerala', 'S', 'tier', 9.931, 76.267, [['Panampilly Nagar', '682036'], ['Kakkanad', '682030'], ['Fort Kochi', '682001']]],
    'Chandigarh': ['Chandigarh', 'N', 'tier', 30.733, 76.779, [['Sector 8', '160009'], ['Sector 35', '160022']]],
    'Panaji': ['Goa', 'W', 'tier', 15.491, 73.828, [['Altinho', '403001'], ['Assagao', '403507']]],
    'Lucknow': ['Uttar Pradesh', 'N', 'tier', 26.847, 80.947, [['Gomti Nagar', '226010'], ['Hazratganj', '226001']]],
    'Indore': ['Madhya Pradesh', 'C', 'tier', 22.72, 75.858, [['Vijay Nagar', '452010'], ['Palasia', '452001']]],
    'Noida': ['Uttar Pradesh', 'N', 'metro', 28.535, 77.391, [['Sector 50', '201301'], ['Sector 18', '201301']]],
    'Coimbatore': ['Tamil Nadu', 'S', 'tier', 11.017, 76.956, [['RS Puram', '641002'], ['Race Course', '641018']]],
    'Dehradun': ['Uttarakhand', 'N', 'tier', 30.317, 78.032, [['Rajpur Road', '248001']]],
    'Guwahati': ['Assam', 'E', 'remote', 26.144, 91.736, [['Zoo Road', '781005']]],
    'Bhubaneswar': ['Odisha', 'E', 'tier', 20.296, 85.825, [['Saheed Nagar', '751007']]],
    'Surat': ['Gujarat', 'W', 'tier', 21.17, 72.831, [['Vesu', '395007']]],
    'Nagpur': ['Maharashtra', 'C', 'tier', 21.146, 79.088, [['Dharampeth', '440010']]],
    'Mysuru': ['Karnataka', 'S', 'tier', 12.296, 76.639, [['Gokulam', '570002']]],
    'Udaipur': ['Rajasthan', 'N', 'tier', 24.585, 73.712, [['Fatehpura', '313004']]],
    'Shillong': ['Meghalaya', 'E', 'remote', 25.578, 91.893, [['Laitumkhrah', '793003']]],
    'Thiruvananthapuram': ['Kerala', 'S', 'tier', 8.524, 76.936, [['Kowdiar', '695003']]],
    'Visakhapatnam': ['Andhra Pradesh', 'S', 'tier', 17.687, 83.218, [['MVP Colony', '530017']]]
  };
  var CITYW = [['Mumbai', 18], ['Bengaluru', 16], ['New Delhi', 13], ['Gurugram', 6], ['Pune', 8], ['Hyderabad', 8], ['Chennai', 6], ['Kolkata', 6], ['Jaipur', 6], ['Ahmedabad', 4], ['Kochi', 3], ['Chandigarh', 3], ['Panaji', 2], ['Lucknow', 2], ['Indore', 2], ['Noida', 3], ['Coimbatore', 2], ['Dehradun', 1], ['Guwahati', 1], ['Bhubaneswar', 1], ['Surat', 1], ['Nagpur', 1], ['Mysuru', 1], ['Udaipur', 1], ['Shillong', 1], ['Thiruvananthapuram', 1], ['Visakhapatnam', 1]];
  // 3-digit pincode prefixes we recognise to a city; anything else falls back to the 2-digit postal circle
  var PIN3 = { '110': 'New Delhi', '400': 'Mumbai', '560': 'Bengaluru', '600': 'Chennai', '700': 'Kolkata', '500': 'Hyderabad', '411': 'Pune', '380': 'Ahmedabad', '302': 'Jaipur', '303': 'Jaipur', '122': 'Gurugram', '201': 'Noida', '226': 'Lucknow', '160': 'Chandigarh', '682': 'Kochi', '641': 'Coimbatore', '452': 'Indore', '395': 'Surat', '440': 'Nagpur', '403': 'Panaji', '248': 'Dehradun', '751': 'Bhubaneswar', '781': 'Guwahati', '570': 'Mysuru', '313': 'Udaipur', '793': 'Shillong', '695': 'Thiruvananthapuram', '530': 'Visakhapatnam',
    '462': ['Bhopal', 'Madhya Pradesh'], '800': ['Patna', 'Bihar'], '141': ['Ludhiana', 'Punjab'], '143': ['Amritsar', 'Punjab'], '390': ['Vadodara', 'Gujarat'], '342': ['Jodhpur', 'Rajasthan'], '171': ['Shimla', 'Himachal Pradesh'], '834': ['Ranchi', 'Jharkhand'], '492': ['Raipur', 'Chhattisgarh'], '575': ['Mangaluru', 'Karnataka'], '422': ['Nashik', 'Maharashtra'], '208': ['Kanpur', 'Uttar Pradesh'], '221': ['Varanasi', 'Uttar Pradesh'], '282': ['Agra', 'Uttar Pradesh'], '190': ['Srinagar', 'Jammu and Kashmir'], '180': ['Jammu', 'Jammu and Kashmir'], '605': ['Puducherry', 'Puducherry'], '625': ['Madurai', 'Tamil Nadu'], '360': ['Rajkot', 'Gujarat'], '520': ['Vijayawada', 'Andhra Pradesh'], '673': ['Kozhikode', 'Kerala'], '744': ['Port Blair', 'Andaman and Nicobar'], '194': ['Leh', 'Ladakh'] };
  var PIN2 = { '11': 'Delhi', '12': 'Haryana', '13': 'Haryana', '14': 'Punjab', '15': 'Punjab', '16': 'Punjab', '17': 'Himachal Pradesh', '18': 'Jammu and Kashmir', '19': 'Jammu and Kashmir', '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh', '24': 'Uttarakhand', '25': 'Uttar Pradesh', '26': 'Uttarakhand', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh', '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan', '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat', '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra', '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh', '49': 'Chhattisgarh', '50': 'Telangana', '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh', '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka', '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu', '67': 'Kerala', '68': 'Kerala', '69': 'Kerala', '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal', '75': 'Odisha', '76': 'Odisha', '77': 'Odisha', '78': 'Assam', '79': 'North East', '80': 'Bihar', '81': 'Bihar', '82': 'Jharkhand', '83': 'Jharkhand', '84': 'Bihar', '85': 'Bihar' };
  var STATE_REGION = { 'Delhi': 'N', 'Haryana': 'N', 'Punjab': 'N', 'Himachal Pradesh': 'N', 'Jammu and Kashmir': 'N', 'Ladakh': 'N', 'Uttar Pradesh': 'N', 'Uttarakhand': 'N', 'Rajasthan': 'N', 'Chandigarh': 'N', 'Gujarat': 'W', 'Maharashtra': 'W', 'Goa': 'W', 'Madhya Pradesh': 'C', 'Chhattisgarh': 'C', 'Telangana': 'S', 'Andhra Pradesh': 'S', 'Karnataka': 'S', 'Tamil Nadu': 'S', 'Kerala': 'S', 'Puducherry': 'S', 'West Bengal': 'E', 'Odisha': 'E', 'Assam': 'E', 'North East': 'E', 'Meghalaya': 'E', 'Bihar': 'E', 'Jharkhand': 'E', 'Andaman and Nicobar': 'E' };
  var REMOTE = /^(18|19|78|79|194|744)/;
  var ORIGIN = { name: 'Northlane studio, Jaipur', short: 'Jaipur studio', lat: 26.84, lon: 75.8 };
  var HUB = { N: { name: 'Gurugram sort centre', short: 'Gurugram', lat: 28.42, lon: 76.96 }, W: { name: 'Bhiwandi sort centre', short: 'Bhiwandi', lat: 19.3, lon: 73.06 }, S: { name: 'Hoskote sort centre', short: 'Hoskote', lat: 13.07, lon: 77.8 },
    E: { name: 'Dankuni sort centre', short: 'Dankuni', lat: 22.68, lon: 88.29 }, C: { name: 'Nagpur sort centre', short: 'Nagpur', lat: 21.1, lon: 79.05 } };
  var CARRIER = { std: { name: 'Parcelwise', code: 'PW' }, exp: { name: 'Arrowpost Express', code: 'AP' }, same: { name: 'Swiftline Same-day', code: 'SL' } };
  var METHOD = { std: 'Standard', exp: 'Express', same: 'Same-day' };
  var RIDERS = ['Sandeep', 'Imran', 'Ravi', 'Prakash', 'Joseph', 'Manoj', 'Arun', 'Salim', 'Vinod', 'Deepak'];

  function pin(p) {
    p = String(p || '').replace(/\s/g, '');
    if (!p) return { ok: false, msg: 'Enter your 6-digit pincode.' };
    if (!/^\d+$/.test(p)) return { ok: false, msg: 'A pincode only has numbers in it.' };
    if (p.length !== 6) return { ok: false, msg: 'Pincodes have six digits. This one has ' + p.length + '.' };
    if (p[0] === '0' || p[0] === '9') return { ok: false, msg: 'That doesn’t look like an Indian pincode. Check the first digit.' };
    var c3 = PIN3[p.slice(0, 3)], st, city, region, zone;
    if (typeof c3 === 'string') { var C = CITY[c3]; city = c3; st = C[0]; region = C[1]; zone = C[2]; }
    else if (c3) { city = c3[0]; st = c3[1]; region = STATE_REGION[st] || 'C'; zone = 'tier'; }
    else { st = PIN2[p.slice(0, 2)]; if (!st) return { ok: false, msg: 'We don’t recognise that pincode. Please check it.' }; region = STATE_REGION[st] || 'C'; zone = 'tier'; city = ''; }
    if (REMOTE.test(p)) zone = 'remote';
    return { ok: true, pin: p, city: city, state: st, region: region, zone: zone, cod: zone !== 'remote', same: zone === 'local' };
  }
  // business days (Sundays off for the courier) added to a date
  function addBiz(ts, n) { var d = new Date(ts); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n--; } return d.getTime(); }
  var TRANSIT = { std: { local: [1, 2], metro: [3, 4], tier: [4, 6], remote: [6, 9] }, exp: { local: [1, 1], metro: [1, 2], tier: [2, 3], remote: [4, 5] } };
  function shipOptions(p, sub, now) {
    var S = db().set, z = p && p.ok ? p.zone : 'tier', t = now || Date.now(), late = new Date(t).getHours() >= 14, base = late ? addBiz(t, 1) : t, out = [];
    function win(m) { var r = TRANSIT[m][z]; return { from: addBiz(base, r[0]), to: addBiz(base, r[1]) }; }
    var w = win('std'); out.push({ id: 'std', label: 'Standard', carrier: CARRIER.std.name, fee: sub >= S.freeShip ? 0 : S.stdFee, from: w.from, to: w.to, note: sub >= S.freeShip ? 'Free over ' + money(S.freeShip) : 'Free over ' + money(S.freeShip) + '. Add ' + money(S.freeShip - sub) + ' more.' });
    w = win('exp'); out.push({ id: 'exp', label: 'Express', carrier: CARRIER.exp.name, fee: S.expFee, from: w.from, to: w.to, note: z === 'remote' ? 'Fastest available to your area' : 'Order by 2 pm to ship today' });
    if (p && p.ok && p.same) out.push({ id: 'same', label: 'Same-day in Jaipur', carrier: CARRIER.same.name, fee: S.sameFee, from: late ? addBiz(t, 1) : t, to: late ? addBiz(t, 1) : t, note: late ? 'Ordered after 2 pm, so it arrives tomorrow by 9 pm' : 'Arrives today by 9 pm' });
    return out;
  }
  function winText(o) { return o.from === o.to || dayStart(o.from) === dayStart(o.to) ? (dayStart(o.from) === dayStart() ? 'Today' : fD(o.from)) : fD(o.from) + ' – ' + fD(o.to); }

  /* ───────── products ───────── */
  var CODE = { 'harbor-jacket': 'HBJ', 'atelier-tote': 'ATT', 'meridian-38': 'MRD', 'coast-sunglasses': 'CST', 'drift-runner': 'DSB', 'court-low': 'SGB', 'field-cap': 'FDC', 'mini-crossbody': 'MCB', 'everyday-tee': 'EDT', 'loop-hoodie': 'LPH', 'easy-trousers': 'ESY', 'rib-knit': 'RBK' };
  var FIT = { 'harbor-jacket': 'Relaxed through the body. If you’re between sizes, take the smaller one.', 'everyday-tee': 'Boxy and slightly dropped at the shoulder. True to size.', 'loop-hoodie': 'Roomy by design. Size down for a neater fit.', 'easy-trousers': 'Cropped above the ankle with an elastic drawcord waist. True to size.', 'rib-knit': 'Slightly cropped and close to the body. Size up for a looser drape.',
    'drift-runner': 'Runs half a size large. Most people take one size down.', 'court-low': 'True to size, with a snug heel that softens in a week.' };
  function seedProducts() {
    return BASE.map(function (b, i) { var p = clone(b);
      p.status = 'active'; p.code = CODE[p.id] || p.id.slice(0, 3).toUpperCase(); p.images = [{ src: 'products/' + p.id + '.jpg', alt: p.alt }]; p.fit = FIT[p.id] || ''; p.compare = 0; p.order = i; p.updated = 0;
      p.tags = [p.cat.toLowerCase(), p.for.toLowerCase()]; return p; });
  }
  function colCode(n) { return String(n).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(); }
  function skuKey(pid, c, s) { return pid + '|' + c + '|' + s; }
  function skuParse(k) { var a = String(k).split('|'); return { pid: a[0], c: +a[1], s: a.slice(2).join('|') }; }
  function skuCode(k) { var x = skuParse(k), p = product(x.pid); if (!p) return k; var col = p.colors[x.c]; return p.code + '-' + (col ? colCode(col.n) : 'X') + '-' + String(x.s).replace(/\s+/g, '').toUpperCase().replace('ONESIZE', 'OS'); }
  function skuLabel(k) { var x = skuParse(k), p = product(x.pid); if (!p) return k; var col = p.colors[x.c]; return p.name + ' · ' + (col ? col.n : '') + (x.s && x.s !== 'One size' ? ' · ' + x.s : ''); }

  /* ───────── persistence ───────── */
  var mem = null, mediaMem = null;
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var TIMEKEYS = { t: 1, at: 1, packed: 1, shipped: 1, out: 1, delivered: 1, eta: 1, since: 1, ends: 1, starts: 1, requested: 1, approved: 1, received: 1, refunded: 1, rejected: 1, nt: 1, last: 1, from: 1, to: 1, pickup: 1, updated: 1, cancelledAt: 1 };
  function shift(o, d) { if (Array.isArray(o)) { o.forEach(function (x) { if (x && typeof x === 'object') shift(x, d); }); return; }
    Object.keys(o).forEach(function (k) { var v = o[k]; if (typeof v === 'number' && TIMEKEYS[k] && v > 1e12) o[k] = v + d; else if (v && typeof v === 'object') shift(v, d); }); }
  function db() {
    if (mem) return mem;
    var s = read(KEY);
    if (!s || s.v !== VER || !s.orders || !s.products) { s = seed(); write(KEY, s); }
    else { // keep the demo alive: move every timestamp forward by the whole days since it was seeded
      var n = Math.floor((dayStart() - dayStart(s.epoch)) / DAY);
      if (n >= 1) { var d = n * DAY, tr = {}; shift(s, d); s.epoch += d; Object.keys(s.traffic).forEach(function (k) { tr[+k + d] = s.traffic[k]; }); s.traffic = tr; write(KEY, s); }
    }
    try { localStorage.removeItem('nl-orders-v1'); } catch (e) {}
    mem = s; return s;
  }
  function save(scope) {
    var s = mem; if (!s) return; if (trackT) { clearTimeout(trackT); trackT = 0; }
    if (!write(KEY, s)) { s.outbox = s.outbox.slice(0, 60); s.ledger = s.ledger.slice(0, 200); s.audit = s.audit.slice(0, 150); write(KEY, s); }
    emit(scope || 'all', false);
  }
  function emit(scope, remote) { try { window.dispatchEvent(new CustomEvent('nl:change', { detail: { scope: scope, remote: remote } })); } catch (e) {} }
  addEventListener('storage', function (e) {
    if (e.key === KEY) { mem = null; cmCache = null; csCache = null; emit('all', true); }
    else if (e.key === MEDIA) { mediaMem = null; emit('media', true); }
    else if (e.key === SESS) emit('session', true);
  });
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} mem = null; cmCache = null; csCache = null; db(); emit('all', false); return mem; }

  var media = {
    all: function () { if (!mediaMem) mediaMem = read(MEDIA) || {}; return mediaMem; },
    get: function (id) { return media.all()[id] || ''; },
    put: function (dataUrl) { var m = media.all(), id = 'm' + Date.now().toString(36); m[id] = dataUrl; if (!write(MEDIA, m)) { delete m[id]; return null; } emit('media', false); return id; }
  };
  // resized WebP copies live in products/w/ and photos/w/ (generated with cwebp); anything else keeps its original file
  function variant(src) { var m = String(src || '').match(/^(products|photos)\/([a-z0-9-]+)\.jpg$/); return m ? { d: m[1], b: m[2], w: m[1] === 'products' ? [450, 900] : [560, 900] } : null; }
  function srcset(src) { var v = variant(src); return v ? v.w.map(function (w) { return ROOT + v.d + '/w/' + v.b + '-' + w + '.webp ' + w + 'w'; }).join(', ') : ''; }
  function thumbSrc(src) { var v = variant(src); return v ? ROOT + v.d + '/w/' + v.b + '-' + v.w[0] + '.webp' : imgSrc(src); }
  function imgAttrs(src, sizes) { var ss = srcset(src); return 'src="' + imgSrc(src) + '"' + (ss ? ' srcset="' + ss + '" sizes="' + (sizes || '50vw') + '"' : ''); }
  function imgSrc(src) { src = String(src || ''); if (src.indexOf('media:') === 0) return media.get(src.slice(6)) || ROOT + 'photos/strip-1.jpg'; if (/^(data:|blob:)/.test(src)) return src; return ROOT + src; }

  /* ───────── seed data ───────── */
  var FIRST = ['Meera', 'Aarav', 'Ananya', 'Vihaan', 'Diya', 'Arjun', 'Ishita', 'Kabir', 'Saanvi', 'Rohan', 'Aditi', 'Karan', 'Nisha', 'Siddharth', 'Pooja', 'Rahul', 'Tara', 'Nikhil', 'Kavya', 'Aditya', 'Riya', 'Varun', 'Sneha', 'Dev', 'Priya', 'Yash', 'Neha', 'Aman', 'Shreya', 'Vikram', 'Anjali', 'Harsh', 'Isha', 'Manav', 'Radhika', 'Sahil', 'Tanvi', 'Kunal', 'Zoya', 'Farhan', 'Simran', 'Arnav', 'Mehak', 'Ritwik', 'Lavanya', 'Pranav', 'Aisha', 'Omkar', 'Trisha', 'Gaurav', 'Naina', 'Abhay', 'Juhi', 'Rehan', 'Sana', 'Ishaan', 'Mitali', 'Samar', 'Ira', 'Neil'];
  var LAST = ['Iyer', 'Sharma', 'Mehta', 'Nair', 'Kapoor', 'Reddy', 'Banerjee', 'Gupta', 'Menon', 'Kulkarni', 'Singh', 'Desai', 'Chatterjee', 'Rao', 'Joshi', 'Pillai', 'Malhotra', 'Shetty', 'Bhat', 'Agarwal', 'Sen', 'Khanna', 'Patel', 'Bose', 'Verma', 'Chopra', 'Das', 'Hegde', 'Saxena', 'Krishnan', 'Mukherjee', 'Thakur', 'Fernandes', 'D’Souza', 'Khan', 'Ahmed', 'Qureshi', 'Sethi', 'Bajaj', 'Naidu'];
  var BLD = ['Sea Breeze Apartments', 'Palm Grove', 'Kamal Kunj', 'Sterling Heights', 'Lakeview Residency', 'Sai Krupa Society', 'Orchid Enclave', 'Banyan Court', 'Silver Oak Towers', 'Gulmohar Villas', 'Amber Residency', 'Neelkanth Heights', 'Rosewood Apartments', 'Shanti Niketan', 'Tulip Gardens'];
  var ROAD = ['Carter Road', '12th Main Road', 'Park Street', 'Station Road', 'MG Road', 'Temple Road', '4th Cross Road', 'Ring Road', 'Church Street', 'Lake Road', 'College Road', 'Hill Road'];
  var CH = [['Online store', 62], ['Instagram', 18], ['WhatsApp', 12], ['Pop-up store', 8]];
  var PAY = [['UPI', 50], ['Card', 25], ['COD', 17], ['Net banking', 8]];
  var CARDS = ['Visa ···· 4242', 'Mastercard ···· 4444', 'RuPay ···· 6075', 'Visa ···· 1881', 'Amex ···· 0005', 'Mastercard ···· 2710'];
  var POP = { 'everyday-tee': 14, 'loop-hoodie': 11, 'field-cap': 10, 'easy-trousers': 10, 'rib-knit': 9, 'harbor-jacket': 8, 'mini-crossbody': 7, 'coast-sunglasses': 7, 'drift-runner': 7, 'atelier-tote': 6, 'court-low': 5, 'meridian-38': 4 };
  var SIZEW = { XS: 1, S: 3, M: 4, L: 3, XL: 1.4, '39': 1, '40': 2, '41': 3, '42': 4, '43': 3, '44': 2, '45': 1, 'One size': 1, '38 mm': 1 };
  var RETR = ['Too small', 'Too big', 'Not as expected', 'Changed my mind', 'Arrived damaged', 'Colour different from photos'];
  var NOTES = ['Customer asked for the parcel to be left with the building security.', 'Called to confirm the size. Happy with M.', 'Gift for a sister’s birthday, please don’t include the invoice.', 'Prefers WhatsApp over calls.', 'Asked about the Navy colourway restock.', 'Repeat customer, add a handwritten card.'];

  function tlPush(o, t, k, m, by) { o.tl.push({ t: t, k: k, m: m, by: by || 'System' }); }

  function seed() {
    var now = Date.now(), today = dayStart(now), r = rng(77031), P = seedProducts(), byId = {}, i, j, k;
    P.forEach(function (p) { byId[p.id] = p; });
    var S = { v: VER, epoch: now, products: P, inv: {}, ledger: [], po: [], orders: [], cust: [], disc: [], alerts: [], reviews: {}, traffic: {}, tpl: tplSeed(), outbox: [], audit: [], views: [],
      set: { store: 'Northlane', freeShip: 5000, stdFee: 149, expFee: 349, sameFee: 199, codFee: 49, codMax: 10000, giftWrap: 150, lowAt: 3, returnDays: 30 }, seq: { rma: 1040, ref: 2200, po: 2290, cust: 1000 }, force: { partial: 2, cod: 4, pending: 1, ret: 3 } };

    /* customers: ~150 people, each with a behaviour profile */
    var used = {}, cust = [];
    function mkCust(fn, ln, city, prof, sinceAge) {
      var C = CITY[city], loc = pick(r, C[5]), nm = fn + ' ' + ln, em = (fn + '.' + ln).toLowerCase().replace(/[^a-z.]/g, '') + '@example.com';
      var c = { id: 'C-' + (++S.seq.cust), name: nm, email: em, phone: '9' + Math.floor(r() * 9) + String(Math.floor(1e7 + r() * 9e7)).slice(0, 8), city: city, state: C[0], since: now - sinceAge * DAY,
        addrs: [{ id: 'a1', name: nm, l1: (r() < .5 ? 'Flat ' + (100 * (1 + Math.floor(r() * 14)) + Math.floor(r() * 8) + 1) + ', ' : (2 + Math.floor(r() * 80)) + ', ') + pick(r, BLD), l2: pick(r, ROAD) + ', ' + loc[0], city: city, state: C[0], pin: loc[1], def: true }],
        tags: [], notes: [], mkt: r() < .62, credit: 0, prof: prof };
      used[nm] = 1; cust.push(c); return c;
    }
    // the demo customer used for the storefront account and tracking
    var meera = mkCust('Meera', 'Iyer', 'Mumbai', 'vip', 150); meera.addrs[0] = { id: 'a1', name: 'Meera Iyer', l1: 'Flat 1203, Sea Breeze Apartments', l2: 'Carter Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', pin: '400050', def: true };
    meera.addrs.push({ id: 'a2', name: 'Meera Iyer (office)', l1: '4th floor, Kamal Kunj', l2: 'Station Road, Powai', city: 'Mumbai', state: 'Maharashtra', pin: '400076', def: false }); meera.mkt = true; meera.phone = '98201' + '34112';
    for (i = 0; cust.length < 150 && i < 4000; i++) {
      var fn = FIRST[(i * 7) % FIRST.length], ln = LAST[(i * 11 + Math.floor(i / FIRST.length) * 3) % LAST.length], nm = fn + ' ' + ln; if (used[nm]) continue;
      var u = r(), prof = u < .07 ? 'vip' : u < .2 ? 'risk' : u < .34 ? 'new' : u < .62 ? 'repeat' : 'once';
      mkCust(fn, ln, wpick(r, CITYW), prof, prof === 'new' ? 2 + r() * 26 : 30 + r() * 100);
    }
    S.cust = cust;
    var byProf = { vip: [], risk: [], new: [], repeat: [], once: [] }; cust.forEach(function (c) { if (c !== meera) byProf[c.prof].push(c); });

    /* discounts */
    S.disc = [
      { code: 'WELCOME10', type: 'pct', value: 10, min: 0, first: true, once: true, limit: 0, used: 0, starts: now - 200 * DAY, ends: 0, active: true, note: 'First order, sent with the newsletter welcome email', t: now - 200 * DAY },
      { code: 'NORTHLANE500', type: 'amt', value: 500, min: 4000, limit: 300, used: 0, starts: now - 120 * DAY, ends: today + 38 * DAY, active: true, note: 'Instagram followers, winter campaign', t: now - 120 * DAY },
      { code: 'FESTIVE15', type: 'pct', value: 15, min: 6000, limit: 0, used: 0, starts: today - 24 * DAY, ends: today - 9 * DAY, active: true, note: 'Diwali edit, ran for two weeks', t: today - 26 * DAY },
      { code: 'FREESHIP', type: 'ship', value: 0, min: 0, limit: 0, used: 0, starts: now - 30 * DAY, ends: today + 12 * DAY, active: true, note: 'Free shipping on any order', t: now - 30 * DAY },
      { code: 'STUDIO20', type: 'pct', value: 20, min: 0, limit: 25, used: 0, starts: now - 90 * DAY, ends: 0, active: true, note: 'Friends of the studio', t: now - 90 * DAY },
      { code: 'WINTER12', type: 'pct', value: 12, min: 5000, limit: 500, used: 0, starts: today + 5 * DAY, ends: today + 40 * DAY, active: true, note: 'Winter knits launch, scheduled', t: now - 2 * DAY }
    ];
    var DC = {}; S.disc.forEach(function (d) { DC[d.code] = d; d.by = []; });

    /* order ages in hours: a busy last fortnight (festive spike), a steady tail back to ~4 months */
    var ages = [1.2, 2.6, 3.9, 5.5, 7.2, 9.8, 14, 19, 23, 27, 31, 38, 44, 50, 57, 64, 71, 80, 88, 97, 106, 118, 131, 145, 160];
    for (i = 0; ages.length < 300; i++) { var dd = 6.5 + Math.pow(r(), 1.35) * 116; var spike = (dd > 9 && dd < 24) ? 1 : 0; ages.push(dd * 24); if (spike && r() < .55) ages.push((9 + r() * 15) * 24); }
    ages.sort(function (a, b) { return b - a; });
    var num = 10180;
    var inv = {}; // committed counting happens later

    for (k = 0; k < ages.length; k++) {
      var ageH = ages[k], t = now - ageH * H, dayAge = ageH / 24;
      // nudge to a plausible hour of day (more in the evening)
      if (ageH > 30) { var dt = new Date(t); dt.setHours(wpick(r, [[9, 1], [11, 2], [13, 3], [15, 2], [18, 3], [20, 4], [21, 4], [22, 3], [23, 1]]), Math.floor(r() * 60)); t = Math.min(dt.getTime(), now - 26 * H); }
      var pool = dayAge < 28 ? (r() < .3 ? byProf.new : r() < .22 ? byProf.vip : r() < .5 ? byProf.repeat : byProf.once)
        : dayAge > 62 ? (r() < .45 ? byProf.risk : r() < .2 ? byProf.vip : r() < .5 ? byProf.repeat : byProf.once)
          : (r() < .25 ? byProf.vip : r() < .5 ? byProf.repeat : byProf.once);
      var c = pick(r, pool);
      if (c.prof === 'once' && c.n1) c = pick(r, byProf.repeat);
      if (c.prof === 'new' && c.n1) c = pick(r, byProf.once);
      c.n1 = (c.n1 || 0) + 1;
      var o = mkOrder(S, byId, r, c, t, ++num, DC);
      S.orders.push(o);
    }
    // Meera's own history, written by hand so the account and tracking demo always have something to show
    var mo = [
      { age: 132 * DAY, items: [['atelier-tote', 0, 'One size', 1]], m: 'std', pay: 'Card', st: 'delivered' },
      { age: 96 * DAY, items: [['rib-knit', 0, 'S', 1], ['easy-trousers', 1, 'S', 1]], m: 'std', pay: 'UPI', st: 'delivered', ret: 'refunded' },
      { age: 61 * DAY, items: [['meridian-38', 1, '38 mm', 1]], m: 'exp', pay: 'Card', st: 'delivered' },
      { age: 19 * DAY, items: [['harbor-jacket', 0, 'S', 1], ['field-cap', 2, 'One size', 1]], m: 'std', pay: 'UPI', st: 'delivered', code: 'FESTIVE15' },
      { age: 9 * DAY, items: [['loop-hoodie', 1, 'M', 1], ['everyday-tee', 0, 'M', 2]], m: 'std', pay: 'UPI', st: 'delivered', ret: 'requested' },
      { age: 2.2 * DAY, items: [['coast-sunglasses', 0, 'One size', 1], ['mini-crossbody', 0, 'One size', 1]], m: 'exp', pay: 'UPI', st: 'out', demo: true }
    ];
    mo.forEach(function (x) { var o = mkOrder(S, byId, r, meera, now - x.age, 0, DC, x); S.orders.push(o); });
    S.orders.sort(function (a, b) { return a.t - b.t; });
    S.orders.forEach(function (o, i2) { o.num = 10181 + i2; o.id = 'NL-' + o.num; o.tl.forEach(function (e) { e.m = e.m.replace(/#ORDER/g, o.id); }); if (o.rets) o.rets.forEach(function (rt) { rt.id = 'RMA-' + (++S.seq.rma); }); });
    S.orders.reverse(); // newest first

    /* inventory: on hand per variant, with a few honest gaps */
    P.forEach(function (p) { p.colors.forEach(function (col, ci) { p.sizes.forEach(function (sz) {
      var key = skuKey(p.id, ci, sz), w = SIZEW[sz] || 1, base = Math.round((ci === 0 ? 9 : 5) * w * (0.6 + r() * .8) + (p.sizes.length === 1 ? 10 : 0));
      S.inv[key] = { on: base, low: p.sizes.length === 1 ? 4 : 2 };
    }); }); });
    var GAP = { 'harbor-jacket|1|XS': 0, 'harbor-jacket|1|S': 1, 'harbor-jacket|0|L': 1, 'rib-knit|2|XS': 0, 'rib-knit|2|S': 0, 'rib-knit|2|M': 1, 'coast-sunglasses|2|One size': 0, 'drift-runner|0|42': 1, 'drift-runner|0|44': 0, 'atelier-tote|2|One size': 2, 'easy-trousers|0|M': 2, 'loop-hoodie|1|XL': 0, 'court-low|2|41': 0, 'meridian-38|2|38 mm': 1, 'everyday-tee|1|XS': 0 };
    var committed = committedMap(S);
    Object.keys(S.inv).forEach(function (key) { var cm = committed[key] || 0; S.inv[key].on = (key in GAP ? GAP[key] : S.inv[key].on) + cm; });
    // stock count history for the ledger
    Object.keys(S.inv).forEach(function (key, ix) { if (ix % 3 === 0) S.ledger.push({ t: today - 35 * DAY + 10 * H + ix * MIN, sku: key, d: 0, r: 'Cycle count', by: 'Kabir Sethi', ref: 'Quarterly count', after: S.inv[key].on + 4 }); });

    /* purchase orders (incoming stock) */
    S.po = [
      { id: 'PO-' + (++S.seq.po), sup: 'Sanganer leather workshop, Jaipur', t: now - 12 * DAY, eta: today + 2 * DAY + 11 * H, st: 'transit', lines: [{ sku: 'atelier-tote|2|One size', q: 12, rcv: 0 }, { sku: 'mini-crossbody|1|One size', q: 10, rcv: 0 }] },
      { id: 'PO-' + (++S.seq.po), sup: 'Ludhiana knitting co-operative', t: now - 9 * DAY, eta: today + 4 * DAY + 10 * H, st: 'ordered', lines: [{ sku: 'rib-knit|2|XS', q: 6, rcv: 0 }, { sku: 'rib-knit|2|S', q: 10, rcv: 0 }, { sku: 'rib-knit|2|M', q: 10, rcv: 0 }, { sku: 'rib-knit|0|M', q: 8, rcv: 0 }] },
      { id: 'PO-' + (++S.seq.po), sup: 'Tiruppur cotton mill', t: now - 6 * DAY, eta: today + 1 * DAY + 15 * H, st: 'transit', lines: [{ sku: 'harbor-jacket|1|XS', q: 6, rcv: 0 }, { sku: 'harbor-jacket|1|S', q: 8, rcv: 0 }, { sku: 'loop-hoodie|1|XL', q: 6, rcv: 0 }, { sku: 'everyday-tee|1|XS', q: 8, rcv: 0 }] },
      { id: 'PO-' + (++S.seq.po), sup: 'Agra footwear atelier', t: now - 3 * DAY, eta: today + 9 * DAY + 10 * H, st: 'ordered', lines: [{ sku: 'drift-runner|0|44', q: 6, rcv: 0 }, { sku: 'drift-runner|0|42', q: 8, rcv: 0 }, { sku: 'court-low|2|41', q: 6, rcv: 0 }] },
      { id: 'PO-' + (S.seq.po - 4), sup: 'Rajkot eyewear workshop', t: now - 30 * DAY, eta: now - 18 * DAY, st: 'received', lines: [{ sku: 'coast-sunglasses|0|One size', q: 20, rcv: 20 }, { sku: 'coast-sunglasses|1|One size', q: 15, rcv: 15 }] }
    ];
    S.po[4].lines.forEach(function (l) { S.ledger.push({ t: S.po[4].eta, sku: l.sku, d: l.q, r: 'Received', by: 'Kabir Sethi', ref: S.po[4].id, after: S.inv[l.sku].on }); });
    // recent stock movements for the ledger: fulfilments from the last 3 weeks plus a few manual adjustments
    S.orders.forEach(function (o) { (o.ships || []).forEach(function (sh) { if (now - sh.ev.packed < 21 * DAY) sh.lines.forEach(function (l) { var it = o.items[l.i]; S.ledger.push({ t: sh.ev.packed, sku: skuKey(it.pid, it.c, it.s), d: -l.q, r: 'Fulfilled', by: sh.by, ref: '#ORDER'.replace('#ORDER', o.id) }); }); }); });
    [['harbor-jacket|0|M', -1, 'Damaged', 'Zip pull came off in QC'], ['rib-knit|0|S', -1, 'Damaged', 'Snag on the cuff'], ['everyday-tee|0|L', 3, 'Found in count', 'Mis-shelved under XL'], ['field-cap|1|One size', -2, 'Samples', 'Sent to stylist for a shoot'], ['atelier-tote|0|One size', -1, 'Samples', 'Pop-up display piece']].forEach(function (a, ix) {
      S.ledger.push({ t: now - (2 + ix * 2.3) * DAY, sku: a[0], d: a[1], r: a[2], by: ix % 2 ? 'Ananya Rao' : 'Kabir Sethi', ref: a[3] }); });
    S.ledger.sort(function (a, b) { return b.t - a.t; }); S.ledger = S.ledger.slice(0, 420);

    /* back-in-stock alerts on the gaps */
    var aE = cust.slice(10, 40).map(function (c) { return c.email; }), ai = 0;
    [['coast-sunglasses|2|One size', 4], ['rib-knit|2|S', 6], ['rib-knit|2|XS', 2], ['harbor-jacket|1|XS', 3], ['drift-runner|0|44', 2], ['loop-hoodie|1|XL', 1], ['court-low|2|41', 1]].forEach(function (a) {
      for (var n = 0; n < a[1]; n++) S.alerts.push({ id: 'AL' + (++ai), sku: a[0], email: aE[(ai * 3) % aE.length], t: now - (1 + r() * 20) * DAY, st: 'waiting' }); });

    /* reviews */
    S.reviews = reviewSeed(P, cust, r, now);

    /* traffic: sessions, carts, checkouts per day (simulated), paid orders come from the orders themselves */
    var perDay = {}; S.orders.forEach(function (o) { var d0 = dayStart(o.t); perDay[d0] = (perDay[d0] || 0) + 1; });
    for (i = 0; i < 125; i++) { var d0 = today - i * DAY, wd = new Date(d0).getDay(), ord = perDay[d0] || 0;
      var ses = Math.round((150 + (wd === 0 || wd === 6 ? 46 : 0) + r() * 60 + ord * 34) * (i > 9 && i < 24 ? 1.45 : 1) * (i === 0 ? (new Date().getHours() + 1) / 24 : 1));
      var cart = Math.round(ses * (0.075 + r() * .03)), chk = Math.max(ord, Math.round(cart * (0.42 + r() * .1)));
      S.traffic[d0] = [ses, Math.max(cart, chk), chk]; }

    /* outbox, audit: generated from what happened in the last week */
    S.orders.forEach(function (o) { o.tl.forEach(function (e) { if (now - e.t < 6 * DAY && e.by !== 'System' && e.by !== 'Customer') S.audit.push({ t: e.t, who: e.by, a: auditVerb(e.k), o: o.id, d: e.m }); }); });
    [[1.1, 'Ananya Rao', 'Edited product', 'Rib Knit', 'Description updated for the winter drop'], [2.4, 'Ananya Rao', 'Created discount', 'WINTER12', '12% off over ₹5,000, starts in 5 days'], [3.2, 'Kabir Sethi', 'Received stock', S.po[4].id, '35 units from Rajkot eyewear workshop'], [4.6, 'Ananya Rao', 'Edited template', 'Order shipped · WhatsApp', 'Shorter message, added the tracking link'], [5.3, 'Kabir Sethi', 'Adjusted stock', 'HBJ-RUS-M', '−1 · Damaged · Zip pull came off in QC']].forEach(function (a) {
      S.audit.push({ t: now - a[0] * DAY, who: a[1], a: a[2], o: a[3], d: a[4] }); });
    S.audit.sort(function (a, b) { return b.t - a.t; });
    S.orders.slice(0, 26).forEach(function (o) { var c2 = custByEmail(S, o.email); outboxFor(S, 'placed', o, c2, o.t + 40 * 1000); (o.ships || []).forEach(function (sh) { if (sh.ev.shipped) outboxFor(S, 'shipped', o, c2, sh.ev.shipped + 2 * MIN, sh); if (sh.ev.delivered) outboxFor(S, 'delivered', o, c2, sh.ev.delivered + 3 * MIN, sh); }); });
    S.outbox.sort(function (a, b) { return b.t - a.t; }); S.outbox = S.outbox.slice(0, 120);
    S.cust.forEach(function (c) { delete c.prof; delete c.n1; }); delete S.force;
    var vipNote = ['Prefers neutral colours; ask before substituting.', 'Styled the Harbor Jacket for a friend’s wedding. Loves the brand.', 'Asked to be told first when the Navy jacket is back.'];
    custByEmail(S, meera.email).notes = [{ t: now - 40 * DAY, m: 'Long-time customer since the first pop-up in Bandra. Always buys the first drop of the season.', by: 'Ananya Rao' }, { t: now - 8 * DAY, m: vipNote[2], by: 'Kabir Sethi' }];
    custByEmail(S, meera.email).tags = ['Pop-up regular'];
    S.cust.filter(function (c) { return c.id !== meera.id; }).slice(0, 12).forEach(function (c, ix) { if (ix % 3 === 0) c.notes.push({ t: now - (5 + ix * 3) * DAY, m: pick(r, NOTES), by: ix % 2 ? 'Kabir Sethi' : 'Ananya Rao' }); });
    S.demo = { email: meera.email, order: S.orders.filter(function (o) { return o.demo; })[0].id };
    S.orders.forEach(function (o) { delete o.demo; });
    return S;
  }
  function auditVerb(k) { return { fulfil: 'Fulfilled order', ship: 'Marked shipped', note: 'Added note', refund: 'Refunded', return: 'Updated return', cancel: 'Cancelled order', deliver: 'Marked delivered', out: 'Marked out for delivery' }[k] || 'Updated order'; }

  function mkOrder(S, byId, r, c, t, num, DC, fixed) {
    var now = Date.now(), items = [], i;
    if (fixed) items = fixed.items.map(function (a) { var p = byId[a[0]]; return { pid: p.id, name: p.name, c: a[1], col: p.colors[a[1]].n, s: a[2], q: a[3], price: p.price }; });
    else {
      var n = 1 + (r() < .42) + (r() < .14), pool = Object.keys(POP).map(function (id) { return [id, POP[id]]; });
      while (n-- > 0) { var id = wpick(r, pool); pool = pool.filter(function (x) { return x[0] !== id; }); var p = byId[id];
        var ci = r() < .62 ? 0 : 1 + Math.floor(r() * (p.colors.length - 1)), sz = wpick(r, p.sizes.map(function (s) { return [s, SIZEW[s] || 1]; }));
        items.push({ pid: p.id, name: p.name, c: ci, col: p.colors[ci].n, s: sz, q: (r() < .12 && p.price < 4000) ? 2 : 1, price: p.price }); }
    }
    var addr = clone(c.addrs[0]); addr.phone = c.phone; delete addr.id; delete addr.def;
    var zone = (CITY[addr.city] || ['', 'C', 'tier'])[2];
    var ch = fixed ? 'Online store' : wpick(r, CH), sub = items.reduce(function (a, it) { return a + it.price * it.q; }, 0);
    var m = fixed ? fixed.m : (zone === 'local' && r() < .5 ? 'same' : r() < .27 ? 'exp' : 'std');
    if (ch === 'Pop-up store') m = 'pickup';
    var code = fixed ? fixed.code : null;
    if (!fixed && r() < .24) { var ageD = (now - t) / DAY;
      var cands = ['NORTHLANE500', 'FREESHIP', 'WELCOME10', 'STUDIO20'].filter(function (cd) { var d = DC[cd]; return t >= d.starts && (!d.ends || t <= d.ends) && sub >= d.min && (!d.limit || d.used < d.limit) && !(d.first && c.n1 > 1); });
      if (ageD > 9 && ageD < 24 && sub >= 6000) cands.push('FESTIVE15', 'FESTIVE15');
      if (cands.length) code = pick(r, cands); }
    var disc = 0, freeShip = false;
    if (code) { var d = DC[code]; if (d.type === 'pct') disc = Math.round(sub * d.value / 100); else if (d.type === 'amt') disc = d.value; else freeShip = true; d.used++; d.by.push(c.email); }
    var setg = S.set, shipFee = m === 'pickup' ? 0 : freeShip ? 0 : m === 'exp' ? setg.expFee : m === 'same' ? setg.sameFee : (sub - disc >= setg.freeShip ? 0 : setg.stdFee);
    var pm = fixed ? fixed.pay : (ch === 'Pop-up store' ? (r() < .6 ? 'UPI' : 'Card') : wpick(r, PAY));
    if (pm === 'COD' && sub > setg.codMax) pm = 'UPI';
    var ageH0 = (now - t) / H;
    if (!fixed && ageH0 < 4 && ageH0 > 2 && S.force.pending > 0) pm = 'UPI';
    if (!fixed && ageH0 < 70 && ageH0 > 6 && S.force.cod > 0 && sub <= setg.codMax && ch !== 'Pop-up store') { pm = 'COD'; S.force.cod--; }
    var codFee = pm === 'COD' ? setg.codFee : 0, gift = (!fixed && r() < .08) ? { note: pick(r, ['Happy birthday, Tara! Wear it often.', 'For the cold Delhi mornings. Love, Ma', 'Congratulations on the new job!', 'Something soft for the long flight.']), wrap: true, fee: setg.giftWrap } : null;
    var total = sub - disc + shipFee + codFee + (gift ? gift.fee : 0);
    var first = c.name.split(' ')[0];
    var payD = pm === 'UPI' ? first.toLowerCase() + '@upi' : pm === 'Card' ? pick(r, CARDS) : pm === 'COD' ? 'Cash on delivery' : 'Net banking';
    var o = { id: 'NL-' + num, num: num, t: t, cid: c.id, email: c.email, name: c.name, addr: addr, items: items, ch: ch, m: m, sub: sub, disc: code ? { code: code, amt: disc } : null, shipFee: shipFee, codFee: codFee, gift: gift, total: total,
      pay: { m: pm, d: payD, st: pm === 'COD' ? 'cod' : 'paid', amt: pm === 'COD' ? 0 : total, at: t }, ships: [], refunds: [], rets: [], tl: [], tags: [], note: '', cancelled: false, demo: fixed && fixed.demo };
    tlPush(o, t, 'placed', 'Order placed on ' + ch + (gift ? ' · gift wrapped with a note' : ''), 'Customer');
    if (code) tlPush(o, t + 1000, 'disc', 'Discount ' + code + ' applied: ' + (disc ? '−' + money(disc) : 'free shipping'), 'System');
    tlPush(o, t + 4000, 'pay', pm === 'COD' ? 'Cash on delivery: ' + money(total) + ' to collect' : 'Payment of ' + money(total) + ' captured · ' + payD, 'System');
    tlPush(o, t + 40000, 'notify', 'Order confirmation sent by email and WhatsApp', 'System');

    // progress the order according to its age
    var ageH = (now - t) / H, staff = r() < .6 ? 'Kabir Sethi' : 'Ananya Rao';
    var target = fixed ? fixed.st : (m === 'pickup' ? 'delivered' : ageH < 5 ? 'placed' : ageH < 15 ? (r() < .5 ? 'packed' : 'placed') : ageH < 30 ? (r() < .7 ? 'shipped' : 'packed') : null);
    if (!fixed && !target) {
      var tr = TRANSIT[m === 'exp' ? 'exp' : 'std'][zone] || [3, 5], need = (m === 'same' ? 12 : 24 + tr[1] * 24);
      target = ageH > need ? 'delivered' : ageH > need - 14 ? 'out' : 'shipped';
    }
    if (!fixed && r() < .035 && ageH > 4) target = 'cancel';
    if (target === 'cancel') {
      var ct = t + (1 + r() * 5) * H; o.cancelled = true; o.cancelledAt = ct; o.cancelReason = pick(r, ['Customer changed their mind', 'Ordered the wrong size, placed a new order', 'Payment flagged as risky']);
      o.items.forEach(function (it) { it.cq = it.q; });
      tlPush(o, ct, 'cancel', 'Order cancelled: ' + o.cancelReason, staff);
      if (o.pay.st === 'paid') { o.refunds.push({ id: 'RF-' + (++S.seq.ref), t: ct + 6 * MIN, amt: o.total, reason: 'Order cancelled', lines: [], by: staff, method: 'Original payment' }); tlPush(o, ct + 6 * MIN, 'refund', 'Refunded ' + money(o.total) + ' to ' + o.pay.d, staff); }
      else o.pay.st = 'voided';
      return o;
    }
    if (target === 'placed') {
      if (!fixed && ageH < 3 && pm === 'UPI' && (S.force.pending-- > 0 || r() < .2)) { o.pay.st = 'pending'; o.pay.amt = 0; o.tl[o.tl.length - 2].m = 'Waiting for UPI approval · ' + payD; }
      return o;
    }
    // partial shipment: a two-line order where one line ships later
    var hold = !fixed && items.length > 1 && ageH > 20 && ageH < 110 && S.force.partial > 0 && target !== 'packed';
    if (hold) S.force.partial--;
    var split = hold || (!fixed && items.length > 1 && r() < .1 && target !== 'packed');
    var groups = split ? [items.map(function (_, ix) { return ix; }).slice(0, -1), [items.length - 1]] : [items.map(function (_, ix) { return ix; })];
    groups.forEach(function (g, gi) {
      if (hold && gi === 1) { var bi = items[g[0]]; tlPush(o, t + 3 * H, 'note', bi.name + ' in ' + bi.col + (bi.s !== 'One size' ? ', ' + bi.s : '') + ' was short on the shelf. Shipping the rest now; this follows when the next delivery lands.', staff); return; }
      var packed = t + (m === 'pickup' ? 5 * MIN : m === 'same' ? 1.2 * H : (2 + r() * 14) * H) + gi * (30 + r() * 30) * H;
      if (packed > now - 20 * MIN) packed = now - (20 + r() * 40) * MIN;
      var sh = { id: 'S' + (gi + 1), lines: g.map(function (ix) { return { i: ix, q: items[ix].q }; }), carrier: m === 'pickup' ? 'Handed over at the pop-up' : CARRIER[m === 'exp' ? 'exp' : m === 'same' ? 'same' : 'std'].name, awb: '', stage: 'packed', ev: { packed: packed }, by: staff, rider: pick(r, RIDERS) };
      o.ships.push(sh);
      tlPush(o, packed, 'fulfil', 'Packed ' + plural(sh.lines.reduce(function (a, l) { return a + l.q; }, 0), 'item') + (groups.length > 1 ? ' · shipment ' + (gi + 1) + ' of ' + groups.length : ''), staff);
      if (m === 'pickup') { sh.stage = 'delivered'; sh.ev.shipped = sh.ev.out = sh.ev.delivered = packed + 2 * MIN; tlPush(o, packed + 2 * MIN, 'deliver', 'Collected by the customer at the Bandra pop-up', staff); return; }
      var tgt = gi === 0 || target === 'delivered' ? target : (target === 'out' ? 'shipped' : target);
      if (fixed && gi === 0) tgt = fixed.st;
      if (tgt === 'packed') return;
      var tr2 = TRANSIT[m === 'exp' ? 'exp' : 'std'][zone] || [3, 5], shipped = packed + (1 + r() * 5) * H; if (shipped > now - 10 * MIN) shipped = now - 12 * MIN;
      sh.awb = mkAwb(m, r); sh.stage = 'shipped'; sh.ev.shipped = shipped; sh.eta = m === 'same' ? shipped + 6 * H : addBiz(shipped, tr2[1]) + 14 * H;
      tlPush(o, shipped, 'ship', 'Handed to ' + sh.carrier + ' · AWB ' + sh.awb, staff);
      tlPush(o, shipped + 2 * MIN, 'notify', 'Shipping update sent by email and WhatsApp', 'System');
      if (tgt === 'shipped') return;
      var out = Math.min(now - (fixed ? 3.4 : .5 + r() * 2) * H, m === 'same' ? shipped + 3 * H : shipped + (tr2[0] * 24 - 10 + r() * 20) * H);
      if (fixed && tgt === 'out') { var o9 = new Date(now); o9.setHours(Math.max(8, o9.getHours() - 3), 12, 0, 0); out = Math.min(o9.getTime(), now - 2 * H); sh.eta = dayStart(now) + 20 * H; }
      if (out < shipped + 2 * H) out = shipped + 2 * H; if (out > now) out = now - 25 * MIN;
      sh.stage = 'out'; sh.ev.out = out; tlPush(o, out, 'out', 'Out for delivery in ' + o.addr.city + ' with ' + sh.rider, 'System');
      if (tgt === 'out') return;
      var del = Math.min(out + (1 + r() * 6) * H, now - 10 * MIN); sh.stage = 'delivered'; sh.ev.delivered = del;
      tlPush(o, del, 'deliver', 'Delivered · received by ' + (r() < .7 ? first : 'building security'), 'System');
      if (pm === 'COD' && gi === groups.length - 1) { o.pay.st = 'paid'; o.pay.amt = o.total; o.pay.at = del; tlPush(o, del + MIN, 'pay', 'Cash of ' + money(o.total) + ' collected by ' + sh.carrier, 'System'); }
    });
    // returns and refunds on delivered orders
    var allDel = o.ships.length && o.ships.every(function (s) { return s.stage === 'delivered'; });
    var dAge = allDel ? (now - o.ships[0].ev.delivered) / DAY : 0, forced = !fixed && allDel && m !== 'pickup' && dAge > 2 && dAge < 11 && S.force.ret > 0;
    if (forced) S.force.ret--;
    var retMode = fixed ? fixed.ret : forced ? ['received', 'requested', 'approved'][S.force.ret] : (allDel && m !== 'pickup' && r() < .1 ? 'auto' : null);
    if (retMode && allDel) {
      var dl = o.ships[0].ev.delivered, ix2 = fixed ? 0 : Math.floor(r() * items.length), it2 = items[ix2], rAge = (now - dl) / DAY;
      var st = retMode !== 'auto' ? retMode : rAge > 14 ? 'refunded' : rAge > 9 ? 'received' : rAge > 5 ? 'approved' : 'requested';
      var reason = fixed ? (retMode === 'requested' ? 'Too big' : 'Too small') : pick(r, RETR);
      var rq = dl + (1 + r() * 3) * DAY; if (rq > now) rq = now - 3 * H;
      var rt = { id: '', t: rq, lines: [{ i: ix2, q: 1, reason: reason }], st: st, ev: { requested: rq }, method: r() < .7 ? 'original' : 'credit', note: reason === 'Too small' || reason === 'Too big' ? 'Would like to exchange for another size if possible.' : '', by: 'customer', restock: reason !== 'Arrived damaged' };
      tlPush(o, rq, 'return', 'Return requested for ' + it2.name + ' (' + reason.toLowerCase() + ')', 'Customer');
      if (st !== 'requested') { rt.ev.approved = rq + (3 + r() * 10) * H; rt.awb = 'RV' + mkAwb('std', r).slice(2); tlPush(o, rt.ev.approved, 'return', 'Return approved · pickup booked with Parcelwise (' + rt.awb + ')', 'Ananya Rao'); }
      if (st === 'received' || st === 'refunded') { rt.ev.received = rt.ev.approved + (2 + r() * 2) * DAY; it2.rq = 1; tlPush(o, rt.ev.received, 'return', 'Return received and inspected · ' + (rt.restock ? 'restocked' : 'not restockable'), 'Kabir Sethi'); }
      if (st === 'refunded') { var amt = unitNet(o, ix2); rt.ev.refunded = rt.ev.received + 3 * H; o.refunds.push({ id: 'RF-' + (++S.seq.ref), t: rt.ev.refunded, amt: amt, reason: 'Return: ' + reason, lines: [{ i: ix2, q: 1 }], by: 'Ananya Rao', method: rt.method === 'credit' ? 'Store credit' : 'Original payment' });
        tlPush(o, rt.ev.refunded, 'refund', 'Refunded ' + money(amt) + (rt.method === 'credit' ? ' as store credit' : ' to ' + o.pay.d), 'Ananya Rao'); }
      if (rt.ev.approved > now) rt.ev.approved = now - H;
      o.rets.push(rt);
    } else if (!fixed && allDel && r() < .025) {
      var pa = Math.round(items[0].price * .1); o.refunds.push({ id: 'RF-' + (++S.seq.ref), t: o.ships[0].ev.delivered + 2 * DAY, amt: pa, reason: 'Goodwill: parcel arrived two days late', lines: [], by: 'Ananya Rao', method: 'Original payment' });
      tlPush(o, o.ships[0].ev.delivered + 2 * DAY, 'refund', 'Partial refund of ' + money(pa) + ' · goodwill, parcel arrived late', 'Ananya Rao');
    }
    if (!fixed && r() < .06) tlPush(o, t + 2 * H, 'note', pick(r, NOTES), staff);
    if (now - t > 21 * DAY) o.tl = o.tl.filter(function (e) { return e.k !== 'notify'; });
    o.tl.sort(function (a, b) { return a.t - b.t; });
    return o;
  }
  function mkAwb(m, r) { var n = ''; for (var i = 0; i < 9; i++) n += Math.floor((r || Math.random)() * 10); return (m === 'exp' ? 'AP' : m === 'same' ? 'SL' : 'PW') + n; }

  /* ───────── reviews ───────── */
  var RV = {
    Clothing: [['Lives on me now', 'Heavier than I expected in the best way. Washed it four times and it still looks new.'], ['Worth the wait', 'The cut is relaxed without being sloppy. I get asked where it’s from every time I wear it.'], ['Beautiful colour', 'The colour is richer in person. Ordered my usual size and it fits exactly as described.'], ['Soft from day one', 'No break-in, no itch. I wore it straight out of the box to a dinner in Bandra.'], ['Runs a touch large', 'Lovely fabric but I should have sized down. Exchange was painless though.'], ['Quietly perfect', 'This is what I wanted from a basic: good weight, clean neckline, no logo anywhere.'], ['Better than the photos', 'The stitching is very neat and the fabric drapes well. Will buy the second colour.'], ['Good, not great', 'Nice quality but the sleeves are long for me. I’m 5′3″ and had them taken up.']],
    Shoes: [['Broke in within a week', 'Stiff for the first two days, then moulded to my feet. Comfortable for a full day of walking.'], ['Take a size down', 'They run half a size big, as the page says. Swapped to 42 and they’re perfect.'], ['Gets better with age', 'The suede has softened and darkened slightly. Exactly what I hoped for.'], ['My everyday pair', 'Worn through a Pune monsoon week with spray on them. Still look great.'], ['Elegant and light', 'Much lighter than they look. Easy to dress up for the office.']],
    Bags: [['The leather is wonderful', 'It smells like a proper workshop and it’s already softening. Fits my 14″ laptop with room to spare.'], ['Everyday bag sorted', 'Strap length is perfect across the body. Phone, keys, cardholder and sunglasses fit.'], ['Built to last', 'Hand stitching is neat and even. You can tell it was made by people who care.'], ['Slightly smaller than expected', 'Lovely bag, but check the dimensions. It’s compact. I still kept it.'], ['A gift that landed', 'Bought for my mother. The packaging and the handwritten card made her day.']],
    Accessories: [['Simple and well made', 'Exactly the understated piece I was looking for. Feels solid in the hand.'], ['Daily wear', 'I wear it every day. No fading, no wobble, and it goes with everything.'], ['Great value', 'Feels far more expensive than it is. The case it comes in is lovely too.'], ['Nice, a bit snug', 'Fits well but sits a little tight for a bigger head. Adjustable strap helps.'], ['Exactly as pictured', 'The finish is beautiful and the colour is true to the photos.']]
  };
  var RVPH = ['photos/strip-1.jpg', 'photos/strip-2.jpg', 'photos/strip-3.jpg', 'photos/strip-4.jpg', 'photos/look-1.jpg', 'photos/look-3.jpg', 'photos/look-4.jpg', 'photos/look-5.jpg', 'photos/journal-1.jpg', 'photos/journal-2.jpg'];
  function reviewSeed(P, cust, r, now) {
    var out = {}, ix = 0;
    P.forEach(function (p, pi) {
      var n = 7 + Math.floor(r() * 9), list = [], pool = RV[p.cat] || RV.Clothing;
      for (var i = 0; i < n; i++) { var c = cust[(pi * 17 + i * 5 + 3) % cust.length], tx = pool[(i + pi) % pool.length], rating = wpick(r, [[5, 62], [4, 26], [3, 8], [2, 3], [1, 1]]);
        if (/Good, not great|smaller than expected|a bit snug|Runs a touch/.test(tx[0])) rating = Math.min(rating, 4);
        var fit = /size down|Runs a touch|run half|large/.test(tx[1]) ? 1 : /snug|small/.test(tx[1]) ? -1 : 0;
        list.push({ id: 'R' + (++ix), name: c.name.split(' ')[0] + ' ' + c.name.split(' ')[1][0] + '.', city: c.city, rating: rating, title: tx[0], body: tx[1], fit: fit, size: p.sizes[Math.min(p.sizes.length - 1, Math.floor(r() * p.sizes.length))], col: p.colors[r() < .7 ? 0 : 1].n,
          t: now - (3 + r() * 110) * DAY, photos: r() < .22 ? [RVPH[(ix * 3) % RVPH.length]] : [], verified: r() < .9, helpful: Math.floor(r() * 18) }); }
      list.sort(function (a, b) { return b.t - a.t; }); out[p.id] = list;
    });
    return out;
  }
  function reviews(pid) { return (db().reviews[pid] || []).slice(); }
  function reviewStats(pid) {
    var L = db().reviews[pid] || [], dist = [0, 0, 0, 0, 0], fit = [0, 0, 0], s = 0;
    L.forEach(function (x) { dist[x.rating - 1]++; s += x.rating; fit[x.fit + 1]++; });
    return { n: L.length, avg: L.length ? s / L.length : 0, dist: dist, fit: fit, photos: L.filter(function (x) { return x.photos.length; }).length };
  }
  function addReview(pid, rv) { var D = db(); rv.id = 'R' + Date.now().toString(36); rv.t = Date.now(); rv.helpful = 0; rv.verified = !!rv.verified; rv.photos = rv.photos || []; (D.reviews[pid] = D.reviews[pid] || []).unshift(rv); save('reviews'); return rv; }

  /* ───────── notifications ───────── */
  function tplSeed() {
    return {
      placed: { label: 'Order placed', email: { on: true, subject: 'Thank you, {{first_name}}. Order {{order}} is confirmed', body: 'Hi {{first_name}},\n\nThank you for your order. We’re packing it by hand at our Jaipur studio and will write again the moment it ships.\n\n{{items}}\n\nTotal paid: {{total}}\nArriving: {{eta}}\n\nTrack it any time: {{tracking_link}}\n\nWith care,\nNorthlane' },
        wa: { on: true, body: 'Hi {{first_name}}, thank you for shopping with Northlane. Order {{order}} ({{total}}) is confirmed and should reach you {{eta}}. Track it here: {{tracking_link}}' } },
      shipped: { label: 'Order shipped', email: { on: true, subject: 'It’s on its way: order {{order}}', body: 'Hi {{first_name}},\n\nGood news: your parcel left our studio today with {{carrier}}.\n\nTracking number: {{awb}}\nExpected: {{eta}}\n\nFollow it here: {{tracking_link}}\n\nNorthlane' },
        wa: { on: true, body: '📦 {{first_name}}, your Northlane order {{order}} has shipped with {{carrier}} (AWB {{awb}}). Expected {{eta}}. Track: {{tracking_link}}' } },
      out: { label: 'Out for delivery', email: { on: false, subject: 'Arriving today: order {{order}}', body: 'Hi {{first_name}},\n\nYour parcel is out for delivery today with {{rider}}. Please keep your phone handy.\n\n{{tracking_link}}\n\nNorthlane' },
        wa: { on: true, body: '{{first_name}}, your Northlane parcel is out for delivery today with {{rider}}. Track live: {{tracking_link}}' } },
      delivered: { label: 'Delivered', email: { on: true, subject: 'Delivered. We hope you love it.', body: 'Hi {{first_name}},\n\nYour order {{order}} was delivered. If anything isn’t right, you have 30 days to return it from your account.\n\nAnd if you have a minute, a review helps a small studio more than you’d think.\n\nNorthlane' },
        wa: { on: false, body: 'Delivered! {{first_name}}, we hope you love your Northlane order {{order}}. Returns are easy for 30 days from your account.' } },
      refund: { label: 'Refund issued', email: { on: true, subject: 'Your refund of {{refund_amount}} is on its way', body: 'Hi {{first_name}},\n\nWe’ve refunded {{refund_amount}} for order {{order}} to {{refund_method}}. Banks usually take 3 to 5 working days to show it.\n\nNorthlane' },
        wa: { on: true, body: '{{first_name}}, we’ve refunded {{refund_amount}} for order {{order}} to {{refund_method}}. It usually shows in 3 to 5 working days.' } },
      return: { label: 'Return approved', email: { on: true, subject: 'Your return {{rma}} is approved', body: 'Hi {{first_name}},\n\nYour return is approved. A Parcelwise rider will collect it on {{pickup}}. Please keep the item in its original packaging.\n\nNorthlane' },
        wa: { on: true, body: '{{first_name}}, your Northlane return {{rma}} is approved. Pickup on {{pickup}}. Keep it packed and ready.' } }
    };
  }
  var VARS = ['first_name', 'order', 'total', 'items', 'eta', 'carrier', 'awb', 'rider', 'tracking_link', 'refund_amount', 'refund_method', 'rma', 'pickup'];
  function vars(o, x) {
    x = x || {}; var sh = x.ship || (o && o.ships && o.ships[o.ships.length - 1]) || {};
    return { first_name: o ? o.name.split(' ')[0] : 'Meera', order: o ? o.id : 'NL-10482', total: o ? money(o.total) : money(8400),
      items: o ? o.items.map(function (it) { return '· ' + it.name + ', ' + it.col + (it.s !== 'One size' ? ', ' + it.s : '') + ' × ' + it.q; }).join('\n') : '· Harbor Jacket, Rust, M × 1',
      eta: o ? etaText(o) : 'Thu, 26 Nov', carrier: sh.carrier || 'Parcelwise', awb: sh.awb || 'PW480219337', rider: sh.rider || 'Sandeep', tracking_link: 'nrthln.in/t/' + (o ? o.id : 'NL-10482'),
      refund_amount: x.amt != null ? money(x.amt) : money(1590), refund_method: x.method || (o ? o.pay.d : 'your UPI account'), rma: x.rma || 'RMA-1043', pickup: x.pickup ? fD(x.pickup) : fD(addBiz(Date.now(), 1)) };
  }
  function fill(str, v) { return String(str).replace(/\{\{(\w+)\}\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  function outboxFor(S, ev, o, c, t, sh, x) {
    var T = S.tpl[ev]; if (!T) return 0; var v = vars(o, Object.assign({ ship: sh }, x || {})), n = 0;
    if (T.email.on) { S.outbox.push({ id: 'M' + Math.random().toString(36).slice(2, 8), t: t, ev: ev, ch: 'email', to: o.email, oid: o.id, subject: fill(T.email.subject, v), body: fill(T.email.body, v) }); n++; }
    if (T.wa.on) { S.outbox.push({ id: 'M' + Math.random().toString(36).slice(2, 8), t: t + 1000, ev: ev, ch: 'wa', to: maskPhone(o.addr.phone), oid: o.id, body: fill(T.wa.body, v) }); n++; }
    return n;
  }
  function notify(ev, o, x) {
    var S = db(), before = S.outbox.length; var n = outboxFor(S, ev, o, null, Date.now(), x && x.ship, x);
    S.outbox.sort(function (a, b) { return b.t - a.t; }); S.outbox = S.outbox.slice(0, 160);
    var T = S.tpl[ev]; if (n && T) { var chs = [T.email.on && 'email', T.wa.on && 'WhatsApp'].filter(Boolean).join(' and '); tlPush(o, Date.now(), 'notify', T.label + ' message sent by ' + chs, 'System'); }
    return n;
  }

  /* ───────── derived order state ───────── */
  function qty(o) { return o.items.reduce(function (a, it) { return a + it.q; }, 0); }
  function liveQty(o) { return o.items.reduce(function (a, it) { return a + it.q - (it.cq || 0); }, 0); }
  function shippedQ(o, i) { return (o.ships || []).reduce(function (a, s) { return a + s.lines.filter(function (l) { return l.i === i; }).reduce(function (b, l) { return b + l.q; }, 0); }, 0); }
  function remaining(o, i) { var it = o.items[i]; return Math.max(0, it.q - (it.cq || 0) - shippedQ(o, i)); }
  function fulfilment(o) {
    if (o.cancelled) return 'cancelled';
    var rem = 0, sh = 0; o.items.forEach(function (it, i) { rem += remaining(o, i); sh += shippedQ(o, i); });
    return rem === 0 ? 'fulfilled' : sh > 0 ? 'partial' : 'unfulfilled';
  }
  var STG = ['placed', 'packed', 'shipped', 'out', 'delivered'];
  var STGL = { placed: 'Placed', packed: 'Packed', shipped: 'In transit', out: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
  function stage(o) { // overall delivery stage: the slowest shipment, or "placed" while anything is left to pack
    if (o.cancelled) return 'cancelled';
    if (!o.ships.length) return 'placed';
    var min = Math.min.apply(null, o.ships.map(function (s) { return STG.indexOf(s.stage); }));
    return fulfilment(o) === 'partial' ? (min >= 2 ? 'shipped' : 'packed') : STG[min];
  }
  function refunded(o) { return o.refunds.reduce(function (a, x) { return a + x.amt; }, 0); }
  function payStatus(o) {
    if (o.pay.st === 'pending') return 'pending'; if (o.pay.st === 'voided') return 'voided'; if (o.pay.st === 'cod') return 'cod';
    var r = refunded(o); if (r >= o.pay.amt - .5 && r > 0) return 'refunded'; if (r > 0) return 'partial_refund'; return 'paid';
  }
  var PAYL = { paid: 'Paid', pending: 'Payment pending', cod: 'COD to collect', refunded: 'Refunded', partial_refund: 'Partially refunded', voided: 'Voided' };
  function refundable(o) { return Math.max(0, (o.pay.amt || 0) - refunded(o)); }
  function unitNet(o, i) { var it = o.items[i], share = o.disc && o.disc.amt ? 1 - o.disc.amt / o.sub : 1; return Math.round(it.price * share); }
  function openReturn(o) { return (o.rets || []).filter(function (x) { return ['requested', 'approved', 'received'].indexOf(x.st) >= 0; })[0] || null; }
  function etaText(o) {
    if (o.cancelled) return 'Cancelled';
    var d = o.ships.filter(function (s) { return s.stage === 'delivered'; });
    if (stage(o) === 'delivered') return 'Delivered ' + fD(d[d.length - 1].ev.delivered);
    var live = o.ships.filter(function (s) { return s.stage !== 'delivered' && s.eta; })[0];
    if (live && live.stage === 'out') return 'Today, by 9 pm';
    if (live) return fD(live.eta);
    if (o.eta && o.eta.from) return winText(o.eta);
    if (o.m === 'pickup') return 'Ready to collect';
    var z = (pin(o.addr.pin) || {}).zone || 'tier', tr = TRANSIT[o.m === 'exp' ? 'exp' : 'std'][z] || [3, 5];
    if (o.m === 'same') return new Date(o.t).getHours() < 14 ? 'Today by 9 pm' : 'Tomorrow by 9 pm';
    return fD(addBiz(o.t, tr[0] + 1)) + ' – ' + fD(addBiz(o.t, tr[1] + 1));
  }
  /* carrier scans for one shipment: what happened (done) and what's planned, with coordinates for the map */
  function geo(city) { var C = CITY[city]; return C ? { lat: C[3], lon: C[4], region: C[1] } : null; }
  function scans(o, sh) {
    var g = geo(o.addr.city) || (function () { var p = pin(o.addr.pin); return { lat: 22, lon: 79, region: p.region || 'C' }; })();
    var hub = HUB[g.region] || HUB.C, local = o.addr.city === 'Jaipur', now = Date.now(), E = [], s0 = sh.ev, city = o.addr.city;
    var shipped = s0.shipped || (s0.packed + 3 * H), end = s0.delivered || (s0.out ? s0.out + 3 * H : sh.eta || addBiz(shipped, 4) + 14 * H);
    if (!s0.delivered && s0.out) end = Math.max(end, now + 50 * MIN);
    var outT = s0.out || end - 4 * H, span = Math.max(4 * H, outT - shipped);
    function add(k, t, place, msg, lat, lon) { E.push({ k: k, t: t, place: place, msg: msg, lat: lat, lon: lon }); }
    add('packed', s0.packed, ORIGIN.short, 'Packed by hand at the Northlane studio', ORIGIN.lat, ORIGIN.lon);
    add('pickup', shipped, ORIGIN.short, 'Collected by ' + sh.carrier, ORIGIN.lat, ORIGIN.lon);
    if (!local) {
      add('origin', shipped + span * .08, 'Jaipur facility', 'Arrived at the ' + sh.carrier.split(' ')[0] + ' facility, Bagru', 26.81, 75.55);
      add('depart', shipped + span * .16, 'Jaipur facility', 'Departed Jaipur on a linehaul truck', 26.81, 75.55);
      if (hub.short !== 'Gurugram' || g.region === 'N') add('hub', shipped + span * .5, hub.short, 'Arrived at the ' + hub.name, hub.lat, hub.lon);
      add('hubdep', shipped + span * .6, hub.short, 'Sorted and dispatched towards ' + city, hub.lat, hub.lon);
      add('dest', shipped + span * .86, city, 'Arrived at the ' + city + ' delivery centre', g.lat + .05, g.lon - .04);
    }
    add('out', outT, city, 'Out for delivery with ' + sh.rider, g.lat + .05, g.lon - .04);
    var loc = o.addr.l2.split(',').pop().trim() || city; add('delivered', end, city, s0.delivered ? 'Delivered to ' + loc : 'Due at the door in ' + loc + ' by 9 pm', g.lat, g.lon);
    var stI = STG.indexOf(sh.stage);
    E.forEach(function (e) {
      e.done = e.k === 'packed' ? stI >= 1 : e.k === 'out' ? stI >= 3 : e.k === 'delivered' ? stI >= 4 : e.k === 'pickup' ? stI >= 2 : stI >= 3 || (stI === 2 && e.t <= now);
      if (stI === 2 && e.t > now) e.done = false;
    });
    return E;
  }

  /* ───────── inventory ───────── */
  function committedMap(S) { var m = {}; S.orders.forEach(function (o) { if (o.cancelled) return; o.items.forEach(function (it, i) { var r2 = Math.max(0, it.q - (it.cq || 0) - shippedQ(o, i)); if (r2) { var k = skuKey(it.pid, it.c, it.s); m[k] = (m[k] || 0) + r2; } }); }); return m; }
  var cmCache = null, cmStamp = 0;
  function committed(key) { var D = db(); if (!cmCache || cmStamp !== D._stamp) { cmCache = committedMap(D); cmStamp = D._stamp; } return cmCache[key] || 0; }
  function incoming(key) { var n = 0, eta = 0, po = ''; db().po.forEach(function (p) { if (p.st === 'received') return; p.lines.forEach(function (l) { if (l.sku === key && l.q > l.rcv) { n += l.q - l.rcv; if (!eta || p.eta < eta) { eta = p.eta; po = p.id; } } }); }); return { n: n, eta: eta, po: po }; }
  function stock(key) { var D = db(), v = D.inv[key] || { on: 0, low: 2 }, cm = committed(key), av = Math.max(0, v.on - cm), inc = incoming(key);
    return { key: key, on: v.on, low: v.low, committed: cm, avail: av, state: av <= 0 ? 'out' : av <= v.low ? 'low' : 'in', inc: inc, alerts: D.alerts.filter(function (a) { return a.sku === key && a.st === 'waiting'; }).length }; }
  function variants(p) { var out = []; p.colors.forEach(function (col, ci) { p.sizes.forEach(function (s) { var k = skuKey(p.id, ci, s), st = stock(k); st.c = ci; st.s = s; st.col = col.n; st.code = skuCode(k); out.push(st); }); }); return out; }
  function totalStock(p) { return variants(p).reduce(function (a, v) { return a + v.avail; }, 0); }
  function ledgerAdd(S, sku, d, reason, by, ref) { var v = S.inv[sku] = S.inv[sku] || { on: 0, low: 2 }; v.on = Math.max(0, v.on + d); S.ledger.unshift({ t: Date.now(), sku: sku, d: d, r: reason, by: by || who(), ref: ref || '', after: v.on }); if (S.ledger.length > 500) S.ledger.length = 500; }
  function adjust(sku, d, reason, note, by) { var S = db(), before = stock(sku); ledgerAdd(S, sku, d, reason, by, note); bump(S); log('Adjusted stock', skuCode(sku), (d > 0 ? '+' : '−') + Math.abs(d) + ' · ' + reason + (note ? ' · ' + note : ''), by);
    if (before.avail <= 0 && d > 0) releaseAlerts(S, sku); save('inv'); return stock(sku); }
  function setLow(sku, n) { var S = db(); (S.inv[sku] = S.inv[sku] || { on: 0 }).low = Math.max(0, n | 0); bump(S); save('inv'); }
  function releaseAlerts(S, sku) {
    var w = S.alerts.filter(function (a) { return a.sku === sku && a.st === 'waiting'; }); if (!w.length) return 0;
    w.forEach(function (a) { a.st = 'notified'; a.nt = Date.now(); S.outbox.unshift({ id: 'M' + Math.random().toString(36).slice(2, 8), t: Date.now(), ev: 'restock', ch: 'email', to: a.email, oid: '', subject: 'It’s back: ' + skuLabel(sku), body: 'Good news. The ' + skuLabel(sku) + ' you asked about is back in stock at Northlane. We’ve held nothing back, so it may go quickly.\n\nnrthln.in/p/' + skuParse(sku).pid }); });
    log('Back-in-stock alerts sent', skuCode(sku), plural(w.length, 'customer') + ' notified by email', 'System');
    return w.length;
  }
  function receivePO(id, by) {
    var S = db(), p = S.po.filter(function (x) { return x.id === id; })[0]; if (!p || p.st === 'received') return null; var n = 0, alerted = 0;
    p.lines.forEach(function (l) { var q = l.q - l.rcv; if (q > 0) { var was = stock(l.sku).avail; ledgerAdd(S, l.sku, q, 'Received', by, p.id); l.rcv = l.q; n += q; bump(S); if (was <= 0) alerted += releaseAlerts(S, l.sku); } });
    p.st = 'received'; p.eta = Math.min(p.eta, Date.now()); p.at = Date.now(); bump(S);
    log('Received stock', p.id, n + ' units from ' + p.sup + (alerted ? ' · ' + plural(alerted, 'back-in-stock alert') + ' sent' : ''), by); save('inv'); return { n: n, alerted: alerted };
  }
  function createPO(sup, eta, lines, by) { var S = db(), p = { id: 'PO-' + (++S.seq.po), sup: sup, t: Date.now(), eta: eta, st: 'ordered', lines: lines.map(function (l) { return { sku: l.sku, q: l.q, rcv: 0 }; }) }; S.po.unshift(p); log('Created purchase order', p.id, lines.reduce(function (a, l) { return a + l.q; }, 0) + ' units from ' + sup, by); save('inv'); return p; }
  function alertMe(sku, email) { var S = db(); email = String(email).trim().toLowerCase(); if (S.alerts.some(function (a) { return a.sku === sku && a.email === email && a.st === 'waiting'; })) return false; S.alerts.push({ id: 'AL' + Date.now().toString(36), sku: sku, email: email, t: Date.now(), st: 'waiting' }); save('alerts'); return true; }
  function bump(S) { S._stamp = (S._stamp || 0) + 1; }

  /* ───────── discounts ───────── */
  function discStatus(d, now) { now = now || Date.now(); if (!d.active) return 'paused'; if (d.starts && now < d.starts) return 'scheduled'; if (d.ends && now > d.ends) return 'expired'; if (d.limit && d.used >= d.limit) return 'limit'; return 'active'; }
  var DSL = { active: 'Active', paused: 'Paused', scheduled: 'Scheduled', expired: 'Expired', limit: 'Limit reached' };
  function discText(d) { return (d.type === 'pct' ? d.value + '% off' : d.type === 'amt' ? money(d.value) + ' off' : 'Free shipping') + (d.min ? ' over ' + money(d.min) : '') + (d.first ? ', first order only' : ''); }
  function applyCode(code, sub, email) {
    code = String(code || '').trim().toUpperCase(); if (!code) return { ok: false, msg: 'Enter a code.' };
    var S = db(), d = S.disc.filter(function (x) { return x.code === code; })[0];
    if (!d) return { ok: false, msg: 'We don’t recognise “' + code + '”. Check the spelling.' };
    var st = discStatus(d);
    if (st === 'expired') return { ok: false, msg: code + ' ended on ' + fD(d.ends) + '.' };
    if (st === 'scheduled') return { ok: false, msg: code + ' starts on ' + fD(d.starts) + '. Save it for then.' };
    if (st === 'paused') return { ok: false, msg: code + ' isn’t active right now.' };
    if (st === 'limit') return { ok: false, msg: code + ' has been fully redeemed. Sorry.' };
    if (sub < d.min) return { ok: false, msg: 'Add ' + money(d.min - sub) + ' more to use ' + code + ' (minimum spend ' + money(d.min) + ').' };
    email = String(email || '').toLowerCase();
    if (email && d.first && S.orders.some(function (o) { return o.email === email && !o.cancelled; })) return { ok: false, msg: code + ' is for a first order. Welcome back, though.' };
    if (email && d.once && d.by.indexOf(email) >= 0) return { ok: false, msg: 'You’ve already used ' + code + '.' };
    var amt = d.type === 'pct' ? Math.round(sub * d.value / 100) : d.type === 'amt' ? Math.min(d.value, sub) : 0;
    return { ok: true, code: code, amt: amt, ship: d.type === 'ship', d: d, msg: d.type === 'ship' ? 'Free shipping applied.' : code + ' saves you ' + money(amt) + '.' };
  }
  function saveDisc(d, by) { var S = db(), ix = -1; d.code = String(d.code).trim().toUpperCase(); S.disc.forEach(function (x, i) { if (x.code === d.orig || x.code === d.code) ix = i; });
    var isNew = ix < 0; if (isNew) { d.used = 0; d.by = []; d.t = Date.now(); S.disc.unshift(d); } else { var old = S.disc[ix]; d.used = old.used; d.by = old.by; d.t = old.t; S.disc[ix] = d; } delete d.orig;
    log(isNew ? 'Created discount' : 'Edited discount', d.code, discText(d), by); save('disc'); return d; }

  /* ───────── quoting and placing orders (storefront) ───────── */
  function quote(cart, opt) {
    opt = opt || {}; var S = db().set, lines = [], sub = 0;
    cart.forEach(function (c) { var p = product(c.id); if (!p) return; var k = skuKey(p.id, c.c || 0, c.s), st = stock(k), col = p.colors[c.c || 0] || p.colors[0];
      lines.push({ p: p, key: k, c: c.c || 0, s: c.s, q: c.q, col: col.n, price: p.price, line: p.price * c.q, stock: st, short: st.avail < c.q }); sub += p.price * c.q; });
    var dc = opt.code ? applyCode(opt.code, sub, opt.email) : null, disc = dc && dc.ok ? dc.amt : 0;
    var opts = shipOptions(opt.pin ? pin(opt.pin) : null, sub - disc), m = opt.ship || 'std', so = opts.filter(function (x) { return x.id === m; })[0] || opts[0];
    var shipFee = so ? so.fee : 0; if (dc && dc.ok && dc.ship) shipFee = 0;
    var codFee = opt.pay === 'COD' ? S.codFee : 0, giftFee = opt.wrap ? S.giftWrap : 0;
    return { lines: lines, sub: sub, code: dc, disc: disc, shipOpts: opts, ship: so, shipFee: shipFee, codFee: codFee, giftFee: giftFee, total: Math.max(0, sub - disc + shipFee + codFee + giftFee), count: lines.reduce(function (a, l) { return a + l.q; }, 0), codOk: sub - disc <= S.codMax };
  }
  function placeOrder(x) {
    // x: { cart, email, phone, addr:{name,l1,l2,city,state,pin}, ship:'std'|'exp'|'same', code, pay:{m,d}, gift:{note,wrap}, channel, saveAddr }
    var D = db(), q = quote(x.cart, { code: x.code, email: x.email, pin: x.addr.pin, ship: x.ship, pay: x.pay.m, wrap: x.gift && x.gift.wrap });
    if (!q.lines.length) return { ok: false, msg: 'Your bag is empty.' };
    var short = q.lines.filter(function (l) { return l.short; });
    if (short.length) return { ok: false, msg: 'Sorry, ' + short.map(function (l) { return l.p.name + ' in ' + l.col + (l.s !== 'One size' ? ', ' + l.s : '') + ' (' + (l.stock.avail ? 'only ' + l.stock.avail + ' left' : 'just sold out') + ')'; }).join(' and ') + '. Please update your bag.', lines: short };
    var email = String(x.email).trim().toLowerCase(), c = custByEmail(D, email), now = Date.now();
    if (!c) { c = { id: 'C-' + (++D.seq.cust), name: x.addr.name, email: email, phone: x.phone, city: x.addr.city, state: x.addr.state, since: now, addrs: [], tags: [], notes: [], mkt: !!x.mkt, credit: 0 }; D.cust.unshift(c); }
    var A = { name: x.addr.name, l1: x.addr.l1, l2: x.addr.l2, city: x.addr.city, state: x.addr.state, pin: x.addr.pin };
    if (!c.addrs.some(function (a) { return a.pin === A.pin && a.l1 === A.l1; })) c.addrs.push(Object.assign({ id: 'a' + (c.addrs.length + 1) + now.toString(36).slice(-3), def: !c.addrs.length }, A));
    if (x.phone) c.phone = x.phone;
    var num = D.orders.reduce(function (a, o) { return Math.max(a, o.num); }, 10180) + 1;
    var o = { id: 'NL-' + num, num: num, t: now, cid: c.id, email: email, name: x.addr.name, addr: Object.assign({ phone: x.phone }, A), items: q.lines.map(function (l) { return { pid: l.p.id, name: l.p.name, c: l.c, col: l.col, s: l.s, q: l.q, price: l.price }; }),
      ch: x.channel || 'Online store', m: q.ship.id, sub: q.sub, disc: q.code && q.code.ok ? { code: q.code.code, amt: q.disc } : null, shipFee: q.shipFee, codFee: q.codFee, gift: x.gift && (x.gift.note || x.gift.wrap) ? { note: x.gift.note || '', wrap: !!x.gift.wrap, fee: q.giftFee } : null, total: q.total,
      pay: { m: x.pay.m, d: x.pay.d, st: x.pay.m === 'COD' ? 'cod' : 'paid', amt: x.pay.m === 'COD' ? 0 : q.total, at: now }, ships: [], refunds: [], rets: [], tl: [], tags: ['New'], note: '', cancelled: false, eta: { from: q.ship.from, to: q.ship.to } };
    tlPush(o, now, 'placed', 'Order placed on ' + o.ch + (o.gift ? ' · gift' + (o.gift.wrap ? ' wrapped' : '') + (o.gift.note ? ' with a note' : '') : ''), 'Customer');
    if (o.disc) { tlPush(o, now + 1, 'disc', 'Discount ' + o.disc.code + ' applied: ' + (o.disc.amt ? '−' + money(o.disc.amt) : 'free shipping'), 'System'); var d = D.disc.filter(function (z) { return z.code === o.disc.code; })[0]; if (d) { d.used++; d.by.push(email); } }
    tlPush(o, now + 2, 'pay', o.pay.m === 'COD' ? 'Cash on delivery: ' + money(o.total) + ' to collect' : 'Payment of ' + money(o.total) + ' captured · ' + o.pay.d, 'System');
    D.orders.unshift(o); bump(D); track('paid');
    notify('placed', o);
    log('New order', o.id, money(o.total) + ' from ' + o.name + ' on ' + o.ch, 'Customer');
    save('orders'); return { ok: true, order: o };
  }
  function findOrder(num, email) {
    var v = String(num || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), m = v.match(/^(?:NL)?(\d{5})$/); v = m ? 'NL-' + m[1] : v;
    var o = order(v); if (!o) return null; if (email == null) return o; return o.email === String(email).trim().toLowerCase() ? o : null;
  }

  /* ───────── order operations (back office) ───────── */
  function fulfil(o, lines, opt) {
    // lines: [{i, q}] ; opt: { carrier, awb, notify, by }
    opt = opt || {}; var S = db(); lines = lines.filter(function (l) { return l.q > 0 && l.q <= remaining(o, l.i); }); if (!lines.length) return null;
    var m = o.m === 'pickup' ? 'std' : o.m, sh = { id: 'S' + (o.ships.length + 1), lines: lines, carrier: opt.carrier || CARRIER[m].name, awb: '', stage: 'packed', ev: { packed: Date.now() }, by: opt.by || who(), rider: RIDERS[o.num % RIDERS.length] };
    o.ships.push(sh);
    lines.forEach(function (l) { var it = o.items[l.i]; ledgerAdd(S, skuKey(it.pid, it.c, it.s), -l.q, 'Fulfilled', sh.by, o.id); });
    var n = lines.reduce(function (a, l) { return a + l.q; }, 0), part = fulfilment(o) === 'partial';
    tlPush(o, Date.now(), 'fulfil', 'Packed ' + plural(n, 'item') + (part || o.ships.length > 1 ? ' · shipment ' + o.ships.length + (part ? ' (partial, ' + plural(liveQty(o) - o.items.reduce(function (a, it, i) { return a + shippedQ(o, i); }, 0), 'item') + ' still to pack)' : '') : ''), sh.by);
    o.tags = o.tags.filter(function (t) { return t !== 'New'; });
    bump(S); log('Fulfilled order', o.id, plural(n, 'item') + (part ? ' · partial shipment' : '') + ' · ' + sh.carrier, sh.by);
    if (opt.ship) advance(o, sh.id, 'shipped', { awb: opt.awb, notify: opt.notify, by: sh.by, quiet: true }); else save('orders');
    return sh;
  }
  function advance(o, sid, to, opt) {
    opt = opt || {}; var S = db(), sh = o.ships.filter(function (s) { return s.id === sid; })[0]; if (!sh) return false;
    var cur = STG.indexOf(sh.stage), nx = STG.indexOf(to); if (nx <= cur) return false; var now = Date.now(), by = opt.by || who();
    for (var k = cur + 1; k <= nx; k++) { var st = STG[k]; sh.ev[st] = now - (nx - k) * MIN;
      if (st === 'shipped') { sh.awb = opt.awb || sh.awb || mkAwb(o.m); var z = (pin(o.addr.pin) || {}).zone || 'tier'; sh.eta = o.m === 'same' ? now + 6 * H : addBiz(now, (TRANSIT[o.m === 'exp' ? 'exp' : 'std'][z] || [3, 5])[1]) + 14 * H;
        tlPush(o, sh.ev[st], 'ship', 'Handed to ' + sh.carrier + ' · AWB ' + sh.awb, by); if (opt.notify !== false) notify('shipped', o, { ship: sh }); }
      if (st === 'out') { tlPush(o, sh.ev[st], 'out', 'Out for delivery in ' + o.addr.city + ' with ' + sh.rider, by === who() ? by : 'System'); if (opt.notify !== false) notify('out', o, { ship: sh }); }
      if (st === 'delivered') { tlPush(o, sh.ev[st], 'deliver', 'Delivered · received by ' + o.name.split(' ')[0], by === who() ? by : 'System'); if (opt.notify !== false) notify('delivered', o, { ship: sh });
        if (o.pay.st === 'cod' && o.ships.every(function (s) { return s.stage === 'delivered' || s === sh; }) && fulfilment(o) === 'fulfilled') { o.pay.st = 'paid'; o.pay.amt = o.total - o.items.reduce(function (a, it, i) { return a + (it.cq || 0) * unitNet(o, i); }, 0); o.pay.at = now; tlPush(o, now + 1, 'pay', 'Cash of ' + money(o.pay.amt) + ' collected by ' + sh.carrier, 'System'); } }
      sh.stage = st; }
    bump(S); if (!opt.quiet) log({ shipped: 'Marked shipped', out: 'Marked out for delivery', delivered: 'Marked delivered', packed: 'Packed' }[to], o.id, 'Shipment ' + sh.id.slice(1) + (sh.awb ? ' · ' + sh.awb : ''), by);
    save('orders'); return true;
  }
  function refund(o, x) {
    // x: { amt, lines:[{i,q}], ship:bool, reason, restock, method, by, notify }
    var S = db(), by = x.by || who(), max = refundable(o), amt = Math.round(Math.min(max, +x.amt || 0) * 100) / 100;
    if (amt <= 0 && !(x.lines && x.lines.length)) return { ok: false, msg: 'Nothing to refund.' };
    if (o.pay.st === 'cod' || o.pay.st === 'pending') return { ok: false, msg: 'This order hasn’t been paid yet, so there’s nothing to refund. Cancel items instead.' };
    var rf = { id: 'RF-' + (++S.seq.ref), t: Date.now(), amt: amt, reason: x.reason || 'Refund', lines: (x.lines || []).filter(function (l) { return l.q > 0; }), by: by, method: x.method || 'Original payment' };
    rf.lines.forEach(function (l) { var it = o.items[l.i], rem = remaining(o, l.i), q = Math.min(l.q, rem); if (q > 0) it.cq = (it.cq || 0) + q; // unshipped: just remove it from the order
      if (x.restock && l.q - q > 0) ledgerAdd(S, skuKey(it.pid, it.c, it.s), l.q - q, 'Restocked', by, o.id); });
    o.refunds.push(rf);
    tlPush(o, rf.t, 'refund', (amt >= max - .5 ? 'Refunded in full: ' : 'Partial refund: ') + money(amt) + ' to ' + (rf.method === 'Store credit' ? 'store credit' : o.pay.d) + ' · ' + rf.reason, by);
    if (rf.method === 'Store credit') { var c = custByEmail(S, o.email); if (c) c.credit = (c.credit || 0) + amt; }
    if (x.notify !== false) notify('refund', o, { amt: amt, method: rf.method === 'Store credit' ? 'your Northlane store credit' : o.pay.d });
    if (o.items.every(function (it) { return (it.cq || 0) >= it.q; })) { o.cancelled = true; o.cancelledAt = Date.now(); o.cancelReason = o.cancelReason || rf.reason; }
    bump(S); log('Refunded', o.id, money(amt) + ' · ' + rf.reason, by); save('orders'); return { ok: true, refund: rf };
  }
  function cancel(o, x) {
    x = x || {}; var S = db(), by = x.by || who(); if (o.cancelled) return { ok: false, msg: 'Already cancelled.' };
    if (o.ships.some(function (s) { return STG.indexOf(s.stage) >= 2; })) return { ok: false, msg: 'Part of this order has already shipped. Refund or return those items instead.' };
    // packed but not shipped: put the stock back on the shelf
    o.ships.forEach(function (s) { s.lines.forEach(function (l) { var it = o.items[l.i]; if (x.restock !== false) ledgerAdd(S, skuKey(it.pid, it.c, it.s), l.q, 'Restocked', by, o.id + ' cancelled'); }); });
    o.ships = []; o.items.forEach(function (it) { it.cq = it.q; }); o.cancelled = true; o.cancelledAt = Date.now(); o.cancelReason = x.reason || 'Cancelled';
    tlPush(o, Date.now(), 'cancel', 'Order cancelled: ' + o.cancelReason, by);
    if (o.pay.st === 'paid' && refundable(o) > 0) { var amt = refundable(o); o.refunds.push({ id: 'RF-' + (++S.seq.ref), t: Date.now(), amt: amt, reason: 'Order cancelled', lines: [], by: by, method: 'Original payment' }); tlPush(o, Date.now() + 1, 'refund', 'Refunded in full: ' + money(amt) + ' to ' + o.pay.d, by); if (x.notify !== false) notify('refund', o, { amt: amt }); }
    else if (o.pay.st !== 'paid') o.pay.st = 'voided';
    bump(S); log('Cancelled order', o.id, o.cancelReason, by); save('orders'); return { ok: true };
  }
  function requestReturn(o, x) {
    // x: { lines:[{i,q,reason}], method:'original'|'credit', note, by:'customer'|'staff', pickup }
    var S = db(); if (openReturn(o)) return { ok: false, msg: 'There’s already a return open for this order.' };
    var lines = x.lines.filter(function (l) { return l.q > 0; }); if (!lines.length) return { ok: false, msg: 'Choose at least one item to return.' };
    var rt = { id: 'RMA-' + (++S.seq.rma), t: Date.now(), lines: lines, st: 'requested', ev: { requested: Date.now() }, method: x.method || 'original', note: x.note || '', by: x.by || 'customer', restock: true, pickup: x.pickup || addBiz(Date.now(), 1) };
    o.rets.push(rt);
    tlPush(o, rt.t, 'return', 'Return ' + rt.id + ' requested for ' + lines.map(function (l) { return o.items[l.i].name + (l.q > 1 ? ' × ' + l.q : ''); }).join(', ') + ' (' + lines[0].reason.toLowerCase() + ')', rt.by === 'customer' ? 'Customer' : who());
    bump(S); log('Return requested', o.id, rt.id + ' · ' + lines[0].reason, rt.by === 'customer' ? 'Customer' : who()); save('orders'); return { ok: true, rma: rt };
  }
  function returnValue(o, rt) { return rt.lines.reduce(function (a, l) { return a + unitNet(o, l.i) * l.q; }, 0); }
  function updateReturn(o, id, to, x) {
    x = x || {}; var S = db(), by = x.by || who(), rt = o.rets.filter(function (r) { return r.id === id; })[0]; if (!rt) return { ok: false };
    var now = Date.now();
    if (to === 'approved') { rt.st = 'approved'; rt.ev.approved = now; rt.awb = 'RV' + mkAwb('std').slice(2); rt.pickup = x.pickup || addBiz(now, 1); tlPush(o, now, 'return', 'Return ' + rt.id + ' approved · pickup booked with Parcelwise for ' + fD(rt.pickup) + ' (' + rt.awb + ')', by); if (x.notify !== false) notify('return', o, { rma: rt.id, pickup: rt.pickup }); }
    if (to === 'rejected') { rt.st = 'rejected'; rt.ev.rejected = now; rt.reason = x.reason || ''; tlPush(o, now, 'return', 'Return ' + rt.id + ' declined' + (x.reason ? ': ' + x.reason : ''), by); }
    if (to === 'received') { rt.st = 'received'; rt.ev.received = now; rt.restock = x.restock !== false;
      rt.lines.forEach(function (l) { var it = o.items[l.i]; it.rq = (it.rq || 0) + l.q; if (rt.restock) ledgerAdd(S, skuKey(it.pid, it.c, it.s), l.q, 'Return restock', by, rt.id); });
      tlPush(o, now, 'return', 'Return ' + rt.id + ' received and inspected · ' + (rt.restock ? plural(rt.lines.reduce(function (a, l) { return a + l.q; }, 0), 'item') + ' restocked' : 'not restockable'), by); }
    if (to === 'refunded') { var amt = x.amt != null ? x.amt : returnValue(o, rt); var res = refund(o, { amt: amt, lines: [], reason: 'Return ' + rt.id, method: rt.method === 'credit' ? 'Store credit' : 'Original payment', by: by, notify: x.notify });
      if (!res.ok) return res; rt.st = 'refunded'; rt.ev.refunded = now; rt.refund = res.refund.id; }
    bump(S); if (to !== 'refunded') log('Updated return', o.id, rt.id + ' → ' + to, by); save('orders'); return { ok: true, rma: rt };
  }
  function addNote(o, m, by) { tlPush(o, Date.now(), 'note', m, by || who()); bump(db()); log('Added note', o.id, m.slice(0, 80), by); save('orders'); }

  /* ───────── customers ───────── */
  function custByEmail(S, email) { email = String(email || '').toLowerCase(); return S.cust.filter(function (c) { return c.email === email; })[0] || null; }
  var csCache = null, csStamp = -1;
  function custStats() {
    var D = db(); if (csCache && csStamp === D._stamp) return csCache; var m = {}, now = Date.now();
    D.cust.forEach(function (c) { m[c.email] = { orders: 0, ltv: 0, last: 0, first: 0, returns: 0, items: 0 }; });
    D.orders.forEach(function (o) { var s = m[o.email]; if (!s) return; if (o.cancelled) return; s.orders++; s.ltv += (o.pay.amt || 0) - refunded(o); s.items += liveQty(o); s.last = Math.max(s.last, o.t); s.first = s.first ? Math.min(s.first, o.t) : o.t; s.returns += o.rets.length; });
    D.cust.forEach(function (c) { var s = m[c.email], seg = [];
      if (s.ltv >= 30000 || s.orders >= 5) seg.push('VIP');
      if (s.orders >= 2 && now - s.last > 60 * DAY) seg.push('At risk');
      if (s.orders <= 1 && (s.first ? now - s.first : now - c.since) < 30 * DAY) seg.push('New');
      if (c.mkt) seg.push('Subscriber');
      s.seg = seg; s.aov = s.orders ? s.ltv / s.orders : 0; });
    csCache = m; csStamp = D._stamp; return m;
  }
  function custNote(c, m, by) { c.notes.unshift({ t: Date.now(), m: m, by: by || who() }); bump(db()); log('Added customer note', c.name, m.slice(0, 80), by); save('cust'); }

  /* ───────── session (storefront demo sign-in) ───────── */
  function session() { var s = read(SESS); if (!s || !s.email) return null; return custByEmail(db(), s.email) || { id: '', name: s.name || '', email: s.email, addrs: [], notes: [], tags: [], credit: 0, guest: true }; }
  function signIn(email, name) { email = String(email).trim().toLowerCase(); var D = db(), c = custByEmail(D, email);
    if (!c && name) { c = { id: 'C-' + (++D.seq.cust), name: name, email: email, phone: '', city: '', state: '', since: Date.now(), addrs: [], tags: [], notes: [], mkt: false, credit: 0 }; D.cust.unshift(c); bump(D); save('cust'); }
    write(SESS, { email: email, name: name || (c && c.name) || '', t: Date.now() }); emit('session', false); return session(); }
  function updateCustomer(email, patch) { var D = db(), c = custByEmail(D, email); if (!c) return null; Object.keys(patch).forEach(function (k) { if (k !== 'email' && k !== 'id') c[k] = patch[k]; }); bump(D);
    var se = read(SESS); if (se && se.email === c.email && patch.name) { se.name = patch.name; write(SESS, se); } save('cust'); return c; }
  function signOut() { try { localStorage.removeItem(SESS); } catch (e) {} emit('session', false); }
  function saveAddr(c, a) { var D = db(); c = custByEmail(D, c.email); if (!c) return; if (a.def) c.addrs.forEach(function (x) { x.def = false; });
    var ix = c.addrs.map(function (x) { return x.id; }).indexOf(a.id); if (ix >= 0) c.addrs[ix] = a; else { a.id = 'a' + Date.now().toString(36); if (!c.addrs.length) a.def = true; c.addrs.push(a); } bump(D); save('cust'); return a; }
  function removeAddr(c, id) { var D = db(); c = custByEmail(D, c.email); if (!c) return; var was = c.addrs.filter(function (a) { return a.id === id; })[0]; c.addrs = c.addrs.filter(function (a) { return a.id !== id; }); if (was && was.def && c.addrs[0]) c.addrs[0].def = true; bump(D); save('cust'); }

  /* ───────── analytics + audit ───────── */
  function track(kind) {
    var D = mem || db(), d0 = dayStart(), row = D.traffic[d0] = D.traffic[d0] || [0, 0, 0];
    if (kind === 'session') { try { if (sessionStorage.getItem('nl-ses')) return; sessionStorage.setItem('nl-ses', '1'); } catch (e) { return; } row[0]++; }
    else if (kind === 'cart') row[1]++; else if (kind === 'checkout') row[2]++; else return;
    // analytics ticks are cheap: batch them into one write when the page is idle or hidden
    if (!trackT) trackT = setTimeout(flushTrack, 1500);
  }
  var trackT = 0;
  function flushTrack() { if (!trackT) return; clearTimeout(trackT); trackT = 0; if (mem) write(KEY, mem); }
  addEventListener('pagehide', flushTrack); document.addEventListener('visibilitychange', function () { if (document.hidden) flushTrack(); });
  var ME = 'Ananya Rao';
  function who() { return ME; }
  function log(a, o, d, by) { var D = mem || db(); D.audit.unshift({ t: Date.now(), who: by || who(), a: a, o: o || '', d: d || '' }); if (D.audit.length > 400) D.audit.length = 400; }

  /* ───────── product CMS ───────── */
  function product(id) { var D = db(); for (var i = 0; i < D.products.length; i++) if (D.products[i].id === id) return D.products[i]; return null; }
  function products(opt) { var L = db().products.slice().sort(function (a, b) { return a.order - b.order; }); return opt && opt.all ? L : L.filter(function (p) { return p.status === 'active'; }); }
  function order(id) { var D = db(); for (var i = 0; i < D.orders.length; i++) if (D.orders[i].id === id) return D.orders[i]; return null; }
  function updateProduct(id, patch, by, summary) {
    var D = db(), p = product(id); if (!p) return null; var prev = clone(p);
    Object.keys(patch).forEach(function (k) { p[k] = patch[k]; }); p.updated = Date.now();
    // new variants start with zero stock rather than undefined
    p.colors.forEach(function (_, ci) { p.sizes.forEach(function (s) { var k = skuKey(p.id, ci, s); if (!D.inv[k]) D.inv[k] = { on: 0, low: 2 }; }); });
    bump(D); log('Edited product', p.name, summary || Object.keys(patch).join(', '), by); save('products'); return prev;
  }
  function restoreProduct(snap, by) { var D = db(); for (var i = 0; i < D.products.length; i++) if (D.products[i].id === snap.id) D.products[i] = snap; bump(D); log('Undid product edit', snap.name, 'Restored the previous version', by); save('products'); }
  function productStats(days) { var since = Date.now() - (days || 30) * DAY, m = {};
    db().orders.forEach(function (o) { if (o.t < since || o.cancelled) return; o.items.forEach(function (it) { var s = m[it.pid] = m[it.pid] || { units: 0, rev: 0, ret: 0 }; s.units += it.q - (it.cq || 0); s.rev += (it.q - (it.cq || 0)) * it.price; s.ret += it.rq || 0; }); });
    return m; }

  window.NL = {
    ROOT: ROOT, DAY: DAY, H: H, MIN: MIN, STG: STG, STGL: STGL, PAYL: PAYL, DSL: DSL, METHOD: METHOD, CARRIER: CARRIER, ORIGIN: ORIGIN, HUB: HUB, CITY: CITY, VARS: VARS, RETR: RETR,
    esc: esc, money: money, compact: compact, fD: fD, fDs: fDs, fT: fT, fDT: fDT, rel: rel, ago: ago, plural: plural, dayStart: dayStart, addBiz: addBiz, maskPhone: maskPhone, clone: clone, winText: winText,
    db: db, save: save, reset: reset, emit: emit, bump: function () { bump(db()); }, media: media, img: imgSrc, srcset: srcset, thumb: thumbSrc, imgAttrs: imgAttrs, who: who, log: log,
    products: products, product: product, updateProduct: updateProduct, restoreProduct: restoreProduct, productStats: productStats,
    skuKey: skuKey, skuParse: skuParse, skuCode: skuCode, skuLabel: skuLabel, colCode: colCode, stock: stock, variants: variants, totalStock: totalStock, incoming: incoming, committed: committed,
    adjust: adjust, setLow: setLow, receivePO: receivePO, createPO: createPO, alertMe: alertMe,
    reviews: reviews, reviewStats: reviewStats, addReview: addReview,
    pin: pin, shipOptions: shipOptions, quote: quote, applyCode: applyCode, placeOrder: placeOrder, findOrder: findOrder, order: order,
    discStatus: discStatus, discText: discText, saveDisc: saveDisc,
    qty: qty, liveQty: liveQty, shippedQ: shippedQ, remaining: remaining, fulfilment: fulfilment, stage: stage, payStatus: payStatus, refunded: refunded, refundable: refundable, unitNet: unitNet, openReturn: openReturn, returnValue: returnValue, etaText: etaText, scans: scans, geo: geo,
    fulfil: fulfil, advance: advance, refund: refund, cancel: cancel, requestReturn: requestReturn, updateReturn: updateReturn, addNote: addNote, notify: notify, vars: vars, fill: fill,
    custByEmail: function (e) { return custByEmail(db(), e); }, custStats: custStats, custNote: custNote,
    session: session, signIn: signIn, signOut: signOut, updateCustomer: updateCustomer, saveAddr: saveAddr, removeAddr: removeAddr, track: track,
    demo: function () { return db().demo; }
  };
})();
