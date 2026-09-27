import {api,esc} from './shared.js';
const size=n=>n>=1e9?(n/1e9).toFixed(3)+' GB':n>=1e6?(n/1e6).toFixed(2)+' MB':(n/1e3).toFixed(1)+' KB';
export async function renderR2Usage(root){
 const links='<p class="small"><a href="https://dash.cloudflare.com/2b23a5289ca4cbcb10045cf6a2a3f94c/r2/overview" target="_blank" rel="noopener">查看 Cloudflare 用量与账单 ↗</a> · <a href="https://developers.cloudflare.com/r2/pricing/" target="_blank" rel="noopener">官方价格说明 ↗</a></p>';
 try{
 const r=await api('/api/admin/r2-usage');
 if(!r.available)throw Error(r.error||'照片存储尚未开通。');
 const percent=r.standardBytes/1e10*100,cost=Math.max(0,Math.ceil(r.standardBytes/1e9)-10)*0.015;
 root.innerHTML=`<h2>R2 云端存储</h2><div class="stats r2-stats"><div class="stat"><strong>${size(r.bytes)}</strong><span>当前实际文件容量</span></div><div class="stat"><strong>${r.count.toLocaleString('zh-CN')}</strong><span>云端文件数</span></div><div class="stat"><strong>$${cost.toFixed(3)}</strong><span>标准存储费参考 / 月</span></div></div><p>标准存储免费额度参考：${percent.toFixed(2)}%（${size(r.standardBytes)} / 10 GB）</p><progress class="r2-meter" max="100" value="${Math.min(100,percent)}" aria-label="当前标准存储容量与免费额度对比"></progress>${percent>=80?'<p class="admin-notice">存储容量已接近或超过免费额度，请关注官方账单。</p>':''}${r.infrequentBytes?'<p>另有低频存储 '+size(r.infrequentBytes)+'，未计入上面的标准存储费参考。</p>':''}<p class="small">${r.stale?'本次读取失败，以下为上次成功数据。':''}核对时间：${esc(new Date(r.checkedAt).toLocaleString('zh-CN'))}。打开概览时检查，最多每 15 分钟重新统计一次。</p><div class="r2-requests"><p>本月写入 / 列表请求：<strong>未接入统计</strong> · 免费 100 万次</p><p>本月读取请求：<strong>未接入统计</strong> · 免费 1000 万次</p></div><p class="small">存储费参考假设当前标准存储容量保持整月，且账户免费额度全部用于本站；不是本月账单。实际按每日峰值平均计费，免费额度由账户内所有桶共享。标准存储超额 $0.015 / GB·月，写入超额 $4.50 / 百万次，读取超额 $0.36 / 百万次，计费单位向上取整。R2 出站流量免费。</p><p class="small">请求量需要额外统计授权，未接入不代表没有产生请求。以上不包含 Workers 等其他服务费用，以 Cloudflare 账单为准。价格核对：2026-09-27。</p>${links}`;
 }catch(e){root.innerHTML='<h2>R2 云端存储</h2><p>'+esc(e.message)+'</p>'+links;}
}
