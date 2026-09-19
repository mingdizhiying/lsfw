export async function deleteMedia(c, query, profile) {
  const id=c.req.param('id');
  if(!/^[a-zA-Z0-9-]+$/.test(id))return c.json({error:'照片不存在。'},404);
  const media=await query(c,'SELECT id FROM media WHERE id=?',id).first();
  if(!media)return c.json({ok:true});
  if(!c.env.MEDIA)return c.json({error:'照片存储暂不可用。'},503);
  const url='/media/'+id;
  const rows=(await query(c,'SELECT id,body,cover FROM entries WHERE cover=? OR instr(body,?)>0',url,url).all()).results;
  const imagePattern=new RegExp('<img\\b[^>]*\\bsrc="'+url+'"[^>]*>','g');
  const statements=rows.map(e=>query(c,'UPDATE entries SET body=?,cover=?,updated_at=? WHERE id=?',e.body.replace(imagePattern,''),e.cover===url?'':e.cover,new Date().toISOString(),e.id));
  const p=await profile(c);
  if(p.avatar===url){p.avatar='';statements.push(query(c,"UPDATE settings SET value=? WHERE key='profile'",JSON.stringify(p)))}
  statements.push(query(c,"UPDATE poetry_books SET cover='' WHERE cover=?",url));
  statements.push(query(c,'DELETE FROM media WHERE id=?',id));
  // Delete the object first; a failed DB update can safely be retried.
  await c.env.MEDIA.delete(id);
  await c.env.DB.batch(statements);
  return c.json({ok:true});
}
