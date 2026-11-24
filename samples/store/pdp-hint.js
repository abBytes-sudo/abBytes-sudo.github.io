/* Product page: asks for the product photograph the moment the head is parsed, in parallel with the stylesheets.
   It is the page's largest paint; pdp-preload.js then paints it, and product.js builds the full gallery. Tiny on purpose. */
(function () {
  try {
    var id = new URLSearchParams(location.search).get('id'); if (!id || !/^[a-z0-9-]+$/.test(id)) return;
    var l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = 'products/w/' + id + '-900.webp';
    l.setAttribute('imagesrcset', 'products/w/' + id + '-450.webp 450w, products/w/' + id + '-900.webp 900w'); l.setAttribute('imagesizes', '(max-width:960px) 100vw, 50vw'); l.setAttribute('fetchpriority', 'high');
    document.head.appendChild(l);
  } catch (e) {}
})();
