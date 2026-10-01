import snapshot from './release-snapshot.js';
export const releaseProjectId='website-release-history';
export const releaseSource='https://api.github.com/repos/mingdizhiying/lsfw/contents/RELEASES.md?ref=main';
const repo='https://github.com/mingdizhiying/lsfw';
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function releaseBody(markdown){
 if(typeof markdown!=='string'||markdown.length>200000||!markdown.includes('# 发布记录')||!/^## v\d/m.test(markdown))throw Error('Invalid release history');
 const sections=markdown.replace(/^\uFEFF/,'').split(/^## /m);
 const intro=sections.shift().replace(/^# 发布记录\s*/, '');
 const render=text=>text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>'<p>'+escape(line.replace(/^- /,'• '))+'</p>').join('');
 const body=sections.reverse().map(section=>{const newline=section.indexOf('\n');return '<h2>'+escape(section.slice(0,newline).trim())+'</h2>'+render(section.slice(newline+1));}).join('');
 return '<p>岚山飞文的发布、更新与回滚记录，自动同步自 <a href="'+repo+'/blob/main/RELEASES.md" target="_blank" rel="noopener noreferrer">GitHub 发布记录</a>。最新记录在前。</p>'+body+'<h2>v1.0.0 · 首次版本基线</h2>'+render(intro);
}
export async function syncReleaseProject(c){
 const db=c.env.DB;
 const cached=await db.prepare('SELECT expires_at FROM cache WHERE key=?').bind('release-history:sync:api').first();
 if(cached?.expires_at>Date.now())return;
 const old=await db.prepare('SELECT body FROM entries WHERE id=?').bind(releaseProjectId).first();
 let source=snapshot,ttl=60000;
 try{
  const response=await fetch(releaseSource,{headers:{'User-Agent':'lsfw-release-history',Accept:'application/vnd.github.raw+json'},signal:AbortSignal.timeout(5000),cf:{cacheTtl:60}});
  if(!response.ok)throw Error('GitHub unavailable');
  source=await response.text();releaseBody(source);ttl=300000;
 }catch{
  if(old){await db.prepare('INSERT OR REPLACE INTO cache(key,value,expires_at) VALUES(?,?,?)').bind('release-history:sync:api','{}',Date.now()+ttl).run();return;}
 }
 const body=releaseBody(source),stamp=new Date().toISOString();
 const date=[...source.matchAll(/20\d{2}-\d{2}-\d{2}/g)].map(m=>m[0]).sort().at(-1)||'2026-09-19';
 if(old?.body!==body)await db.prepare(`INSERT INTO entries(id,kind,title,body,excerpt,tags,date,status,link,created_at,updated_at) VALUES(?,'project',?,?,?,?,?,'published',?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,excerpt=excluded.excerpt,date=excluded.date,updated_at=excluded.updated_at`).bind(releaseProjectId,'网站版本记录',body,'岚山飞文的发布记录、功能更新与回滚历史，与 GitHub 自动同步。','["网站","版本记录"]',date,repo,stamp,stamp).run();
 await db.prepare('INSERT OR REPLACE INTO cache(key,value,expires_at) VALUES(?,?,?)').bind('release-history:sync:api','{}',Date.now()+ttl).run();
}
