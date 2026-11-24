/* Starts the first row of product photographs downloading before the deferred scripts render the grid (unfiltered shop only). */
(function () {
  try {
    if (location.search && !/^\?cat=Clothing$/.test(location.search)) return;
    var ids = location.search ? ['harbor-jacket', 'everyday-tee', 'loop-hoodie'] : ['harbor-jacket', 'atelier-tote', 'meridian-38'];
    ids.forEach(function (id) { var l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.href = 'products/w/' + id + '-450.webp'; l.setAttribute('imagesrcset', 'products/w/' + id + '-450.webp 450w, products/w/' + id + '-900.webp 900w'); l.setAttribute('imagesizes', '(max-width:960px) 50vw, 25vw'); document.head.appendChild(l); });
  } catch (e) {}
})();
