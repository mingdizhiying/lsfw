export function bindLightbox(root,box){
 let trigger=null;const image=box.querySelector('img'),caption=box.querySelector('p');
 const cleanup=()=>{document.body.classList.remove('photo-open');image.removeAttribute('src');box.classList.remove('lightbox-fallback');trigger?.focus();};
 const close=()=>{if(typeof box.close==='function'&&!box.classList.contains('lightbox-fallback'))box.close();else{box.removeAttribute('open');cleanup();}};
 box.addEventListener('close',cleanup);box.querySelector('.close').onclick=close;box.onclick=e=>{if(e.target===box)close();};
 document.addEventListener('keydown',e=>{if(!box.hasAttribute('open'))return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'&&box.classList.contains('lightbox-fallback')){e.preventDefault();box.querySelector('.close').focus();}});
 root.addEventListener('click',e=>{const button=e.target.closest?.('[data-full]');if(!button)return;trigger=button;image.src=button.dataset.full;image.alt=button.dataset.caption||'';caption.textContent=button.dataset.caption||'';document.body.classList.add('photo-open');try{if(typeof box.showModal!=='function')throw Error('unsupported');box.showModal();}catch{box.classList.add('lightbox-fallback');box.setAttribute('open','');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');}box.querySelector('.close').focus();});
}
