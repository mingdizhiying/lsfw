import {api,esc,safeImage,textLines} from './shared.js';
const DAY=86400000;
export function watchBar(time,year,today=new Date()){
 const first=Date.UTC(year,0,1),last=Date.UTC(year+1,0,1),start=Date.parse(time.start+'T00:00:00Z');
 const finish=time.end?Date.parse(time.end+'T00:00:00Z'):Math.min(+today,last-DAY);
 const from=Math.max(first,start),to=Math.min(last,finish+DAY);
 if(to<=from||from>=last)return null;
 return {left:(from-first)/(last-first)*100,width:Math.max(.45,(to-from)/(last-first)*100),ongoing:time.ongoing};
}
export async function yearbookPage(root,isCurrent=()=>true){
 root.innerHTML='<div class="loading">正在翻开看番年表…</div>';
 let years;try{years=await api('/api/bangumi/yearbooks')}catch(e){root.textContent=e.message;return;}
 if(!root.isConnected||!isCurrent())return;
 if(!years.length){root.innerHTML='<p>还没有看番年表。</p>';return;}
 root.innerHTML='<div class="yearbook-toolbar"><div><div class="eyebrow">A YEAR IN STORIES</div><h2>看番年表</h2></div><label>年份<select id="yearbook-year">'+years.map(y=>`<option value="${y.year}">${y.year} 年</option>`).join('')+'</select></label></div><div id="yearbook-content"></div>';
 const select=root.querySelector('select'),target=root.querySelector('#yearbook-content');let revision=0;
 const chosen=new URLSearchParams(location.search).get('year');if(years.some(y=>String(y.year)===chosen))select.value=chosen;
 async function load(){const current=++revision,year=Number(select.value),url=new URL(location.href);url.searchParams.set('year',year);history.replaceState(null,'',url);target.innerHTML='<p class="loading">正在读取目录…</p>';
 try{const r=await api('/api/bangumi/yearbooks/'+year);if(current!==revision||!root.isConnected||!isCurrent())return;
 const dated=r.items.filter(i=>i.time&&watchBar(i.time,year)).sort((a,b)=>a.time.start.localeCompare(b.time.start)||a.position-b.position),unknown=r.items.filter(i=>!i.time);
 target.innerHTML=`<div class="yearbook-summary"><strong>${r.items.length} 部作品</strong><span>${dated.length} 条时间记录</span><span>${unknown.length} 部未注明时间</span><a href="${esc(r.url)}" target="_blank" rel="noopener">查看原目录 ↗</a></div><p class="small">${r.error?esc(r.error)+' ':''}同步于 ${esc(new Date(r.syncedAt).toLocaleString('zh-CN'))} · 日期来自目录备注；竖条表示观看日期范围，不代表实际观看小时数。</p><div class="yearbook-spread"><section class="yearbook-leaf"><div class="yearbook-leaf-heading"><span>01 / 作品目录</span><small>按 Bangumi 目录顺序</small></div><div class="yearbook-catalog">${r.items.map(i=>`<article class="yearbook-item" id="yb-item-${i.id}"><span class="yearbook-number">${String(i.position).padStart(2,'0')}</span><a href="https://bgm.tv/subject/${i.id}" target="_blank" rel="noopener" class="yearbook-cover">${safeImage(i.cover)?`<img src="${esc(i.cover)}" alt="${esc(i.name)}" loading="lazy" referrerpolicy="no-referrer">`:'<span>暂无封面</span>'}</a><div><h3><a href="https://bgm.tv/subject/${i.id}" target="_blank" rel="noopener">${esc(i.name)}</a></h3><p class="small">${esc(i.time?.label||'未注明观看时间')}</p>${i.comment?`<details><summary>目录文字</summary><p>${textLines(i.comment)}</p></details>`:''}</div></article>`).join('')}</div></section><section class="yearbook-leaf yearbook-timeline"><div class="yearbook-leaf-heading"><span>02 / 观看时间轴</span><small>按开始观看日期排序</small></div>${verticalChart(dated,year)}<p class="small">实线：有结束日期 · 虚线：未完结。悬停、键盘聚焦或点击竖条，查看作品封面与观看日期。</p>${unknown.length?`<details><summary>${unknown.length} 部作品尚未标注观看时间</summary><ul>${unknown.map(i=>`<li><a href="#yb-item-${i.id}">${String(i.position).padStart(2,'0')} ${esc(i.name)}</a></li>`).join('')}</ul></details>`:''}</section></div>`;
 bindChart(target,dated);
 }catch(e){if(current===revision&&isCurrent()){target.innerHTML='<p>'+esc(e.message)+'</p><button class="button secondary" id="yearbook-retry">重新读取</button>';target.querySelector('button').onclick=load;}}}
 select.onchange=load;await load();
}

