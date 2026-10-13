export type Media={id:string,type:'image'|'video'|'audio',url:string,blob:Blob,name:string}
export type Message={id:string,role:'user'|'ai',text:string,audio?:string,media?:Media[]}
export type Facts=Partial<Record<'time'|'place'|'people'|'event'|'feeling',string>>
export const questions:Record<keyof Facts,string>={time:'大概是什么时候的事？不记得也没关系。',place:'那是在什么地方呀？',people:'当时和谁在一起？',event:'那天有什么让您记住的小事？',feeling:'现在想起来，您有什么想说的？'}
export function extract(text:string,old:Facts,asked?:keyof Facts):Facts{
 const f={...old};const patterns:Record<keyof Facts,RegExp>={time:/(\d{4}年|去年|前年|今年|退休|小时候|年轻|昨天|今天|那年)/,place:/(杭州|北京|上海|学校|公园|家里|校园|西湖|在.{1,12}(?:里|边|村|市|镇|山|海))/,people:/(女儿|儿子|孙女|孙子|同事|学生|朋友|家人|老伴|我们|晓禾|林悦)/,event:/(一起|去|吃|玩|散步|拍|毕业|旅行|上课|聊天|走|看)/,feeling:/(开心|高兴|难过|想念|怀念|遗憾|幸福|温暖|舍不得)/};for(const k of Object.keys(patterns) as (keyof Facts)[])if(patterns[k].test(text))f[k]=text;if(asked&&!f[asked])f[asked]=/不记得|不知道|忘了/.test(text)?'暂不确定':text;return f
}
export function level(f:Facts){return f.event&&(f.time||f.place)&&f.people&&f.feeling?2:f.event&&(f.people||f.time||f.place)?1:0}
export async function storeMemory(data:{id:string,kind:'fragment'|'daily',words:string,media:Media[],facts:Facts,people:string[],recipientIds:string[]}){
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('sgx-elder-demo',1);r.onupgradeneeded=()=>r.result.createObjectStore('items',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('items','readwrite');tx.objectStore('items').put({...data,createdAt:new Date().toISOString(),tags:Object.keys(data.facts),photos:data.media.filter(m=>m.type==='image').map(m=>m.blob),voice:null,media:data.media.filter(m=>m.type!=='image').map(m=>({type:m.type,blob:m.blob,name:m.name}))});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
}
