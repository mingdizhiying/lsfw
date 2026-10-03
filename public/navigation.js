const groups=[...document.querySelectorAll('header .nav-group')];
for(const group of groups){
 group.addEventListener('toggle',()=>{if(group.open)for(const other of groups)if(other!==group)other.open=false;});
 for(const link of group.querySelectorAll('a'))if(new URL(link.href).pathname===location.pathname){link.setAttribute('aria-current','page');group.classList.add('has-current');}
}
document.addEventListener('click',event=>{for(const group of groups)if(group.open&&!group.contains(event.target))group.open=false;});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;for(const group of groups)if(group.open){const focused=group.contains(document.activeElement);group.open=false;if(focused)group.querySelector('summary').focus();}});
