const q=(c,s,...p)=>c.env.DB.prepare(s).bind(...p);
const hosts=new Set(['music.163.com','y.music.163.com','163cn.tv']);
export function musicURL(value){
 const found=String(value||'').match(/https?:\/\/[^\s<>"，。)）]+/i);if(!found)throw Error('请粘贴网易云单曲分享链接。');
 const u=new URL(found[0]);if(!hosts.has(u.hostname)||u.username||u.password||u.port)throw Error('仅支持网易云音乐的分享链接。');u.protocol='https:';return u;
}
export function songID(u){
 const hash=u.hash.replace(/^#/,'');const route=hash.startsWith('/')?new URL(hash,u.origin):u;
 if(!/^\/(?:m\/)?song\/?$/.test(route.pathname))return null;
 const id=route.searchParams.get('id');return /^\d{1,16}$/.test(id||'')?id:null;
}
export function musicCover(value){try{const u=new URL(value);if(!/^p\d+\.music\.126\.net$/.test(u.hostname)||u.port||u.username||u.password)return '';u.protocol='https:';return u.href}catch{return ''}}
export async function readSong(value,request=fetch){
 let u=musicURL(value),id;
 for(let n=0;n<5;n++){
  id=songID(u);if(id)break;
  const r=await request(u.href,{redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(r.status<300||r.status>=400||!r.headers.get('location'))throw Error('未识别到单曲，请使用“分享歌曲 → 复制链接”，暂不支持歌单或专辑。');
  u=musicURL(new URL(r.headers.get('location'),u).href);
 }
 if(!id)throw Error('分享链接跳转过多，请复制单曲的完整链接。');
 const r=await request('https://music.163.com/api/song/detail/?id='+id+'&ids='+encodeURIComponent('['+id+']'),{redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('网易云暂时无法读取，请稍后重试。');
 const d=await r.json(),s=d.songs?.find(s=>String(s.id)===id);if(!s?.name)throw Error('歌曲不存在或暂时无法读取。');
 return {id,title:String(s.name).slice(0,200),artist:(s.artists||[]).map(a=>a.name).join(' / ').slice(0,300),album:String(s.album?.name||'').slice(0,200),cover:musicCover(s.album?.picUrl),url:'https://music.163.com/song?id='+id};
}
export function normalizeMusicTags(value){return [...new Set((Array.isArray(value)?value:String(value||'').split(/[,，]/)).map(x=>String(x).trim().slice(0,30)).filter(Boolean))].slice(0,12);}
const packMusic=row=>({...row,pinned:!!row.pinned,tags:normalizeMusicTags(JSON.parse(row.tags||'[]'))});
export function musicRoutes(app){
 app.get('/api/music',async c=>c.json((await q(c,"SELECT * FROM music_tracks WHERE status='published' ORDER BY pinned DESC,updated_at DESC,id DESC").all()).results.map(packMusic)));
 app.get('/api/admin/music',async c=>c.json((await q(c,'SELECT * FROM music_tracks ORDER BY pinned DESC,updated_at DESC,id DESC').all()).results.map(packMusic)));
 app.post('/api/admin/music/resolve',async c=>{try{const b=await c.req.json();return c.json(await readSong(b.url))}catch(e){return c.json({error:e.message||'无法读取歌曲。'},400)}});
 app.put('/api/admin/music/:id',async c=>{const id=c.req.param('id'),b=await c.req.json();if(!/^\d{1,16}$/.test(id)||typeof b.title!=='string'||!b.title.trim()||b.cover&&!musicCover(b.cover))return c.json({error:'请先读取有效歌曲，检查名称和封面。'},400);
 await q(c,'INSERT INTO music_tracks(id,title,artist,album,cover,review,status,updated_at,pinned,tags) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,artist=excluded.artist,album=excluded.album,cover=excluded.cover,review=excluded.review,status=excluded.status,updated_at=excluded.updated_at,pinned=excluded.pinned,tags=excluded.tags',id,b.title.trim().slice(0,200),String(b.artist||'').slice(0,300),String(b.album||'').slice(0,200),musicCover(b.cover),String(b.review||'').slice(0,3000),b.status==='published'?'published':'draft',new Date().toISOString(),b.pinned===true||b.pinned===1?1:0,JSON.stringify(normalizeMusicTags(b.tags))).run();return c.json({id});
 });
}
