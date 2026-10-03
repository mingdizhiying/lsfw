import test from 'node:test';
import assert from 'node:assert/strict';
import {bookmarkURL,publicIP,metadata,resolveBookmark,bookmarkCover} from '../src/bookmarks.js';
test('share text extracts links and rejects internal and credential targets',()=>{
 assert.equal(bookmarkURL('分享视频 https://b23.tv/abc123 【哔哩哔哩】').href,'https://b23.tv/abc123');
 for(const s of ['http://127.0.0.1','http://2130706433','http://[::1]','http://server.local/a','https://user:pass@example.com','http://example.com:8080'])assert.throws(()=>bookmarkURL(s));
 for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1'])assert.equal(publicIP(ip),false);
 assert.equal(publicIP('1.1.1.1'),true);
});
test('metadata accepts reversed attributes and decodes titles without executing markup',()=>{
 assert.deepEqual(metadata('<title>Fallback</title><meta content="A &amp; B" property="og:title"><meta name="description" content="hello &#x4e16;&#30028;">'),{title:'A & B',description:'hello 世界'});
 assert.equal(bookmarkCover('https://evil.com/x.jpg'),'');
});
const dns=()=>Response.json({Answer:[{type:1,data:'1.1.1.1'}]});
test('Bilibili short link resolves to canonical video metadata',async()=>{
 const request=async url=>{if(url.includes('dns-query'))return dns();if(url==='https://b23.tv/abc')return new Response(null,{status:302,headers:{location:'https://www.bilibili.com/video/BV1GJ411x7h7/'}});if(url.includes('api.bilibili.com'))return Response.json({code:0,data:{title:'视频',desc:'介绍',pic:'http://i0.hdslb.com/a.jpg'}});throw Error(url);};
 const r=await resolveBookmark('分享 https://b23.tv/abc',request);assert.equal(r.kind,'video');assert.equal(r.title,'视频');assert.equal(r.cover,'https://i0.hdslb.com/a.jpg');
});
test('private DNS answers and unsafe redirects never get fetched',async()=>{
 let calls=[];const r=await resolveBookmark('https://example.com',async url=>{calls.push(url);return Response.json({Answer:[{type:1,data:'10.0.0.1'}]});});assert.ok(r.warning);assert.ok(calls.every(x=>x.includes('dns-query')));
 calls=[];await resolveBookmark('https://example.com',async url=>{calls.push(url);return url.includes('dns-query')?dns():new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});});assert.ok(!calls.some(x=>x.includes('127.0.0.1')));
});
test('blocked sites preserve original link for manual editing',async()=>{
 const r=await resolveBookmark('https://example.com',async url=>url.includes('dns-query')?dns():new Response('blocked',{status:403}));assert.equal(r.url,'https://example.com/');assert.ok(r.warning);assert.equal(r.title,'');
});
import {readPreviewImage} from '../src/bookmarks.js';
test('website previews resolve relative OG images and reject non-images and private redirects',async()=>{
 const r=await resolveBookmark('https://example.com/page',async url=>url.includes('dns-query')?dns():new Response('<title>Example</title><meta property="og:image" content="/cover.png">',{headers:{'content-type':'text/html'}}));
 assert.equal(r.cover,'https://example.com/cover.png');
 await assert.rejects(()=>readPreviewImage('https://example.com/cover',async url=>url.includes('dns-query')?dns():new Response('<html>unsafe</html>',{headers:{'content-type':'text/html'}})));
 await assert.rejects(()=>readPreviewImage('https://example.com/cover',async url=>url.includes('dns-query')?dns():new Response(null,{status:302,headers:{location:'http://127.0.0.1/a'}})));
 const image=await readPreviewImage('https://example.com/cover.png',async url=>url.includes('dns-query')?dns():new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}}));
 assert.equal(image.type,'image/png');assert.equal(image.bytes.length,3);
});
