import { useEffect, useState } from 'react'
import { mediaUrl } from './data'
export function useAsset(path:string) {
  const [url,setUrl]=useState(path.startsWith('upload:')?'':mediaUrl(path))
  useEffect(()=>{
    if(!path.startsWith('upload:')) {setUrl(path?mediaUrl(path):'');return}
    setUrl(''); let alive=true;let objectUrl='';const r=indexedDB.open('sgx-demo-v5-media',1)
    r.onupgradeneeded=()=>r.result.createObjectStore('files')
    r.onsuccess=()=>{const db=r.result;const q=db.transaction('files').objectStore('files').get(path);q.onsuccess=()=>{if(q.result&&alive){objectUrl=URL.createObjectURL(q.result);setUrl(objectUrl)}db.close()};q.onerror=()=>db.close()}
    return ()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
  },[path]);return url
}
export function Photo({path,alt,...props}:{path:string;alt:string;className?:string}) { const src=useAsset(path);const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[path]);return src&&!failed?<img {...props} src={src} alt={alt} onError={()=>setFailed(true)}/>:<div className="rf-photo-empty">{alt || '这张照片暂时无法读取'}</div> }
export function Voice({path,text}:{path:string;text:string}) {const src=useAsset(path);const [error,setError]=useState(false);return <div className="rf-voice"><span>听听这段声音</span><audio controls src={src} preload="none" onError={()=>setError(true)} onPlay={e=>{speechSynthesis?.cancel();document.querySelectorAll('audio').forEach(a=>{if(a!==e.currentTarget)a.pause()})}}/>{error&&<small>暂时无法播放，可以先读文字。</small>}{text&&<p>{text}</p>}</div>}
