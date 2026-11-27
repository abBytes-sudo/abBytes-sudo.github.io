/* Send it home: fills #share-slot on the vehicle page. Draws a 1080×1350 card on a canvas (photo, price, monthly figure,
   inspection score, a QR code to the family page), with a download, a WhatsApp message (no number: the sender picks the chat),
   the family.html link, and the A5 windscreen sheet. */
(function () {
  'use strict';
  var R = window.Revv, D = window.REVV_DATA; if (!R || !D) return;
  var esc = R.esc, W = 1080, H = 1350;
  var SEND = '<svg class="ic2" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-3-6-7-2z"/><path d="M11 14l9-10"/></svg>';

  R.familyLink = function (l) { var b = R.shop(); return new URL('family.html?id=' + encodeURIComponent(l.id), location.href).href.split('#')[0] + (b ? '#brand=' + R.encodeBrand(b) : ''); };
  R.shareText = function (l) { return 'Have a look at this ' + R.title(l) + ': ' + R.inr(l.price) + ', or ' + R.inrFull(R.monthly(l.price)) + ' a month. Inspected, ' + l.score + '/150. '; };

  function lines(ctx, text, max) { var words = text.split(' '), out = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }
  function cover(ctx, img, box, dx, dy, dw, dh) {
    var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(dw / iw, dh / ih), sw = dw / s, sh = dh / s;
    var cx = (box[0] + box[2]) / 2 * iw, cy = (box[1] + box[3]) / 2 * ih, sx = Math.min(Math.max(0, cx - sw / 2), iw - sw), sy = Math.min(Math.max(0, cy - sh / 2), ih - sh);
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  R.drawShareCard = function (l, canvas) {
    var ctx = canvas.getContext('2d'), cs = getComputedStyle(document.documentElement), acc = (cs.getPropertyValue('--sig') || '#FF5B1F').trim() || '#FF5B1F';
    var b = R.shop(), name = b ? b.name : 'Revv', d = R.dealer(l.dealer), img = new Image();
    img.src = R.img(l);
    var fonts = document.fonts ? Promise.all(['800 80px Archivo', '600 28px "JetBrains Mono"', '500 28px "JetBrains Mono"', '400 30px Archivo'].map(function (f) { return document.fonts.load(f); })).catch(function () {}) : Promise.resolve();
    var pic = (img.decode ? img.decode() : new Promise(function (ok, no) { img.onload = ok; img.onerror = no; })).catch(function () {});
    return Promise.all([fonts, pic]).then(function () {
      canvas.width = W; canvas.height = H;
      ctx.fillStyle = '#0A0B0D'; ctx.fillRect(0, 0, W, H);
      var F = (D.FOCUS && D.FOCUS[l.img]) || { box: [0, 0, 1, 1] };
      if (img.naturalWidth) cover(ctx, img, F.box, 0, 0, W, 780);
      var g = ctx.createLinearGradient(0, 560, 0, 780); g.addColorStop(0, 'rgba(10,11,13,0)'); g.addColorStop(1, 'rgba(10,11,13,.92)'); ctx.fillStyle = g; ctx.fillRect(0, 560, W, 220);
      // name tag
      ctx.font = '800 34px Archivo'; var tw = ctx.measureText(name).width;
      ctx.fillStyle = 'rgba(10,11,13,.82)'; ctx.fillRect(48, 48, tw + 112, 72);
      ctx.fillStyle = acc; ctx.fillRect(60, 60, 48, 48);
      ctx.fillStyle = '#0A0B0D'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = '800 30px Archivo'; ctx.fillText(name.charAt(0).toUpperCase(), 84, 86);
      ctx.textAlign = 'left'; ctx.fillStyle = '#EDEAE3'; ctx.font = '800 34px Archivo'; ctx.fillText(name, 128, 86);
      // inspection badge on the photo
      ctx.font = '600 26px "JetBrains Mono"'; var badge = l.score + '/150 INSPECTED', bw = ctx.measureText(badge).width + 40;
      ctx.fillStyle = 'rgba(10,11,13,.82)'; ctx.fillRect(W - 48 - bw, 48, bw, 72); ctx.fillStyle = '#3DDC97'; ctx.fillText(badge, W - 28 - bw, 86);
      // title and money
      ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#9A9DA3'; ctx.font = '500 26px "JetBrains Mono"';
      ctx.fillText((R.body(l) + ' · ' + l.city + ' · ' + d.name).toUpperCase(), 56, 836);
      ctx.fillStyle = '#EDEAE3'; ctx.font = '800 72px Archivo';
      var tl = lines(ctx, R.title(l).toUpperCase(), W - 112).slice(0, 2); tl.forEach(function (t, i) { ctx.fillText(t, 56, 912 + i * 74); });
      var y = 912 + tl.length * 74 + 52;
      ctx.fillStyle = acc; ctx.font = '800 124px Archivo'; var pt = R.inr(l.price); ctx.fillText(pt, 52, y + 60);
      var pw = ctx.measureText(pt).width;
      ctx.fillStyle = '#EDEAE3'; ctx.font = '600 30px "JetBrains Mono"'; ctx.fillText(R.inrFull(R.monthly(l.price)) + ' a month', 52 + pw + 36, y + 6);
      ctx.fillStyle = (l.fair || 0) >= 5000 ? '#3DDC97' : '#9A9DA3'; ctx.font = '500 26px "JetBrains Mono"'; ctx.fillText(R.fairTxt(l), 52 + pw + 36, y + 52);
      // facts
      ctx.fillStyle = '#c9ccd1'; ctx.font = '400 32px Archivo';
      ctx.fillText([R.km(l.km), R.own(l.owners), l.fuel, l.trans].join(' · '), 56, y + 132);
      // QR to the family page
      var qs = 0; if (window.RevvQR) { try { var px = 5, q = window.RevvQR.make(R.familyLink(l)); px = Math.max(3, Math.floor(196 / (q.size + 8))); qs = (q.size + 8) * px; window.RevvQR.draw(ctx, R.familyLink(l), W - 56 - qs, H - 56 - qs, px, '#0A0B0D', '#EDEAE3'); } catch (e) { qs = 0; } }
      ctx.fillStyle = '#9A9DA3'; ctx.font = '500 24px "JetBrains Mono"';
      ['SCAN FOR THE FULL REPORT,', 'PHOTOS AND ON-ROAD PRICE'].forEach(function (t, i) { ctx.fillText(t, 56, H - 100 + i * 36); });
      ctx.fillStyle = 'rgba(237,234,227,.14)'; ctx.fillRect(56, H - 150, W - 112 - (qs ? qs + 32 : 0), 2);
      return canvas;
    });
  };

  R.whenSlot('share-slot', function (slot, id) {
    var l = R.byId(id); if (!l) return;
    var open = false, url = null;
    function draw() {
      slot.innerHTML = '<button type="button" class="btn ghost slot-btn" data-sh aria-expanded="' + open + '" aria-controls="shr-p">' + SEND + 'Send to family</button>' +
        (open ? '<div class="shr-p" id="shr-p"><canvas class="shr-prev" id="shr-c" width="' + W + '" height="' + H + '" role="img" aria-label="Share card: ' + esc(R.title(l)) + ', ' + esc(R.inr(l.price)) + '"></canvas>' +
          '<div class="shr-acts"><a class="btn sm" id="shr-wa" href="https://wa.me/?text=' + encodeURIComponent(R.shareText(l) + R.familyLink(l)) + '" target="_blank" rel="noopener">Send on WhatsApp</a>' +
          '<a class="btn ghost sm" id="shr-dl" download="' + esc(l.id) + '.png" href="#" aria-disabled="true">Download the card</a>' +
          '<button type="button" class="btn ghost sm" data-shc>Copy the family link</button>' +
          '<a class="btn ghost sm" href="family.html?id=' + encodeURIComponent(l.id) + '" target="_blank" rel="noopener">Open the family page</a>' +
          '<a class="btn ghost sm wide" href="sticker.html?id=' + encodeURIComponent(l.id) + '" target="_blank" rel="noopener">Print a windscreen sheet (A5)</a></div>' +
          '<p class="shr-n">WhatsApp opens with the message ready; you choose who gets it.</p></div>' : '');
      slot.hidden = false;
      if (open) render();
    }
    function render() {
      var c = document.getElementById('shr-c'), dl = document.getElementById('shr-dl');
      R.drawShareCard(l, c).then(function () {
        c.toBlob(function (b) { if (!b) return; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b); dl.href = url; dl.removeAttribute('aria-disabled'); }, 'image/png');
      });
    }
    slot.addEventListener('click', function (e) {
      if (e.target.closest('[data-sh]')) { open = !open; draw(); var b = slot.querySelector('[data-sh]'); if (b) b.focus(); return; }
      var dl = e.target.closest('#shr-dl'); if (dl && dl.getAttribute('aria-disabled')) { e.preventDefault(); return; }
      if (e.target.closest('[data-shc]')) {
        var link = R.familyLink(l), ok = function () { R.toast('Family link copied. It opens a one-screen view of this ' + (l.type === 'bike' ? 'bike' : 'car') + '.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok, function () { R.toast(esc(link)); }); else R.toast(esc(link));
      }
    });
    addEventListener('revv:exchange', function () { if (open) render(); });
    if (/^#share$/.test(location.hash)) { open = true; setTimeout(function () { slot.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 300); }
    draw();
  });
})();
