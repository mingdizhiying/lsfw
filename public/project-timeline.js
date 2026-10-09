import {esc,html} from './shared.js';
export function projectTimeline(body,date){
 const source=document.createElement('div');source.innerHTML=html(body);
 const sections=[];let current={title:"",content:[]};
 for(const node of source.childNodes){
  if(node.nodeType===1&&/^H[234]$/.test(node.tagName)){
   if(current.explicit||current.content.some(x=>x.trim()))sections.push(current);
   current={title:node.textContent,content:[],explicit:true};
  }else current.content.push(node.nodeType===3?esc(node.textContent):node.outerHTML||'');
 }
 if(current.explicit||current.content.length||!sections.length)sections.push(current);
 const intro=sections[0]&&!sections[0].explicit?sections.shift():null;
 return `${intro?'<div class="prose project-intro">'+intro.content.join('')+'</div>':''}${sections.length?'<div class="admin-actions"><button type="button" class="button secondary" id="project-reverse">倒序显示</button></div>':''}<ol class="project-timeline">${sections.map(s=>`<li><div class="project-milestone">${esc(s.title)}</div><div class="prose project-update">${s.content.join('')||'<p>待记录</p>'}</div></li>`).join('')}</ol>`;
}

export function bindProjectOrder(root){const button=root.querySelector('#project-reverse'),list=root.querySelector('.project-timeline');if(!button||!list)return;let reversed=false;button.onclick=()=>{list.replaceChildren(...[...list.children].reverse());reversed=!reversed;button.textContent=reversed?'正序显示':'倒序显示';button.setAttribute('aria-pressed',String(reversed));};}
