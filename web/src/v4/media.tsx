import { useEffect, useState, useRef } from 'react'
import { resource } from './data'
const blobs = new Map<string, string>()
function db() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('sgx-demo-v4-media', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('files')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}
export async function saveMedia(file: File) {
  const id = 'upload:' + crypto.randomUUID()
  const store = await db()
  await new Promise<void>((resolve, reject) => {
    const tx = store.transaction('files', 'readwrite')
    tx.objectStore('files').put(file, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  store.close()
  blobs.set(id, URL.createObjectURL(file))
  return id
}
function useMedia(path: string) {
  const [src, setSrc] = useState(
    path.startsWith('upload:') ? blobs.get(path) || '' : resource(path),
  )
  useEffect(() => {
    let alive = true
    if (!path.startsWith('upload:')) {
      setSrc(path ? resource(path) : '')
      return
    }
    if (blobs.has(path)) {
      setSrc(blobs.get(path)!)
      return
    }
    setSrc('')
    db()
      .then((store) => {
        const request = store.transaction('files').objectStore('files').get(path)
        request.onsuccess = () => {
          if (request.result) {
            const url = URL.createObjectURL(request.result)
            blobs.set(path, url)
            if (alive) setSrc(url)
          }
          store.close()
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path])
  return src
}
export function PhotoImage({
  path,
  alt,
  className = '',
  onClick,
}: {
  path: string
  alt: string
  className?: string
  onClick?: () => void
}) {
  const src = useMedia(path)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [path])
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={'media-unavailable ' + className} onClick={onClick}>
      <span>{alt}</span>
      <small>照片暂时无法读取</small>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setFailed(false)
        }}
      >
        重新加载
      </button>
    </div>
  )
}
export function AudioPlayer({
  path,
  text,
  onStart,
}: {
  path: string
  text: string
  onStart?: () => void
}) {
  const src = useMedia(path)
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const stop = () => ref.current?.pause()
    window.addEventListener('sgx-stop-media', stop)
    const visibility = () => {
      if (document.hidden) stop()
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stop()
      window.removeEventListener('sgx-stop-media', stop)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return (
    <div className="audio-card">
      <span>♫ {path.startsWith('upload:') ? '上传的声音' : '演示配音'} · 点一下，听听这份心意</span>
      <audio
        ref={ref}
        controls
        preload="metadata"
        src={src}
        onPlay={(e) => {
          document.querySelectorAll('audio').forEach((a) => {
            if (a !== e.currentTarget) a.pause()
          })
          onStart?.()
        }}
      />
      <p>{text || '暂无文字稿'}</p>
    </div>
  )
}
export const stopMedia = () => window.dispatchEvent(new Event('sgx-stop-media'))
