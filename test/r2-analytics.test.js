import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeOperations,fetchOperations} from '../src/r2-analytics.js';
const row=(actionType,requests)=>({dimensions:{actionType},sum:{requests}});
test('R2 separates read/write/free and unknown operations',()=>{
 assert.deepEqual(summarizeOperations([row('PutObject',3),row('ListObjects',2),row('GetObject',9),row('HeadObject',1),row('DeleteObject',4),row('Unknown',2)]),{classA:5,classB:10,other:6,total:21});
 assert.throws(()=>summarizeOperations(null));assert.throws(()=>summarizeOperations([row('GetObject',null)]));
});
test('R2 GraphQL errors never become zero usage',async()=>{
 await assert.rejects(()=>fetchOperations('test',new Date('2026-09-27T00:00:00Z'),async()=>({ok:true,json:async()=>({errors:[{message:'denied'}]})})));
});
test('R2 queries UTC month and account scope separately from bucket',async()=>{
 const r=await fetchOperations('test',new Date('2026-10-01T00:00:00Z'),async(url,options)=>{
 const body=JSON.parse(options.body);assert.equal(body.variables.start,'2026-10-01T00:00:00.000Z');assert.match(body.query,/bucketName:"lsfw-media"/);
 return {ok:true,json:async()=>({data:{viewer:{accounts:[{site:[row('GetObject',2)],account:[row('GetObject',5)]}]}}})};
 });assert.equal(r.site.classB,2);assert.equal(r.account.classB,5);
});
