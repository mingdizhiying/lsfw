import {send} from './shared.js';
import {bookmarksEditor} from './admin-bookmarks.js';
import {musicEditor} from './admin-music.js';
export function pasteBoard(root){
 root.innerHTML=`<form class="admin-card"><h2>粘贴识别板</h2><label>网站、B 站或网易云分享文字<textarea name="text" rows="4" required maxlength="12000" placeholder="粘贴链接或完整分享文字，识别后确认保存"></textarea></label><label>保存到<select name="kind"><option value="auto">自动识别</option><option value="bookmark">收藏夹</option><option value="music">音乐</option></select></label><button class="button">识别内容</button><p class="feedback" role="status"></p></form><div class="paste-result"></div>`;
 const form=root.querySelector('form'),result=root.querySelector('.paste-result');
 form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button'),hint=form.querySelector('.feedback'),text=form.elements.text.value;
 const music=form.elements.kind.value==='music'||(form.elements.kind.value==='auto'&&isMusicShare(text));
 button.disabled=true;hint.textContent='正在识别…';
 try{const item=await send(music?'/api/admin/music/resolve':'/api/admin/bookmarks/resolve',music?{url:text}:{text});if(!root.isConnected)return;
 result.querySelectorAll('audio').forEach(a=>a.pause());
 const saved=()=>{result.replaceChildren();form.reset();hint.textContent='已保存，可在'+(music?'音乐':'收藏夹')+'中继续管理。';};
 await (music?musicEditor:bookmarksEditor)(result,item,saved);
 hint.textContent=item.warning||'已识别，请检查下方资料并保存。';
 }catch(error){hint.textContent=error.message;}finally{button.disabled=false;}};
}
export function isMusicShare(text){return /https?:\/\/(?:music\.163\.com|y\.music\.163\.com|163cn\.tv)(?=[/\s?#]|$)/i.test(text);}
