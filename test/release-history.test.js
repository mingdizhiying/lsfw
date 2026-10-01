import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseBody,syncReleaseProject,releaseProjectId} from '../src/release-history.js';
const source='# 发布记录\n基线 2026-09-19\n## v1.0.1 · 修复\n- 第一版\n## v1.0.2 · 更新\n- <script>alert(1)</script>\n';
test('release history is newest first and escapes source HTML',()=>{
 const body=releaseBody(source);
 assert.ok(body.indexOf('v1.0.2')<body.indexOf('v1.0.1'));
 assert.ok(body.includes('&lt;script&gt;'));
 assert.ok(!body.includes('<script>'));
 assert.throws(()=>releaseBody('<html>Bad gateway</html>'));
});
function fixture(old=null,expires=0){
 const writes=[];
 const DB={prepare(sql){
  return {bind(...args){
   return {
    async first(){return sql.includes('FROM cache')?{expires_at:expires}:old;},
    async run(){writes.push({sql,args});}
   };
  }};
 }};
 return {writes,env:{DB}};
}
test('sync creates project from GitHub, then updates existing history',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(source);
 try{
  for(const old of [null,{body:'previous history'}]){
   const c=fixture(old);await syncReleaseProject(c);
   const insert=c.writes.find(w=>w.sql.includes('INSERT INTO entries'));
   assert.equal(insert.args[0],releaseProjectId);
   assert.equal(insert.args[2],releaseBody(source));
   assert.equal(c.writes.length,2);
  }
 }finally{globalThis.fetch=original;}
});
test('GitHub failure preserves existing history; first load falls back to bundled history',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response('unavailable',{status:503});
 try{
  const existing=fixture({body:'saved'});await syncReleaseProject(existing);
  assert.ok(existing.writes.every(w=>!w.sql.includes('INSERT INTO entries')));
  const fresh=fixture();await syncReleaseProject(fresh);
  assert.ok(fresh.writes.some(w=>w.sql.includes('INSERT INTO entries')));
 }finally{globalThis.fetch=original;}
});
test('fresh cache skips GitHub and database updates',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('must not fetch');};
 try{const c=fixture(null,Date.now()+300000);await syncReleaseProject(c);assert.equal(c.writes.length,0);}finally{globalThis.fetch=original;}
});
