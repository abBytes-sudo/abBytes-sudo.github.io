/* Northlane catalogue: shared by the store and the order tracking pages (fictional products, real photography). */
(function () {
  'use strict';
  var C = function (n, h) { return { n: n, h: h }; };
  // dp = two detail crops for the product gallery: [x%, y%] focus points
  var P = [
    { id: 'harbor-jacket', name: 'Harbor Jacket', cat: 'Clothing', for: 'Women', price: 210, isNew: true, sizes: ['XS', 'S', 'M', 'L'], colors: [C('Rust', '#B0644A'), C('Navy', '#28324A'), C('Black', '#1F1D1B')],
      alt: 'A rust-coloured zip bomber jacket on a hanger, held up against a pale wall', dp: [[50, 20], [84, 62]], look: ['easy-trousers', 'rib-knit', 'atelier-tote'],
      desc: 'A light bomber in water-resistant cotton twill, with a ribbed collar, a brass zip and a soft rust finish that deepens with wear.', mat: 'Cotton twill, 100% organic. Brass zip, corozo-free ribbed trims. Cold wash, hang to dry.' },
    { id: 'atelier-tote', name: 'Atelier Tote', cat: 'Bags', for: 'Women', price: 185, sizes: ['One size'], colors: [C('Cognac', '#9A5A2B'), C('Black', '#221E1B'), C('Bone', '#E3D8C6')],
      alt: 'A cognac leather tote bag hanging from two hooks on a white door', dp: [[32, 12], [60, 64]], look: ['mini-crossbody', 'meridian-38', 'rib-knit'],
      desc: 'Full-grain, vegetable-tanned leather that softens with every day. A magnetic clasp, hand-stitched handles and room for a 14 inch laptop.', mat: 'Vegetable-tanned full-grain leather, cotton lining. Wipe clean, condition twice a year.', dims: [['Height', '34 cm'], ['Width', '38 cm'], ['Depth', '12 cm'], ['Handle drop', '24 cm'], ['Weight', '780 g']] },
    { id: 'meridian-38', name: 'Meridian 38', cat: 'Accessories', for: 'Unisex', price: 240, sizes: ['38 mm'], colors: [C('Black dial', '#14110F'), C('Ivory dial', '#EFE7D8'), C('Forest dial', '#24402F')],
      alt: 'A steel wristwatch with a black dial and a brushed link bracelet against a dark cloth', dp: [[50, 52], [52, 22]], look: ['atelier-tote', 'coast-sunglasses', 'everyday-tee'],
      desc: 'A quiet steel watch with a black dial, slim batons and a brushed link bracelet that sits flat on the wrist. Thirty-eight millimetres, nothing more.', mat: 'Brushed stainless steel case and bracelet, mineral crystal. Water resistant to 30 m.', dims: [['Case diameter', '38 mm'], ['Case thickness', '8 mm'], ['Bracelet width', '18 mm'], ['Wrist fit', '14 to 19 cm'], ['Weight', '92 g']] },
    { id: 'coast-sunglasses', name: 'Coast Sunglasses', cat: 'Accessories', for: 'Unisex', price: 95, isNew: true, sizes: ['One size'], colors: [C('Tortoise', '#6B3E26'), C('Black', '#151312'), C('Honey', '#C88A3A')],
      alt: 'Round tortoiseshell sunglasses with dark lenses on a pale surface', dp: [[26, 44], [58, 40]], look: ['rib-knit', 'field-cap', 'everyday-tee'],
      desc: 'Hand-polished acetate frames with polarised lenses and five-barrel hinges. A round shape that sits well on almost every face.', mat: 'Bio-acetate frames, polarised UV400 lenses. Soft case included.', dims: [['Lens width', '49 mm'], ['Bridge', '21 mm'], ['Temple length', '145 mm'], ['Weight', '28 g']] },
    { id: 'drift-runner', name: 'Desert Boot', cat: 'Shoes', for: 'Unisex', price: 148, isNew: true, sizes: ['40', '41', '42', '43', '44', '45'], colors: [C('Olive', '#6E6B3F'), C('Sand', '#CDBFA6'), C('Charcoal', '#3A3836')],
      alt: 'A pair of olive suede desert boots with crepe soles beside a piece of driftwood', dp: [[48, 52], [30, 72]], look: ['easy-trousers', 'loop-hoodie', 'everyday-tee'],
      desc: 'Olive suede on a natural crepe sole, unlined and soft from the first wear. The boot we reach for from October to March.', mat: 'Suede upper, natural crepe sole, Goodyear-welted heel. Brush, never soak.', dims: [['Sole length (EU 42)', '29.5 cm'], ['Shaft height', '10 cm'], ['Fit', 'True to size'], ['Weight (pair)', '820 g']] },
    { id: 'court-low', name: 'Sage Brogue', cat: 'Shoes', for: 'Unisex', price: 138, sizes: ['39', '40', '41', '42', '43', '44'], colors: [C('Sage', '#5E8B7A'), C('Black', '#1E1C1A'), C('Chalk', '#EEEAE2')],
      alt: 'A sage-green suede slip-on brogue with a perforated toe, resting on a pale pink plinth', dp: [[46, 56], [64, 36]], look: ['easy-trousers', 'rib-knit', 'field-cap'],
      desc: 'A slip-on brogue in soft sage-green suede, with a perforated toe, a low stacked heel and a stitched sole. Dressed up or down, it holds its own.', mat: 'Suede upper, leather lining and sole, rubber heel tap. Brush clean, protect with suede spray.', dims: [['Sole length (EU 42)', '29 cm'], ['Heel height', '2.5 cm'], ['Fit', 'True to size'], ['Weight (pair)', '780 g']] },
    { id: 'field-cap', name: 'Field Cap', cat: 'Accessories', for: 'Unisex', price: 42, sizes: ['One size'], colors: [C('White', '#F2EFE9'), C('Stone', '#CFC6B5'), C('Navy', '#26324A')],
      alt: 'A white trucker cap with a curved brim and mesh back on a pale background', dp: [[50, 42], [84, 52]], look: ['loop-hoodie', 'everyday-tee', 'coast-sunglasses'],
      desc: 'A soft-fronted trucker in washed cotton with a curved brim, a breathable mesh back and an adjustable snap closure.', mat: 'Cotton front, recycled polyester mesh. Spot clean.', dims: [['Crown height', '11 cm'], ['Brim length', '7 cm'], ['Head size', '54 to 62 cm, adjustable'], ['Weight', '70 g']] },
    { id: 'mini-crossbody', name: 'Mini Crossbody', cat: 'Bags', for: 'Women', price: 120, sizes: ['One size'], colors: [C('Tan', '#A8602F'), C('Black', '#221E1B'), C('Sand', '#CDBFA6')],
      alt: 'A tan leather crossbody bag with a zip top, a flap pocket and a detached strap on a pale studio background', dp: [[66, 36], [26, 66]], look: ['rib-knit', 'atelier-tote', 'meridian-38'],
      desc: 'Compact enough for the evening, roomy enough for a phone, keys and a lipstick. A zip top, a flap pocket on the front and an adjustable strap.', mat: 'Smooth tanned leather, cotton lining, gunmetal hardware. Wipe with a dry cloth.', dims: [['Height', '17 cm'], ['Width', '24 cm'], ['Depth', '8 cm'], ['Strap drop', '52 to 62 cm'], ['Weight', '520 g']] },
    { id: 'everyday-tee', name: 'Everyday Tee', cat: 'Clothing', for: 'Men', price: 38, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: [C('White', '#F2EEE6'), C('Clay', '#B97A5B'), C('Ink', '#25262E')],
      alt: 'A white crew-neck t-shirt on a wooden hanger against a pale wall', dp: [[50, 16], [86, 32]], look: ['easy-trousers', 'field-cap', 'drift-runner'],
      desc: 'Heavyweight organic cotton, a relaxed shoulder and a neckline that holds its shape wash after wash.', mat: '240 gsm organic cotton jersey. Wash at 30 degrees, tumble dry low.' },
    { id: 'loop-hoodie', name: 'Loop Hoodie', cat: 'Clothing', for: 'Unisex', price: 88, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: [C('White', '#F2EFE9'), C('Oat', '#D9CDB8'), C('Charcoal', '#3A3836')],
      alt: 'A white hoodie hanging on a wall beside dried palm leaves', dp: [[66, 40], [60, 20]], look: ['easy-trousers', 'field-cap', 'drift-runner'],
      desc: 'Loopback cotton fleece, brushed inside, with a double-layer hood and deep pockets. The easiest layer you will own.', mat: 'Organic cotton loopback fleece, 380 gsm. Wash inside out, dry flat.' },
    { id: 'easy-trousers', name: 'Easy Trousers', cat: 'Clothing', for: 'Women', price: 96, sizes: ['XS', 'S', 'M', 'L'], colors: [C('Sage', '#A9C4B2'), C('Stone', '#BDB39F'), C('Black', '#1F1D1B')],
      alt: 'Cropped sage-green trousers with a drawcord waist, worn by a model', dp: [[50, 10], [50, 86]], look: ['rib-knit', 'drift-runner', 'mini-crossbody'],
      desc: 'A relaxed, cropped leg in washed cotton with a drawcord waist and side pockets. Cut to sit just above the ankle.', mat: 'Washed organic cotton twill. Machine wash cold, line dry.' },
    { id: 'rib-knit', name: 'Rib Knit', cat: 'Clothing', for: 'Women', price: 110, sizes: ['XS', 'S', 'M', 'L'], colors: [C('Cream', '#EDE6D6'), C('Moss', '#7A7A58'), C('Rose', '#C98C86')],
      alt: 'A cream ribbed roll-neck sweater held up on a hanger against a soft lilac wall', dp: [[60, 40], [70, 18]], look: ['easy-trousers', 'mini-crossbody', 'coast-sunglasses'],
      desc: 'A soft, chunky rib in merino with a slightly cropped shape and a high neck. Warm without the weight.', mat: 'Extra-fine merino, responsibly sourced. Hand wash cool, dry flat.' }
  ];
  var byId = {}; P.forEach(function (p) { byId[p.id] = p; });
  window.NLCAT = { P: P, byId: byId };
})();
