import {useEffect,useState,useRef} from 'react'
import {UserPlus,Link,Check,ArrowLeft,UsersThree,QrCode,CaretRight,Download,ShareNetwork} from '@phosphor-icons/react'
import {QRCodeSVG} from 'qrcode.react'
import {readConnections,ensureInvitation,renewInvitation,resolveConnection,applyConnection,CONNECTION_EVENT} from './connections'
import './connections.css'
export function ConnectionPanel({elder=false,defaultName='',onClose,onViewChange,homeRequest=0,identity={name:'陈明远',avatar:'./images/teacher.png'}}:{elder?:boolean,defaultName?:string,onClose?:()=>void,onViewChange?:(view:string)=>void,homeRequest?:number,identity?:{name:string,avatar:string}}){
 const [state,setState]=useState(readConnections),[name,setName]=useState(defaultName),[relation,setRelation]=useState(''),[message,setMessage]=useState(''),[code,setCode]=useState(new URLSearchParams(location.search).get('connect')||''),[notice,setNotice]=useState(''),[submitted,setSubmitted]=useState(false),[remove,setRemove]=useState<string|null>(null)
 const [view,setView]=useState<'home'|'qr'|'requests'|'friends'>('home'),[details,setDetails]=useState(false),[copyFallback,setCopyFallback]=useState(false)
 const qr=useRef<HTMLDivElement>(null)
 useEffect(()=>{setView('home');onViewChange?.('home')},[homeRequest])
 useEffect(()=>{if(elder)ensureInvitation();const sync=()=>setState(readConnections());sync();window.addEventListener('storage',sync);window.addEventListener(CONNECTION_EVENT,sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(CONNECTION_EVENT,sync)}},[elder])
 const invite=location.origin+'/mini-program-showcase/?role=contributor&page=me&connect='+encodeURIComponent(state.code)
 async function share(){try{if(navigator.share){await navigator.share({title:identity.name+'的亲友名片',text:'加我为亲友，一起分享日常。',url:invite});return}await navigator.clipboard.writeText(invite);setNotice('邀请已复制，可以发给亲友。')}catch(error){if((error as Error).name!=='AbortError'){setCopyFallback(true);setNotice('请长按邀请链接复制。')}}}
 async function saveQr(){try{const svg=qr.current?.querySelector('svg');if(!svg)throw Error();const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=900;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,900,900);ctx.drawImage(img,0,0,900,900);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/png'));const download=URL.createObjectURL(blob);const a=document.createElement('a');a.href=download;a.download=identity.name+'-亲友二维码.png';a.click();setTimeout(()=>URL.revokeObjectURL(download),1000);setNotice('二维码已生成，请在下载内容中查看。')}finally{URL.revokeObjectURL(url)}}catch{setNotice('没有保存成功，您也可以截屏保存二维码。')}}
 const pending=state.requests.filter(r=>r.status==='pending'),friends=state.requests.filter(r=>r.status==='accepted')
 const navigate=(next:typeof view)=>{setView(next);onViewChange?.(next);setNotice('');setCopyFallback(false)}
 const change=(id:string,status:'accepted'|'declined'|'removed')=>{try{resolveConnection(id,status);setNotice(status==='accepted'?'已添加为亲友':status==='declined'?'已婉拒这次申请':'已解除亲友关系');setRemove(null)}catch{setNotice('没有保存成功，请再试一次。')}}
 return <div className="connection-panel">
 {onClose&&<button className="connection-back" onClick={onClose}><ArrowLeft size={23}/>返回</button>}
 {elder?<>
 {view==='home'?<>
  <button className="connection-profile-row" onClick={()=>navigate('qr')}><img src={identity.avatar} alt=""/><span><b>{identity.name}</b><small>我的二维码</small></span><QrCode size={26}/><CaretRight size={20}/></button>
  <div className="connection-menu">
   <button onClick={()=>void share()}><span className="connection-row-icon"><Link size={25}/></span><b>邀请亲友</b><CaretRight size={20}/></button>
   <button onClick={()=>navigate('requests')}><span className="connection-row-icon"><UserPlus size={25}/></span><b>新的朋友</b>{pending.length>0&&<em>{pending.length}</em>}<CaretRight size={20}/></button>
   <button onClick={()=>navigate('friends')}><span className="connection-row-icon"><UsersThree size={25}/></span><b>已添加的亲友</b><small>{friends.length||''}</small><CaretRight size={20}/></button>
  </div>
 </>:<>
 {!onViewChange&&<button className="connection-back" onClick={()=>navigate('home')}><ArrowLeft size={23}/>返回</button>}
 {view==='qr'?<>
  <div className="personal-qr-card"><div className="qr-identity"><img src={identity.avatar} alt=""/><div><h2>{identity.name}</h2><span>我的亲友名片</span></div></div><div ref={qr} className="personal-qr" aria-label="我的亲友二维码"><QRCodeSVG value={invite} size={260} level="M" marginSize={4} title={identity.name+'的亲友邀请二维码'}/></div><p>扫一扫，加我为亲友</p><small>添加后，由我确认</small></div>
  <div className="qr-actions"><button onClick={()=>void saveQr()}><Download size={23}/>保存二维码</button><button onClick={()=>void share()}><ShareNetwork size={23}/>分享名片</button></div>
  <button className="connection-quiet qr-details-trigger" onClick={()=>setDetails(v=>!v)}>用邀请码添加</button>
  {details&&<div className="qr-code-details"><strong>{state.code}</strong><button className="connection-quiet" onClick={()=>{try{setState(renewInvitation());setNotice('二维码和邀请码已更新，旧邀请不再有效。')}catch{setNotice('更新失败，请再试一次。')}}}>更新二维码与邀请码</button></div>}
 </>:view==='requests'?<>
  {!onViewChange&&<h2 className="connection-page-title">新的朋友</h2>}{!pending.length&&<div className="connection-empty"><UserPlus size={42} weight="light"/><p>还没有新的朋友申请</p><button onClick={()=>navigate('qr')}>出示我的二维码</button></div>}
  {pending.map(r=><article key={r.id} className="connection-person"><b>{r.name}</b><span>{r.relation}</span>{r.message&&<p>{r.message}</p>}<div><button onClick={()=>change(r.id,'declined')}>婉拒</button><button className="connection-primary" onClick={()=>change(r.id,'accepted')}><Check size={20}/>同意添加</button></div></article>)}
 </>:<>
  {!onViewChange&&<h2 className="connection-page-title">已添加的亲友</h2>}{!friends.length&&<div className="connection-empty"><UsersThree size={42} weight="light"/><p>邀请熟悉的人，分享日常。</p><button onClick={()=>navigate('qr')}>出示我的二维码</button></div>}
  {friends.map(r=><article className="connection-person" key={r.id}><b>{r.name}</b><span>{r.relation}</span>{remove===r.id?<div><button onClick={()=>setRemove(null)}>保留</button><button onClick={()=>change(r.id,'removed')}>确认解除</button></div>:<button className="connection-quiet" onClick={()=>setRemove(r.id)}>解除关系</button>}</article>)}
 </>}
 </>}
 {copyFallback&&<input aria-label="亲友邀请链接" readOnly value={invite} onFocus={e=>e.target.select()}/>}
 </>:<>
 <div className="connection-intro"><UsersThree size={35}/><h2>添加一位亲友</h2><p>输入长者分享的邀请码，向对方介绍一下自己。</p></div>
 {submitted?<div className="connection-person"><Check size={35}/><h3>申请已提交</h3><p>等待陈老师确认后，就可以分享日常和问候。</p><p className="connection-muted">{state.requests.find(r=>r.name===name.trim())?.status==='accepted'?'陈老师已同意添加':state.requests.find(r=>r.name===name.trim())?.status==='declined'?'对方暂未同意这次申请':'等待对方确认'}</p></div>:<form onSubmit={e=>{e.preventDefault();try{ensureInvitation();applyConnection(code,name,relation,message);setSubmitted(true);setNotice('')}catch(error){setNotice((error as Error).message)}}}>
 <label>邀请码<input aria-label="邀请码" value={code} onChange={e=>setCode(e.target.value)} placeholder="输入对方的邀请码" required/></label>
 {code.trim().toUpperCase()===state.code&&state.expiresAt>Date.now()&&<div className="connection-recipient"><b>陈老师 · 陈明远</b><span>请确认是您认识的人</span></div>}
 <label>您的姓名<input value={name} onChange={e=>setName(e.target.value)} maxLength={30} required/></label><label>您是对方的什么人<input value={relation} onChange={e=>setRelation(e.target.value)} placeholder="例如：学生、女儿、老同事" maxLength={30} required/></label><label>打个招呼（选填）<textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={200} placeholder="陈老师，我是……"/></label><button className="connection-primary" type="submit">发送添加申请</button>
 </form>}
 </>}
 {notice&&<p className="connection-notice" role="status">{notice}</p>}
 </div>
}
