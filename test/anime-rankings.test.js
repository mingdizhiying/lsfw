import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchRankedDirectory} from '../src/anime-rankings.js';
import {rankCard} from '../public/anime-rankings.js';
test('rankings preserve directory order and exclude non-anime',async()=>{
 const data=[{id:50,type:2,name:'First'},{id:2,type:4,name:'Game'},{id:10,type:2,name:'Second'}];
 const r=await fetchRankedDirectory('https://bgm.tv/index/82655',2025,async url=>({ok:true,json:async()=>url.includes('/collections')?{total:2,data:[{subject_id:50,type:2},{subject_id:10,type:3}]}:url.includes('/subjects')?{total:3,data}:{title:'Rank'}}));
 assert.deepEqual(r.items.map(i=>[i.id,i.position]),[[50,1]]);
});
test('rank cards distinguish podium and escape directory text',()=>{
 const html=rankCard({id:1,name:'<script>',comment:'<img onerror=x>',cover:'javascript:alert(1)'},1);
 assert.match(html,/rank-1/);assert.match(html,/NO. 01/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));assert.ok(!html.includes('javascript:'));
 assert.match(rankCard({id:4,name:'Fourth'},4),/NO. 04/);
});
