import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parseBiliImport} from '../public/bili-import.js';
const item={url:'https://www.bilibili.com/video/BV1X8411f7xN/',title:'马里奥',description:'介绍',cover:'https://i0.hdslb.com/bfs/archive/a.jpg'};
test('browser import accepts only Bilibili videos and trusted image URLs',()=>{
 assert.equal(parseBiliImport(JSON.stringify(item)).status,'draft');
 for(const change of [{url:'https://evil.com/video/BV1X8411f7xN/'},{cover:'javascript:alert(1)'},{cover:'https://i0.hdslb.com.evil.com/a.jpg'},{cover:'https://u:p@i0.hdslb.com/a.jpg'},{title:''}])assert.throws(()=>parseBiliImport(JSON.stringify({...item,...change})));
});
test('helper reads public page metadata only on click and sends an encoded draft to fixed admin origin',()=>{
 let button,opened;const ctx={location:{pathname:'/zh-Hans/video/BV1X8411f7xN/'},alert:assert.fail,window:{open:(...args)=>opened=args},document:{createElement:()=>({style:{}}),querySelector:q=>q==='h1'?{textContent:item.title}:q.includes('og:image')?{content:item.cover}:{content:item.description},body:{append:b=>button=b}}};
 vm.runInNewContext(readFileSync(new URL('../public/lsfw-bili.user.js',import.meta.url),'utf8'),ctx);
 assert.equal(opened,undefined);button.onclick();const u=new URL(opened[0]);assert.equal(u.origin,'https://lsfw.top');assert.equal(u.pathname,'/admin');assert.equal(opened[2],'noopener,noreferrer');assert.equal(parseBiliImport(decodeURIComponent(u.hash.slice('#bili-import/'.length))).cover,item.cover);
});
