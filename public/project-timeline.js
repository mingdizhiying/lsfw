import {esc,html} from './shared.js';
export function projectTimeline(body,date){
 const source=document.createElement('div');source.innerHTML=html(body);
 const sections=[];let current={title:date,content:[]};
 for(const node of source.childNodes){
  if(node.nodeType===1&&/^H[234]$/.test(node.tagName)){
   if(current.explicit||current.content.some(x=>x.trim()))sections.push(current);
   current={title:node.textContent,content:[],explicit:true};
  }else current.content.push(node.nodeType===3?esc(node.textContent):node.outerHTML||'');
 }
 if(current.explicit||current.content.length||!sections.length)sections.push(current);
 return `<ol class="project-timeline">${sections.map(s=>`<li><div class="project-milestone">${esc(s.title)}</div><div class="prose project-update">${s.content.join('')||'<p>待记录</p>'}</div></li>`).join('')}</ol>`;
}
