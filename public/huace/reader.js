(() => {
'use strict';
const $=id=>document.getElementById(id),total=window.CATALOG.pages.length,key='lc-catalog-'+window.CATALOG.version;
const images=[$('pageImage'),$('rightImage')],hd=$('zoomImage'),dialog=$('zoomDialog');
let current=1,seq=0,zoomSeq=0,swipe=null,swiped=false;
const path=(folder,n)=>'assets/'+folder+'/'+String(n).padStart(3,'0')+'.jpg';
const pair=()=>current===1?[null,1]:[current,current<total?current+1:null];
function advance(d){show(d<0?(current<=2?1:current-2):(current===1?2:current+2));}
function show(n){
 n=Math.max(1,Math.min(total,Math.trunc(n)));current=n===1?1:Math.floor(n/2)*2;
 const token=++seq,pages=pair();let done=0,failed=false;
 $('pageNumber').value=current;$('pageNumber').max=total;$('total').textContent=total;
 $('progress').style.width=(Math.min(total,current===1?1:current+1)/total*100)+'%';
 for(const id of ['prev','prevSide'])$(id).disabled=current===1;
 for(const id of ['next','nextSide'])$(id).disabled=current>=total;
 $('status').textContent='正在加载画册…';$('retry').hidden=true;
 function finish(error=false){if(token!==seq)return;done++;failed=failed||error;if(done!==2)return;
 $('status').textContent=failed?'页面加载失败，请检查网络后重试':'';$('retry').hidden=!failed;
 for(const p of current===1?[2,3]:[current-2,current-1,current+2,current+3])if(p>0&&p<=total){const img=new Image();img.src=path('pages',p);}
 }
 images.forEach((img,i)=>{
 img.onload=null;img.onerror=null;img.dataset.ready='';img.dataset.page=pages[i]||'';img.parentElement.classList.toggle('blank',!pages[i]);
 if(!pages[i]){img.hidden=true;img.removeAttribute('src');finish();return;}
 img.hidden=false;img.style.opacity='.25';img.alt='画册第 '+pages[i]+' 页，共 '+total+' 页';
 img.onload=()=>{if(token!==seq)return;img.dataset.ready='true';img.style.opacity='1';finish();};
 img.onerror=()=>{if(token!==seq)return;img.style.opacity='0';finish(true);};img.src=path('pages',pages[i]);
 });
 try{localStorage.setItem(key,String(current));history.replaceState(null,'','#page='+current);}catch{}
}
function openZoom(page){
 const p=page||pair().find(Boolean),img=images.find(i=>Number(i.dataset.page)===p);
 if(!img||img.dataset.ready!=='true')return;
 const token=++zoomSeq;$('zoomTitle').textContent='第 '+p+' 页 · 高清原图';$('hdStatus').textContent='正在加载高清原图…';
 hd.src=path('pages',p);hd.alt='画册第 '+p+' 页高清原图';dialog.showModal();$('zoomScroll').scrollTo(0,0);
 const original=new Image();original.onload=()=>{if(token!==zoomSeq||!dialog.open)return;hd.src=original.src;$('hdStatus').textContent='';};original.onerror=()=>{if(token===zoomSeq)$('hdStatus').textContent='高清图加载失败，当前显示阅读版';};original.src=path('hd',p);
}
for(const id of ['prev','prevSide'])$(id).onclick=()=>advance(-1);
for(const id of ['next','nextSide'])$(id).onclick=()=>advance(1);
$('jump').onsubmit=e=>{e.preventDefault();const n=Number($('pageNumber').value);if(Number.isFinite(n)&&n>=1)show(n);else $('pageNumber').value=current;$('pageNumber').blur();};
$('retry').onclick=()=>show(current);$('enlarge').onclick=()=>openZoom();
images.forEach(img=>img.onclick=()=>{if(!swiped)openZoom(Number(img.dataset.page));});
hd.onclick=()=>dialog.close();$('closeZoom').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{zoomSeq++;hd.removeAttribute('src');});
document.addEventListener('keydown',e=>{if(dialog.open||e.target.tagName==='INPUT')return;if(e.key==='ArrowRight'){e.preventDefault();advance(1);}if(e.key==='ArrowLeft'){e.preventDefault();advance(-1);}});
$('stage').addEventListener('touchstart',e=>{swiped=false;swipe=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
$('stage').addEventListener('touchmove',e=>{if(e.touches.length!==1)swipe=null;},{passive:true});
$('stage').addEventListener('touchend',e=>{if(!swipe||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;swipe=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;advance(dx<0?1:-1);setTimeout(()=>swiped=false,500);}},{passive:true});
$('stage').addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
const hash=location.hash.match(/^#page=(\d+)$/);let start=hash?Number(hash[1]):1;if(!hash){try{start=Number(localStorage.getItem(key))||1;}catch{}}show(Number.isFinite(start)?start:1);
})();
