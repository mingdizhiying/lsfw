export function bindAdminNavigation(nav){
 for(const group of nav.querySelectorAll('.admin-new-group')){const toggle=group.querySelector('button'),menu=group.querySelector('.admin-new-menu');let timer;
 function open(value){clearTimeout(timer);toggle.setAttribute('aria-expanded',String(value));menu.hidden=!value;group.classList.toggle('is-open',value);if(value)nav.querySelectorAll('.admin-new-group').forEach(other=>{if(other!==group){other.classList.remove('is-open');other.querySelector('button').setAttribute('aria-expanded','false');other.querySelector('.admin-new-menu').hidden=true;}});}
 toggle.onclick=()=>open(menu.hidden);
 group.onpointerenter=e=>{if(e.pointerType==='mouse'&&matchMedia('(hover: hover)').matches)open(true)};
 group.onpointerleave=e=>{if(e.pointerType==='mouse')timer=setTimeout(()=>open(false),180)};
 group.onfocusin=()=>clearTimeout(timer);
 group.onfocusout=e=>{if(!group.contains(e.relatedTarget))open(false)};
 group.onkeydown=e=>{if(e.key==='Escape'){open(false);toggle.focus();e.preventDefault()}else if(e.target===toggle&&['ArrowRight','ArrowDown'].includes(e.key)){open(true);menu.querySelector('a').focus();e.preventDefault()}};
 menu.onclick=e=>{if(e.target.closest('a'))open(false)};
 document.addEventListener('click',e=>{if(!group.contains(e.target))open(false)});
}
}
