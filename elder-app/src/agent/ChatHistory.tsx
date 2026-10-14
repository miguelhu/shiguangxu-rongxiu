import {useEffect,useRef} from 'react'
import {ChatCircle,CaretRight,X} from '@phosphor-icons/react'
import examples from './history-examples.json'
export function ChatHistory({onClose,onSelect,selected}:{onClose:()=>void,onSelect:(index:number)=>void,selected:number}){
 const panel=useRef<HTMLElement>(null)
 useEffect(()=>{const old=document.activeElement as HTMLElement;panel.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);old?.focus()}},[onClose])
 return <div className="history-slide"><button className="history-dismiss" aria-label="收起聊天菜单" onClick={onClose}/><aside ref={panel} tabIndex={-1} className="history-panel" aria-label="聊天历史"><div className="history-heading"><h2>聊天历史</h2><button aria-label="关闭聊天历史" onClick={onClose}><X size={26}/></button></div><div className="history-list"><button className="history-current" aria-current={selected===-1?'page':undefined} onClick={()=>onSelect(-1)}><ChatCircle size={23}/>我的聊天<CaretRight size={20}/></button><p className="history-kicker">使用案例</p>{examples.map((item,i)=><button className="history-item" aria-current={selected===i?'page':undefined} key={item.title} onClick={()=>onSelect(i)}><span className="history-icon"><ChatCircle size={23}/></span><span><b>{item.title}</b><small>{item.subtitle}</small></span><CaretRight size={19}/></button>)}</div></aside></div>
}
