import test from 'node:test';
import assert from 'node:assert/strict';
import {scanStorage} from '../src/r2-usage.js';
test('R2 inventory follows every cursor and separates storage classes',async()=>{
 const calls=[];const result=await scanStorage({list:async args=>{calls.push(args);return args.cursor?{objects:[{size:4,storageClass:'InfrequentAccess'}],truncated:false}:{objects:[{size:12},{size:7,storageClass:'Standard'}],truncated:true,cursor:'next'};}});
 assert.equal(result.count,3);assert.equal(result.bytes,23);assert.equal(result.standardBytes,19);assert.equal(result.infrequentBytes,4);assert.equal(calls[1].cursor,'next');
});
test('R2 inventory never returns a misleading partial total',async()=>{
 await assert.rejects(()=>scanStorage({list:async()=>({objects:[{size:12}],truncated:true})}));
});
test('Empty R2 bucket is a valid zero inventory',async()=>{
 const r=await scanStorage({list:async()=>({objects:[],truncated:false})});assert.equal(r.bytes,0);assert.equal(r.count,0);
});
