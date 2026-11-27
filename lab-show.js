/* 3D Lab: one exhibit in focus. The picture is a capture of the real piece; "Run it live" loads the project itself in its place. */
(function () {
  'use strict';
  var d = document, $ = function (s) { return d.querySelector(s); };
  /* id, title, where it is from, what it shows, page to run, poster, runs in place */
  var X = [
    ['ghatika', 'An exploded watch', 'Ghatika, a watch maison', 'A mechanical watch that comes apart layer by layer as you scroll: crystal, hands, dial, case, movement. The same model drives a configurator for dial, case and strap.', 'samples/watch/index.html', 'img/lab/ghatika.webp', 1],
    ['revv', 'A car under X-ray', 'Revv, a marketplace for pre-owned cars and superbikes', 'A car you walk around, then see through: a 150-point inspection drawn onto the body as an X-ray lens passes over it.', 'samples/revv/index.html', 'img/lab/revv.webp', 1],
    ['aaranya', 'Towers with floors that pull out', 'Aaranya Residences, a property launch', 'Three high-rise towers. Scroll into one, pull a floor out like a drawer to see which homes are free, and move the sun across the day.', 'samples/launch/index.html', 'img/lab/aaranya.webp', 1],
    ['sthira', 'A building that rises', 'Sthira, a design-build firm', 'A project drawn like an engineering sheet that rises stage by stage as you scroll, from the foundation to the finishes.', 'samples/build/index.html', 'img/lab/sthira.webp', 1],
    ['taradhura', 'A ridge from dawn to starlight', 'Taradhura, a hill retreat', 'A Kumaon hillside painted in layers. Scrolling moves the day from first light, through the mist lifting, to night.', 'samples/resort/index.html', 'img/lab/taradhura.webp', 1],
    ['black-hole', 'The black hole', 'this portfolio', 'A black hole drawn one ray of light at a time, bending the stars and its own disk around itself. On the homepage it carries the projects.', 'index.html#work', 'img/lab/black-hole.webp', 0],
    ['turntable', 'Products on a turntable', 'a Lab experiment', 'Three products lit in a small studio that you can spin: a kettlebell, a coffee pouch and a smart key.', 'lab-experiments.html#studio', 'assets/lab/ch-studio.webp', 1],
    ['room', 'A room you can re-finish', 'a Lab experiment', 'A living room whose floor, walls, sofa and wood change with one choice of palette.', 'lab-experiments.html#room', 'assets/lab/ch-room.webp', 1],
    ['print', 'From print to listings', 'a Lab experiment', 'A printed property magazine turning, page by page, into listings a team can search.', 'lab-experiments.html#magazine', 'assets/lab/ch-magazine.webp', 1],
    ['floor', 'A builder floor to explore', 'a Lab experiment', 'A building you can open floor by floor to see what is on each one.', 'lab-experiments.html#building', 'assets/lab/ch-building.webp', 1]
  ];
  var list = $('#list'), stage = $('#stage'), poster = $('#poster'), cap = $('#cap'), run = $('#run'), open = $('#open'), liveEl = $('#live'), cur = -1, frame = null, btns = [];
  function stop() { if (frame) { frame.remove(); frame = null; } stage.classList.remove('on'); liveEl.hidden = true; run.textContent = 'Run it live'; }
  function show(i, quiet) {
    i = (i + X.length) % X.length; if (i === cur) return; var x = X[i]; cur = i; stop();
    poster.classList.add('out'); setTimeout(function () { poster.src = x[5]; poster.classList.remove('out'); }, quiet ? 0 : 230);
    $('#xk').textContent = 'Exhibit ' + (i < 9 ? '0' : '') + (i + 1) + ' · from ' + x[2]; $('#xh').textContent = x[1]; $('#xp').textContent = x[3]; $('#xi').textContent = (i + 1) + ' of ' + X.length;
    run.hidden = !x[6]; open.href = x[4]; open.textContent = x[6] ? 'Open it full screen ↗' : 'See it on the homepage →'; open.classList.toggle('g', !x[6]);
    btns.forEach(function (b, k) { if (k === i) { b.setAttribute('aria-current', 'true'); if (b.scrollIntoView && innerWidth <= 900 && !quiet) b.scrollIntoView({ block: 'nearest', inline: 'center' }); } else b.removeAttribute('aria-current'); });
    cap.classList.remove('sw'); void cap.offsetWidth; cap.classList.add('sw'); if (!quiet) try { history.replaceState(null, '', '#' + x[0]); } catch (e) { /* file: */ }
  }
  X.forEach(function (x, i) {
    var li = d.createElement('li'), b = d.createElement('button'), n = d.createElement('span'), t = d.createElement('b'), f = d.createElement('i');
    b.type = 'button'; n.textContent = (i < 9 ? '0' : '') + (i + 1); t.textContent = x[1]; f.textContent = x[2].split(',')[0]; b.appendChild(n); b.appendChild(t); b.appendChild(f);
    b.addEventListener('click', function () { show(i); }); li.appendChild(b); list.appendChild(li); btns.push(b);
  });
  run.addEventListener('click', function () {
    if (frame) { stop(); return; } var x = X[cur]; frame = d.createElement('iframe'); frame.title = x[1] + ', running live'; frame.addEventListener('load', function () { stage.classList.add('on'); liveEl.hidden = false; });
    frame.src = x[4]; stage.appendChild(frame); run.textContent = 'Stop';
  });
  $('#prev').addEventListener('click', function () { show(cur - 1); }); $('#next').addEventListener('click', function () { show(cur + 1); });
  addEventListener('keydown', function (e) { if (frame || e.metaKey || e.ctrlKey || e.altKey) { if (e.key === 'Escape') stop(); return; } if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); });
  var h = location.hash.slice(1), at = 0; X.forEach(function (x, i) { if (x[0] === h) at = i; }); show(at, true);
})();
