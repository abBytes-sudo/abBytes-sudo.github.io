/* Northlane Back Office: the packing bench (#/bench, #/bench/NL-10483).
   One order at a time, oldest first: the pieces as big photos with their bins, a scan field that ticks them off, a weight
   check, the courier label, then the next order. Packing writes the same fulfilment, stock and audit records as the order
   page, so the customer's account shows the order as packed straight away. */
(function () {
  'use strict';
  var NL = window.NL, A = window.A, $ = A.$, esc = A.esc, money = A.money, ic = A.ic;
  var KG = { 'harbor-jacket': 1.15, 'atelier-tote': .62, 'meridian-38': .24, 'coast-sunglasses': .16, 'drift-runner': .82, 'court-low': .9, 'field-cap': .12, 'mini-crossbody': .41, 'everyday-tee': .21, 'loop-hoodie': .58, 'easy-trousers': .46, 'rib-knit': .34 };
  var CATKG = { Clothing: .4, Bags: .5, Shoes: .85, Accessories: .2 }, AISLE = { Clothing: 'A', Bags: 'B', Shoes: 'C', Accessories: 'D' };
  var PACKERS = ['Kabir Sethi', 'Ananya Rao'];
  var S = { id: '', got: [], wt: '', note: '', skip: [], done: 0, msg: null, notice: '' };
  function packer() { try { var p = localStorage.getItem('nl-bench-packer'); if (PACKERS.indexOf(p) >= 0) return p; } catch (e) {} return PACKERS[0]; }

  function queue() {
    var q = NL.db().orders.filter(function (o) { return !o.cancelled && NL.fulfilment(o) !== 'fulfilled' && o.pay.st !== 'pending'; }).sort(function (a, b) { return a.t - b.t; });
    return q.filter(function (o) { return S.skip.indexOf(o.id) < 0; }).concat(q.filter(function (o) { return S.skip.indexOf(o.id) >= 0; }));
  }
  function lines(o) { return o.items.map(function (it, i) { return { i: i, q: NL.remaining(o, i) }; }).filter(function (l) { return l.q > 0; }); }
  function code(it) { return NL.skuCode(NL.skuKey(it.pid, it.c, it.s)); }
  function bin(it) { var all = NL.products({ all: true }), p = NL.product(it.pid), ix = Math.max(0, all.indexOf(p)), sh = (ix * 5 + it.c * 2) % 24 + 1; return (AISLE[p && p.cat] || 'E') + '-' + (sh < 10 ? '0' : '') + sh; }
  function kg(o, L) { var w = .18; L.forEach(function (l) { var it = o.items[l.i], p = NL.product(it.pid); w += l.q * (KG[it.pid] || CATKG[p && p.cat] || .3) + .03 * l.q; }); return Math.round(w * 100) / 100; }
  function need(L) { return L.reduce(function (a, l) { return a + l.q; }, 0); }
  function got(L) { return L.reduce(function (a, l) { return a + Math.min(l.q, S.got[l.i] || 0); }, 0); }
  function weight() { var v = parseFloat(String(S.wt).replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; }
  function wtState(o, L) { var w = weight(), e = kg(o, L), d = w - e; if (!w) return { ok: false, t: '' }; if (Math.abs(d) <= Math.max(.06, e * .06)) return { ok: true, t: 'Within ' + Math.round(Math.abs(d) * 1000) + ' g of expected.' }; return { ok: false, bad: true, t: (d > 0 ? Math.round(d * 1000) + ' g over' : Math.round(-d * 1000) + ' g under') + ' what this order should weigh. ' + (d > 0 ? 'Check for an extra piece.' : 'Check that every piece is in.') }; }
  function why(o, L) { var left = need(L) - got(L); if (left) return 'Scan ' + (left === 1 ? '1 more piece' : left + ' more pieces') + ' first'; var w = wtState(o, L); if (!weight()) return 'Weigh the parcel first'; if (!w.ok) return 'The weight is off. Check the box, then weigh again'; return ''; }
  function mins(q) { return Math.max(1, Math.round(q.reduce(function (a, o) { return a + 1.1 + .45 * lines(o).reduce(function (b, l) { return b + l.q; }, 0); }, 0))); }
  function awbFor(o) { var c = NL.CARRIER[o.m === 'pickup' || !NL.CARRIER[o.m] ? 'std' : o.m].code, h = 0, s = o.id + Date.now(); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return c + String(100000000 + h % 899999999); }

  function current(r, q) {
    S.notice = '';
    if (r.id) { var w = NL.order(r.id); if (w && q.indexOf(w) >= 0) { if (S.id !== w.id) { S.id = w.id; S.got = []; S.wt = ''; S.note = ''; } return w; } if (w) S.notice = w.id + ' is already packed.'; }
    var o = S.id && NL.order(S.id); if (o && q.indexOf(o) >= 0) return o;
    o = q[0] || null; S.id = o ? o.id : ''; S.got = []; S.wt = ''; S.note = ''; return o;
  }
  function note(o) {
    var n = [];
    if (o.gift && o.gift.note) n.push('<b>Gift note to tuck in:</b> “' + esc(o.gift.note) + '”');
    if (o.gift && o.gift.wrap) n.push('<b>Gift wrap</b>, no prices inside the box.');
    if (o.note) n.push('<b>Note:</b> ' + esc(o.note));
    if (o.m === 'exp' || o.m === 'same') n.push('<b>' + NL.METHOD[o.m] + '.</b> It goes in the first bag at the pickup.');
    if (NL.payStatus(o) === 'cod') n.push('<b>Cash on delivery:</b> the courier collects ' + money(o.total) + '.');
    return n.length ? '<div class="bn-note">' + ic('note') + '<p>' + n.join('<br>') + '</p></div>' : '';
  }

  A.page('bench', {
    title: 'Packing bench', nav: 'bench', flush: true, skeleton: 'none',
    crumbs: function (r) { return [['Orders', '#/orders'], ['Packing bench', '#/bench']].concat(r.id ? [[r.id, '']] : []); },
    docTitle: function (r) { return 'Packing bench' + (r.id ? ' · ' + r.id : ''); },
    render: function (r) {
      var q = queue(), o = current(r, q), now = Date.now(), pk = A.pickup(now), who = packer();
      var head = '<div class="bn-top"><div class="bn-prog"><b>' + (o ? 'Order ' + (S.done + 1) + ' of ' + (S.done + q.length) : 'All packed') + '</b><span>' + (o ? 'about ' + mins(q) + ' min left' : NL.plural(S.done, 'order') + ' packed this session') + '</span><span class="bn-bar" aria-hidden="true"><i style="width:' + Math.round(S.done / Math.max(1, S.done + q.length) * 100) + '%"></i></span></div>' +
        '<span class="bn-pk">' + ic('clock') + (pk.today ? NL.CARRIER.std.name + ' collects in ' + A.dur(pk.t - now) : 'Next pickup ' + (pk.tomorrow ? 'tomorrow' : pk.day) + ', 4 pm') + '</span>' +
        '<label class="bn-who"><span>Packing as</span><select class="sel sm" data-ch="packer">' + PACKERS.map(function (p) { return '<option' + (p === who ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></label>' +
        '<a class="b sm" href="#/orders">' + ic('x') + 'Leave the bench</a></div>';
      if (!o) return '<div class="bn">' + head + '<div class="bn-empty">' + A.empty('check', 'The bench is clear', 'Every paid order is packed for ' + (pk.today ? 'the 4 pm pickup' : 'the next pickup') + '. New orders from the store land here first.', '<a class="b pri" href="#/">' + ic('journey') + 'See every parcel on the map</a>') + '</div></div>';
      var L = lines(o), n = need(L), g = got(L), ready = !why(o, L), w = wtState(o, L), exp = kg(o, L), nx = q.filter(function (x) { return x !== o; })[0];
      var items = L.map(function (l) { var it = o.items[l.i], p = NL.product(it.pid), src = p && p.images[0] ? NL.thumb(p.images[0].src) : '', k = Math.min(l.q, S.got[l.i] || 0), done = k >= l.q;
        return '<button type="button" class="bn-it' + (done ? ' done' : '') + '" data-act="tick" data-i="' + l.i + '" aria-label="' + esc(it.name + ', ' + it.col + (it.s !== 'One size' ? ', ' + it.s : '') + ': ' + k + ' of ' + l.q + ' scanned' + (done ? '' : '. Tap to tick one')) + '">' +
          '<span class="bn-ph">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' : '') + '<span class="bn-ck" aria-hidden="true">' + ic('check') + '</span></span>' +
          '<span class="bn-tx"><b>' + esc(it.name) + '</b><span>' + esc(it.col) + (it.s !== 'One size' ? ' · ' + esc(it.s) : '') + '</span><span class="mono">' + esc(code(it)) + '</span></span>' +
          '<span class="bn-bin"><small>Bin</small>' + bin(it) + '</span><span class="bn-q"><b>' + k + '</b>/' + l.q + '</span></button>'; }).join('');
      var reason = why(o, L);
      return '<div class="bn">' + head + (S.notice ? '<p class="bn-notice">' + ic('check') + esc(S.notice) + ' Next up is ' + esc(o.id) + '.</p>' : '') +
        '<div class="bn-main"><section class="bn-order" aria-label="Order ' + esc(o.id) + '">' +
        '<div class="bn-oh"><div><h1>' + esc(o.id) + '</h1><p>' + esc(o.name) + ' · ' + esc(o.addr.l2.split(',').pop().trim()) + ', ' + esc(o.addr.city) + ' · placed ' + NL.ago(o.t) + '</p></div><div class="bn-tags"><span class="st ' + (o.m === 'std' || o.m === 'pickup' ? 'c-mute' : 'c-acc') + '">' + (o.m === 'pickup' ? 'Collect at the pop-up' : NL.METHOD[o.m]) + '</span>' + A.payPill(o) + '</div></div>' +
        note(o) + '<div class="bn-items' + (L.length === 1 ? ' one' : L.length === 2 ? ' two' : '') + '">' + items + '</div><p class="bn-cnt"><b>' + g + ' of ' + n + '</b> pieces in the box' + (nx ? '<span class="mute"> · up next: ' + esc(nx.id) + ', ' + NL.plural(lines(nx).reduce(function (a, l) { return a + l.q; }, 0), 'piece') + ' for ' + esc(nx.addr.city) + '</span>' : '') + '</p></section>' +
        '<aside class="bn-side" aria-label="Pack and label"><div class="bn-scan"><label for="bnScan">Scan or type a code</label><div class="bn-in">' + ic('search') + '<input id="bnScan" type="text" autocomplete="off" spellcheck="false" autocapitalize="characters" data-kd="scan" placeholder="' + esc(code(o.items[L[0].i])) + '" aria-describedby="bnMsg"></div>' +
        '<p class="bn-msg' + (S.msg ? ' ' + S.msg.t : '') + '" id="bnMsg" aria-live="polite">' + (S.msg ? S.msg.h : 'Press Enter after each code, or tap a piece.') + '</p></div>' +
        '<div class="bn-wt' + (g < n ? ' off' : '') + '"><div class="bn-wh"><span>Weight check</span><b>Expected ' + exp.toFixed(2) + ' kg</b></div><div class="bn-wi"><label class="vh" for="bnWt">Weighed, in kilograms</label><input id="bnWt" class="in" type="text" inputmode="decimal" data-in="wt" value="' + esc(S.wt) + '" placeholder="0.00"' + (g < n ? ' disabled' : '') + '><span>kg</span><button class="b sm" type="button" data-act="read"' + (g < n ? ' disabled' : '') + '>' + ic('package') + 'Read the scale</button></div>' +
        '<p class="bn-wm ' + (w.ok ? 'ok' : w.bad ? 'bad' : '') + '" id="bnWm">' + esc(w.t) + '</p></div>' +
        '<div class="bn-cour"><label for="bnNote">Note for the courier</label><input id="bnNote" class="in" type="text" data-in="note" value="' + esc(S.note) + '" placeholder="For example: call before delivering" maxlength="120"></div>' +
        '<div class="bn-go"><button class="b pri lg" type="button" data-act="pack" id="bnPack"' + (ready ? '' : ' aria-disabled="true"') + '>' + ic('printer') + 'Print label and next <kbd>P</kbd></button><p class="bn-why" id="bnWhy">' + esc(reason || 'Ready. The label prints and the next order opens.') + '</p>' +
        '<button class="b sm ghost" type="button" data-act="skip">Skip for now <kbd>N</kbd></button></div></aside></div></div>';
    },
    mount: function () { document.body.classList.add('benching'); var i = $('#bnScan'); if (i && !A.reduce) setTimeout(function () { try { i.focus({ preventScroll: true }); } catch (e) {} }, 30); },
    leave: function () { document.body.classList.remove('benching'); S.msg = null; },
    remote: function () { A.refresh(); },
    keys: { p: function () { pack(); }, P: function () { pack(); }, n: function () { skip(); }, N: function () { skip(); }, Escape: function () { A.go('orders'); } },
    acts: {
      tick: function (b) { var o = NL.order(S.id), i = +b.getAttribute('data-i'), l = o && lines(o).filter(function (x) { return x.i === i; })[0]; if (!l) return; if ((S.got[i] || 0) >= l.q) { say('bad', 'Already counted. ' + esc(o.items[i].name) + ' needs ' + l.q + '.'); return; } S.got[i] = (S.got[i] || 0) + 1; say('ok', esc(o.items[i].name) + ' ticked by hand.'); A.refresh(); },
      scan: function (inp, e) { if (e.key === 'Escape') { inp.blur(); return; } if (e.key !== 'Enter') return; e.preventDefault(); var v = inp.value; inp.value = ''; if (!v.trim()) { pack(); return; } scan(v); },
      read: function () { var o = NL.order(S.id); if (!o) return; var L = lines(o), e = kg(o, L), h = 0; for (var i = 0; i < o.id.length; i++) h = (h * 7 + o.id.charCodeAt(i)) % 41; S.wt = (e + (h - 20) / 1000).toFixed(2); var f = $('#bnWt'); if (f) f.value = S.wt; sync(); },
      wt: function (inp) { S.wt = inp.value; sync(); },
      note: function (inp) { S.note = inp.value; },
      pack: function () { pack(); },
      skip: function () { skip(); },
      packer: function (s) { try { localStorage.setItem('nl-bench-packer', s.value); } catch (e) {} A.toast('Packing as ' + esc(s.value)); }
    }
  });
  function say(t, h) { S.msg = { t: t, h: h }; var m = $('#bnMsg'); if (m) { m.className = 'bn-msg ' + t; m.innerHTML = h; } }
  // weight typed or read: update the check and the print button without redrawing the page
  function sync() { var o = NL.order(S.id); if (!o) return; var L = lines(o), w = wtState(o, L), r = why(o, L), m = $('#bnWm'), b = $('#bnPack'), y = $('#bnWhy');
    if (m) { m.className = 'bn-wm ' + (w.ok ? 'ok' : w.bad ? 'bad' : ''); m.textContent = w.t; } if (b) { if (r) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); } if (y) y.textContent = r || 'Ready. The label prints and the next order opens.'; }
  function scan(raw) {
    var c = String(raw || '').trim().toUpperCase().replace(/\s+/g, ''), o = NL.order(S.id); if (!c || !o) return false;
    var L = lines(o), hit = -1, dup = -1;
    L.forEach(function (l) { if (code(o.items[l.i]).toUpperCase() !== c) return; if ((S.got[l.i] || 0) < l.q) { if (hit < 0) hit = l.i; } else dup = l.i; });
    if (hit >= 0) { S.got[hit] = (S.got[hit] || 0) + 1; var it = o.items[hit], left = need(L) - got(L); say('ok', esc(it.name) + ', ' + esc(it.col) + (it.s !== 'One size' ? ' ' + esc(it.s) : '') + ' · ' + (left ? left + ' to go' : 'that’s everything. Weigh the box.')); A.refresh(); return true; }
    if (dup >= 0) { say('bad', 'Already scanned. ' + esc(o.id) + ' needs ' + L.filter(function (l) { return l.i === dup; })[0].q + ' of the ' + esc(o.items[dup].name) + '.'); return false; }
    var other = null; NL.products({ all: true }).forEach(function (p) { NL.variants(p).forEach(function (v) { if (!other && String(v.code).toUpperCase() === c) other = { p: p, v: v }; }); });
    if (other) { say('bad', 'That’s the ' + esc(other.p.name) + ' in ' + esc(other.v.col) + (other.v.s !== 'One size' ? ', ' + esc(other.v.s) : '') + '. It isn’t in ' + esc(o.id) + ': back to bin ' + bin({ pid: other.p.id, c: other.v.c }) + '.'); return false; }
    say('bad', 'No piece has the code “' + esc(c) + '”. Check the tag, or tap the piece instead.'); return false;
  }
  function skip() { var o = NL.order(S.id); if (!o) return; S.skip = S.skip.filter(function (x) { return x !== o.id; }); S.skip.push(o.id); S.id = ''; S.msg = null; A.toast(esc(o.id) + ' moved to the end of the queue.', { icon: 'clock' }); A.go('bench'); }
  function labelHtml(o, sh, wt) {
    var a = o.addr, bars = '', s = sh.awb; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); bars += '<i style="width:' + (1 + c % 3) + 'px"></i><b style="width:' + (1 + (c >> 2) % 3) + 'px"></b>'; }
    return '<div class="lbl"><div class="lbl-h"><span class="lbl-brand">Northlane</span><span>' + esc(sh.carrier) + ' · ' + (NL.METHOD[o.m] || 'Standard') + '</span></div>' +
      '<div class="lbl-to"><span class="k">Ship to</span><b>' + esc(a.name) + '</b><p>' + esc(a.l1) + '<br>' + esc(a.l2) + '<br>' + esc(a.city) + ', ' + esc(a.state) + ' ' + esc(a.pin) + '</p><p>' + esc(NL.maskPhone(a.phone || '')) + '</p></div>' +
      '<div class="lbl-bc"><div class="lbl-bars" aria-hidden="true">' + bars + '</div><span class="mono">' + esc(s.replace(/^([A-Z]+)(\d{3})(\d{3})(\d+)$/, '$1 $2 $3 $4')) + '</span></div>' +
      '<div class="lbl-g"><div><span class="k">Order</span><b>' + esc(o.id) + '</b></div><div><span class="k">Weight</span><b>' + wt.toFixed(2) + ' kg</b></div><div><span class="k">Pieces</span><b>' + sh.lines.reduce(function (x, l) { return x + l.q; }, 0) + '</b></div><div><span class="k">Payment</span><b>' + (NL.payStatus(o) === 'cod' ? 'COD ' + money(o.total) : 'Prepaid') + '</b></div></div>' +
      '<div class="lbl-fr"><span class="k">From</span> Northlane studio, Jaipur · returns to the same address</div></div>';
  }
  function pack() {
    var o = NL.order(S.id); if (!o) return; var L = lines(o), r = why(o, L);
    if (r) { say('bad', esc(r) + '.'); var f = need(L) > got(L) ? $('#bnScan') : $('#bnWt'); if (f) f.focus(); return; }
    var by = packer(), t0 = Date.now(), snap = { tl: o.tl.length, tags: o.tags.slice() }, wt = weight();
    var sh = NL.fulfil(o, L, { by: by }); if (!sh) { say('bad', 'Nothing left to pack on ' + esc(o.id) + '.'); return; }
    sh.awb = sh.awb || awbFor(o); sh.wt = wt;
    if (S.note.trim()) NL.addNote(o, 'For the courier: ' + S.note.trim(), by); NL.save('orders');
    var label = labelHtml(o, sh, wt), id = o.id, sid = sh.id;
    if (window.__tour) { var pv = A.modal({ title: 'Label printed', sub: esc(sh.carrier) + ' · AWB ' + esc(sh.awb), size: 'sm', body: '<div class="lbl-pv">' + label + '</div>' }); setTimeout(function () { pv.close(); }, 3200); } else A.print(label);
    S.done++; S.id = ''; S.got = []; S.wt = ''; S.note = ''; S.msg = null;
    A.toast('<b>' + esc(id) + '</b> packed by ' + esc(by.split(' ')[0]) + ' · label printed', { icon: 'printer', undo: function () { unpack(id, sid, snap, t0, by); } });
    A.go('bench');
  }
  function unpack(id, sid, snap, t0, by) {
    var D = NL.db(), o = NL.order(id); if (!o) return; var ix = -1; o.ships.forEach(function (s, i) { if (s.id === sid) ix = i; }); if (ix < 0) return;
    var sh = o.ships[ix]; if (NL.STG.indexOf(sh.stage) > 1) { A.toast('It has gone with the courier, so it can’t come back to the bench.', { bad: true }); return; }
    o.ships.splice(ix, 1); sh.lines.forEach(function (l) { var it = o.items[l.i], k = NL.skuKey(it.pid, it.c, it.s); (D.inv[k] = D.inv[k] || { on: 0, low: 2 }).on += l.q; });
    D.ledger = D.ledger.filter(function (e) { return !(e.ref === id && e.r === 'Fulfilled' && e.t >= t0 - 5); });
    o.tl.length = Math.min(o.tl.length, snap.tl); o.tags = snap.tags; NL.log('Unpacked order', id, 'Back on the bench', by); NL.bump(); NL.save('orders');
    S.done = Math.max(0, S.done - 1); S.id = id; S.got = []; A.go('bench/' + id);
  }
  A.bench = { scan: scan, pack: pack, read: function () { var b = $('[data-act="read"]'); if (b) b.click(); }, state: function () { var o = NL.order(S.id); return o ? { id: o.id, need: need(lines(o)), got: got(lines(o)), ready: !why(o, lines(o)) } : null; }, code: function (o, i) { return code(o.items[i]); } };
  A.cmd({ label: 'Open the packing bench', icon: 'package', kbd: 'G B', keys: 'pack fulfil scan label bench', run: function () { A.go('bench'); } });
})();
