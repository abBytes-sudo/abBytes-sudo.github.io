/* Revv dealer app · refurbishment board: Bought → Workshop → Detailing → Photos → Live. Drag a card (or use its arrows),
   see what each stage has cost so far, and open a card for its ledger, jobs and before-and-after photos. Moving a car
   to Live sends it to Revv for review with its ledger attached. */
(function () {
  'use strict';
  var R = window.Revv, BO = window.BO, L = window.LEDGER, esc = BO.esc, ic = BO.ic, $ = BO.$, $$ = BO.$$;
  var S = L.STAGES, HINT = { Bought: 'Paid for, not yet in the workshop', Workshop: 'Mechanical and body work', Detailing: 'Cleaning, polish, small fixes', Photos: 'Shoot and the 150-point report', Live: 'On Revv, or in review' };
  var mob = { st: null };

  function cards(me) {
    var inc = L.incoming(me).map(L.ofIncoming);
    var live = R.listings({ all: true }).filter(function (l) { return l.dealer === me && l.status !== 'sold' && !l.rejected; }).map(L.of).sort(function (a, b) { return a.days - b.days; });
    return inc.concat(live.map(function (g) { g.stage = 'Live'; return g; }));
  }
  function card(g) {
    var i = S.indexOf(g.stage), inR = g.kind === 'listing' && g.l.approved === false;
    return '<li class="rf-c' + (g.kind === 'listing' ? ' listed' : '') + '" draggable="' + (g.kind === 'incoming') + '" data-rf="' + esc(g.id) + '" tabindex="0" aria-label="' + esc(g.title) + ', ' + esc(g.stage) + '">' +
      '<div class="rf-t">' + (g.img ? '<img src="' + g.img + '" alt="" width="64" height="44" loading="lazy">' : '<span class="ph-t">' + ic(g.car ? 'stock' : 'bike') + '</span>') + '<span><b>' + esc(g.title) + '</b><small>' + (g.kind === 'incoming' ? 'Bought ' + g.days + ' d ago' : (inR ? 'In review' : g.l.status === 'reserved' ? 'Reserved' : 'Live') + ' · day ' + g.days) + '</small></span></div>' +
      '<div class="rf-m"><span class="num">' + R.inr(g.bought + g.refurb) + '</span><span class="dim">' + g.jobs.length + ' job' + (g.jobs.length === 1 ? '' : 's') + (g.refurb ? ' · ' + R.inr(g.refurb) : '') + '</span>' + (g.x && g.x.from === 'appraisal' ? '<span class="chip sig">Exchange</span>' : '') + '</div>' +
      (g.kind === 'incoming' ? '<div class="rf-a"><button type="button" class="ib sm" data-mv="-1" aria-label="Move back to ' + esc(S[i - 1] || '') + '"' + (i <= 0 ? ' disabled' : '') + '>‹</button><button type="button" class="btn sm" data-rf-open>Ledger</button><button type="button" class="ib sm" data-mv="1" aria-label="Move on to ' + esc(S[i + 1] || '') + '">›</button></div>' : '<div class="rf-a"><button type="button" class="btn sm" data-rf-open>Ledger</button></div>') + '</li>';
  }
  function vRefurb(el) {
    var me = L.me(), all = cards(me), by = {}; S.forEach(function (s) { by[s] = all.filter(function (g) { return g.stage === s; }); });
    if (!mob.st || !mob.picked) mob.st = S.filter(function (s) { return s !== 'Live' && by[s].length; })[0] || 'Live';
    var spent = all.filter(function (g) { return g.kind === 'incoming'; }).reduce(function (s, g) { return s + g.bought + g.refurb; }, 0);
    el.innerHTML = '<div class="ph"><div><h1>Refurbishment</h1><p>' + all.filter(function (g) { return g.kind === 'incoming'; }).length + ' vehicles getting ready · ' + R.inr(spent) + ' in them so far · drag a card to the next stage</p></div><div class="acts"><a class="btn" href="#/appraisals">' + ic('tag') + 'Appraisals</a><a class="btn" href="#/money">' + ic('rupee') + 'Money</a></div></div>' +
      '<div class="rf-tabs" role="tablist" aria-label="Stages">' + S.map(function (s) { return '<button type="button" role="tab" data-st="' + s + '" aria-selected="' + (mob.st === s) + '">' + s + ' <span class="n">' + by[s].length + '</span></button>'; }).join('') + '</div>' +
      '<div class="rf-board">' + S.map(function (s) {
        var list = s === 'Live' ? by[s].slice(0, 8) : by[s], cost = by[s].reduce(function (a, g) { return a + g.bought + g.refurb; }, 0);
        return '<section class="rf-col' + (mob.st === s ? ' on' : '') + '" data-col="' + s + '" aria-labelledby="rf-' + s + '"><header class="rf-h"><h2 id="rf-' + s + '">' + s + '</h2><span class="n">' + by[s].length + '</span><span class="rf-sum num" title="Bought plus refurbishment">' + R.inr(cost) + '</span><p>' + HINT[s] + '</p></header><ul class="rf-l">' +
          (list.length ? list.map(card).join('') : '<li class="rf-e">Nothing ' + (s === 'Bought' ? 'waiting. Accepted appraisals land here.' : 'at this stage.') + '</li>') + (s === 'Live' && by[s].length > list.length ? '<li class="rf-e"><a href="#/inventory">+' + (by[s].length - list.length) + ' more in Inventory</a></li>' : '') + '</ul></section>';
      }).join('') + '</div>';
  }
  function moveTo(id, st) {
    var g = L.byId(id); if (!g || g.kind !== 'incoming' || g.stage === st) return;
    if (st === 'Live') {
      BO.dialog({ title: 'Send to Revv for review?', ok: 'Send for review', html: '<p style="margin:0 0 8px">' + esc(g.title) + ' goes into the moderation queue at ' + R.inrFull(g.ask) + ' with its ledger attached. It goes live once the 150-point report is in.</p><p style="margin:0;color:var(--mute);font-size:13px">Cost so far ' + R.inrFull(g.cost) + ' · margin at asking ' + R.inrFull(g.margin) + '.</p>', run: function () { var nid = L.publish(g); BO.refresh(); BO.toast('<b>' + esc(g.title) + '</b> sent for review.', { undo: function () { var ex = R.extra().filter(function (x) { return x.id !== nid; }); R.set(R.K.extra, ex); L.patch(g.id, function (o) { o.published = null; }); BO.refresh(); } }); } });
      return;
    }
    var from = g.stage; L.setStage(id, st); BO.refresh(); BO.toast('<b>' + esc(g.title) + '</b> → ' + esc(st) + '.', { undo: function () { L.setStage(id, from); BO.refresh(); } });
  }
  function bind(el) {
    var drag = null;
    el.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('[data-rf][draggable="true"]'); if (!c) return; drag = c.dataset.rf; c.classList.add('drag'); try { e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
    el.addEventListener('dragend', function () { drag = null; $$('.rf-c.drag,.rf-col.over', el).forEach(function (x) { x.classList.remove('drag', 'over'); }); });
    el.addEventListener('dragover', function (e) { var col = drag && e.target.closest('[data-col]'); if (!col) return; e.preventDefault(); $$('.rf-col.over', el).forEach(function (x) { if (x !== col) x.classList.remove('over'); }); col.classList.add('over'); });
    el.addEventListener('drop', function (e) { var col = drag && e.target.closest('[data-col]'); if (!col) return; e.preventDefault(); var id = drag; drag = null; moveTo(id, col.dataset.col); });
  }
  var bound = null;
  function view(el) {
    vRefurb(el);
    if (bound !== el) { bind(el); bound = el; }
    el.onclick = function (e) {
      var t = e.target, tab = t.closest('[data-st]'); if (tab) { mob.st = tab.dataset.st; mob.picked = true; BO.render(true); return; }
      var c = t.closest('[data-rf]'); if (!c) return; var id = c.dataset.rf;
      var mvb = t.closest('[data-mv]'); if (mvb) { var g = L.byId(id), i = S.indexOf(g.stage) + (+mvb.dataset.mv); if (i >= 0 && i < S.length) moveTo(id, S[i]); return; }
      if (t.closest('[data-rf-open]') || !t.closest('button')) openCard(id);
    };
    el.onkeydown = function (e) { var c = e.target.closest && e.target.closest('[data-rf]'); if (!c || e.target !== c) return; if (e.key === 'Enter') openCard(c.dataset.rf); if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && c.getAttribute('draggable') === 'true') { var g = L.byId(c.dataset.rf), i = S.indexOf(g.stage) + (e.key === 'ArrowRight' ? 1 : -1); if (i >= 0 && i < S.length) { e.preventDefault(); moveTo(g.id, S[i]); } } };
  }
  // the card: ledger plus before and after photos
  function openCard(id) {
    var g0 = L.byId(id); if (!g0) return;
    L.open(id, function () { BO.refresh(); }, function (b, g) {
      var before = g.kind === 'incoming' ? (g.stage === 'Bought' ? '' : 'photos/d-mech-s.jpg') : 'photos/d-shop-s.jpg', after = g.kind === 'listing' ? g.img : (g.stage === 'Photos' && g.img ? g.img : '');
      var ph = d0('div', 'rf-ph'); ph.innerHTML = '<p class="lbl">Before and after</p><div class="rf-pg">' + slot('Before', before, 'intake') + slot('After', after, 'final') + '</div>' + (g.kind === 'incoming' ? '<label class="lbl" for="rf-stg">Stage</label><select class="sel" id="rf-stg">' + S.map(function (s) { return '<option' + (s === g.stage ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' : '');
      b.appendChild(ph);
      $$('input[type=file]', ph).forEach(function (inp) { inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; if (!f) return; var fig = inp.closest('figure'); fig.querySelector('.rf-img').innerHTML = '<img src="' + URL.createObjectURL(f) + '" alt="' + esc(inp.dataset.k) + ' photo of ' + esc(g.title) + '">'; L.patch(id, function (o) { (o.photos = o.photos || {})[inp.dataset.k] = f.name; }); BO.toast('Photo added: ' + esc(f.name)); }); });
      var sel = $('#rf-stg', ph); if (sel) sel.addEventListener('change', function () { BO.closeSlide(true); moveTo(id, sel.value); });
      function slot(k, src, cls) { var saved = (L.own(id).photos || {})[k]; return '<figure class="rf-f ' + cls + '"><div class="rf-img">' + (src ? '<img src="' + src + '" alt="' + k + ' photo of ' + esc(g.title) + '" loading="lazy">' : '<span>' + ic('plus') + (saved ? esc(saved) : 'No photo yet') + '</span>') + '</div><figcaption>' + k + '<label class="btn sm"><input type="file" accept="image/*" capture="environment" data-k="' + k + '" class="sr">' + (src ? 'Replace' : 'Add photo') + '</label></figcaption></figure>'; }
    });
  }
  function d0(t, c) { var e = document.createElement(t); e.className = c; return e; }

  (window.DEALER_EXT = window.DEALER_EXT || []).push(function (cfg) {
    cfg.views.refurb = view;
    var grp = cfg.nav.filter(function (g) { return g.group === 'Money'; })[0];
    if (grp) grp.items.splice(1, 0, { id: 'refurb', label: 'Refurbishment', icon: 'board', short: 'Refurb' });
    var c0 = cfg.counts; cfg.counts = function () { var c = c0 ? c0() : {}; c.refurb = L.incoming(L.me()).length; return c; };
  });
})();
