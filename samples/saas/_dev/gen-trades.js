// Generates the six Orbit trade pages from one template and the content sets in saas/trade.js.
// Usage, from the repo root: node site/samples/saas/_dev/gen-trades.js site/samples/saas
// Bump V below when trade.js, orbit.css, orbit-ui.js, trade.css or trade-page.js change. This folder is not deployed.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = process.argv[2];
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'trade.js'), 'utf8'), ctx);
const TR = ctx.window.OrbitTrades;
const V = '3';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const H1N = { clinic: 'clinic', salon: 'salon', restaurant: 'restaurant', realestate: 'brokerage', construction: 'construction firm', store: 'online store' };
const PLURAL = { clinic: 'clinics', salon: 'salons', restaurant: 'restaurants', realestate: 'real estate', construction: 'construction firms', store: 'online stores' };
const SITE = 'https://abbytes-sudo.github.io/samples/saas/';
const ORB = n => `<svg class="orb" width="${n}" height="${n}" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle class="m" cx="17.2" cy="5.6" r="2.6"/></svg>`;
const ARROW = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
function qh(q, ts, h2, lede, ats, dark) {
  return `<header class="qh${dark ? ' on-dark' : ''}"><div class="qh-q"><p class="bub c">${esc(q)}</p><time class="ts">${ts}</time></div><div class="qh-a"><p class="who">${ORB(20)}Orbit <time>${ats}</time></p><h2>${esc(h2)}</h2>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div></header>`;
}
TR.order.forEach(id => {
  const t = TR.byId[id], c = t.color, noun = H1N[id];
  const title = `Orbit for ${PLURAL[id]} · Your ${noun}, answering at 11:42 pm`;
  const osub = 'Orbit ' + t.sub.replace(/^It /, '');
  const desc = `${osub} Try the live assistant for ${t.biz}.`;
  const figs = t.figures.map(f => `<li><b>${esc(f[0])}</b><span>${esc(f[1])}</span><span class="ex">Example</span></li>`).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(osub)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc('Your ' + noun + ', answering at 11:42 pm · Orbit Assistants')}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}og-${id}.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:url" content="${SITE}${t.page}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}og-${id}.jpg">
<meta name="theme-color" content="#0B0D10">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'none'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="orbit.css?v=${V}">
<link rel="stylesheet" href="trade.css?v=${V}">
<link rel="stylesheet" href="../assets/back.css?v=2">
<script src="trade.js?v=${V}" defer></script>
<script src="orbit-ui.js?v=${V}" defer></script>
<script src="trade-page.js?v=${V}" defer></script>
<script src="../assets/back.js?v=2" defer></script>
</head>
<body class="lt tp" data-trade="${id}" style="--acc:${c.acc};--acc-ink:${c.ink};--acc-deep:${c.deep};--acc-tx:${c.tx};--acc-soft:${c.soft}">
<p class="demo"><span>Portfolio project by <a href="../../index.html">Abhishek</a>.</span></p>
<header class="hd night"><div class="wrap nav">
  <div class="nav-l"><a class="logo" href="index.html" aria-label="Orbit Assistants, all trades">${ORB(24)}Orbit <span>Assistants</span></a> <span class="for">for ${esc(PLURAL[id])}</span><span class="clk" id="clk" title="The page runs through one night"><i aria-hidden="true"></i><span class="sr">Time in this story: </span><b>11:42 pm</b></span></div>
  <nav aria-label="On this page"><a href="#night">The night shift</a><a href="#try">Try it</a><a href="#flows">Five jobs</a><a href="#inbox">Inbox</a></nav>
  <a class="btn sm" href="#get">Get one built</a>
</div></header>

<main id="top">
<section class="tp-hero">
  <div class="wrap tp-hero-in">
    <div class="tp-hero-l">
      <p class="who">${ORB(20)}${esc(t.biz)}’s assistant <time>11:42 pm</time></p>
      <h1>Your ${esc(noun)}, answering at <span class="tail">11:42&nbsp;pm</span>.</h1>
      <p class="tp-sub">${esc(t.sub)}</p>
      <div class="tp-cta"><a class="btn" href="#try">Try it as one of your ${esc(t.people.split(' ')[0])} ${ARROW}</a><a class="btn ghost" href="#get">Get one for your ${esc(noun)}</a></div>
      <ul class="tp-figs" aria-label="Example figures">${figs}</ul>
    </div>
    <div class="tp-phone" id="try">
      <div class="tp-orbit" aria-hidden="true"><i></i></div>
      <div class="device" id="tpPhone" aria-label="${esc(t.biz)} assistant, live"><div class="dev-sk" aria-hidden="true"><i></i><i></i><i></i></div></div>
      <div class="tp-tries" id="tpTries"><p>Or tap a message a ${esc(t.people.split(' ')[0].replace(/s$/, ''))} might send</p><div class="chips">${t.questions.map(q => `<button type="button" class="chip">${esc(q)}</button>`).join('')}</div></div>
    </div>
  </div>
</section>

