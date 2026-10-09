import {directoryURL,fetchDirectory} from './anime-yearbook.js';
export async function fetchRankedDirectory(url,year,fetcher=fetch,user='1063113'){
 const result=await fetchDirectory(url,year,fetcher),watched=new Set();let offset=0,total=1;
 while(offset<total){const response=await fetcher(`https://api.bgm.tv/v0/users/${encodeURIComponent(user)}/collections?subject_type=2&type=2&limit=100&offset=${offset}`,{headers:{'User-Agent':'LanshanFeiwen/1.0 (https://lsfw.top)'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('暂时无法核对看过状态，原排行保留。');const r=await response.json();if(!Array.isArray(r.data)||!Number.isInteger(r.total)||r.total<0||r.total>10000||(!r.data.length&&offset<r.total))throw Error('看过列表未能完整读取。');total=r.total;for(const i of r.data)if(i.type===2&&!i.private)watched.add(i.subject_id);offset+=r.data.length;}
 return {...result,items:result.items.filter(i=>i.type===2&&watched.has(i.id)).map((i,n)=>({...i,position:n+1}))};
}
export function rankingRoutes(app){
 const q=(c,s,...v)=>c.env.DB.prepare(s).bind(...v);
 const pack=row=>({year:row.year,url:row.url,title:row.title,items:JSON.parse(row.items_json),syncedAt:row.synced_at,error:row.last_error});
 async function sync(c,year,url,background=false){
  const result=await fetchRankedDirectory(url,year,fetch,c.env.BANGUMI_USER),now=new Date().toISOString();
  if(background){await q(c,'UPDATE anime_rankings SET title=?,items_json=?,synced_at=?,next_sync=?,last_error=? WHERE year=? AND url=?',result.title,JSON.stringify(result.items),now,Date.now()+21600000,'',year,url).run();return;}
  await q(c,'INSERT INTO anime_rankings(year,url,title,items_json,synced_at,next_sync,last_error) VALUES(?,?,?,?,?,?,?) ON CONFLICT(year) DO UPDATE SET url=excluded.url,title=excluded.title,items_json=excluded.items_json,synced_at=excluded.synced_at,next_sync=excluded.next_sync,last_error=excluded.last_error',year,url,result.title,JSON.stringify(result.items),now,Date.now()+21600000,'').run();
  return {...result,year,url,syncedAt:now,error:''};
 }
 app.get('/api/bangumi/rankings',async c=>c.json((await q(c,'SELECT year,url,title,synced_at FROM anime_rankings ORDER BY year DESC').all()).results));
 app.get('/api/bangumi/rankings/:year',async c=>{
  const row=await q(c,'SELECT * FROM anime_rankings WHERE year=?',Number(c.req.param('year'))).first();if(!row)return c.json({error:'这一年尚未设置目录。'},404);
  if(!row.synced_at){try{return c.json(await sync(c,row.year,row.url))}catch{return c.json({error:'目录暂时未能同步，请稍后重试。'},502)}}
  if(row.next_sync<Date.now()){
   const lock=await q(c,'UPDATE anime_rankings SET next_sync=? WHERE year=? AND next_sync=?',Date.now()+600000,row.year,row.next_sync).run();
   if(lock.meta.changes)c.executionCtx.waitUntil(sync(c,row.year,row.url,true).catch(()=>q(c,"UPDATE anime_rankings SET last_error='自动更新失败，显示上次成功数据。' WHERE year=?",row.year).run()));
  }
  return c.json(pack(row));
 });
 app.get('/api/admin/rankings',async c=>c.json((await q(c,'SELECT * FROM anime_rankings ORDER BY year DESC').all()).results.map(pack)));
 app.put('/api/admin/rankings/:year',async c=>{
  const year=Number(c.req.param('year'));if(!Number.isInteger(year)||year<1900||year>2100)return c.json({error:'年份须为 1900–2100。'},400);
  let url;try{url=directoryURL((await c.req.json()).url)}catch(e){return c.json({error:e.message},400)}
  try{return c.json(await sync(c,year,url))}catch(e){return c.json({error:e.message||'同步失败，原记录仍保留。'},502)}
 });
 app.delete('/api/admin/rankings/:year',async c=>{await q(c,'DELETE FROM anime_rankings WHERE year=?',Number(c.req.param('year'))).run();return c.json({ok:true})});
}
