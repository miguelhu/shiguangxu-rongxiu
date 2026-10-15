import {useEffect,useRef,useState} from 'react'
import {ArrowLeft} from '@phosphor-icons/react'
import {ChatComposer} from './ChatComposer'
import {MediaPreview} from './agent/components'
import {Media,storeMemory} from './agent/model'
import {ACCOUNTS} from './Contacts'
const scenes=[
 [{text:'今天翻到了你毕业时的照片，还记得那天吗？',photo:'./images/t-p03.jpg'},{text:'不着急回，忙完照顾好自己。'}],
 [{text:'老周，下次见面，咱们再慢慢聊。'},{text:'翻到了当年的合影，发给你看看。',photo:'./images/t-p01.jpg'}],
 [{text:'林悦，你上次说的近况我都看到了。忙归忙，也要好好吃饭。'},{text:'这张照片留得真好。',photo:'./images/t-p02.jpg'}],
 [{text:'老朋友，今天想起咱们以前的事，有空一起喝茶。'}],
 [{text:'陆航，最近工作怎么样？有空说说你的近况。'}]
]
export function DispatchInbox({records}:{records:any[]}){
 const [selected,setSelected]=useState<number|null>(null),[draft,setDraft]=useState(''),[media,setMedia]=useState<Media[]>([]),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[added,setAdded]=useState<any[]>([])
 const picker=useRef<HTMLInputElement>(null),urls=useRef<string[]>([])
 useEffect(()=>()=>{urls.current.forEach(URL.revokeObjectURL)},[])
 const url=(b:Blob)=>{const u=URL.createObjectURL(b);urls.current.push(u);return u}
 const daily=[...records.filter(r=>r.kind==='daily'),...added]
 async function send(){if(busy||selected===null)return;setBusy(true);setError('');const person=ACCOUNTS[selected];const id=crypto.randomUUID();try{await storeMemory({id,kind:'daily',words:draft,media,facts:{},people:[person.name],recipientIds:[person.id]});setAdded(v=>[...v,{id,kind:'daily',words:draft,photos:media.filter(m=>m.type==='image').map(m=>m.url),voice:media.find(m=>m.type==='audio')?.url,recipientIds:[person.id]}]);setDraft('');setMedia([]);setConfirm(false)}catch{setError('这次没能保存，请再试一次。')}finally{setBusy(false)}}
 if(selected!==null){const p=ACCOUNTS[selected],items=daily.filter(r=>(r.recipientIds||[]).includes(p.id)||(r.people||[]).includes(p.name));return <section className="dispatch-thread"><div className="dm-person-header"><button className="dispatch-back" aria-label="返回消息列表" onClick={()=>{if(!busy){setSelected(null);setConfirm(false)}}}><ArrowLeft size={25}/></button><span className={`contact-avatar ${p.tone}`}>{p.initial}</span><div><h1>{p.name}</h1><small>{p.relation}</small></div></div><div className="dm-messages">{scenes[selected].map((s,i)=><article className="dispatch-message" key={i}>{'photo'in s&&<img src={s.photo} alt="日常示例照片"/>}<p>{s.text}</p><small>示例</small></article>)}{items.map(r=><article className="dispatch-message" key={r.id}>{r.photos.map((src:string,i:number)=><img key={i} src={src} alt="日常照片"/>)}<p>{r.words}</p>{r.voice&&<audio controls src={r.voice}/>}<small>演示记录 · 未实际发送</small></article>)}</div>
 {(media.length>0||draft)&&<div className="dm-draft"><MediaPreview media={media}/>{draft&&<textarea aria-label="留言内容" value={draft} onChange={e=>{setDraft(e.target.value);setConfirm(false)}}/>}<button onClick={()=>{setMedia([]);setDraft('');setConfirm(false)}} disabled={busy}>清除草稿</button></div>}
 {confirm&&<div className="dm-confirm"><p>发送给 {p.name}</p><small>当前为演示，不会实际发出。</small><button className="primary" disabled={busy} onClick={()=>void send()}>{busy?'正在保存…':'确认发送（演示）'}</button><button className="secondary" disabled={busy} onClick={()=>setConfirm(false)}>再改一下</button></div>}{error&&<p role="alert">{error}</p>}
 <div className="direct-composer dm-composer"><ChatComposer nextLabel="预览发送" key={selected} disabled={busy} onPhoto={()=>picker.current?.click()} onText={setDraft} onVoice={(blob,text)=>{setMedia(v=>[...v.filter(m=>m.type!=='audio'),{id:crypto.randomUUID(),type:'audio',url:url(blob),blob,name:'语音留言'}]);if(text)setDraft(text);setConfirm(false)}} onNext={text=>{if(text)setDraft(text);setConfirm(true)}} nextDisabled={!draft.trim()&&!media.length}/></div><input ref={picker} type="file" hidden multiple accept="image/*" onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.some(f=>!f.type.startsWith('image/')||f.size>20*1024*1024)||files.length+media.filter(m=>m.type==='image').length>3){setError('请选择20MB以内的照片，最多3张。');return}setMedia(v=>[...v,...files.map(f=>({id:crypto.randomUUID(),type:'image' as const,url:url(f),blob:f,name:f.name}))]);setError('');setConfirm(false)}}/>
 </section>}
 return <section className="dispatch-list">{ACCOUNTS.map((p,i)=><button className="dispatch-person" key={p.id} onClick={()=>{setSelected(i);setDraft('');setMedia([]);setConfirm(false);setError('')}}><span className={`contact-avatar ${p.tone}`}>{p.initial}</span><span><b>{p.name}<small>{p.relation}</small></b><p>{[...daily].reverse().find(r=>(r.recipientIds||[]).includes(p.id))?.words||scenes[i][0].text}</p></span></button>)}</section>
}
