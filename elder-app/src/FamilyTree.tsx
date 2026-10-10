import {useEffect,useRef,useState} from 'react'
import {ArrowsOut,ArrowsIn,Crosshair,PaperPlaneTilt,X,Tree,List} from '@phosphor-icons/react'
type Member={id:string,name:string,relation:string,x:number,y:number,initial:string,tone:string,account?:string,detail:string}
const MEMBERS:Member[]=[
{id:'father',name:'陈守仁',relation:'父亲',x:212,y:20,initial:'仁',tone:'sand',detail:'陈明远的父亲'},
{id:'mother',name:'许静兰',relation:'母亲',x:388,y:20,initial:'兰',tone:'rose',detail:'陈明远的母亲'},
{id:'self',name:'陈明远',relation:'我',x:212,y:224,initial:'陈',tone:'peach',detail:'家谱以您的关系为中心展示'},
{id:'wife',name:'林惠芳',relation:'爱人',x:388,y:224,initial:'芳',tone:'sage',detail:'陈明远的爱人，陈晓禾与陈知远的母亲'},
{id:'daughter',name:'陈晓禾',relation:'女儿',x:80,y:428,initial:'禾',tone:'peach',account:'t-u05',detail:'陈明远与林惠芳的女儿'},
{id:'soninlaw',name:'李嘉树',relation:'女婿',x:256,y:428,initial:'树',tone:'sage',detail:'陈晓禾的丈夫，李沐言的父亲'},
{id:'son',name:'陈知远',relation:'儿子',x:440,y:428,initial:'远',tone:'blue',detail:'陈明远与林惠芳的儿子'},
{id:'daughterinlaw',name:'沈宁',relation:'儿媳',x:616,y:428,initial:'宁',tone:'rose',detail:'陈知远的妻子，陈星禾的母亲'},
{id:'granddaughter',name:'李沐言',relation:'外孙女',x:168,y:632,initial:'言',tone:'rose',detail:'陈晓禾与李嘉树的女儿'},
{id:'grandson',name:'陈星禾',relation:'孙子',x:528,y:632,initial:'星',tone:'sand',detail:'陈知远与沈宁的儿子'},
]
export function FamilyTree({profile,onSend}:{profile:{name:string,avatar:string},onSend:(id:string)=>void}){
 const [selected,setSelected]=useState<string|null>(null),[overview,setOverview]=useState(false),[list,setList]=useState(false),[width,setWidth]=useState(340)
 const board=useRef<HTMLDivElement>(null),drag=useRef<{x:number,y:number,left:number,top:number,moved:boolean}|null>(null)
 const scale=overview?Math.min(width/792,1):1
 const center=()=>{const el=board.current;if(el)el.scrollTo({left:268-el.clientWidth/2,top:130,behavior:'smooth'})}
 useEffect(()=>{if(list)return;const el=board.current;if(!el)return;const observer=new ResizeObserver(()=>setWidth(el.clientWidth));observer.observe(el);if(!overview){el.scrollLeft=268-el.clientWidth/2;el.scrollTop=130}return()=>observer.disconnect()},[list,overview])
 useEffect(()=>{if(!selected)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[selected])
 const current=MEMBERS.find(m=>m.id===selected)
 const name=(m:Member)=>m.id==='self'?profile.name:m.name
 const portrait=(m:Member)=>m.id==='self'?<img src={profile.avatar} alt=""/>:<span className={`contact-avatar ${m.tone}`}>{m.initial}</span>
 return <div className="family-expanded"><div className="family-heading"><div><h2>我的家谱</h2><p>四代人，一家人的时光</p></div><button aria-label={list?'查看家谱':'查看成员名单'} onClick={()=>setList(!list)}>{list?<Tree size={26}/>:<List size={26}/>}</button></div>{list?<div className="family-members">{MEMBERS.map(m=><button key={m.id} onClick={()=>setSelected(m.id)}>{portrait(m)}<span><strong>{name(m)}</strong><small>{m.relation}</small></span></button>)}</div>:<><div className="tree-toolbar"><button onClick={()=>setOverview(!overview)}>{overview?<ArrowsIn size={21}/>:<ArrowsOut size={21}/>} {overview?'放大看':'看全家'}</button><button onClick={()=>{if(overview)setOverview(false);else center()}}><Crosshair size={21}/>回到我</button></div><div className={`tree-viewport ${overview?'overview':''}`} ref={board} aria-label="家谱图，可上下左右滑动" tabIndex={0}
 onPointerDown={e=>{if(e.pointerType!=='mouse'||e.button!==0)return;const el=board.current!;drag.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop,moved:false}}}
 onPointerMove={e=>{const d=drag.current,el=board.current;if(!d||!el)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>7){d.moved=true;el.setPointerCapture(e.pointerId);el.scrollLeft=d.left-dx;el.scrollTop=d.top-dy}}}
 onPointerUp={()=>{if(drag.current){const moved=drag.current.moved;setTimeout(()=>{drag.current=null},0);if(moved)return}}} onPointerCancel={()=>{drag.current=null}}
 onClickCapture={e=>{if(drag.current?.moved){e.preventDefault();e.stopPropagation()}}}>
 <div style={{width:792*scale,height:812*scale}}><div className="tree-canvas" style={{transform:`scale(${scale})`}}><svg width="792" height="812" aria-hidden="true"><g fill="none" stroke="#bca084" strokeWidth="2.5"><path d="M324 88H388 M356 88V190H268V224 M324 292H388 M356 292V394H136V428 M356 394H496V428 M192 496H256 M552 496H616 M224 496V632 M584 496V632"/></g><g fill="#fbf3eb" stroke="#bca084" strokeWidth="2"><circle cx="356" cy="88" r="5"/><circle cx="356" cy="292" r="5"/><circle cx="224" cy="496" r="5"/><circle cx="584" cy="496" r="5"/></g></svg>{MEMBERS.map(m=><button className={`family-node ${m.id==='self'?'self':''}`} style={{left:m.x,top:m.y}} key={m.id} onClick={()=>setSelected(m.id)} aria-label={`${name(m)}，${m.relation}`}>{portrait(m)}<strong>{name(m)}</strong><span>{m.relation}</span></button>)}</div></div></div><p className="tree-instruction">滑动查看家人 · 点头像看详情</p></>}
 <p className="family-demo-note">家庭关系演示：除陈老师、陈晓禾外，其他成员为示例。</p>
 {current&&<div className="family-modal-backdrop" onClick={()=>setSelected(null)}><div className="family-member-sheet" role="dialog" aria-modal="true" aria-label="家人资料" onClick={e=>e.stopPropagation()}><button className="sheet-close" aria-label="关闭家人资料" autoFocus onClick={()=>setSelected(null)}><X size={25}/></button>{portrait(current)}<h2>{name(current)}</h2><span className="family-relation">{current.relation}</span><p>{current.detail}</p>{current.account?<button className="primary" onClick={()=>onSend(current.account!)}><PaperPlaneTilt size={23}/>给Ta发日常</button>:current.id!=='self'?<p className="hint">示例成员 · 尚未关联小程序账号</p>:null}</div></div>}
 </div>
}