function verticalChart(items,year){
 const start=Date.UTC(year,0,1),span=Date.UTC(year+1,0,1)-start;
 const months=Array.from({length:12},(_,m)=>({label:m+1,top:(Date.UTC(year,m,1)-start)/span*100}));
 return `<div class="yb-vertical"><div class="yb-months" aria-hidden="true">${months.map(m=>`<span style="top:${m.top}%">${m.label}月</span>`).join('')}</div><div class="yb-scroll" tabindex="0" role="region" aria-label="纵向观看时间轴，月份从上往下排列，可横向滑动"><div class="yb-plot" style="min-width:${Math.max(300,items.length*22)}px"><div class="yb-grid" aria-hidden="true">${months.map(m=>`<i style="top:${m.top}%"></i>`).join('')}</div><div class="yb-columns">${items.map((i,index)=>{const bar=watchBar(i.time,year);return `<div class="yb-column"><button type="button" class="yb-bar ${bar.ongoing?'ongoing':''}" data-yb-index="${index}" style="top:${bar.left}%;height:${Math.min(bar.width,100-bar.left)}%" aria-label="${esc(i.name+'，'+i.time.label)}" aria-expanded="false" aria-controls="yb-preview"><span class="yb-bar-fill"></span></button></div>`}).join('')}</div>${!items.length?'<p class="yb-empty">暂无可识别的观看时间</p>':''}</div></div></div><div id="yb-preview" class="yb-preview" role="region" aria-label="作品预览" hidden></div>`;
}
function bindChart(root,items){
 const panel=root.querySelector('.yearbook-timeline'),preview=root.querySelector('#yb-preview'),buttons=[...root.querySelectorAll('.yb-bar')];
 let active=null,pinned=false,timer;
 function close(){clearTimeout(timer);if(active)active.setAttribute('aria-expanded','false');active=null;pinned=false;preview.hidden=true;}
 function show(button){clearTimeout(timer);if(active&&active!==button)active.setAttribute('aria-expanded','false');active=button;button.setAttribute('aria-expanded','true');const i=items[Number(button.dataset.ybIndex)];
 preview.innerHTML=`<button type="button" class="yb-preview-close" aria-label="关闭作品预览">×</button>${safeImage(i.cover)?`<img src="${esc(i.cover)}" alt="${esc(i.name)}" referrerpolicy="no-referrer">`:''}<div><strong>${esc(i.name)}</strong><p>${esc(i.time.label)}</p><a href="#yb-item-${i.id}">定位目录中的作品 →</a></div>`;preview.hidden=false;
 const r=button.getBoundingClientRect(),p=panel.getBoundingClientRect(),w=preview.offsetWidth,h=preview.offsetHeight;
 preview.style.left=Math.max(0,Math.min(p.width-w,r.left-p.left+18))+'px';preview.style.top=Math.max(0,Math.min(r.top+18,innerHeight-h-12)-p.top)+'px';
 preview.querySelector('button').onclick=close;preview.querySelector('a').onclick=close;
 }
 buttons.forEach(button=>{
 button.onpointerenter=e=>{if(e.pointerType==='mouse'&&!pinned)show(button)};
 button.onpointerleave=()=>{if(!pinned)timer=setTimeout(close,160)};
 button.onfocus=()=>{if(!pinned)show(button)};
 button.onclick=()=>{if(active===button&&pinned)close();else{pinned=true;show(button)}};
 button.onblur=e=>{if(!pinned&&!preview.contains(e.relatedTarget))close()};
 });
 preview.onpointerenter=()=>clearTimeout(timer);preview.onpointerleave=()=>{if(!pinned)timer=setTimeout(close,160)};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){close();e.preventDefault()}});
 root.querySelector('.yb-scroll').onscroll=close;
}
