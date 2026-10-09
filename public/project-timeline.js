import {esc,html} from './shared.js';
import {timestamp,dateParagraph,orderSections} from './project-order.js';
export function projectTimeline(body,date,order='desc'){
 const source=document.createElement('div');source.innerHTML=html(body);
 const sections=[];let current={title:'',content:[]};
 for(const node of source.childNodes){
  const text=node.textContent||'';
  if(node.nodeType===1&&(/^H[1-6]$/.test(node.tagName)||(['P','DIV'].includes(node.tagName)&&dateParagraph(text)))){
   if(current.explicit||current.content.some(x=>x.trim()))sections.push(current);
   current={title:text,content:[],explicit:true};
  }else current.content.push(node.nodeType===3?esc(text):node.outerHTML||'');
 }
 if(current.explicit||current.content.length)sections.push(current);
 const intro=sections[0]&&!sections[0].explicit?sections.shift():null;
 const ordered=orderSections(sections.map(s=>{const text=document.createElement('div');text.innerHTML=s.content.join('');return {...s,time:timestamp(s.title)??timestamp(text.textContent)};}),order);
 return `${intro?'<div class="prose project-intro">'+intro.content.join('')+'</div>':''}<ol class="project-timeline">${ordered.map(s=>`<li><div class="project-milestone">${esc(s.title)}</div><div class="prose project-update">${s.content.join('')||'<p>待记录</p>'}</div></li>`).join('')}</ol>`;
}
