import {api,esc,heading,textLines,empty} from './shared.js';
export function recordCard(s,index=0){return `<article class="record-card"><div class="record-top"><span>SIDE ${String(index+1).padStart(2,'0')}</span><span>33⅓ RPM</span></div><button class="record-button" type="button" aria-label="播放 ${esc(s.title)}" aria-pressed="false"><span class="vinyl"><span class="record-label">${s.cover?`<img src="${esc(s.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'♪'}</span></span><span class="record-action" aria-hidden="true">▶</span></button><h2>${esc(s.title)}</h2><p class="record-artist">${esc(s.artist)}</p>${s.album?`<p class="small record-album">${esc(s.album)}</p>`:''}${s.review?`<p class="record-review">${textLines(s.review)}</p>`:''}<div class="record-progress"><input class="record-seek" type="range" min="0" max="100" value="0" step="0.1" disabled aria-label="播放进度"><span class="record-time">0:00 / 0:00</span></div><audio preload="none" hidden aria-label="${esc(s.title)}播放器" src="https://music.163.com/song/media/outer/url?id=${s.id}.mp3"></audio><p class="record-status small" role="status">点击唱片，听一会儿。</p><a class="quiet-link" href="https://music.163.com/song?id=${s.id}" target="_blank" rel="noopener">去网易云收听 ↗</a></article>`}
export function bindRecords(root){
 const cards=[...root.querySelectorAll('.record-card')];
 cards.forEach(card=>{const audio=card.querySelector('audio'),button=card.querySelector('button'),status=card.querySelector('.record-status'),action=card.querySelector('.record-action');
 const seek=card.querySelector('.record-seek'),time=card.querySelector('.record-time');
 const clock=value=>{const n=Number.isFinite(value)?Math.max(0,Math.floor(value)):0;return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
 const progress=()=>{if(!seek||!time)return;const ready=Number.isFinite(audio.duration)&&audio.duration>0;seek.disabled=!ready;seek.value=ready?String(audio.currentTime/audio.duration*100):'0';time.textContent=clock(audio.currentTime)+' / '+clock(audio.duration);};
 if(seek)seek.oninput=()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(seek.value)/100*audio.duration;};
 audio.ontimeupdate=progress;audio.onloadedmetadata=progress;audio.ondurationchange=progress;
 const state=(playing,text)=>{card.classList.toggle('playing',playing);button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',(playing?'暂停 ':'播放 ')+card.querySelector('h2').textContent);action.textContent=playing?'Ⅱ':'▶';status.textContent=text};
 button.onclick=async()=>{if(!audio.paused){audio.pause();return}status.textContent='正在连接唱片…';try{await audio.play()}catch{state(false,'暂时无法站内播放，可前往网易云收听。')}};
 audio.onplay=()=>{cards.forEach(other=>{if(other!==card)other.querySelector('audio').pause()})};
 audio.onplaying=()=>state(true,'正在播放');audio.onpause=()=>state(false,'已暂停');audio.onended=()=>state(false,'播放完毕');audio.onwaiting=()=>state(false,'正在缓冲…');audio.onerror=()=>state(false,'此歌曲暂不可站内播放，可前往网易云收听。');
 });
 window.addEventListener('pagehide',()=>cards.forEach(c=>c.querySelector('audio').pause()),{once:true});
}
export async function musicPage(){const root=document.querySelector('#app');document.title='音乐 · 岚山飞文';root.innerHTML=heading('音乐','把喜欢的旋律，放进生活的留声机。')+'<p class="small">轻触唱片播放或暂停，拖动进度条跳转。播放仍受歌曲版权与账号权限限制。</p><div id="records" class="record-grid"><p>正在整理唱片…</p></div>';const rows=await api('/api/music'),list=root.querySelector('#records');list.innerHTML=rows.length?rows.map(recordCard).join(''):empty('唱片架暂且留白','喜欢的歌，会慢慢放在这里。','♪');bindRecords(list)}
