import test from 'node:test';
import assert from 'node:assert/strict';
import {deletePhoto} from '../public/delete-photo.js';
test('photo deletion requires explicit confirmation, prevents duplicates, reports failures and allows retry',async()=>{
 const originalDocument=globalThis.document,originalFetch=globalThis.fetch;let current,calls=0,done=0,resolve;
 globalThis.document={body:{append(){}},createElement(){const elements={'[data-confirm]':{},'[data-cancel]':{focus(){}},'[role="status"]':{}};const listeners={};current={elements,setAttribute(){},querySelector(s){return elements[s]},addEventListener(k,fn){listeners[k]=fn},showModal(){this.open=true},close(){this.open=false;listeners.close?.()},remove(){this.removed=true}};return current}};
 globalThis.fetch=async()=>{calls++;return new Promise(r=>resolve=r)};
 try{deletePhoto('test-photo',()=>done++);assert.equal(calls,0);current.elements['[data-cancel]'].onclick();assert.equal(current.removed,true);assert.equal(done,0);
 deletePhoto('test-photo',()=>done++);const dialog=current,button=dialog.elements['[data-confirm]'];const first=button.onclick();await button.onclick();assert.equal(calls,1);assert.equal(button.disabled,true);resolve({ok:false,status:503,json:async()=>({error:'存储暂不可用'})});await first;assert.equal(done,0);assert.equal(dialog.open,true);assert.match(dialog.elements['[role="status"]'].textContent,/存储暂不可用/);assert.equal(button.disabled,false);
 const retry=button.onclick();resolve({ok:true,json:async()=>({ok:true})});await retry;assert.equal(calls,2);assert.equal(done,1);assert.equal(dialog.removed,true);
 }finally{globalThis.document=originalDocument;globalThis.fetch=originalFetch}
});
