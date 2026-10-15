import {useState} from 'react'
import {ArrowLeft,PaperPlaneTilt,Camera} from '@phosphor-icons/react'
import {ACCOUNTS} from './Contacts'
const scenes=[
 [{text:'今天翻到了你毕业时的照片，还记得那天吗？',photo:'./images/t-p03.jpg'},{text:'不着急回，忙完照顾好自己。'}],
 [{text:'老周，下次见面，咱们再慢慢聊。'},{text:'翻到了当年的合影，发给你看看。',photo:'./images/t-p01.jpg'}],
 [{text:'林悦，你上次说的近况我都看到了。忙归忙，也要好好吃饭。'},{text:'这张照片留得真好。',photo:'./images/t-p02.jpg'}],
 [{text:'老朋友，今天想起咱们以前的事，有空一起喝茶。'}],
 [{text:'陆航，最近工作怎么样？有空说说你的近况。'}]
]
export function DispatchInbox({records,onCompose}:{records:any[],onCompose:(id:string,greeting:boolean)=>void}){
 const [selected,setSelected]=useState<number|null>(null)
 const daily=records.filter(r=>r.kind==='daily')
 if(selected!==null){const p=ACCOUNTS[selected],items=daily.filter(r=>(r.recipientIds||[]).includes(p.id)||(r.people||[]).includes(p.name));return <section className="dispatch-thread"><button className="dispatch-back" onClick={()=>setSelected(null)}><ArrowLeft size={23}/>所有亲友</button><div className="dispatch-identity"><span className={`contact-avatar ${p.tone}`}>{p.initial}</span><div><h1>{p.name}</h1><small>{p.relation}</small></div></div><p className="dispatch-label">往来示例</p>{scenes[selected].map((s,i)=><article className="dispatch-message" key={i}>{'photo'in s&&<img src={s.photo} alt="日常示例照片"/>}<p>{s.text}</p><small>示例 · 未实际发送</small></article>)}{items.map(r=><article className="dispatch-message" key={r.id}>{r.photos.map((src:string,i:number)=><img key={i} src={src} alt="日常照片"/>)}<p>{r.words}</p>{r.voice&&<audio controls src={r.voice}/>}<small>本机演示记录 · 未实际发送</small></article>)}<div className="dispatch-actions"><button onClick={()=>onCompose(p.id,false)}><Camera size={23}/>发个日常</button><button onClick={()=>onCompose(p.id,true)}><PaperPlaneTilt size={23}/>捎句话</button></div></section>}
 return <section className="dispatch-list"><h1>发给亲友</h1>{ACCOUNTS.map((p,i)=><button className="dispatch-person" key={p.id} onClick={()=>setSelected(i)}><span className={`contact-avatar ${p.tone}`}>{p.initial}</span><span><b>{p.name}<small>{p.relation}</small></b><p>{daily.find(r=>(r.recipientIds||[]).includes(p.id))?.words||scenes[i][0].text}</p></span></button>)}<p className="dispatch-label">包含使用案例与本机演示记录</p></section>
}
