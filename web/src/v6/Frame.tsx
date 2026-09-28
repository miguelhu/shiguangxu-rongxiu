import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowSquareOut, FrameCorners, Play } from '@phosphor-icons/react'
import { useDemo } from './context'
import { resource } from './data'
import { available, ceremonyBlocks, orderedPhotos, orderedStories, photosFor } from './model'
import CeremonyFrame from './CeremonyFrame'
import './frame-link.css'
const hostedFrame = 'https://shiguangxu.miguelhuchen.space/photoframe/'
export default function Frame({compact=false,received=false}:{compact?:boolean;received?:boolean}) {
  const {c,s}=useDemo();const ref=useRef<HTMLIFrameElement>(null);const [ceremony,setCeremony]=useState(false)
  const url=useMemo(()=>{const base=location.protocol==='file:'?hostedFrame:new URL('/photoframe/',location.origin).href;return `${base}#/frame${received?'/received':''}?case=${c.id}&scenario=teacher-retirement&embedded=1${s.previewing?'&preview=1':''}`},[c.id,received,!!s.previewing])
  const origin=new URL(url).origin
  const path=(p:string)=>!p||p.startsWith('upload:')?p:new URL(resource(p),location.href).href
  const blocks=ceremonyBlocks(c.id,s)
  const host=(!s.previewing&&s.version?.host)||s.host
  const letter=(!s.previewing&&s.version?.letter)||s.letter
  const allPhotos=[...new Map([...photosFor(c.id,s),...(!s.previewing?s.version?.photos||[]:[])].map(p=>[p.id,p])).values()]
  const mapBlock=(b:typeof blocks[number])=>({...b,audio:path(b.audio)})
  const stories=orderedStories(c.id,s,blocks)
  const payload={schema:1,caseId:c.id,address:host.address||c.address,name:host.name||c.name,category:c.category,host:host.organizer||c.host,date:host.date||c.date,cover:path(host.cover||c.cover),bio:host.bio||c.bio,photos:orderedPhotos(c.id,s,blocks).map(p=>({...p,path:path(p.path)})),blocks:[...stories,...blocks.filter(b=>b.kind!=='story')].map(mapBlock),letter:letter.text||'',letterConfirmed:!!letter.confirmed,version:s.version?.number||0,fresh:available(c.id,s,'gift').filter(b=>b.source==='onsite'||b.source==='greeting').map(mapBlock),media:allPhotos.map(p=>({...p,path:path(p.path)})),preview:!!s.previewing}
  const serialized=JSON.stringify(payload)
  const publish=()=>{try{localStorage.setItem(`sgx-frame-${s.previewing?'preview':'gift'}-v1:${c.id}`,serialized)}catch{}ref.current?.contentWindow?.postMessage({type:'sgx:frame-gift',gift:JSON.parse(serialized)},origin)}
  useEffect(()=>{publish();const ready=(e:MessageEvent)=>{if(e.origin===origin&&e.source===ref.current?.contentWindow&&e.data?.type==='sgx:frame-ready')publish()};window.addEventListener('message',ready);return()=>window.removeEventListener('message',ready)},[serialized,url,ceremony])
  useEffect(()=>setCeremony(false),[c.id,received])
  return <section className={`connected-frame ${compact?'connected-frame--compact':''}`}>
    <div className="connected-frame-toolbar"><button className={!ceremony?'active':''} onClick={()=>setCeremony(false)}><FrameCorners size={19}/>日常相框</button>{!received&&<button className={ceremony?'active':''} onClick={()=>setCeremony(true)}><Play size={18}/>仪式播放</button>}<a href={url.replace('&embedded=1','')} target="_blank" rel="noreferrer" onClick={publish}><ArrowSquareOut size={18}/>打开相框</a></div>
    {ceremony?<CeremonyFrame compact={compact}/>:<iframe ref={ref} src={url} title={`${c.address}的拾光叙相框`} onLoad={publish} allow="autoplay; fullscreen"/>}
  </section>
}
