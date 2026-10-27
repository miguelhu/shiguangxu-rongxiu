import {useState} from 'react'
import {Bell,Check,PencilSimple} from '@phosphor-icons/react'
import {ChatComposer} from './ChatComposer'
type Reminder={id:string,title:string,time:string,date:string,daily:boolean,paused:boolean,done:boolean}
const key='sgx-reminders-v1'
export function Reminders(){
 const [items,setItems]=useState<Reminder[]>(()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}})
 const [draft,setDraft]=useState<Reminder|null>(null),[error,setError]=useState(''),[filter,setFilter]=useState('待提醒'),[remove,setRemove]=useState(false)
 const save=(next:Reminder[])=>{try{localStorage.setItem(key,JSON.stringify(next));setItems(next);setError('');return true}catch{setError('没有保存成功，请再试一次。');return false}}
 const create=(text='')=>{
  setError('')
  const number=(value:string)=>{const digits:Record<string,number>={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(/^\d+$/.test(value))return Number(value);if(value.includes('十')){const [t,u]=value.split('十');return (t?digits[t]:1)*10+(u?digits[u]:0)}return digits[value]}
  const m=text.match(/([零一二两三四五六七八九十\d]{1,3})(?:点|:|：)(半|[零一二两三四五六七八九十\d]{1,3})?/)
  let hour=m?number(m[1]):NaN;const minute=m?.[2]==='半'?30:m?.[2]?number(m[2]):0
  if(/下午|晚上/.test(text)&&hour<12)hour+=12
  if(/凌晨/.test(text)&&hour===12)hour=0
  const date=new Date();if(text.includes('明天'))date.setDate(date.getDate()+1)
  const dateText=/今天|明天/.test(text)?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`:''
  setDraft({id:crypto.randomUUID(),title:text.replace(/每天|明天|今天|提醒我|早上|上午|下午|晚上|凌晨/g,'').replace(m?.[0]||/a^/,'').replace(/^分/,'').trim(),time:Number.isFinite(hour)&&hour<24&&minute<60?`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`:'',date:dateText,daily:text.includes('每天'),paused:false,done:false});setRemove(false)
 }
 const filtered=items.filter(x=>filter==='已完成'?x.done:filter==='已暂停'?x.paused&&!x.done:!x.paused&&!x.done).sort((a,b)=>(a.daily?'':a.date).localeCompare(b.daily?'':b.date)||a.time.localeCompare(b.time))
 return <section className="reminders-page"><div className="reminder-intro"><Bell size={30}/><h1>要记着的事，放在这里。</h1></div><div className="contact-tabs">{['待提醒','已完成','已暂停'].map(t=><button key={t} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</div>{!filtered.length&&<div className="utility-empty"><Bell size={38}/><p>{filter==='待提醒'?'还没有提醒':'这里暂时没有记录'}</p>{filter==='待提醒'&&<span>可以说：“每天早上8点提醒我吃药”。</span>}</div>}{filtered.map(r=><article className="reminder-card" key={r.id}><span>{r.daily?'每天':r.date} · {r.time}</span><h2>{r.title}</h2><div>{!r.done&&<button onClick={()=>save(items.map(i=>i.id===r.id?{...i,done:true}:i))}><Check size={21}/>完成</button>}<button onClick={()=>{setDraft({...r});setRemove(false)}}><PencilSimple size={21}/>修改</button></div></article>)}<p className="utility-note">当前可保存和管理提醒，定时通知与相框提醒尚未接通。</p><div className="utility-composer direct-composer"><ChatComposer onText={create} onVoice={(_blob,text)=>text?create(text):setError('这次没有听清，请再说一次或用键盘输入。')}/></div>{error&&<p role="alert">{error}</p>}
 {draft&&<div className="agent-overlay"><form className="reminder-editor" onSubmit={e=>{e.preventDefault();if(!draft.title.trim()||(!draft.daily&&!draft.date)){setError('请填写事情和日期。');return}if(!draft.daily&&new Date(draft.date+'T'+draft.time).getTime()<=Date.now()){setError('请选择还没到的时间。');return}if(save([...items.filter(i=>i.id!==draft.id),{...draft,title:draft.title.trim()}]))setDraft(null)}}><h2>确认这件事</h2><label>提醒什么<input required value={draft.title} maxLength={80} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label>重复<select value={draft.daily?'daily':'once'} onChange={e=>setDraft({...draft,daily:e.target.value==='daily'})}><option value="once">只提醒一次</option><option value="daily">每天</option></select></label>{!draft.daily&&<label>日期<input type="date" required value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label>}<label>时间<input type="time" required value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></label>{error&&<p role="alert">{error}</p>}<button className="primary">保存提醒</button><button type="button" className="secondary" onClick={()=>{setDraft(null);setError('')}}>返回</button>{items.some(i=>i.id===draft.id)&&<div className="reminder-edit-actions"><button type="button" onClick={()=>{if(save(items.map(i=>i.id===draft.id?{...i,paused:!i.paused,done:false}:i)))setDraft(null)}}>{draft.paused?'恢复提醒':'暂停提醒'}</button><button type="button" onClick={()=>{if(!remove)setRemove(true);else if(save(items.filter(i=>i.id!==draft.id)))setDraft(null)}}>{remove?'确认删除':'删除提醒'}</button></div>}</form></div>}
 </section>
}
