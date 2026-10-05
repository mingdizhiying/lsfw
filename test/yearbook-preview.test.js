import test from 'node:test';
import assert from 'node:assert/strict';
import {previewPosition} from '../public/anime-yearbook.js';
test('yearbook preview follows the clicked point on a long bar',()=>{
 const p=previewPosition({left:400,right:418,top:-300,bottom:900},600,270,160,1200,800);
 assert.deepEqual(p,{left:426,top:520});
});
test('yearbook preview switches to the left at the screen edge',()=>{
 assert.deepEqual(previewPosition({left:1000,right:1018},400,270,160,1100,800),{left:722,top:320});
});
test('yearbook preview stays inside a mobile viewport',()=>{
 const p=previewPosition({left:300,right:318},790,270,210,375,800);
 assert.deepEqual(p,{left:22,top:578});
 const top=previewPosition({left:25,right:43},10,270,210,375,800);
 assert.equal(top.top,12);
});
