const TTL=15*60*1000;
export async function scanStorage(bucket){
 let cursor,bytes=0,count=0,standardBytes=0,infrequentBytes=0;
 for(let page=0;page<100;page++){
  const result=await bucket.list({limit:1000,...(cursor?{cursor}:{})});
  for(const object of result.objects){bytes+=object.size;count++;if(object.storageClass==='InfrequentAccess')infrequentBytes+=object.size;else standardBytes+=object.size;}
  if(!result.truncated)return {bytes,count,standardBytes,infrequentBytes,checkedAt:new Date().toISOString()};
  if(!result.cursor||result.cursor===cursor)throw Error('Incomplete inventory');
  cursor=result.cursor;
 }
 throw Error('Inventory too large');
}
export function storageEstimate(bytes){return Math.max(0,Math.ceil(bytes/1e9)-10)*0.015;}
export async function r2Usage(c){
 if(!c.env.MEDIA)return c.json({available:false});
 const row=await c.env.DB.prepare("SELECT value,expires_at FROM cache WHERE key='r2-storage-usage'").first();
 const cached=row?JSON.parse(row.value):null;
 if(cached&&row.expires_at>Date.now())return c.json({...cached,available:true,stale:false});
 try{
  const usage=await scanStorage(c.env.MEDIA);
  await c.env.DB.prepare("INSERT INTO cache(key,value,expires_at) VALUES('r2-storage-usage',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires_at=excluded.expires_at").bind(JSON.stringify(usage),Date.now()+TTL).run();
  return c.json({...usage,available:true,stale:false});
 }catch{
  return c.json(cached?{...cached,available:true,stale:true}:{available:false,error:'暂时无法读取云端用量，请稍后重试。'});
 }
}
