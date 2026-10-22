import {fetchOperations} from './r2-analytics.js';
export const READ_LIMIT=9000000;
const monthOf=clock=>clock.toISOString().slice(0,7);
export async function ensureBudget(env,clock=new Date(),analytics=fetchOperations){
 const month=monthOf(clock);let row=await env.DB.prepare('SELECT * FROM media_read_budget WHERE month=?').bind(month).first();
 if(row)return row;
 if(!env.CF_ANALYTICS_TOKEN)throw Error('图片预算尚未初始化：请配置统计授权。');
 const stats=await analytics(env.CF_ANALYTICS_TOKEN,clock);
 const baseline=Math.ceil(stats.account.classB);
 if(!Number.isSafeInteger(baseline)||baseline<0)throw Error('读取统计无效。');
 await env.DB.prepare('INSERT OR IGNORE INTO media_read_budget(month,baseline,reads,seeded_at) VALUES(?,?,0,?)').bind(month,baseline,clock.toISOString()).run();
 return env.DB.prepare('SELECT * FROM media_read_budget WHERE month=?').bind(month).first();
}
export async function reserveRead(env,clock=new Date()){
 const row=await ensureBudget(env,clock);
 return !!await env.DB.prepare('UPDATE media_read_budget SET reads=reads+1 WHERE month=? AND baseline+reads<? RETURNING reads').bind(row.month,READ_LIMIT).first();
}
export async function mediaBudgetStatus(c){
 try{const r=await ensureBudget(c.env);return c.json({...r,limit:READ_LIMIT,remaining:Math.max(0,READ_LIMIT-r.baseline-r.reads),available:true});}
 catch{return c.json({available:false,error:'图片月度预算初始化失败，未缓存图片暂时受保护停用；请检查统计授权。'});}
}
export async function mediaRateGuard(c,next){
 try{if(!c.env.MEDIA_RATE_LIMITER)throw Error('Missing limiter');const r=await c.env.MEDIA_RATE_LIMITER.limit({key:'media:'+ (c.req.header('CF-Connecting-IP')||'unknown')});if(!r.success)return new Response('图片访问过于频繁，请稍后重试。',{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});}
 catch{return new Response('图片访问保护暂时不可用，请稍后重试。',{status:503,headers:{'Retry-After':'60','Cache-Control':'no-store'}});}
 return next();
}
// Call only AFTER checking current media existence and access permissions.
export async function protectedMedia(c,m,cache=globalThis.caches?.default){
 const key=new Request(new URL('/__media_cache_v1/'+encodeURIComponent(m.id),c.env.SITE_ORIGIN||c.req.url));
 const headers={'Content-Type':m.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 let hit;try{hit=await cache?.match(key)}catch{}
 if(hit)return new Response(hit.body,{headers:{...headers,'X-Media-Cache':'HIT'}});
 try{if(!await reserveRead(c.env))return new Response('本月图片读取预算已达保护线，请下月再试。',{status:503,headers:{'Retry-After':'3600','Cache-Control':'no-store'}});}
 catch{return new Response('图片预算检查暂时不可用，请稍后重试。',{status:503,headers:{'Retry-After':'60','Cache-Control':'no-store'}});}
 const object=await c.env.MEDIA.get(m.id);
 if(!object)return new Response('照片不存在。',{status:404,headers:{'Cache-Control':'no-store'}});
 const response=new Response(object.body,{headers:{...headers,'X-Media-Cache':'MISS'}});
 if(cache){const copy=response.clone();copy.headers.set('Cache-Control','public, max-age=86400');try{await cache.put(key,copy)}catch{}}
 return response;
}
