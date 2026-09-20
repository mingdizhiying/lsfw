export function homeMotion(root){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const targets=root.querySelectorAll('.intro-copy,.identity,.days,#photos,.home-reading>section,.home-reading>aside');
 if(!('IntersectionObserver' in window))return;
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.classList.add('home-arrived');observer.unobserve(entry.target)}},{threshold:.08});
 targets.forEach(el=>observer.observe(el));
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
}
