import sanitize from 'sanitize-html';
export const clean = (html) => sanitize(String(html||''), {
  allowedTags: ['p','br','h2','h3','h4','strong','b','em','i','u','s','blockquote','ul','ol','li','pre','code','a','img','hr','table','thead','tbody','tr','th','td'],
  allowedAttributes: {a:['href','title'],img:['src','alt'],th:['colspan','rowspan'],td:['colspan','rowspan']},
  allowedSchemes: ['https','http','mailto'], allowProtocolRelative:false,
  transformTags: {div:sanitize.simpleTransform('p',{}),a:sanitize.simpleTransform('a',{rel:'noopener noreferrer',target:'_blank'})},
  exclusiveFilter: frame => frame.tag==='img' && !/^\/media\/[a-zA-Z0-9-]+$/.test(frame.attribs.src||'')
});
export const plain=(s)=>sanitize(String(s||''),{allowedTags:[],allowedAttributes:{}}).trim();
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
export async function digest(v){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),v=>v.toString(16).padStart(2,'0')).join('')}
export async function hashPassword(password,salt=random()){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:new TextEncoder().encode(salt)},key,256);
 return `${salt}:${Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')}`;
}
export async function verifyPassword(password,stored){if(!stored||typeof password!=='string'||password.length>256)return false;return constantEqual(await hashPassword(password,stored.split(':')[0]),stored)}
export function constantEqual(a,b){if(typeof a!=='string'||typeof b!=='string')return false;let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export const emailValid=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=254;
export const safeLink=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
