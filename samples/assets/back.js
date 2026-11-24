/* "Back to portfolio": a link in the top bar, plus a floating button once the hero has scrolled away */
(function () {
  var HOME = '../../index.html#examples';
  var bar = document.querySelector('.demo, .nl-bar');
  if (bar && !bar.querySelector('.back-top')) { var l = document.createElement('a'); l.className = 'back-top'; l.href = HOME; l.textContent = '← Back to portfolio'; bar.insertBefore(l, bar.firstChild); }
  var a = document.createElement('a'); a.className = 'to-home'; a.href = HOME; a.innerHTML = '<b aria-hidden="true">←</b> Portfolio'; a.setAttribute('aria-label', 'Back to Abhishek’s portfolio');
  document.body.appendChild(a);
  var main = document.querySelector('main'), first = main && main.firstElementChild;
  function check() { var past = first && first.tagName === 'SECTION' ? first.getBoundingClientRect().bottom < 80 : scrollY > 200; a.classList.toggle('on', past); }
  addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); check();
})();
