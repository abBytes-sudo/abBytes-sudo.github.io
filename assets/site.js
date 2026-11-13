/* Progressive lightbox: links to full-size images open in a <dialog>. Without JS they open the image itself. */
(function(){
  if(!window.HTMLDialogElement||!document.createElement('dialog').showModal) return;
  var d=document.createElement('dialog'); d.className='lb'; d.setAttribute('aria-label','Image viewer');
  d.innerHTML='<button type="button">Close</button><img alt=""><p></p>';
  document.body.appendChild(d);
  var img=d.querySelector('img'), cap=d.querySelector('p'), btn=d.querySelector('button'), opener=null;
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a.zoom');
    if(!a||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    e.preventDefault(); opener=a;
    var i=a.querySelector('img'), f=a.closest('figure'), c=f&&f.querySelector('figcaption');
    // the caption's "FIG. 01" label is a separate span spaced by CSS; keep a space after it in the viewer's caption
    img.src=a.getAttribute('href'); img.alt=i?i.alt:'';
    cap.textContent=c?[].map.call(c.childNodes,function(n){return n.textContent.trim();}).filter(Boolean).join(' '):'';
    // a screenshot more than 2.4 times taller than wide (a whole phone page) opens at reading width and scrolls
    var w=i?+i.getAttribute('width'):0, h=i?+i.getAttribute('height'):0;
    d.classList.toggle('tall', w>0 && h/w>2.4);
    d.showModal(); d.scrollTop=0; btn.focus();
  });
  btn.addEventListener('click',function(){d.close();});
  d.addEventListener('click',function(e){if(e.target===d) d.close();});
  d.addEventListener('close',function(){img.removeAttribute('src'); if(opener) opener.focus();});
})();
