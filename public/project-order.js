export function timestamp(text){
 const m=String(text||'').match(/(?:^|[^\d])(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?(?!\d)/);if(!m)return null;
 const [y,mo,d,h,mi,s]=[m[1],m[2],m[3],m[4]||0,m[5]||0,m[6]||0].map(Number),value=Date.UTC(y,mo-1,d,h,mi,s),v=new Date(value);
 return v.getUTCFullYear()===y&&v.getUTCMonth()===mo-1&&v.getUTCDate()===d&&h<24&&mi<60&&s<60?value:null;
}
export function dateParagraph(text){return /^\s*\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?(?:[T\s]+\d{1,2}:\d{2}(?::\d{2})?)?\s*$/.test(text)&&timestamp(text)!==null;}
export function orderSections(sections,direction='desc'){return sections.map((s,index)=>({...s,index})).sort((a,b)=>{if(a.time===null&&b.time===null)return a.index-b.index;if(a.time===null)return 1;if(b.time===null)return -1;return (direction==='asc'?a.time-b.time:b.time-a.time)||a.index-b.index;});}
