/* Studio OS app-shell loader. index.html ships a static shell (sidebar + home greeting) that paints at once;
   this file personalises it for the signed-in role, waits for that frame, then loads the core bundle.
   Other views (studio-os.rest.min.js) load on first use. ?dev=1 loads the readable sources from js/. */
(function () {
  'use strict';
  var CORE = ['core', 'seed', 'seed-crm', 'v-home', 'app'], REST = ['v-sales', 'v-portal', 'v-delivery', 'v-site', 'v-finance', 'v-work', 'v-crm', 'v-design', 'v-ops'];
  var V = '20261128f', dev = /[?&]dev=1\b/.test(location.search);
  var NAMES = { owner: ['Ira', 'Owner'], pm: ['Kabir', 'Project manager'], accounts: ['Rakesh', 'Accounts'], site: ['Imran', 'Site engineer'], design: ['Tanvi', 'Designer'], client: ['Rohan', 'Client'] };
  var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var role = 'owner';
  try { var p = JSON.parse(localStorage.getItem('mr-studio-os-ui') || '{}'); if (p && NAMES[p.role]) role = p.role; if (p && p.theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); } catch (e) { /* private mode */ }
  var as = /[?&]as=(owner|pm|accounts|site|design|client)\b/.exec(location.search); if (as) role = as[1];
  /* the opening line of a client's quotation: one sentence, the same words in the first frame and in the finished page */
  window.MR_INTRO = function (studio) { return 'Prepared for you by ' + studio + '. Every line, the GST and the payment schedule are set out below. Comment on any line you want to talk through, then accept and sign at the end.'; };
  window.MR_BOOT = { rest: dev ? REST.map(function (f) { return 'js/' + f + '.js?t=' + Date.now(); }) : ['studio-os.rest.min.js?v=' + V] };

  /* personalise the static shell before the first frame */
  var route = location.hash.replace(/^#\/?/, '').split('?')[0], shell = document.getElementById('shell');
  if (shell) {
    var home = role !== 'client' && (!route || (route === 'site' && role === 'site'));
    if (home) {
      var d = new Date(), h = d.getHours(), n = NAMES[role];
      var g = role === 'site' ? (h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening') : (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
      document.getElementById('hello').textContent = (role === 'owner' || role === 'accounts') ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ' · what needs you today' : g + ', ' + n[0];
      document.getElementById('shEye').textContent = DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()] + ' · ' + n[1] + ' · checking what needs you';
      if (role === 'site' || role === 'accounts') shell.classList.add('sh-' + role);
    } else {
      shell.className = 'page sh-route';
      if (/^(q|c)\//.test(route)) document.body.classList.add('portal');
      /* a client's quote link: the letterhead, the heading and the opening line are drawn now, exactly as the finished
         page draws them (v-portal.js), so the largest paint on a phone is the first one and not the one after the bundles */
      if (/^q\//.test(route)) {
        var B = window.StudioBrand && window.StudioBrand.get && window.StudioBrand.get(), nm = B ? B.name : 'Marlow & Reed', full = B ? B.name : 'Marlow & Reed Interiors LLP';
        var e = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
        var mark = '<span class="mark" aria-hidden="true"' + (B ? ' data-n="' + B.n + '">' + e(B.initial) : '>M<i>&amp;</i>R') + '</span>';
        var main = document.getElementById('main');
        main.innerHTML = '<div class="portal-top"><div class="in">' + mark + '<div class="who"><b>' + e(nm) + '</b><span>Opening your quotation</span></div></div></div>' +
          '<div class="page narrow" style="padding-top:28px" aria-busy="true"><article class="doc" aria-label="Quotation"><header class="doc-hd"><div class="co">' + mark + '<div><b>' + e(full) + '</b><span>Plot 42, Udyog Vihar Phase IV<br>Sector 18, Gurugram, Haryana 122015</span></div></div><div class="dt"><h1>Quotation</h1></div></header>' +
          '<p class="doc-intro">' + e(window.MR_INTRO(nm)) + '</p><div class="sh-lines" aria-hidden="true"><span class="sk"></span><span class="sk"></span><span class="sk"></span><span class="sk"></span></div></article></div>';
      }
    }
  }

  function add(src) { var s = document.createElement('script'); s.src = src; s.async = false; document.head.appendChild(s); }
  var started = false;
  function go() {
    if (started) return; started = true;
    if (dev) { var m = document.querySelector('link[href^="erp.min.css"]'); if (m) m.href = 'erp.css?t=' + Date.now(); CORE.forEach(function (f) { add('js/' + f + '.js?t=' + Date.now()); }); return; }
    add('studio-os.min.js?v=' + V);
  }
  // start the app only once the shell has actually been painted (first contentful paint), so the shell stays the LCP
  try {
    new PerformanceObserver(function (list, obs) { obs.disconnect(); setTimeout(go, 0); }).observe({ type: 'paint', buffered: true });
  } catch (e) { if (window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(go, 30); }); }
  setTimeout(go, 600);   // safety net if paint timing never reports
})();
