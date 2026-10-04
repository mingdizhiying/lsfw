import test from 'node:test';import assert from 'node:assert/strict';import {bindLightbox} from '../public/lightbox.js';
for(const native of [false,true])test(`photo lightbox opens and closes with ${native?'native dialog':'Safari fallback'}`,()=>{
 const old=globalThis.document;let click,closedHandler,focused=false,srcRemoved=false;const attrs=new Map(),classes=new Set(),button={focus(){focused=true}},image={removeAttribute(){srcRemoved=true}},caption={};
 const box={querySelector:s=>s==='img'?image:s==='p'?caption:button,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},addEventListener:(n,fn)=>{if(n==='close')closedHandler=fn;},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),hasAttribute:k=>attrs.has(k)};
 if(native){box.showModal=()=>attrs.set('open','');box.close=()=>{attrs.delete('open');closedHandler();};}
 globalThis.document={body:{classList:{add(){},remove(){}}},addEventListener(){}};
 try{bindLightbox({addEventListener:(n,fn)=>click=fn},box);click({target:{closest:()=>({dataset:{full:'/media/test',caption:'Photo'},focus(){}})}});assert.ok(attrs.has('open'));assert.equal(image.src,'/media/test');assert.equal(caption.textContent,'Photo');assert.ok(focused);assert.equal(classes.has('lightbox-fallback'),!native);button.onclick();assert.equal(attrs.has('open'),false);assert.ok(srcRemoved);}finally{globalThis.document=old;}
});
