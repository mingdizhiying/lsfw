import test from 'node:test';
import assert from 'node:assert/strict';
import {musicURL,songID,musicCover,readSong} from '../src/music.js';
test('music links accept shared text, desktop hashes and mobile single songs',()=>{
 assert.equal(songID(musicURL('分享歌曲 https://music.163.com/#/song?id=123 (来自网易云音乐)')),'123');
 assert.equal(songID(musicURL('https://y.music.163.com/m/song?id=123&uct=abc')),'123');
 assert.equal(songID(musicURL('https://music.163.com/playlist?id=123')),null);
 assert.equal(musicURL('分享歌曲 https://163cn.tv/bhtZTFwC (@网易云音乐)').hostname,'163cn.tv');
 for(const u of ['http://127.0.0.1/song?id=1','https://music.163.com.evil.com/song?id=1','https://user@music.163.com/song?id=1','https://music.163.com:444/song?id=1'])assert.throws(()=>musicURL(u));
});
test('cover URLs are restricted to NetEase artwork hosts',()=>{
 assert.equal(musicCover('http://p1.music.126.net/cover.jpg'),'https://p1.music.126.net/cover.jpg');
 assert.equal(musicCover('https://p1.music.126.net.evil.com/cover.jpg'),'');
});
test('song import follows only trusted redirects and validates returned song ID',async()=>{
 const mock=async url=>url.includes('/share/')?new Response('',{status:302,headers:{location:'https://music.163.com/song?id=123'}}):Response.json({songs:[{id:123,name:'测试曲',artists:[{name:'歌手'}],album:{name:'专辑',picUrl:'https://p1.music.126.net/c.jpg'}}]});
 assert.equal((await readSong('https://y.music.163.com/share/test',mock)).title,'测试曲');
 await assert.rejects(()=>readSong('https://y.music.163.com/share/test',async()=>new Response('',{status:302,headers:{location:'http://localhost/internal'}})));
 await assert.rejects(()=>readSong('https://music.163.com/song?id=123',async()=>Response.json({songs:[{id:999,name:'错误曲目'}]})));
});
import {bindRecords} from '../public/music.js';
test('vinyl follows actual playback, pauses other tracks and stops on errors',async()=>{
 const old=globalThis.window;globalThis.window={addEventListener(){}};
 function card(){const nodes={audio:{paused:true,pause(){this.paused=true;this.onpause?.()},async play(){this.paused=false;this.onplay?.()}},button:{setAttribute(){}},'.record-status':{},'.record-action':{},h2:{textContent:'test'}};return {nodes,playing:false,classList:{},querySelector:k=>nodes[k]};}
 function make(){const c=card();c.classList.toggle=(_,value)=>c.playing=value;return c;}
 const a=make(),b=make();try{bindRecords({querySelectorAll:()=>[a,b]});await a.nodes.button.onclick();assert.equal(a.playing,false);a.nodes.audio.onplaying();assert.equal(a.playing,true);await b.nodes.button.onclick();assert.equal(a.playing,false);b.nodes.audio.onplaying();assert.equal(b.playing,true);b.nodes.audio.onwaiting();assert.equal(b.playing,false);b.nodes.audio.onerror();assert.equal(b.playing,false);assert.match(b.nodes['.record-status'].textContent,/暂不可/);}finally{globalThis.window=old;}
});
