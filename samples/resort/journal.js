/* Taradhura journal: list with filters, and the article view (journal.html?post=slug). */
(function () {
  'use strict';
  var TD = window.TD, ui = TD.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc, D = TD.date;
  var posts = TD.posts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var id = new URLSearchParams(location.search).get('post'), p = id && TD.post(id);
  if (p) {
    $('#jr-list').hidden = true; var art = $('#jr-post'); art.hidden = false;
    document.title = p.title + ' · Taradhura journal';
    var i = posts.indexOf(p), next = posts[(i + 1) % posts.length];
    art.innerHTML = '<header class="wrap art art-head"><p class="crumb small muted" style="justify-content:center;display:flex;gap:8px"><a class="ul" href="journal.html">Journal</a> / <span>' + esc(p.kicker) + '</span></p><h1>' + esc(p.title) + '</h1><p class="lede">' + esc(p.dek) + '</p><p class="by">' + esc(p.author) + ' · ' + D.long(p.date) + ' · ' + p.read + ' min read</p></header>' +
      '<figure class="art-img wrap" style="margin:0 auto">' + ui.photo(p.photo, p.dek, '100vw', '', true) + '</figure>' +
      '<div class="wrap art"><div class="art-body">' + p.body.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>' +
      '<div class="art-foot"><a class="lnk" href="journal.html"><span class="ar" aria-hidden="true">←</span><span>All stories</span></a><a class="lnk" href="journal.html?post=' + next.id + '"><span>Next: ' + esc(next.title) + '</span><span class="ar" aria-hidden="true">→</span></a></div>' +
      '<div class="demo-pay" style="margin:48px 0 96px;background:var(--paper-2);border:1px solid var(--line)"><b>Come and see it.</b><span>Rates from ' + TD.inr(TD.types[0].base) + ' a night with breakfast. <a class="ul" href="book.html">Check dates</a></span></div></div>';
    return;
  }
  var tags = ['All'].concat(posts.map(function (x) { return x.kicker; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
  $('#jr-tags').innerHTML = tags.map(function (t, i) { return '<button type="button" class="chip' + (i ? '' : ' on') + '" aria-pressed="' + (i === 0) + '" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');
  function render(tag) {
    var list = posts.filter(function (x) { return tag === 'All' || x.kicker === tag; }), lead = list[0];
    $('#jr-lead').href = 'journal.html?post=' + lead.id;
    $('#jr-lead').innerHTML = '<figure>' + ui.photo(lead.photo, '', '(max-width:900px) 100vw, 60vw') + '</figure><div><p class="kicker">' + esc(lead.kicker) + ' · ' + lead.read + ' min</p><h2 class="d2 display" style="margin:18px 0 18px">' + esc(lead.title) + '</h2><p class="muted">' + esc(lead.dek) + '</p><p class="small muted">' + esc(lead.author) + ' · ' + D.fmt(lead.date, { year: 'numeric' }) + '</p></div>';
    $('#jl').innerHTML = list.slice(1).map(function (x) { return '<a class="jc" href="journal.html?post=' + x.id + '"><figure>' + ui.photo(x.photo, '', '(max-width:900px) 100vw, 33vw') + '</figure><p class="kicker">' + esc(x.kicker) + ' · ' + x.read + ' min</p><h3>' + esc(x.title) + '</h3><p>' + esc(x.dek) + '</p></a>'; }).join('') || '<p class="muted">That’s the only story in this section so far.</p>';
  }
  $$('#jr-tags button').forEach(function (b) { b.onclick = function () { $$('#jr-tags button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); render(b.dataset.t); }; });
  render('All');
})();
