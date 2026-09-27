const ACCOUNT='2b23a5289ca4cbcb10045cf6a2a3f94c';
const A=new Set(['ListBuckets','PutBucket','ListObjects','ListObjectsV2','PutObject','CopyObject','CompleteMultipartUpload','CreateMultipartUpload','LifecycleStorageTierTransition','ListMultipartUploads','UploadPart','UploadPartCopy','ListParts','PutBucketEncryption','PutBucketCors','PutBucketLifecycleConfiguration']);
const B=new Set(['HeadBucket','HeadObject','GetObject','UsageSummary','GetBucketEncryption','GetBucketLocation','GetBucketCors','GetBucketLifecycleConfiguration']);
export function summarizeOperations(rows){
 if(!Array.isArray(rows)||rows.length>=10000)throw Error('Incomplete analytics');
 const out={classA:0,classB:0,other:0,total:0};
 for(const row of rows){const n=row.sum?.requests;if(!Number.isFinite(n)||n<0)throw Error('Invalid analytics');const action=row.dimensions?.actionType;out.total+=n;out[A.has(action)?'classA':B.has(action)?'classB':'other']+=n;}
 return out;
}
export async function fetchOperations(token,clock=new Date(),fetcher=fetch){
 const start=new Date(Date.UTC(clock.getUTCFullYear(),clock.getUTCMonth(),1)).toISOString(),end=clock.toISOString();
 const query=`query($accountTag:string!,$start:Time!,$end:Time!){viewer{accounts(filter:{accountTag:$accountTag}){site:r2OperationsAdaptiveGroups(limit:10000,filter:{datetime_geq:$start,datetime_leq:$end,bucketName:"lsfw-media"}){sum{requests}dimensions{actionType}}account:r2OperationsAdaptiveGroups(limit:10000,filter:{datetime_geq:$start,datetime_leq:$end}){sum{requests}dimensions{actionType}}}}}`;
 const response=await fetcher('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{accountTag:ACCOUNT,start,end}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Analytics unavailable');
 const data=await response.json(),accounts=data.data?.viewer?.accounts;
 if(data.errors?.length||!Array.isArray(accounts)||accounts.length!==1)throw Error('Analytics unavailable');
 return {site:summarizeOperations(accounts[0].site),account:summarizeOperations(accounts[0].account),start,end,checkedAt:end};
}
export async function r2Analytics(c){
 if(!c.env.CF_ANALYTICS_TOKEN)return c.json({available:false,configured:false});
 const month=new Date().toISOString().slice(0,7),key='r2-analytics:'+month;
 const row=await c.env.DB.prepare('SELECT value,expires_at FROM cache WHERE key=?').bind(key).first();
 const cached=row?JSON.parse(row.value):null;
 if(cached&&row.expires_at>Date.now())return c.json({...cached,available:true,configured:true,stale:false});
 try{
 const value=await fetchOperations(c.env.CF_ANALYTICS_TOKEN);
 await c.env.DB.prepare('INSERT INTO cache(key,value,expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires_at=excluded.expires_at').bind(key,JSON.stringify(value),Date.now()+900000).run();
 return c.json({...value,available:true,configured:true,stale:false});
 }catch{return c.json(cached?{...cached,available:true,configured:true,stale:true}:{available:false,configured:true,error:'统计暂时无法读取，请检查令牌权限或稍后重试。'});}
}
