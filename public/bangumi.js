import {$,esc,api,heading,empty,safeImage,textLines,dateTime} from './shared.js';
export function posterCard(x){
 const name=x.subject?.name||'未命名作品',image=safeImage(x.subject?.image),score=Number(x.rate)||0;
 return `<article class="anime-poster"><a class="anime-cover" href="https://bgm.tv/subject/${Number(x.subject_id)}" target="_blank" rel="noopener" aria-label="在 Bangumi 查看 ${esc(name)}">${image?`<img src="${esc(image)}" alt="${esc(name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'<span class="anime-no-cover">暂无海报</span>'}<span class="anime-score">${score?'★ '+score+' / 10':'未评分'}</span><span class="anime-cover-hint">查看作品 ↗</span></a><div class="anime-caption"><span class="anime-finished">看过</span><h3><a href="https://bgm.tv/subject/${Number(x.subject_id)}" target="_blank" rel="noopener">${esc(name)}</a></h3><div class="anime-tags">${(x.tags||[]).slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${x.comment?`<details><summary>我的短评</summary><p>${textLines(x.comment)}</p></details>`:''}</div></article>`;
}
export async function bangumiPage(watchingCard,timelineItem){
 document.title='Bangumi · 岚山飞文';const root=$('#app');
 root.innerHTML=heading('故事还在继续','正在追的故事，和已经走过的世界。')+'<div id="bgm-profile"></div><div class="tabs" role="group" aria-label="Bangumi内容"><button class="button" data-bgm-view="watching">在看</button><button class="button secondary" data-bgm-view="watched">看过 · 海报墙</button><button class="button secondary" data-bgm-view="timeline">时间轴</button></div><div id="bgm-body"></div>';
 api('/api/bangumi/profile').then(p=>{$('#bgm-profile').innerHTML=`<div class="bgm-profile"><img src="${esc(safeImage(p.data.avatar.medium))}" alt=""><div><h2>${esc(p.data.nickname)}</h2><a href="https://bgm.tv/user/1063113" target="_blank" rel="noopener">Bangumi 个人主页 ↗</a></div></div>`}).catch(e=>{$('#bgm-profile').textContent=e.message});
 let revision=0;
 async function render(mode){
  const current=++revision;let offset=0,until='',busy=false;const seen=new Set();
  const url=new URL(location.href);url.searchParams.set('view',mode);history.replaceState(null,'',url);
  root.querySelectorAll('[data-bgm-view]').forEach(b=>{const selected=b.dataset.bgmView===mode;b.classList.toggle('secondary',!selected);b.setAttribute('aria-pressed',String(selected))});
  $('#bgm-body').innerHTML=`<div class="section-head"><div><div class="eyebrow">${mode==='watched'?'THE STORIES I KEEP':mode==='watching'?'NOW WATCHING':'LIFE ON BANGUMI'}</div><h2>${mode==='watched'?'看过的世界':mode==='watching'?'正在追的故事':'时间轴'}</h2></div><span class="small" id="bgm-count"></span></div><div id="bgm-list" class="${mode==='watched'?'poster-wall':mode==='timeline'?'timeline':'collection-grid'}"></div><button id="bgm-more" class="button secondary">${mode==='timeline'?'更早的动态':'加载更多'}</button><p class="small" id="sync-time" role="status"></p>`;
  const list=$('#bgm-list'),button=$('#bgm-more'),feedback=$('#sync-time'),count=$('#bgm-count');
  async function load(){if(busy)return;busy=true;button.disabled=true;feedback.textContent='正在读取…';try{
   const r=await api(mode==='timeline'?'/api/bangumi/timeline'+(until?'?until='+until:''):`/api/bangumi/collections?type=${mode==='watched'?2:3}&subject=2&offset=${offset}`);if(current!==revision)return;
   const rows=mode==='timeline'?r.data:r.data.data;const unique=rows.filter(x=>{const id=mode==='timeline'?x.id:x.subject_id;if(seen.has(id))return false;seen.add(id);return true});
   if(!seen.size)list.innerHTML=empty(mode==='watched'?'看过的故事，会在这里留下海报。':'这里还没有记录');else list.insertAdjacentHTML('beforeend',unique.map(x=>mode==='timeline'?timelineItem(x):mode==='watched'?posterCard(x):`<article class="collection-card">${watchingCard(x)}${x.comment?`<details><summary>我的短评</summary><p>${textLines(x.comment)}</p></details>`:''}</article>`).join(''));
   if(mode==='timeline'){until=rows.at(-1)?.id||'';button.hidden=rows.length<20}else{offset+=rows.length;button.hidden=offset>=r.data.total||!rows.length;count.textContent=`已展示 ${seen.size} / ${r.data.total} 部`;}
   feedback.textContent=(r.stale?'上次成功同步 · ':'更新于 ')+dateTime(r.syncedAt);
  }catch(e){if(current===revision){feedback.textContent=e.message+' 请点击重试。';button.textContent='重新读取';button.hidden=false}}finally{busy=false;if(current===revision)button.disabled=false}}
  button.onclick=load;await load();
 }
 root.querySelectorAll('[data-bgm-view]').forEach(b=>b.onclick=()=>render(b.dataset.bgmView));const view=new URLSearchParams(location.search).get('view');await render(['watched','timeline'].includes(view)?view:'watching');
}
