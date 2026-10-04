import {
  CaretLeft,
  Play,
  Microphone,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS, RecordingDialog } from '../components/RecordingDialog'
import { getMockGalleryPhotos } from '../mock'
import '../styles/home.css'
import type { GalleryPhoto } from '../types'

const ALBUM_PHOTO_DRAFT_KEY = 'shiguangxu:album-photo-draft'

type DraftPhoto = {
  previewUrl: string
  source: 'camera' | 'album'
  createdAt: string
}

function readDraftPhoto(): DraftPhoto | null {
  try {
    const raw = window.sessionStorage.getItem(ALBUM_PHOTO_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as DraftPhoto) : null
  } catch {
    return null
  }
}

function createNewPhotoFallback(draft: DraftPhoto | null): GalleryPhoto {
  return {
    id: 'gallery-new-draft',
    url: draft?.previewUrl || '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    alt: '新选择的家庭照片',
    title: '待生成标题',
    uploadedAt: draft?.createdAt || new Date().toISOString(),
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
    metadataSummary: draft?.source === 'album'
      ? '从手机相册选择，等待结合语音备注生成标题和分类。'
      : '由手机拍摄录入，等待结合语音备注生成标题和分类。',
  }
}

export function AlbumPhotoNotePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const draftPhoto = useMemo(() => readDraftPhoto(), [])
  const mockPhoto = id ? getMockGalleryPhotos().find((photo) => photo.id === id) : undefined
  const isNew = searchParams.get('mode') === 'new' || !id
  const photo = mockPhoto || createNewPhotoFallback(draftPhoto)
  const [recording, setRecording] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [photoTitle, setPhotoTitle] = useState(photo.title)
  const [voiceDuration, setVoiceDuration] = useState(photo.voiceNoteDurationSeconds || 0)
  const [voiceText, setVoiceText] = useState(photo.voiceNoteText || '')
  const [toastMessage, setToastMessage] = useState('')
  const recordingStartedAtRef = useRef(0)
  const hasVoiceNote = voiceDuration > 0

  useEffect(() => {
    if (!recordingStartedAt) return undefined
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000))))
    }, 240)
    return () => window.clearInterval(timer)
  }, [recordingStartedAt])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const startRecording = () => {
    setRecording(true)
    setRecordingSeconds(0)
    recordingStartedAtRef.current = Date.now()
    setRecordingStartedAt(recordingStartedAtRef.current)
  }

  const cancelRecording = () => {
    setRecording(false)
    setRecordingStartedAt(null)
    setRecordingSeconds(0)
  }

  const confirmRecording = () => {
    const duration = Math.max(MIN_RECORDING_SECONDS, Math.min(MAX_RECORDING_SECONDS, Math.round((Date.now() - recordingStartedAtRef.current) / 1000) || recordingSeconds))
    setVoiceDuration(duration)
    setVoiceText('这张照片想给外婆留个备注：孩子们都很期待周末去看她，也想让她知道家里一直惦记着她。')
    if (isNew) {
      setPhotoTitle('周末想给外婆看的照片')
    }
    setRecording(false)
    setRecordingStartedAt(null)
    setRecordingSeconds(0)
  }

  return (
    <main className="album-note-page" aria-label={isNew ? '照片备注' : '照片详情'}>
      <header className="proto-topbar-static album-note-topbar">
        <button type="button" aria-label="返回家庭空间" onClick={() => navigate('/member/treasure')}>
          <CaretLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <h1>{isNew ? '照片备注' : '照片详情'}</h1>
        <span className="proto-topbar-static__spacer" aria-hidden="true" />
      </header>

      <section className="album-note-content">
        <figure className="album-note-photo-card">
          <div className="album-note-photo-card__image">
            <img src={photo.url} alt={photo.alt} />
          </div>
          <figcaption>
            <strong>{photoTitle}</strong>
          </figcaption>
        </figure>

        <section className="album-note-remark-section" aria-label="照片语音备注">
          <div className="album-note-remark-heading">
            <h2>照片备注</h2>
            {hasVoiceNote ? (
              <button className="album-note-edit-button" type="button" onClick={startRecording}>
                重录
              </button>
            ) : null}
          </div>
          {hasVoiceNote ? (
            <>
              <button className="album-note-voice-player" type="button" aria-label={`播放照片备注语音 ${voiceDuration}秒`}>
                <span aria-hidden="true">
                  <Play size={17} weight="fill" />
                </span>
                <strong>照片备注 {voiceDuration}秒</strong>
              </button>
              <p>{voiceText}</p>
            </>
          ) : (
            <>
              <button className="album-note-empty-record" type="button" onClick={startRecording}>
                <span aria-hidden="true">
                  <Microphone size={22} weight="fill" />
                </span>
                <strong>开始录音</strong>
              </button>
              <p className="album-note-empty-record__hint">说几句照片里的时间、人物或故事，AI会更准确地生成标题、分类和回忆线索。</p>
            </>
          )}
        </section>
      </section>

      {recording ? (
        <RecordingDialog recordingSeconds={recordingSeconds} onCancel={cancelRecording} onConfirm={confirmRecording} />
      ) : null}
      {toastMessage ? <div className="home-toast" role="status">{toastMessage}</div> : null}
    </main>
  )
}
