const groups=[...document.querySelectorAll('header .nav-group')];
const hover=matchMedia('(hover: hover) and (pointer: fine)');
for(const group of groups){
 let closeTimer;
 group.addEventListener('toggle',()=>{if(group.open)for(const other of groups)if(other!==group)other.open=false;});
 group.addEventListener('pointerenter',event=>{if(event.pointerType!=='mouse'||!hover.matches)return;clearTimeout(closeTimer);group.open=true;});
 group.addEventListener('pointerleave',event=>{if(event.pointerType!=='mouse'||!hover.matches)return;closeTimer=setTimeout(()=>{if(!group.contains(document.activeElement))group.open=false;},180);});
 group.addEventListener('focusout',()=>{setTimeout(()=>{if(!group.matches(':hover')&&!group.contains(document.activeElement))group.open=false;},0);});
 const titleLink=group.querySelector('summary a');
 if(titleLink)titleLink.addEventListener('click',event=>{if((event.pointerType==='touch'||!hover.matches)&&!group.open){event.preventDefault();group.open=true;}});
 for(const link of group.querySelectorAll('a'))if(new URL(link.href).pathname===location.pathname){link.setAttribute('aria-current','page');group.classList.add('has-current');}
}
document.addEventListener('click',event=>{for(const group of groups)if(group.open&&!group.contains(event.target))group.open=false;});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;for(const group of groups)if(group.open){const focused=group.contains(document.activeElement);group.open=false;if(focused)group.querySelector('summary').focus();}});
