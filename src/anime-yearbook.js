const date=(y,m,d)=>{const value=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const time=new Date(value+'T00:00:00Z');return Number.isFinite(+time)&&time.toISOString().slice(0,10)===value?value:null};
export function parseWatchTime(text,year){
 const token=String.raw`(?:(\d{4})[年./-])?(\d{1,2})[月./-](\d{1,2})日?`;
 const match=String(text||'').trim().match(new RegExp('^(?:观看(?:时间)?[：:]?\\s*)?'+token));
 if(!match)return null;
 const start=date(Number(match[1]||year),Number(match[2]),Number(match[3]));if(!start)return null;
 const tail=String(text).trim().slice(match[0].length);
 const range=tail.match(/^\s*([—–~～至到-]+)\s*/);
 if(!range)return {start,end:start,ongoing:false,label:match[0]};
 const rest=tail.slice(range[0].length);
 if(/^(未完结|至今|现在|在看|未看完|进行中)/.test(rest))return {start,end:null,ongoing:true,label:match[0]+range[0]+rest.match(/^(未完结|至今|现在|在看|未看完|进行中)/)[0]};
 const last=rest.match(new RegExp('^'+token));if(!last)return null;
 let endYear=Number(last[1]||match[1]||year),end=date(endYear,Number(last[2]),Number(last[3]));
 if(end&&end<start&&!last[1])end=date(endYear+1,Number(last[2]),Number(last[3]));
 if(!end||end<start)return null;
 return {start,end,ongoing:false,label:match[0]+range[0]+last[0]};
}
export function directoryURL(value){
 const u=new URL(String(value));
 if(!['https:','http:'].includes(u.protocol)||!['bgm.tv','bangumi.tv','chii.in'].includes(u.hostname)||u.port||u.username||u.password||!/^\/index\/\d+\/?$/.test(u.pathname))throw Error('请填写 Bangumi 目录链接，例如 https://bgm.tv/index/87023。');
 return 'https://bgm.tv/index/'+u.pathname.match(/\d+/)[0];
}
export async function fetchDirectory(url,year,fetcher=fetch){
 const source=directoryURL(url),id=source.split('/').pop();
 async function get(path){const response=await fetcher('https://api.bgm.tv/v0/indices/'+id+path,{headers:{'User-Agent':'LanshanFeiwen/1.0 (https://lsfw.top)'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Bangumi 目录暂时无法访问，请确认目录公开后重试。');return response.json();}
 const metadata=await get('');if(metadata.ban||typeof metadata.title!=='string')throw Error('目录不可读取。');
 let items=[],offset=0,total=1;const seen=new Set();
 while(offset<total){
  const result=await get('/subjects?limit=50&offset='+offset);
  if(!Array.isArray(result.data)||!Number.isInteger(result.total)||result.total<0||result.total>1000)throw Error('目录返回异常或超过 1000 部，请按年份拆分。');
  total=result.total;if(!result.data.length&&offset<total)throw Error('目录未能完整读取，请稍后重试。');
  for(const row of result.data){if(!Number.isSafeInteger(row.id)||seen.has(row.id))continue;seen.add(row.id);const comment=String(row.comment||'').trim().slice(0,15000),cover=String(row.images?.common||row.images?.medium||'');items.push({id:row.id,name:String(row.name_cn||row.name||'').slice(0,300),cover:/^https:\/\/lain\.bgm\.tv\//.test(cover)?cover:'',comment,time:parseWatchTime(comment,year),type:row.type,position:items.length+1});}
  offset+=result.data.length;
 }
 if(!items.length)throw Error('目录中没有可读取的作品，请确认它是公开目录。');
 return {title:metadata.title.slice(0,160),items};
}
export function yearbookRoutes(app){
 const q=(c,s,...v)=>c.env.DB.prepare(s).bind(...v);
 const pack=row=>({year:row.year,url:row.url,title:row.title,items:JSON.parse(row.items_json),syncedAt:row.synced_at,error:row.last_error});
 async function sync(c,year,url,background=false){
  const result=await fetchDirectory(url,year),now=new Date().toISOString();
  if(background){await q(c,'UPDATE anime_yearbooks SET title=?,items_json=?,synced_at=?,next_sync=?,last_error=? WHERE year=? AND url=?',result.title,JSON.stringify(result.items),now,Date.now()+21600000,'',year,url).run();return;}
  await q(c,'INSERT INTO anime_yearbooks(year,url,title,items_json,synced_at,next_sync,last_error) VALUES(?,?,?,?,?,?,?) ON CONFLICT(year) DO UPDATE SET url=excluded.url,title=excluded.title,items_json=excluded.items_json,synced_at=excluded.synced_at,next_sync=excluded.next_sync,last_error=excluded.last_error',year,url,result.title,JSON.stringify(result.items),now,Date.now()+21600000,'').run();
  return {...result,year,url,syncedAt:now,error:''};
 }
 app.get('/api/bangumi/yearbooks',async c=>c.json((await q(c,'SELECT year,url,title,synced_at FROM anime_yearbooks ORDER BY year DESC').all()).results));
 app.get('/api/bangumi/yearbooks/:year',async c=>{
  const row=await q(c,'SELECT * FROM anime_yearbooks WHERE year=?',Number(c.req.param('year'))).first();if(!row)return c.json({error:'这一年尚未设置目录。'},404);
  if(!row.synced_at){try{return c.json(await sync(c,row.year,row.url))}catch{return c.json({error:'目录暂时未能同步，请稍后重试。'},502)}}
  if(row.next_sync<Date.now()){
   const lock=await q(c,'UPDATE anime_yearbooks SET next_sync=? WHERE year=? AND next_sync=?',Date.now()+600000,row.year,row.next_sync).run();
   if(lock.meta.changes)c.executionCtx.waitUntil(sync(c,row.year,row.url,true).catch(()=>q(c,"UPDATE anime_yearbooks SET last_error='自动更新失败，显示上次成功数据。' WHERE year=?",row.year).run()));
  }
  return c.json(pack(row));
 });
 app.get('/api/admin/yearbooks',async c=>c.json((await q(c,'SELECT * FROM anime_yearbooks ORDER BY year DESC').all()).results.map(pack)));
 app.put('/api/admin/yearbooks/:year',async c=>{
  const year=Number(c.req.param('year'));if(!Number.isInteger(year)||year<1900||year>2100)return c.json({error:'年份须为 1900–2100。'},400);
  let url;try{url=directoryURL((await c.req.json()).url)}catch(e){return c.json({error:e.message},400)}
  try{return c.json(await sync(c,year,url))}catch(e){return c.json({error:e.message||'同步失败，原记录仍保留。'},502)}
 });
 app.delete('/api/admin/yearbooks/:year',async c=>{await q(c,'DELETE FROM anime_yearbooks WHERE year=?',Number(c.req.param('year'))).run();return c.json({ok:true})});
}
