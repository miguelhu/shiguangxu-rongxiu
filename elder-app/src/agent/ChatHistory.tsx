import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,ChatCircle,CaretRight,X} from '@phosphor-icons/react'
import examples from './history-examples.json'
import {ConversationArea} from './components'
import {Message} from './model'
export function ChatHistory({onClose}:{onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null)
 const [selected,setSelected]=useState<number|null>(null)
 useEffect(()=>{const d=dialog.current!;d.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{d.close();document.body.style.overflow=previous;window.speechSynthesis?.cancel()}},[])
 const example=selected===null?null:examples[selected]
 const messages:Message[]=example?example.steps.flatMap((step,i)=>step.messages.map((m,j)=>({id:`${i}-${j}`,role:m[0] as 'ai'|'user',text:m[1],...(m[2]?{media:[{id:`photo-${i}-${j}`,type:'image' as const,url:m[2],name:'案例照片',blob:new Blob()}]}:{})}))):[]
 const speak=(text:string)=>{if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.9;speechSynthesis.speak(u)}}
 return <dialog ref={dialog} className="history-drawer" aria-label="聊天历史" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="history-panel"><div className="history-heading">{example&&<button aria-label="返回历史列表" onClick={()=>{window.speechSynthesis?.cancel();setSelected(null)}}><ArrowLeft size={25}/></button>}<h2>{example?'聊天记录':'聊天历史'}</h2><button aria-label="关闭聊天历史" onClick={onClose}><X size={26}/></button></div>{example?<div className="history-detail" key={selected}><span className="history-kicker">示例会话</span><h1>{example.title}</h1><ConversationArea messages={messages} speak={speak}/><p className="history-end">以上为使用案例，不代表实际保存或发送。</p><button className="history-current" onClick={onClose}>回到当前聊天</button></div>:<div className="history-list"><button className="history-current" onClick={onClose}><ChatCircle size={23}/>继续当前聊天<CaretRight size={20}/></button><p className="history-kicker">使用案例 · 示例历史</p>{examples.map((item,i)=><button className="history-item" key={item.title} onClick={()=>setSelected(i)}><span className="history-icon"><ChatCircle size={23}/></span><span><b>{item.title}</b><small>{item.subtitle}</small></span><CaretRight size={19}/></button>)}</div>}</div></dialog>
}
