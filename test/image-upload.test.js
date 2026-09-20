import test from 'node:test';
import assert from 'node:assert/strict';
import {compressImage} from '../public/image-upload.js';
test('mobile upload falls back to Image decoding and emits a JPEG',async t=>{
 let closed=0;const canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toBlob:callback=>callback(new Blob(['test'],{type:'image/jpeg'}))};
 t.mock.method(URL,'createObjectURL',()=> 'blob:test');t.mock.method(URL,'revokeObjectURL',()=>closed++);
 const oldImage=globalThis.Image,oldDocument=globalThis.document,oldBitmap=globalThis.createImageBitmap;
 globalThis.createImageBitmap=async()=>{throw Error('unsupported')};globalThis.Image=class{naturalWidth=4000;naturalHeight=3000;set src(v){queueMicrotask(()=>this.onload())}};globalThis.document={createElement:()=>canvas};
 try{const blob=await compressImage({type:'image/jpeg',size:100,name:'photo.jpg'});assert.equal(blob.type,'image/jpeg');assert.equal(canvas.width,2000);assert.equal(canvas.height,1500);assert.equal(closed,1)}finally{globalThis.Image=oldImage;globalThis.document=oldDocument;globalThis.createImageBitmap=oldBitmap}
});
