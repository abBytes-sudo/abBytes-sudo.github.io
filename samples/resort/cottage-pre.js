/* Runs synchronously right after the hero photo so the first frame already shows the right cottage:
   the cross-document view transition morphs the card photo into this one. Keep in sync with data.js (hero, name). */
(function () {
  var M = { deodar: ['deodar-bed', 'Deodar Rooms', 'Morning light in Deodar Room D4'], ridge: ['ridge-hearth', 'Ridge Cottages', 'The dry-stone fireplace in Ridge Cottage R2'],
    orchard: ['orchard-living', 'Orchard Houses', 'The long living room of Orchard House O1'], star: ['star-aframe', 'Star House', 'The glass gable over the bed in the Star House'] };
  var id = new URLSearchParams(location.search).get('id'); if (!M[id]) id = 'ridge';
  var v = M[id], img = document.getElementById('cp-img');
  img.src = 'photos/' + v[0] + '.jpg'; img.srcset = 'photos/' + v[0] + '-s.jpg 760w, photos/' + v[0] + '.jpg 1600w'; img.alt = v[2];
  document.title = v[1] + ' · Taradhura';
  document.documentElement.dataset.cot = id;
})();
