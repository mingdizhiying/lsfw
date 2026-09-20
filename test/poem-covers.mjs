import assert from 'node:assert/strict';
const base='http://127.0.0.1:8792';let cookie='';
async function req(path,body,method=body?'PUT':'GET'){const r=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')}}
const login=await req('/api/auth/login',{email:process.env.TEST_ADMIN_EMAIL||'admin@example.com',password:'local-test-password-98765'},'POST');assert.equal(login.status,200);cookie=login.cookie.split(';')[0];
const fd=new FormData();fd.set('file',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'test.png');const upload=await fetch(base+'/api/admin/media',{method:'POST',headers:{Origin:base,Cookie:cookie},body:fd});assert.equal(upload.status,200);const cover=await upload.json();
const bid=crypto.randomUUID(),pid=crypto.randomUUID(),book={title:'配图权限测试',status:'draft'},poem={book_id:bid,title:'配图诗',body:'第一行\n第二行',date:'2026-09-20',status:'published',cover:cover.url};
assert.equal((await req('/api/admin/poetry/books/'+bid,book)).status,200);assert.equal((await req('/api/admin/poetry/poems/'+pid,poem)).status,200);assert.equal((await fetch(base+cover.url)).status,403);
await req('/api/admin/poetry/books/'+bid,{...book,status:'published'});assert.equal((await fetch(base+cover.url)).status,200);assert.equal((await req('/api/poetry/poems/'+pid)).body.cover,cover.url);
assert.equal((await req('/api/admin/poetry/poems/'+pid,{...poem,cover:'https://example.com/a.jpg'})).status,400);
await req('/api/admin/poetry/poems/'+pid,{...poem,status:'draft'});assert.equal((await fetch(base+cover.url)).status,403);
await req('/api/admin/media/'+cover.id,{},'DELETE');const admin=await req('/api/admin/poetry');assert.equal(admin.body.poems.find(p=>p.id===pid).cover,'');assert.equal((await fetch(base+cover.url)).status,404);
console.log('PASS: poem cover persistence, parent and poem draft privacy, invalid cover rejection, deletion cleanup');
