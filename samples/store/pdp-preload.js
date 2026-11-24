/* Paints the product photograph straight away, before the deferred page scripts run (it is the largest paint on the product page).
   product.js replaces this with the full gallery from the shared catalogue (including any photo the admin has swapped in) a moment later. */
(function () {
  try {
    var id = new URLSearchParams(location.search).get('id'), g = document.getElementById('gal');
    if (!g || g.children.length || !id || !/^[a-z0-9-]+$/.test(id)) return;
    var f = document.createElement('div'), i = document.createElement('img');
    i.src = 'products/' + id + '.jpg'; i.srcset = 'products/w/' + id + '-450.webp 450w, products/w/' + id + '-900.webp 900w'; i.sizes = '(max-width:960px) 100vw, 50vw'; i.alt = ''; i.width = 900; i.height = 1125; i.setAttribute('fetchpriority', 'high'); i.decoding = 'async';
    i.onerror = function () { f.hidden = true; };
    f.className = 'f m'; f.appendChild(i); g.appendChild(f);
  } catch (e) {}
})();
