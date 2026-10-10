import {useState} from 'react'
import {FamilyTree} from './FamilyTree'
import {CaretRight,PaperPlaneTilt,ArrowLeft,UserCircle} from '@phosphor-icons/react'
export const ACCOUNTS=[
 {id:'t-u05',name:'陈晓禾',relation:'女儿',family:true,initial:'禾',tone:'peach'},
 {id:'t-u03',name:'周宁',relation:'同事',family:false,initial:'宁',tone:'sage'},
 {id:'user-linyue',name:'林悦',relation:'学生',family:false,initial:'悦',tone:'rose'},
 {id:'t-u06',name:'魏成',relation:'朋友',family:false,initial:'成',tone:'sand'},
 {id:'t-u02',name:'陆航',relation:'学生',family:false,initial:'航',tone:'blue'},
]
export function Contacts({profile,onSend}:{profile:{name:string,avatar:string},onSend:(id:string)=>void}){
 const [tab,setTab]=useState('family'),[selected,setSelected]=useState<string|null>(null),[editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState('')
 const [notes,setNotes]=useState<Record<string,string>>(()=>{try{return JSON.parse(localStorage.getItem('elder-account-notes')||'{}')}catch{return {}}})
 const person=ACCOUNTS.find(a=>a.id===selected)
 const avatar=(p:typeof ACCOUNTS[number])=><span className={`contact-avatar ${p.tone}`}>{p.initial}</span>
 if(person)return <div className="contact-detail"><button className="contact-back" onClick={()=>{setSelected(null);setEditing(false)}}><ArrowLeft size={22}/>返回亲友</button><div className="contact-identity">{avatar(person)}<h1>{notes[person.id]||person.name}</h1><p>{person.relation} · {notes[person.id]?`账号姓名：${person.name}`:'小程序账号'}</p></div><button className="primary" onClick={()=>onSend(person.id)}><PaperPlaneTilt size={25}/>给Ta发日常</button>{editing?<form className="contact-note" onSubmit={e=>{e.preventDefault();const next={...notes,[person.id]:draft.trim()};try{localStorage.setItem('elder-account-notes',JSON.stringify(next));setNotes(next);setEditing(false)}catch{setError('未能保存，请重试。')}}}><label>我对Ta的称呼<input maxLength={20} value={draft} onChange={e=>setDraft(e.target.value)} placeholder={person.name}/></label><button className="secondary">保存称呼</button></form>:<button className="secondary" onClick={()=>{setDraft(notes[person.id]||'');setEditing(true)}}>修改备注称呼</button>}{error&&<p role="alert">{error}</p>}</div>
 return <><div className="contact-tabs" role="tablist" aria-label="亲友分类"><button role="tab" aria-selected={tab==='family'} onClick={()=>setTab('family')}>家人</button><button role="tab" aria-selected={tab==='friends'} onClick={()=>setTab('friends')}>亲友</button></div>{tab==='family'?<FamilyTree profile={profile} onSend={onSend}/>:<div className="friend-list">{ACCOUNTS.filter(a=>!a.family).map(p=><button className="friend-card" key={p.id} onClick={()=>setSelected(p.id)}>{avatar(p)}<div><h2>{notes[p.id]||p.name}</h2><p>{p.relation}<span><UserCircle size={16}/>小程序账号</span></p></div><CaretRight size={22}/></button>)}</div>}</>
}
