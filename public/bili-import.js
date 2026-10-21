export function parseBiliImport(value){
 if(typeof value!=='string'||value.length>12000)throw Error('导入内容过长。');
 const d=JSON.parse(value),u=new URL(d.url),cover=new URL(d.cover);
 const bv=u.pathname.match(/\/(?:video)\/(BV[a-zA-Z0-9]+)\/?$/)?.[1];
 if(!['www.bilibili.com','bilibili.com'].includes(u.hostname)||u.protocol!=='https:'||u.port||u.username||u.password||!bv)throw Error('仅支持 B 站视频链接。');
 if(cover.protocol!=='https:'||!/^([a-z0-9-]+\.)*hdslb\.com$/i.test(cover.hostname)||cover.port||cover.username||cover.password)throw Error('封面必须来自 B 站图片域名。');
 if(typeof d.title!=='string'||!d.title.trim())throw Error('未读取到视频标题。');
 return {url:'https://www.bilibili.com/video/'+bv+'/',title:d.title.trim().slice(0,200),description:String(d.description||'').slice(0,2000),cover:cover.href,kind:'video',status:'draft'};
}
