/* The way back out of a project: a link in the top bar, plus a floating button once the hero has scrolled away.
   It goes back to wherever the visitor came in from (the homepage's project list or the 3D Lab), remembered for the tab.
   Inside the 3D Lab's live frame there is no way back to show (the Lab has its own "Stop and go back"),
   and any link to the portfolio itself opens in the whole window instead of inside the frame. */
(function () {
  var framed = false;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  var ROOT = '../../', KEY = 'ab-back';
  var LAB = { watch: 'ghatika', revv: 'revv', launch: 'aaranya', build: 'sthira', resort: 'taradhura' };
  var folder = (location.pathname.match(/\/samples\/([^\/]+)\//) || [])[1] || '';

  if (framed) {
    var bar0 = document.querySelector('.demo, .nl-bar'), old = bar0 && bar0.querySelector('.back-top');
    if (old) old.remove();
    document.addEventListener('click', function (e) {
      var l = e.target.closest && e.target.closest('a[href]');
      if (l && /(^|\/)\.\.\/\.\.\/(index|lab)\.html|^\/($|index|lab|#)/.test(l.getAttribute('href'))) l.target = '_top';
    }, true);
    return;
  }

  /* where did this visit start? only a page outside the samples counts; later pages keep the first answer */
  var from = '';
  try {
    var r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.origin === location.origin && !/\/samples\//.test(r.pathname)) {
      from = /lab\.html$/.test(r.pathname) ? 'lab' : 'home';
      sessionStorage.setItem(KEY, from);
    } else from = sessionStorage.getItem(KEY) || '';
  } catch (e) {}

  var href = ROOT + 'index.html#projects', text = '← Back to portfolio', short = 'Portfolio';
  if (from === 'lab') { href = ROOT + 'lab.html' + (LAB[folder] ? '#' + LAB[folder] : ''); text = '← Back to the 3D Lab'; short = '3D Lab'; }
  else if (!from) { text = '← More projects by Abhishek'; short = 'More work'; }

  var bar = document.querySelector('.demo, .nl-bar'), top = bar && bar.querySelector('.back-top');
  if (bar && !top) { top = document.createElement('a'); top.className = 'back-top'; bar.insertBefore(top, bar.firstChild); }
  if (top) {
    top.href = href;
    /* phones: a short label, so the one disclosure line ("Portfolio project by Abhishek") always reads whole */
    var mq = matchMedia('(max-width: 560px)'), shortText = from === 'lab' ? '← 3D Lab' : '← More work';
    var setLabel = function () { top.textContent = mq.matches ? shortText : text; };
    setLabel(); if (mq.addEventListener) mq.addEventListener('change', setLabel);
    top.style.marginRight = '10px'; top.style.whiteSpace = 'nowrap';
    if (!top.nextSibling || top.nextSibling.nodeType !== 3) bar.insertBefore(document.createTextNode(' '), top.nextSibling);
  }

  /* the back office behind each site: shown in the top bar so visitors know it exists (owner, 28 Nov) */
  var BO = { revv: ['dealer.html', 'the dealer back office'], gym: ['staff.html', 'the club back office'], store: ['../orders/admin.html', 'the store back office'],
    interior: ['studio.html', 'the studio back office'], masonry: ['desk.html', 'the office desk'], watch: ['staff.html', 'the boutique back office'],
    work: ['staff.html', 'the reseller console'], launch: ['admin.html', 'the sales back office'], build: ['admin.html', 'the site back office'], resort: ['staff.html', 'the front desk'] };
  var bo = BO[folder], here = location.pathname.split('/').pop() || 'index.html';
  if (bar && bo && bo[0].split('/').pop() !== here && !bar.querySelector('.bo-link') && ![].some.call(bar.querySelectorAll('a[href]'), function (x) { return x.getAttribute('href').split('#')[0].split('?')[0].split('/').pop() === bo[0].split('/').pop(); })) {
    var bl = document.createElement('a'); bl.className = 'bo-link'; bl.href = bo[0];
    bl.style.marginLeft = '14px'; bl.style.whiteSpace = 'nowrap'; bl.style.textDecoration = 'underline'; bl.style.textUnderlineOffset = '3px';
    var mqb = matchMedia('(max-width: 560px)');
    var setBo = function () { bl.textContent = mqb.matches ? 'Back office →' : 'See ' + bo[1] + ' →'; bl.style.display = mqb.matches && bar.scrollWidth > bar.clientWidth ? 'none' : ''; };
    bar.appendChild(bl); setBo(); if (mqb.addEventListener) mqb.addEventListener('change', setBo);
  }

  var a = document.createElement('a'); a.className = 'to-home'; a.href = href;
  a.innerHTML = '<b aria-hidden="true">←</b> ' + short; a.setAttribute('aria-label', text.replace('← ', ''));
  document.body.appendChild(a);
  var main = document.querySelector('main'), first = main && main.firstElementChild;
  function check() { var past = first && first.tagName === 'SECTION' ? first.getBoundingClientRect().bottom < 80 : scrollY > 200; a.classList.toggle('on', past); }
  addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); check();
})();
