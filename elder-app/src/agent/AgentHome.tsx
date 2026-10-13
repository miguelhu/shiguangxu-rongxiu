import {useEffect,useRef,useState} from 'react'
import {Camera,Images,Microphone,VideoCamera,X,Check,SpeakerHigh} from '@phosphor-icons/react'
import {ChatComposer} from '../ChatComposer'
import {ACCOUNTS} from '../Contacts'
import {Facts,Media,Message,extract,questions,storeMemory} from './model'
import {AgentSuggestion,ConversationArea,MediaPreview,MemoryActions,MemoryProgress,UploadTrigger,WelcomeMessage,XiaoxuAssistant} from './components'
import './agent.css'
type Stage='welcome'|'choice'|'memory'|'share'|'confirm'|'saved'|'conversation'
export function AgentHome({name,active,recipient}:{name:string,active:boolean,recipient?:string}){
 const [stage,setStage]=useState<Stage>('welcome'),[messages,setMessages]=useState<Message[]>([]),[media,setMedia]=useState<Media[]>([]),[facts,setFacts]=useState<Facts>({}),[story,setStory]=useState<string[]>([]),[asked,setAsked]=useState<(keyof Facts)[]>([]),[recipients,setRecipients]=useState<string[]>([]),[upload,setUpload]=useState(false),[discard,setDiscard]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[autoSpeak,setAutoSpeak]=useState(false),[voiceStarted,setVoiceStarted]=useState(false)
 const input=useRef<HTMLInputElement>(null),end=useRef<HTMLDivElement>(null),urls=useRef<string[]>([]),lock=useRef(false),recordId=useRef(crypto.randomUUID()),lastRecipient=useRef(''),mediaMode=useRef('image/*')
 const objectURL=(b:Blob)=>{const u=URL.createObjectURL(b);urls.current.push(u);return u}
 const speak=(text:string)=>{if(!('speechSynthesis'in window)){setError('这台设备暂不支持朗读。');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.9;speechSynthesis.speak(u)}
 const ai=(text:string)=>{setMessages(m=>[...m,{id:crypto.randomUUID(),role:'ai',text}]);if(autoSpeak)speak(text)}
 useEffect(()=>{if(active){const frame=requestAnimationFrame(()=>window.scrollTo({top:stage==='welcome'&&!voiceStarted?0:document.documentElement.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));return()=>cancelAnimationFrame(frame)}},[messages,stage,active])
 useEffect(()=>()=>{urls.current.forEach(URL.revokeObjectURL);window.speechSynthesis?.cancel()},[])
 useEffect(()=>{if(!active)window.speechSynthesis?.cancel()},[active])
 useEffect(()=>{if(recipient&&recipient!==lastRecipient.current){lastRecipient.current=recipient;setRecipients([recipient]);setStage('share');ai('好，我们给这位亲友发个日常。先选内容，或者说一句想说的话。')}},[recipient])
 const hasContent=media.length>0||story.some(t=>t.trim())
 function nextQuestion(f:Facts,previous:(keyof Facts)[]){const q=(Object.keys(questions) as (keyof Facts)[]).find(k=>!f[k]&&!previous.includes(k));if(q)setAsked([...previous,q]);return q?questions[q]:'这些都记下了。您还可以继续讲，也可以现在存下。'}
 function choose(intent:'memory'|'share'){setStage(intent);if(intent==='memory')ai(hasContent?nextQuestion(facts,asked):'先说说想留下的那件事，也可以选一张照片。');else ai(media.length?'想发给谁？您可以点选，也可以告诉我。':'先挑一张照片，或者说一句想分享的话。')}
 async function save(kind:'fragment'|'daily'){
 if(lock.current)return;if(!hasContent){setError('先留一句话或一份照片、录音吧。');return}if(kind==='daily'&&!recipients.length){setError('先选一位亲友。');return}lock.current=true;setBusy(true);setError('');try{await storeMemory({id:kind==='daily'?recordId.current+'-daily':recordId.current,kind,words:story.join('\n'),media,facts,recipientIds:kind==='daily'?recipients:[],people:kind==='daily'?recipients.map(id=>ACCOUNTS.find(a=>a.id===id)?.name||id):[]});setStage('saved');ai(kind==='fragment'?'已经存好了。我在，您接着说。':'已留下这次发送记录，演示还没有真正发出。我在，您接着说。')}catch{setError('这次没能保存，内容还在，请再试一次。')}finally{lock.current=false;setBusy(false)}}
 function reset(){setMedia([]);setStory([]);setFacts({});setAsked([]);setRecipients([]);setStage('conversation');setVoiceStarted(true);setDiscard(false);setError('');recordId.current=crypto.randomUUID();window.speechSynthesis?.cancel();ai('这次未保存的内容先放下，已经保存的还在。您想聊什么，我都在。')}
 function receive(text:string,audio?:Blob){if(busy)return;const clean=text.trim();const voice=audio?objectURL(audio):undefined;setMessages(m=>[...m,{id:crypto.randomUUID(),role:'user',text:clean||'一段语音',audio:voice}]);setVoiceStarted(true);if(audio)setMedia(m=>[...m,{id:crypto.randomUUID(),type:'audio',url:voice!,blob:audio,name:'我的讲述'}]);
 if(!clean){if(['welcome','conversation','saved'].includes(stage))setStage('choice');ai('声音留下了，这次没能转成文字。您可以继续说，也可以直接选择存起来或发出去。');return}
 if(/歇会|休息一下|先不聊/.test(clean)){ai('好，您歇一歇。想说的时候再叫我。');return}
 if(/舍弃|不要了|放弃|先不记了/.test(clean)){setDiscard(true);return}
 if(/帮我存下|就到这|保存吧|存好了|帮我记进去/.test(clean)){if(hasContent)void save('fragment');else ai('先留一句话或一份照片，我们就能存下。');return}
 if(/发出去|发给|发照片|分享|发送/.test(clean)){
 setStage('share');const match=ACCOUNTS.filter(a=>clean.includes(a.name)||clean.includes(a.relation));if(match.length===1)setRecipients([match[0].id]);if(/孙女/.test(clean))ai('家谱里的孙女还没有关联账号，暂时不能直接发给她。您可以先选照片，再选择已关联的亲友。');else ai(media.length?'好，选好亲友后，我们一起确认要发的内容。':'好，先选一张照片，也可以直接说一句想分享的话。');return}
 if(/^(我想|帮我|请)?(存起来|保存|记下来|留住)[。！]?$/.test(clean)){choose('memory');return}
 if(stage==='share'||stage==='confirm'){const found=ACCOUNTS.filter(a=>clean.includes(a.name)||clean.includes(a.relation));if(found.length){setRecipients(found.map(a=>a.id));ai('亲友选好了。确认内容后再发送。')}else{setStory(s=>[...s,clean]);ai('这句话也放进去了。选好亲友后，就可以看看要发的内容。')}setStage('share');return}
 const newTopic=/换个话题|另一件事|另外一件|再说件|聊点别的/.test(clean);if(newTopic){setMedia([]);setRecipients([]);recordId.current=crypto.randomUUID()}const baseFacts=newTopic?{}:facts;const baseAsked=newTopic?[]:asked;const f=extract(clean,baseFacts,stage==='memory'&&!newTopic?asked[asked.length-1]:undefined);setFacts(f);setStory(s=>newTopic?[clean]:[...s,clean]);setStage('memory');const reflection=/开心|高兴/.test(clean)?'听起来，那是一段开心的回忆。':/难过|舍不得|想念/.test(clean)?'您说的这份感受，我也一起记下。':`“${clean.slice(0,40)}${clean.length>40?'…':''}”，记下了。`;ai(`${reflection}\n${nextQuestion(f,baseAsked)}`)
 }
 function pick(accept:string,capture=false){mediaMode.current=accept;const el=input.current!;el.accept=accept;if(capture)el.setAttribute('capture','environment');else el.removeAttribute('capture');setUpload(false);el.click()}
 function uploadFiles(files:FileList|null){if(!files?.length)return;const items=Array.from(files);if(media.length+items.length>6){setError('这份记录最多放6份内容。您可以先存下，我们继续聊。');return}if(items.some(f=>!(/^(image|video|audio)\//.test(f.type))||f.size>50*1024*1024)){setError('请选择50MB以内的照片、视频或声音文件。');return}const added=items.map(f=>({id:crypto.randomUUID(),type:f.type.split('/')[0] as Media['type'],url:objectURL(f),blob:f,name:f.name}));setMedia(m=>[...m,...added]);setError('');setMessages(m=>[...m,{id:crypto.randomUUID(),role:'user',text:'',media:added}]);if(stage==='share')ai('收到了。选好亲友，我们再确认一下。');else if(stage==='memory'||stage==='saved'){setStage('memory');ai('这份内容也一起留下了。您可以继续讲，或现在存下。')}else{setStage('choice');ai('收到了，您想存起来，还是发给亲友？')}}
 return <div className={`agent-home ${stage==='welcome'&&!voiceStarted?'welcoming':'in-conversation'}`}>
 {stage==='welcome'&&!voiceStarted?<WelcomeMessage name={name}/>:<><XiaoxuAssistant compact/><ConversationArea messages={messages} speak={speak}/></>}
 {stage==='choice'&&<AgentSuggestion options={[{text:'存起来',action:()=>choose('memory')},{text:'发出去',action:()=>choose('share')}]}/>}
 {stage==='memory'&&<><button className="agent-add-inline" onClick={()=>setUpload(true)}>补充照片或声音</button><MemoryProgress facts={facts}/><MemoryActions busy={busy} onSave={()=>void save('fragment')} onDiscard={()=>setDiscard(true)}/></>}
 {stage==='share'&&<div className="agent-share"><button className="agent-add-inline" onClick={()=>setUpload(true)}>选择照片或其他内容</button><div className="agent-recipients">{ACCOUNTS.map(a=><button key={a.id} aria-pressed={recipients.includes(a.id)} onClick={()=>setRecipients(r=>r.includes(a.id)?r.filter(x=>x!==a.id):[...r,a.id])}><span className={`contact-avatar ${a.tone}`}>{a.initial}</span><span>{a.name}<small>{a.relation}</small></span>{recipients.includes(a.id)&&<Check size={23}/>}</button>)}</div><button className="primary" disabled={!hasContent||!recipients.length} onClick={()=>{setStage('confirm');ai('再看一眼，确认是这些内容和亲友。')}}>看看要发的内容</button></div>}
 {stage==='confirm'&&<div className="agent-confirm"><p>发给：{recipients.map(id=>ACCOUNTS.find(a=>a.id===id)?.name).join('、')}</p><MediaPreview media={media}/><p>{story.join('\n')}</p><small>当前演示不会实际发送。</small><button className="primary" disabled={busy} onClick={()=>void save('daily')}>确认发送（演示）</button><button className="secondary" onClick={()=>setStage('share')}>再改一下</button></div>}
 {(stage==='saved'||stage==='conversation')&&<button className="agent-add-inline" onClick={()=>setUpload(true)}>补充照片或声音</button>}
 {stage!=='welcome'&&stage!=='saved'&&stage!=='conversation'&&stage!=='memory'&&<button className="agent-discard" onClick={()=>setDiscard(true)}>暂时舍弃</button>}
 {error&&<p className="agent-error" role="alert">{error}</p>}
 <div ref={end} className="conversation-end"/>
 {active&&<div className="agent-input"><div className="agent-input-tools">{stage==='welcome'&&!voiceStarted&&<UploadTrigger onClick={()=>setUpload(true)}/>}<button aria-label={autoSpeak?'关闭自动朗读':'开启自动朗读'} aria-pressed={autoSpeak} onClick={()=>{setAutoSpeak(!autoSpeak);if(autoSpeak)window.speechSynthesis?.cancel()}}><SpeakerHigh size={21}/>{autoSpeak?'朗读开':'朗读'}</button></div><ChatComposer onText={receive} onVoice={(blob,text)=>receive(text,blob)} onStart={()=>{setVoiceStarted(true);window.speechSynthesis?.cancel()}} disabled={busy}/></div>}
 <input ref={input} type="file" hidden multiple onChange={e=>{uploadFiles(e.target.files);e.target.value=''}}/>
 {upload&&<div className="agent-overlay" onClick={()=>setUpload(false)}><div className="agent-upload-sheet" role="dialog" aria-label="添加内容" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="sheet-close" aria-label="关闭上传选项" onClick={()=>setUpload(false)}><X size={25}/></button><h2>想留下什么？</h2><button onClick={()=>pick('image/*')}><Images size={27}/>照片</button><button onClick={()=>pick('image/*',true)}><Camera size={27}/>拍一张</button><button onClick={()=>pick('video/*')}><VideoCamera size={27}/>视频</button><button onClick={()=>pick('audio/*')}><Microphone size={27}/>声音文件</button></div></div>}
 {discard&&<div className="agent-overlay"><div className="agent-discard-dialog" role="alertdialog" aria-modal="true" aria-label="舍弃这次记录"><h2>这次先不留了吗？</h2><p>已经保存的内容不会删除。</p><button className="primary" onClick={reset}>舍弃这次记录</button><button className="secondary" onClick={()=>setDiscard(false)}>继续讲述</button></div></div>}
 </div>
}
