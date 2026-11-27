/* Ghatika complications, worked out in the browser from the visitor's own clock.
   Every model: your local time on the hands. Prahar: the prahar and ghati, reckoned from a fixed 06:00 sunrise.
   Nimisha: the moon's phase and the tithi, from approximate longitudes of the sun and moon (good to about half an hour).
   Yantra: a second city on the 24-hour hand, remembered on this device. */
(function () {
  'use strict';
  var RAD = Math.PI / 180, SYN = 29.530588853;
  function norm(a) { a %= 360; return a < 0 ? a + 360 : a; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------- prahar and ghati: eight prahars of three hours, sixty ghatis of 24 minutes, sixty palas of 24 seconds
  var ORD = ['First', 'Second', 'Third', 'Fourth'];
  function prahar(d) {
    var min = (d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 - 360 + 1440) % 1440;
    var p = Math.floor(min / 180), g = Math.floor(min / 24), pala = Math.floor((min % 24) * 2.5);
    return { index: p, name: ORD[p % 4] + ' prahar of the ' + (p < 4 ? 'day' : 'night'), ghati: g, pala: pala };
  }

  // ---------- sun and moon (the larger periodic terms only)
  function days(t) { return t / 86400000 + 2440587.5 - 2451545.0; }
  function sunLon(d) { var g = norm(357.52911 + 0.98560028 * d) * RAD; return norm(280.46646 + 0.98564736 * d + 1.914602 * Math.sin(g) + 0.019993 * Math.sin(2 * g)); }
  function moonLon(d) {
    var Mm = norm(134.963 + 13.064993 * d) * RAD, Ms = norm(357.529 + 0.98560028 * d) * RAD, D = norm(297.850 + 12.190749 * d) * RAD, F = norm(93.272 + 13.229350 * d) * RAD;
    return norm(218.316 + 13.176396 * d + 6.288774 * Math.sin(Mm) + 1.274027 * Math.sin(2 * D - Mm) + 0.658314 * Math.sin(2 * D) + 0.213618 * Math.sin(2 * Mm) - 0.185116 * Math.sin(Ms) - 0.114332 * Math.sin(2 * F));
  }
  function elong(t) { var d = days(t); return norm(moonLon(d) - sunLon(d)); }
  // when the elongation next reaches `target` degrees (a few Newton steps on the mean rate)
  function when(t, target) {
    t += norm(target - elong(t)) / 12.19 * 86400000;
    for (var i = 0; i < 3; i++) t += (norm(target - elong(t) + 180) - 180) / 12.19 * 86400000;
    return t;
  }
  var TITHI = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
  var PHASE = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  function moon(now) {
    var t = now || Date.now(), e = elong(t), i = Math.floor(e / 12), shukla = i < 15, n = shukla ? i : i - 15;
    var name = n === 14 ? (shukla ? 'Purnima' : 'Amavasya') : TITHI[n];
    var j = (i + 1) % 30, nsh = j < 15, nn = nsh ? j : j - 15, next = nn === 14 ? (nsh ? 'Purnima' : 'Amavasya') : TITHI[nn];
    var full = when(t + 3600000, 180), newm = when(t + 3600000, 0);
    return { elong: e, age: e / 360 * SYN, lit: Math.round((1 - Math.cos(e * RAD)) / 2 * 100), phase: PHASE[Math.floor(norm(e + 22.5) / 45) % 8],
      tithi: name, next: next, paksha: shukla ? 'shukla paksha' : 'krishna paksha', ends: new Date(when(t + 60000, (i + 1) * 12 % 360)), full: new Date(full), newm: new Date(newm) };
  }

  // ---------- a second city
  var CITIES = [['Udaipur', 'Asia/Kolkata'], ['London', 'Europe/London'], ['Dubai', 'Asia/Dubai'], ['Singapore', 'Asia/Singapore'], ['Hong Kong', 'Asia/Hong_Kong'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney'], ['Frankfurt', 'Europe/Berlin'], ['Nairobi', 'Africa/Nairobi'], ['New York', 'America/New_York'], ['Toronto', 'America/Toronto'], ['San Francisco', 'America/Los_Angeles']];
  var offs = {};
  function offset(tz, t) { // minutes east of UTC for this zone, recomputed each minute
    var key = tz + Math.floor(t / 60000); if (offs[key] != null) return offs[key];
    var o = 0;
    try {
      var p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(new Date(t)).forEach(function (x) { p[x.type] = +x.value; });
      o = Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(t / 60000) * 60000) / 60000);
    } catch (e) { o = 330; }
    offs = {}; offs[key] = o; return o;
  }
  function cityTime(tz, t) {
    t = t || Date.now(); var o = offset(tz, t), u = new Date(t + o * 60000), local = new Date(t);
    var dd = Math.round((Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()) - Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())) / 86400000);
    return { h: u.getUTCHours(), m: u.getUTCMinutes(), s: u.getUTCSeconds(), day: dd };
  }
  function homeZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function defaultCity() { var z = homeZone(); return /Kolkata|Calcutta/.test(z) ? 'Europe/London' : 'Asia/Kolkata'; }

  window.GHComp = { prahar: prahar, moon: moon, cityTime: cityTime, CITIES: CITIES, defaultCity: defaultCity, hm: hm, pad: pad, SYN: SYN };
})();
