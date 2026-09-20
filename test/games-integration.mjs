import assert from 'node:assert/strict';
const base='http://127.0.0.1:8792';let cookie='';
async function req(path,body,method=body?'PUT':'GET',auth=true){const r=await fetch(base+path,{method,headers:{Origin:base,...(auth?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')}}
const login=await req('/api/auth/login',{email:process.env.TEST_ADMIN_EMAIL||'admin@example.com',password:'local-test-password-98765'},'POST');assert.equal(login.status,200);cookie=login.cookie.split(';')[0];
assert.equal((await req('/api/admin/games',null,'GET',false)).status,401);
assert.equal((await req('/api/admin/games/search?q=test',null,'GET',false)).status,401);
const search=await req('/api/admin/games/search?q='+encodeURIComponent('星露谷'));assert.equal(search.status,200);assert.ok(search.body.length);const id=crypto.randomUUID(),g={...search.body[0],review:'喜欢这里的慢节奏。\n可以认真过每一天。',steam_appid:413150,status:'draft'};
assert.equal((await req('/api/admin/games/'+id,g)).status,200);assert.ok(!(await req('/api/games')).body.some(x=>x.id===id));
assert.equal((await req('/api/admin/games/'+id,{...g,cover:'https://evil.example/image'})).status,400);
await req('/api/admin/games/'+id,{...g,status:'published'});const pub=(await req('/api/games')).body.find(x=>x.id===id);assert.equal(pub.review,g.review);assert.equal(pub.minutes,null);assert.ok((await req('/api/games?home=1')).body.length<=3);
assert.equal((await req('/api/admin/games/sync',{},'POST')).status,400);
const admin=(await req('/api/admin/games')).body;assert.equal(admin.configured,false);assert.ok(!('key' in admin));console.log('PASS: authenticated search, real Bangumi import, draft privacy, input validation, review roundtrip, home limit, unavailable Steam time');
