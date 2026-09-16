import { useEffect, useRef, useState } from 'react'
import { Microphone, Stop } from '@phosphor-icons/react'
import { useDemo } from './context'
import { AudioPlayer, saveMedia } from './media'
import { Button, Upload } from './ui'
export function VoiceInput({
  path,
  text,
  onChange,
}: {
  path: string
  text: string
  onChange: (p: string, t: string) => void
}) {
  const { c, notify } = useDemo()
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const active = useRef(true)
  const requestId = useRef(0)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      requestId.current++
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])
  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [recording])
  useEffect(() => {
    if (seconds >= 60 && recording) recorder.current?.stop()
  }, [seconds, recording])
  async function record() {
    const id = ++requestId.current
    try {
      const tracks = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!active.current || id !== requestId.current) {
        tracks.getTracks().forEach((t) => t.stop())
        return
      }
      stream.current = tracks
      const rec = new MediaRecorder(tracks)
      recorder.current = rec
      const chunks: BlobPart[] = []
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data)
      }
      rec.onstop = async () => {
        tracks.getTracks().forEach((t) => t.stop())
        if (!active.current) return
        setRecording(false)
        try {
          const file = new File(chunks, '我的语音祝福.webm', { type: rec.mimeType || 'audio/webm' })
          const saved = await saveMedia(file)
          if (active.current) onChange(saved, '')
        } catch {
          notify('声音未能保存，可以再录一次或上传音频。')
        }
      }
      rec.start()
      setSeconds(0)
      setRecording(true)
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop())
      notify('未获得麦克风权限，可以上传音频或使用演示声音。')
    }
  }
  return (
    <div className="voice-input">
      <details>
        <summary>不知道说什么？可以这样说</summary>
        <p>
          我是____，想对您说……
          <br />
          最想谢谢您的是……
          <br />
          接下来的日子，希望您……
        </p>
      </details>
      {recording ? (
        <Button onClick={() => recorder.current?.stop()}>
          <Stop />
          结束录音 · {seconds}秒
        </Button>
      ) : (
        <Button secondary onClick={record}>
          <Microphone />
          开始录音 · 最长60秒
        </Button>
      )}
      <Upload onAudio={(p) => onChange(p, '')}>上传一段声音</Upload>
      <button
        className="text-button"
        onClick={() => onChange(`audio/cases/${c.id}/greeting.m4a`, c.nextWish)}
      >
        使用可试听的演示声音
      </button>
      {path && (
        <>
          <AudioPlayer path={path} text={text} />
          <button className="text-button" onClick={() => onChange('', '')}>
            移除声音
          </button>
        </>
      )}
    </div>
  )
}
