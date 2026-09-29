import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWatchTime,directoryURL,fetchDirectory} from '../src/anime-yearbook.js';
import {watchBar} from '../public/anime-yearbook.js';
test('watch dates recognize actual directory notation and reject guesses',()=>{
 assert.equal(parseWatchTime('5.10—5.12 感想',2025).end,'2025-05-12');
 assert.equal(parseWatchTime('11.21——12.20',2025).start,'2025-11-21');
 assert.equal(parseWatchTime('8.28–8.30',2025).end,'2025-08-30');
 assert.equal(parseWatchTime('1.1\n感想',2026).end,'2026-01-01');
 assert.equal(parseWatchTime('10.2——未完结',2025).ongoing,true);
 assert.equal(parseWatchTime('2025.12.28—2026.1.5',2025).end,'2026-01-05');
 assert.equal(parseWatchTime('12.28—1.5',2025).end,'2026-01-05');
 assert.equal(parseWatchTime('只有文字，没有时间',2026),null);
 assert.equal(parseWatchTime('2.30',2026),null);
 assert.equal(parseWatchTime('5.10—待补充',2026),null);
});
test('directory URL rejects external hosts and credentials',()=>{
 assert.equal(directoryURL('https://bangumi.tv/index/123'),'https://bgm.tv/index/123');
 for(const u of ['https://evil.test/index/1','https://bgm.tv.evil.test/index/1','https://a@bgm.tv/index/1','file:///index/1','https://bgm.tv/subject/1'])assert.throws(()=>directoryURL(u));
});
test('official API paginates, preserves order and only parses comment dates',async()=>{
 const calls=[];const r=await fetchDirectory('https://bgm.tv/index/123',2025,async url=>({ok:true,json:async()=>{calls.push(url);if(!url.includes('/subjects'))return {title:'年度'};return url.endsWith('offset=0')?{total:2,data:[{id:12,name:'A',comment:'5.10—5.12',date:'2020-01-01',images:{common:'https://lain.bgm.tv/a.jpg'}}]}:{total:2,data:[{id:13,name:'B',comment:'无观看日期',date:'2025-01-01'}]};}}));assert.equal(calls.length,3);assert.equal(r.items.length,2);assert.equal(r.items[1].position,2);assert.equal(r.items[1].time,null);assert.equal(r.items[0].time.start,'2025-05-10');
});
test('partial API response fails rather than silently truncating a directory',async()=>{
 await assert.rejects(()=>fetchDirectory('https://bgm.tv/index/1',2026,async url=>({ok:true,json:async()=>url.includes('/subjects')?{total:2,data:[]}:{title:'Test'}})));
});
test('timeline clips cross-year and ongoing ranges without future exaggeration',()=>{
 const cross=watchBar({start:'2025-12-28',end:'2026-01-05'},2026);assert.equal(cross.left,0);assert.ok(cross.width>1&&cross.width<2);
 assert.equal(watchBar({start:'2027-01-01',end:null,ongoing:true},2026,new Date('2026-09-29')),null);
 const ongoing=watchBar({start:'2026-01-01',end:null,ongoing:true},2026,new Date('2026-06-30T00:00:00Z'));assert.ok(ongoing.width<51);
});
