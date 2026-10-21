// ==UserScript==
// @name         岚山飞文 · 收藏 B 站视频
// @namespace    https://lsfw.top/
// @version      1.0.0
// @description  点击按钮提取当前视频标题、简介和封面地址，在后台确认保存；不读取 Cookie、不下载视频。
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/zh-Hans/video/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(()=>{
 const button=document.createElement('button');button.textContent='收藏到岚山飞文';
 button.style.cssText='position:fixed;right:18px;bottom:80px;z-index:2147483647;padding:12px 18px;border:1px solid #777e67;border-radius:24px;background:#f4f0e4;color:#34372f;font-size:14px;cursor:pointer;box-shadow:0 3px 14px #0002';
 button.onclick=()=>{
  const bv=location.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1];
  const meta=name=>document.querySelector('meta[property="'+name+'"]')?.content||'';
  const cover=meta('og:image').replace(/^http:/,'https:');
  if(!bv||!cover){alert('尚未读取到视频封面，请等待页面加载后重试。');return;}
  const data={url:'https://www.bilibili.com/video/'+bv+'/',title:document.querySelector('h1')?.textContent.trim()||meta('og:title'),description:(meta('og:description')||'').slice(0,2000),cover};
  window.open('https://lsfw.top/admin#bili-import/'+encodeURIComponent(JSON.stringify(data)),'_blank','noopener,noreferrer');
 };document.body.append(button);
})();
