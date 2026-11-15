// Shared feedback for failed images, without replacing album/poetry sizing rules.
const notices=new WeakMap();
document.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||img.hasAttribute('data-game-cover')||!img.getAttribute('src')||notices.has(img))return;const button=document.createElement('button');button.type='button';button.className='image-retry';button.textContent='图片加载失败 · 重试';button.onclick=e=>{e.preventDefault();e.stopPropagation();button.textContent='正在重试…';const src=img.getAttribute('src');img.removeAttribute('src');img.src=src;};img.after(button);notices.set(img,button);},true);
document.addEventListener('load',event=>{const img=event.target;const button=notices.get(img);if(button){button.remove();notices.delete(img)}},true);
