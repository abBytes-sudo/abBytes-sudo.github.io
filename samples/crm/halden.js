/* Lumen CRM Pro — Halden Supply catalogue (fictional furniture and lighting distributor)
   and the cross-sample demo bridge. The 20 SKUs below are Stockroom's catalogue, used verbatim.
   Bridge keys (both optional; each app works alone):
   - demo-bridge:won-deals  [{ id, customer, wonAt, items: [{ sku, name, qty }] }]   written here
   - demo-bridge:stock      { [sku]: { name, available } }                            read here (Stockroom writes it) */
(function () {
  'use strict';
  var C = window.CRM = window.CRM || {};

  // sku, name, category, list price (₹ per unit, ex-GST)
  // Identical to Stockroom's catalogue (site/samples/stockroom/data.js, window.HALDEN_SKUS).
  C.HALDEN = [
    ["HS-CH-001", "Oak dining chair", "Seating", 9800],
    ["HS-CH-002", "Walnut dining chair", "Seating", 11600],
    ["HS-CH-003", "Cane bar stool", "Seating", 7900],
    ["HS-CH-004", "Bouclé lounge chair", "Seating", 29000],
    ["HS-TB-005", "Oak dining table, 180 cm", "Tables", 52000],
    ["HS-TB-006", "Oak dining table, 220 cm", "Tables", 63000],
    ["HS-TB-007", "Travertine coffee table", "Tables", 42000],
    ["HS-SF-008", "Linen 3-seat sofa, Sand", "Sofas", 78000],
    ["HS-SF-009", "Linen 3-seat sofa, Moss", "Sofas", 78000],
    ["HS-ST-010", "Teak sideboard", "Storage", 55000],
    ["HS-ST-011", "Oak bookshelf", "Storage", 24900],
    ["HS-ST-012", "Cane bedside cabinet", "Storage", 13900],
    ["HS-LT-013", "Opal globe pendant", "Lighting", 6400],
    ["HS-LT-014", "Brass pendant lamp", "Lighting", 8900],
    ["HS-LT-015", "Linen floor lamp", "Lighting", 11500],
    ["HS-LT-016", "Ceramic table lamp", "Lighting", 5600],
    ["HS-LT-017", "Brass wall sconce", "Lighting", 4700],
    ["HS-LT-018", "LED track spot, 4-pack", "Lighting", 8400],
    ["HS-RG-019", "Jute rug, 200 × 300 cm", "Textiles", 15800],
    ["HS-TX-020", "Linen cushion cover", "Textiles", 890]
  ].map(function (r) { return { sku: r[0], name: r[1], cat: r[2], price: r[3] }; });
  C.sku = function (s) { return C.HALDEN.filter(function (x) { return x.sku === s; })[0]; };

  function read(k) { try { var v = JSON.parse(localStorage.getItem(k)); return v; } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  C.bridge = {
    // stock: returns { sku: { name, available } } or null when Stockroom has never run in this browser
    stock: function () { var s = read('demo-bridge:stock'); return s && typeof s === 'object' && !Array.isArray(s) ? s : null; },
    wonDeals: function () { var a = read('demo-bridge:won-deals'); return Array.isArray(a) ? a : []; },
    // upsert by deal id so re-winning a deal never double-reserves stock
    pushWon: function (rec) {
      var a = C.bridge.wonDeals().filter(function (x) { return x && x.id !== rec.id; }); a.push(rec);
      return write('demo-bridge:won-deals', a.slice(-60));
    },
    // optional, written by Stockroom: { [dealId]: { so, status, lines: [{ sku, qty, res }] } }
    orders: function () { var o = read('demo-bridge:orders'); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; },
    order: function (id) { var o = C.bridge.orders(); return o && o[id] ? o[id] : null; },
    onStock: function (fn) { window.addEventListener('storage', function (e) { if (e.key === 'demo-bridge:stock' || e.key === 'demo-bridge:orders') fn(); }); },
    pullWon: function (id) { var a = C.bridge.wonDeals().filter(function (x) { return x && x.id !== id; }); return write('demo-bridge:won-deals', a); }
  };
})();
