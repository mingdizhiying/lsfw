import {yearbooksEditor} from './admin-yearbooks.js';
import {rankingsEditor} from './admin-rankings.js';
export async function animeEditor(root){
 root.innerHTML='<h1>番剧</h1><div class="tabs"><button class="button" data-anime="yearbook">看番年表</button><button class="button secondary" data-anime="ranking">追番排行</button></div><div id="anime-settings"></div>';
 const target=root.querySelector('#anime-settings');
 async function show(mode){root.querySelectorAll('[data-anime]').forEach(b=>{const active=b.dataset.anime===mode;b.classList.toggle('secondary',!active);b.setAttribute('aria-pressed',String(active));});const panel=document.createElement('div');target.replaceChildren(panel);try{await(mode==='ranking'?rankingsEditor:yearbooksEditor)(panel);}catch(e){panel.textContent=e.message;}}
 root.querySelectorAll('[data-anime]').forEach(b=>b.onclick=()=>show(b.dataset.anime));await show('yearbook');
}
