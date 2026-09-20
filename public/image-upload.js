export async function decodeImage(file){
 if(typeof globalThis.createImageBitmap==='function'){
  try{return await globalThis.createImageBitmap(file)}catch{}
 }
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('手机浏览器无法解码这张图片，请转为 JPG/PNG 后再上传。'))};
  img.src=url;
 });
}
export async function compressImage(file){
 if(!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)&&!(file.type===''&&/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name||'')))throw Error('请选择 JPG、PNG 或 WebP 图片；HEIC 需浏览器支持解码。');
 if(file.size>30*1024*1024)throw Error('原图请控制在30MB以内。');
 const image=await decodeImage(file);
 try{
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  if(!w||!h)throw Error('图片尺寸无效，请重新选择。');
  const scale=Math.min(1,2000/Math.max(w,h)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
  const context=canvas.getContext('2d');if(!context)throw Error('无法处理图片，请在系统浏览器中重试。');
  context.drawImage(image,0,0,canvas.width,canvas.height);
  let blob;
  if(typeof canvas.toBlob==='function')blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
  else{const data=canvas.toDataURL('image/jpeg',.88),raw=atob(data.split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));blob=new Blob([bytes],{type:'image/jpeg'})}
  if(!blob||blob.size>8*1024*1024)throw Error('图片压缩后仍过大，请换一张较小的图片。');
  return blob;
 }finally{if(typeof image.close==='function')image.close()}
}