<section class="tp-night" id="night">
  <div class="wrap">
    ${qh('What happens after we close?', '11:41 pm', t.story.head, 'One message, from a ' + t.people.split(' ')[0].replace(/s$/, '') + '’s phone to your team’s morning.', '11:41 pm', true)}
    <div class="nt-rail" aria-hidden="true"><span>11:42 pm</span><span>11:43 pm</span><span>11:44 pm</span><span>while you sleep</span><span>9:05 am</span></div>
    <ol class="nt" id="ntTrack" aria-label="One enquiry, from 11:42 pm to 9:05 am"></ol>
    <p class="nt-ghost"><span>Without an assistant, the first reply comes about 6 hours later</span><i aria-hidden="true"></i><span class="ex">Example</span></p>
  </div>
</section>

<section class="sec nite" id="flows">
  <div class="wrap">
    ${qh('What else can it do for a ' + noun + '?', '11:46 pm', 'Five jobs it does every night.', 'Each one is a script your team can read and change. Send any of them to the assistant above.', '11:46 pm', true)}
    <ol class="fl" id="flGrid"></ol>
  </div>
</section>

<div class="dawn" id="dawn" aria-hidden="true"><div class="dawn-arc"><i></i></div><p><b>9:05 am</b><span>${esc(t.staff.name)} opens the inbox</span></p></div>

<section class="sec alt" id="inbox">
  <div class="wrap">
    ${qh('And what does my team see in the morning?', '9:04 am', t.staff.name + '’s inbox at 9:05 am.', 'Everything the assistant handled overnight, the chats waiting for a person and the bookings it saved. Ask for a person in the phone above, then take over here.', '9:05 am')}
    <div class="ib">
      <div class="ib-top"><b>${esc(t.biz)} · inbox</b><span class="ib-time">9:05 am</span><span class="ex">Example week</span>
        <div class="ib-f" id="ibF" role="group" aria-label="Show"><button type="button" data-f="all" aria-pressed="true">All<span></span></button><button type="button" data-f="waiting" aria-pressed="false">Needs a person<span></span></button><button type="button" data-f="booked" aria-pressed="false">Booked<span></span></button></div>
      </div>
      <div class="ib-k" id="ibK"></div>
      <div class="ib-body"><ul class="ib-list" id="ibList" aria-label="Conversations"></ul><div class="ib-view" id="ibView" aria-live="polite"></div></div>
    </div>
    <div class="ld"><h3>Bookings and leads it saved</h3><div class="ld-tw"><table class="ld-t"><thead><tr><th scope="col">Name</th><th scope="col">What they want</th><th scope="col">Came from</th><th scope="col">When</th><th scope="col">Status</th></tr></thead><tbody id="ldBody"></tbody></table></div></div>
  </div>
</section>

<section class="sec" id="live">
  <div class="wrap">
    ${qh('How long until it’s live?', '9:12 am', 'Four steps to live.', '', '9:12 am')}
    <ol class="st4">
      <li><b>01</b><h3>Brief</h3><p>One 30-minute call about how your ${esc(t.people.split(' ')[0])} ask and book.</p></li>
      <li><b>02</b><h3>Map</h3><p>${esc(t.map)}</p></li>
      <li><b>03</b><h3>Test</h3><p>Your team tries to break it before anyone else sees it.</p></li>
      <li><b>04</b><h3>Launch</h3><p>On your website, WhatsApp and Instagram, then tuned every week.</p></li>
    </ol>
  </div>
</section>

<section class="sec alt" id="get">
  <div class="wrap">
    ${qh('Can you build one for my ' + noun + '?', '9:14 am', 'I’ll build this for your ' + noun + '.', 'Your brief is half written already. Change anything, then send it.', '9:14 am')}
    <div class="bf" id="bf"></div>
  </div>
</section>

<section class="sec" id="more">
  <div class="wrap">
    ${qh('Do you build these for other trades?', '9:15 am', 'Made for other trades too.', 'The same engine, scripted for each business. Each page has its own live assistant.', '9:15 am')}
    <div class="mo" id="moGrid"></div>
    <p class="mo-all"><a class="btn ghost" href="index.html">See everything Orbit does ${ARROW}</a></p>
  </div>
</section>
</main>

<footer class="ft">
  <div class="wrap ft-thread">
    <div class="ft-q"><p class="bub c">That’s all for now, thanks.</p><time class="ts">9:16 am</time></div>
    <div class="ft-a"><p class="who">${ORB(20)}Orbit <time>9:16 am</time></p><p class="bub a">Anything else? I’m here.</p>
      <div class="chips"><a class="chip" href="#try">Try it again</a><a class="chip" href="#get">Get one built</a><a class="chip" href="index.html">All of Orbit</a></div></div>
    <div class="ft-meta"><p>© 2026 Orbit Assistants. A portfolio project by <a class="lnk" href="../../index.html">Abhishek</a>.</p><nav aria-label="Trades">${TR.order.map(k => `<a href="${TR.byId[k].page}"${k === id ? ' aria-current="page"' : ''}>${esc(TR.byId[k].label)}</a>`).join('')}</nav></div>
  </div>
</footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, t.page), html);
  console.log('wrote', t.page, html.length);
});
