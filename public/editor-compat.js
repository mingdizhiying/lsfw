// Content IDs only: this helper is never used for passwords or session tokens.
export function contentId(cryptoAPI=globalThis.crypto){
 if(typeof cryptoAPI?.randomUUID==='function')return cryptoAPI.randomUUID();
 const bytes=new Uint8Array(16);
 if(typeof cryptoAPI?.getRandomValues==='function')cryptoAPI.getRandomValues(bytes);
 else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function shanghaiDate(now=new Date()){
 const local=new Date(now.getTime()+8*60*60*1000);
 return `${local.getUTCFullYear()}-${String(local.getUTCMonth()+1).padStart(2,'0')}-${String(local.getUTCDate()).padStart(2,'0')}`;
}
