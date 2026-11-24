/* Stockroom design system page: swatches with live contrast, spacing, components and icons, all from stockroom.css. */
(function () {
  'use strict';
  var V = window.SRV, $ = function (s) { return document.querySelector(s); };
  if (!V || !V.icon || !window.Code128) return; // the page is pre-rendered; this script only refreshes it and draws barcodes
  var root = getComputedStyle(document.documentElement);
  function tok(n) { return root.getPropertyValue(n).trim(); }
  function lum(hex) {
    var c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    return [0, 2, 4].map(function (i) { var v = parseInt(c.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [.2126, .7152, .0722][i]; }, 0);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  var SW = [['--paper', 'App canvas'], ['--paper-2', 'Wells, segmented controls'], ['--sheet', 'Panels, tables'], ['--rule', 'Hairlines'], ['--ink', 'Text, primary buttons'], ['--ink-2', 'Secondary text'], ['--ink-3', 'Tertiary text, meta'],
    ['--accent', 'Selection, focus, chart'], ['--accent-soft', 'Selected rows'], ['--ok', 'In stock'], ['--low', 'Below reorder point'], ['--out', 'Out of stock, late'], ['--lumen', 'Lumen CRM badge only']];
  $('#swatches').innerHTML = SW.map(function (s) {
    var v = tok(s[0]), r = /^#/.test(v) ? ratio(v, '#FFFFFF') : 0;
    return '<div><i style="background:var(' + s[0] + ')"></i><b>' + s[0] + '</b><span>' + s[1] + '<br><em>' + v + (r > 1.2 ? ' · ' + r.toFixed(1) + ':1 on white' : '') + '</em></span></div>';
  }).join('');
  $('#space').innerHTML = [4, 8, 12, 16, 24, 32, 48].map(function (n) { return '<div><i style="width:' + n + 'px;height:' + n + 'px"></i>' + n + '</div>'; }).join('') +
    ['6px · control', '10px · panel', '12px · canvas', '999px · status'].map(function (r) { return '<div><i style="width:56px;height:40px;border-radius:' + r.split(' ')[0] + ';background:var(--sheet);border:1px solid var(--rule-2)"></i>' + r + '</div>'; }).join('');
  var I = V.icon;
  var C = [
    ['Buttons', '.btn', '<button class="btn primary">' + I('check') + 'Approve</button><button class="btn">' + I('receipt') + 'Receive</button><button class="btn ghost">Cancel</button><button class="btn accent">' + I('camera') + 'Start camera</button><button class="btn" disabled>Disabled</button>'],
    ['Quick actions', '.qbtn', '<span class="qa"><a class="qbtn" href="#">' + I('scan') + 'Scan</a><a class="qbtn" href="#">' + I('plus') + 'New PO</a><a class="qbtn" href="#">' + I('transfer') + 'Transfer</a></span>'],
    ['Stock status', '.pill', '<span class="pill ok">In stock</span><span class="pill low">Below reorder</span><span class="pill out">Out of stock</span><span class="pill acc">Picking</span><span class="pill">Reserved</span>'],
    ['Movement types', '.mv', V.mv('receipt') + V.mv('transfer') + V.mv('sale') + V.mv('adjustment')],
    ['Cross-product badge', '.crm', V.crm() + '<span class="tag">Auto-drafted</span><span class="kbd">⌘K</span><span class="chip up">▲ 0.2%</span>'],
    ['Inputs', '.input .seg .stepper', '<label class="search" style="width:200px"><span class="vh">Search</span>' + I('search') + '<input class="input" placeholder="Search"></label><span class="seg"><button aria-pressed="true">All</button><button aria-pressed="false">Bhiwandi</button><button aria-pressed="false">Hoskote</button></span><span class="stepper"><button type="button" class="st-btn" aria-label="Fewer">−</button><input class="input num" value="12" aria-label="Quantity"><button type="button" class="st-btn" aria-label="More">+</button></span>'],
    ['Toast with undo', '.toast', '<div class="toast"><span class="tx">Approved <span class="mono">PO-1046</span> · sent to Kaveri Woodcraft</span><button type="button" class="undo">Undo <span class="kbd">⌘Z</span></button></div>'],
    ['Empty state', '.empty2', V.empty('check', 'All clear', 'Nothing needs you right now.')],
    ['Item label · Code 128', '.label', '<div class="label" style="width:260px"><div class="b"><span>Halden Supply</span><span>Lighting</span></div><div class="n">Brass pendant lamp</div><div class="v">Spun brass · bin B-02</div><canvas data-bc="HS-LT-014" width="300" height="80" role="img" aria-label="Barcode HS-LT-014"></canvas></div>'],
    ['Status stepper', '.stepper4', V.stepper4(['Draft', 'Sent', 'Partly received', 'Received'], 2)],
    ['Work card · Today', '.task', '<ul class="tasks" style="width:100%"><li class="task acc"><span class="tic">' + I('box') + '</span><div class="grow"><b>3 orders to pick</b><span>SO-2255 for Asha Interiors is next · 8 lines</span></div><span class="tchip">≈ 12 m</span><span class="btn primary">Start picking</span></li></ul>'],
    ['Object chips', '.obj .skup', '<span class="obj">' + I('sales', 'sm') + 'SO-2262</span><span class="obj">' + I('purchasing', 'sm') + 'PO-1046</span><span class="obj bin-c">BHW-A-03</span><span class="skup">HS-CH-001</span><span class="skup sn">Serial</span>'],
    ['Jargon, explained in place', '.tip', '<span>Reorder point ' + V.tip('rop', 'reorder point') + '</span><span>FIFO ' + V.tip('fifo', 'FIFO') + '</span><span class="faint" style="font-size:12.5px">Hover or focus the ?</span>'],
    ['Focus card · pick mode', '.focus', '<div class="focus" style="width:100%"><div class="fx-top"><span class="fx-k">Go to bin</span><b class="fx-bin">BHW-A-08</b><span class="fx-s">Bhiwandi · zone A · pallet racking</span></div><div class="outcomes"><span class="faint">Something wrong?</span><span class="oc">Found fewer</span><span class="oc">Damaged</span><span class="oc">Bin empty</span></div></div>']
  ];
  $('#comp').innerHTML = C.map(function (c) { return '<section class="panel"><header><h3>' + c[0] + '</h3><small>' + c[1] + '</small></header><div class="pad">' + c[2] + '</div></section>'; }).join('');
  ['overview', 'items', 'locations', 'ledger', 'sales', 'purchasing', 'scan', 'labels', 'reports', 'receipt', 'sale', 'transfer', 'adjustment', 'camera', 'print', 'alert', 'bolt', 'link', 'box', 'search'].forEach(function (k, i, a) {
    if (!i) $('#icons').innerHTML = '';
    $('#icons').insertAdjacentHTML('beforeend', '<div>' + I(k) + k + '</div>');
  });
  [].forEach.call(document.querySelectorAll('canvas[data-bc]'), function (c) { window.Code128.draw(c, c.dataset.bc, { module: 2, height: 56 }); });
})();
