export function foodSearchText(record){
 const title=String(record.title||'').trim(),address=String(record.address||'').trim();
 return address?[...new Set([record.province,record.city,title,address].map(x=>String(x||'').trim()).filter(Boolean))].join(' '):title;
}
export function foodMapLinks(record){
 const query=foodSearchText(record),make=(base,params)=>{const u=new URL(base);for(const [k,v] of Object.entries(params))if(v)u.searchParams.set(k,v);return u.href;};
 return [
 ['高德地图',make('https://uri.amap.com/search',{keyword:query,src:'lsfw',callnative:'1'})],
 ['腾讯地图',make('https://apis.map.qq.com/uri/v1/search',{keyword:query,referer:'lsfw'})],
 ['苹果地图',make('https://maps.apple.com/',{q:query})],
 ['Google 地图',make('https://www.google.com/maps/search/',{api:'1',query})]
 ];
}
export function openFoodMaps(record,trigger){
 document.querySelector('#food-map-dialog .food-map-close')?.click();
 const overlay=document.createElement('div');overlay.className='food-map-overlay';
 const dialog=document.createElement('div');dialog.id='food-map-dialog';dialog.className='food-map-dialog';dialog.setAttribute('aria-labelledby','food-map-title');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 const title=document.createElement('h2');title.id='food-map-title';title.textContent='选择地图';
 const close=document.createElement('button');close.type='button';close.className='food-map-close';close.textContent='×';close.setAttribute('aria-label','关闭地图选择');
 const text=document.createElement('p');text.textContent=foodSearchText(record);text.className='food-map-query';
 const links=document.createElement('div');links.className='food-map-links';
 for(const [name,url] of foodMapLinks(record)){const a=document.createElement('a');a.className='button secondary';a.textContent=name+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
 const copy=document.createElement('button');copy.type='button';copy.className='button secondary';copy.textContent='复制店名与地址';
 const status=document.createElement('p');status.setAttribute('role','status');status.className='small';
 const note=document.createElement('p');note.className='small';note.textContent='由地图提供搜索和定位，请在结果中确认具体门店。';
 dialog.append(close,title,text,links,copy,status,note);overlay.append(dialog);document.body.append(overlay);
 const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const dismiss=()=>{document.removeEventListener('keydown',onKey);overlay.remove();document.body.style.overflow=previousOverflow;trigger?.focus({preventScroll:true});};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();dismiss();}else if(e.key==='Tab'){const items=[close,...links.children,copy],first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 document.addEventListener('keydown',onKey);close.onclick=dismiss;overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.textContent);status.textContent='已复制。';}catch{status.textContent='无法自动复制，请长按上方店名与地址复制。';}};
 close.focus({preventScroll:true});
}
