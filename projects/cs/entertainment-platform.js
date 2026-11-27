/* Entertainment platform: the 68 updates as dots that turn from raised to verified when the rounds chart comes
   into view, and "Ask for the screens", a short form that opens the visitor's own email app with the request
   written out (the page's policy allows no form submission, so nothing is sent from the page). */
(function () {
  'use strict';
  var d = document;

  var dots = d.getElementById('ro-dots');
  if (dots) {
    for (var i = 0; i < 68; i++) {
      var dot = d.createElement('i');
      dot.style.setProperty('--d', (i * 22) + 'ms');
      dots.appendChild(dot);
    }
  }

  var form = d.getElementById('ask');
  if (!form) return;
  var name = form.elements.name, company = form.elements.company, why = form.elements.why, status = d.getElementById('ask-st');
  var TO = 'abhimasih0505@gmail.com';
  function say(text, link) {
    status.textContent = text;
    if (link) {
      var a = d.createElement('a'); a.href = link; a.textContent = 'open it here';
      status.appendChild(d.createTextNode(' If it didn’t open, '));
      status.appendChild(a);
      status.appendChild(d.createTextNode(' or write to ' + TO + '.'));
    }
  }
  name.addEventListener('input', function () {
    if (name.value.trim()) { name.removeAttribute('aria-invalid'); form.classList.remove('bad'); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = name.value.trim(), c = company.value.trim(), w = why.value.trim();
    if (!n) {
      name.setAttribute('aria-invalid', 'true'); form.classList.add('bad');
      say('Please add your name, so I know who the screens are for.');
      name.focus();
      return;
    }
    var subject = 'Entertainment platform screens: ' + n + (c ? ', ' + c : '');
    var body = 'Hi Abhishek,\n\nCould you send me the screens of the entertainment platform?\n\n' +
      'Name: ' + n + '\n' + (c ? 'Company: ' + c + '\n' : '') + (w ? 'Why: ' + w + '\n' : '') + '\nThanks.';
    var url = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body).replace(/%0A/g, '%0D%0A');
    form.classList.add('sent');
    say('Your email app should open with the message ready to send.', url);
    location.href = url;
  });
})();
