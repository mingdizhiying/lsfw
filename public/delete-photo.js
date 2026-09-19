import {send} from './shared.js';

// Use an in-page dialog: embedded browsers may suppress native confirm().
export function deletePhoto(id,onDeleted){
 const dialog=document.createElement('dialog');
 dialog.className='delete-photo-dialog';
 dialog.setAttribute('aria-labelledby','delete-photo-title');
 dialog.innerHTML='<h2 id="delete-photo-title">删除这张照片？</h2><p>照片将从相册、正文和封面中移除，R2 中的文件也会永久删除，无法恢复。</p><p class="feedback" role="status"></p><div class="admin-actions"><button type="button" class="button secondary" data-cancel>保留照片</button><button type="button" class="button danger" data-confirm>确认删除</button></div>';
 document.body.append(dialog);
 const confirm=dialog.querySelector('[data-confirm]'),cancel=dialog.querySelector('[data-cancel]'),feedback=dialog.querySelector('[role="status"]');
 let busy=false;
 cancel.onclick=()=>dialog.close();
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 confirm.onclick=async()=>{
  if(busy)return;busy=true;confirm.disabled=cancel.disabled=true;confirm.textContent='正在删除…';feedback.textContent='正在清理照片及云端文件，请稍候。';
  try{await send('/api/admin/media/'+encodeURIComponent(id),{},'DELETE');onDeleted();dialog.close()}
  catch(e){feedback.textContent=e.message+' 照片列表尚未移除，可重试。';}
  finally{busy=false;confirm.disabled=cancel.disabled=false;confirm.textContent='确认删除'}
 };
 dialog.showModal();cancel.focus();
}
