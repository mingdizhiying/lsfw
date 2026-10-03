import {isIP} from 'node:net';
const q=(c,s,...p)=>c.env.DB.prepare(s).bind(...p);
export function bookmarkURL(value){
 const found=String(value||'').slice(0,12000).match(/https?:\/\/[^\s<>"“”]+/i);if(!found)throw Error('请粘贴包含 http 或 https 链接的分享文字。');
 const u=new URL(found[0].replace(/[。，、！；）)\]】]+$/g,''));
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||isIP(u.hostname.replace(/^\[|\]$/g,''))||!u.hostname.includes('.')||/\.(localhost|local|internal|lan|test|invalid|onion)$/i.test(u.hostname))throw Error('请使用公开网站的完整链接。');
 return u;
}
export function publicIP(ip){
 if(isIP(ip)===6)return /^[23][0-9a-f]{3}:/i.test(ip)&&!/^2001:(?:db8|0):/i.test(ip)&&!/^2002:/i.test(ip);
 if(isIP(ip)!==4)return false;
 const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===198&&[18,19,51].includes(b)||a===192&&b===0||a===203&&b===0);
}
async function checkDNS(u,request){
 if(['b23.tv','www.bilibili.com','bilibili.com','m.bilibili.com'].includes(u.hostname))return;
 const results=await Promise.all(['A','AAAA'].map(async type=>{const r=await request('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(u.hostname)+'&type='+type,{headers:{Accept:'application/dns-json'},signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('暂时无法检查网址。');return r.json()}));
 const ips=results.flatMap(r=>(r.Answer||[]).filter(a=>a.type===1||a.type===28).map(a=>a.data));if(!ips.length||ips.some(ip=>!publicIP(ip)))throw Error('无法读取此网站地址。');
}
async function readText(response){
 if(Number(response.headers.get('content-length'))>700000)throw Error('网页内容过大，可手动填写。');
 const reader=response.body.getReader();let size=0;const chunks=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>700000)throw Error('网页内容过大，可手动填写。');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.length;}return new TextDecoder().decode(bytes);
}
const decode=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&(?:amp|quot|apos|lt|gt|nbsp);/g,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '}[x])).replace(/&#(x[\da-f]+|\d+);/gi,(m,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):'';}).trim();
export function metadata(text){const meta={};for(const tag of text.match(/<meta\b[^>]*>/gi)||[]){const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[m[1].toLowerCase()]=m[2]??m[3]??m[4];const key=attrs.property||attrs.name;if(key)meta[key.toLowerCase()]=decode(attrs.content);}
 return {title:(meta['og:title']||decode(text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])).slice(0,200),description:(meta['og:description']||meta.description||'').slice(0,2000)};
}
export function bookmarkCover(value){try{const u=new URL(value);return u.protocol==='https:'&&/^(?:[a-z\d-]+\.)*hdslb\.com$/i.test(u.hostname)&&!u.port&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export async function resolveBookmark(value,request=fetch){
 let u=bookmarkURL(value);let result={url:u.href,title:'',description:'',cover:'',kind:'website'};
 try{for(let n=0;n<4;n++){
  await checkDNS(u,request);
  const bvid=/(?:^|\/)video\/(BV[a-zA-Z0-9]+)/.exec(u.pathname)?.[1];
  if((u.hostname==='bilibili.com'||u.hostname.endsWith('.bilibili.com'))&&bvid){
   result={...result,url:'https://www.bilibili.com/video/'+bvid+'/',kind:'video'};
   try{const r=await request('https://api.bilibili.com/x/web-interface/view?bvid='+bvid,{redirect:'error',signal:AbortSignal.timeout(7000)});const d=JSON.parse(await readText(r));if(d.code===0&&d.data?.title)return {...result,title:String(d.data.title).slice(0,200),description:String(d.data.desc||'').slice(0,2000),cover:bookmarkCover(String(d.data.pic||'').replace(/^http:/,'https:'))};}catch{}
  }
  const r=await request(u.href,{redirect:'manual',headers:{'User-Agent':'Mozilla/5.0 (compatible; LsfwBookmarks/1.0)'},signal:AbortSignal.timeout(7000)});
  if(r.status>=300&&r.status<400&&r.headers.get('location')){u=bookmarkURL(new URL(r.headers.get('location'),u).href);continue;}
  if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('网站暂不允许读取');
  const info=metadata(await readText(r));if(!info.title)throw Error('未找到网页标题');return {...result,...info,url:result.kind==='video'?result.url:u.href};
 }throw Error('跳转次数过多');}catch{return {...result,warning:'未能自动读取完整资料，可手动填写标题和简介后保存。'};}
}
export function bookmarkRoutes(app){
 app.get('/api/bookmarks',async c=>c.json((await q(c,"SELECT * FROM bookmarks WHERE status='published' ORDER BY updated_at DESC").all()).results));
 app.get('/api/admin/bookmarks',async c=>c.json((await q(c,'SELECT * FROM bookmarks ORDER BY updated_at DESC').all()).results));
 app.post('/api/admin/bookmarks/resolve',async c=>{try{return c.json(await resolveBookmark((await c.req.json()).text))}catch(e){return c.json({error:e.message},400)}});
 app.put('/api/admin/bookmarks/:id',async c=>{try{const b=await c.req.json(),id=c.req.param('id');if(!/^[a-z\d-]{1,80}$/i.test(id)||!String(b.title||'').trim())throw Error('请填写标题。');const url=bookmarkURL(b.url).href;const existing=await q(c,'SELECT id FROM bookmarks WHERE url=? AND id<>?',url,id).first();if(existing)return c.json({error:'这个链接已经收藏，请编辑已有收藏。'},409);const stamp=new Date().toISOString();await q(c,`INSERT INTO bookmarks(id,url,title,description,note,category,kind,cover,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET url=excluded.url,title=excluded.title,description=excluded.description,note=excluded.note,category=excluded.category,kind=excluded.kind,cover=excluded.cover,status=excluded.status,updated_at=excluded.updated_at`,id,url,String(b.title).trim().slice(0,200),String(b.description||'').slice(0,2000),String(b.note||'').slice(0,3000),String(b.category||'').slice(0,60),b.kind==='video'?'video':'website',bookmarkCover(b.cover),b.status==='published'?'published':'draft',stamp,stamp).run();return c.json({id});}catch(e){return c.json({error:e.message},400)}});
 app.delete('/api/admin/bookmarks/:id',async c=>{await q(c,'DELETE FROM bookmarks WHERE id=?',c.req.param('id')).run();return c.json({ok:true})});
}
