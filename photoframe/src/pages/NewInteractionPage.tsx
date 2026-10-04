import { ArrowLeft, CaretRight, MagicWand, Microphone, PaperPlaneTilt, TrashSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS, RecordingDialog } from '../components/RecordingDialog'
import type { ComposeDraft, InteractionThread } from '../types'

const SESSION_INTERACTION_DRAFT_KEY = 'shiguangxu:interaction-draft'
const SESSION_INTERACTIONS_KEY = 'shiguangxu:sent-interactions'

const DEFAULT_DRAFT: ComposeDraft = {
  id: 'compose-001',
  photoUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=900&q=82',
  photoAlt: '家人在户外野餐聊天',
  source: 'album',
  mode: 'text',
  text: '',
  status: 'editing',
}

const TEXT_LIMIT = 100

const POLISHED_DRAFTS = [
  '这张照片想第一时间分享给你。今天看到它的时候，突然很想起你，也想知道你今天过得怎么样。',
  '把这张照片发给你看看，也想顺便问问你最近好不好。等你有空，也跟我聊聊你的近况。',
]

interface StoredInteractionDraft {
  name: string
  photoAlt: string
  photoUrl: string
  source: 'album' | 'camera'
  type?: string
}

function getStoredInteractionDraft(): StoredInteractionDraft | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_INTERACTION_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredInteractionDraft
  } catch {
    return null
  }
}

function getStoredThreads(): InteractionThread[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_INTERACTIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as InteractionThread[]
  } catch {
    return []
  }
}

function polishDraft(text: string, index: number) {
  const fallback = POLISHED_DRAFTS[index % POLISHED_DRAFTS.length]
  const normalized = text.trim()
  if (!normalized) return fallback
  return normalized.length > 58
    ? `${normalized.slice(0, 56)}，想把这一刻认真分享给你。看到这张照片时，我第一时间想到了你，也很想听听你看到它时想起了什么。`
    : `${normalized}，想把这一刻认真分享给你。看到这张照片时，我第一时间想到了你，也很想听听你看到它时想起了什么。`
}

function getAsrDraft(durationSeconds: number) {
  if (durationSeconds >= 8) {
    return '这张照片想分享给你看看，今天看到这一幕的时候，我一下子就想到你了。最近天气变化挺快的，你也要记得照顾好自己。'
  }
  return '这张照片想分享给你看看，今天看到它的时候，我一下子就想到你了。'
}

function saveSentInteraction(draft: ComposeDraft) {
  // Prototype-only: store a temporary interaction locally so the UX can be reviewed end to end.
  // Production should upload the photo, call the interaction creation API, and read the new thread from the backend.
  const now = new Date().toISOString()
  const content = draft.text
  const newThread: InteractionThread = {
    id: `session-thread-${Date.now()}`,
    title: draft.source === 'camera' ? '刚拍下的照片' : '新发起的照片互动',
    photoUrl: draft.photoUrl,
    photoAlt: draft.photoAlt,
    photoLabel: draft.source === 'camera' ? '刚拍摄' : '相册照片',
    photoMeta: '刚刚',
    photoTone: 'peach',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: content,
    initialMethod: 'text',
    latestSnippet: draft.text,
    latestAt: now,
    unread: false,
    responses: [
      {
        id: `session-response-${Date.now()}`,
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content,
        createdAt: now,
      },
    ],
  }
  window.sessionStorage.setItem(SESSION_INTERACTIONS_KEY, JSON.stringify([newThread, ...getStoredThreads()]))
  window.dispatchEvent(new Event('shiguangxu:interaction-sent'))
}

export function NewInteractionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storedDraft = getStoredInteractionDraft()
  const [draft, setDraft] = useState<ComposeDraft>({
    ...DEFAULT_DRAFT,
    photoAlt: storedDraft?.photoAlt ?? DEFAULT_DRAFT.photoAlt,
    photoUrl: storedDraft?.photoUrl ?? DEFAULT_DRAFT.photoUrl,
    source: storedDraft?.source ?? (searchParams.get('source') === 'camera' ? 'camera' : 'album'),
  })
  const [error, setError] = useState('')
  const [polishIndex, setPolishIndex] = useState(0)
  const [polishedText, setPolishedText] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordingIsPrototype, setRecordingIsPrototype] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const voiceChunksRef = useRef<BlobPart[]>([])
  const recordingStartedAtRef = useRef(0)
  const autoCompleteRecordingRef = useRef(false)
  const canSend = draft.text.trim().length > 0 && draft.status !== 'sending' && !transcribing
  const canPolish = draft.text.trim().length > 0 && draft.status !== 'sending' && !transcribing

  useEffect(() => {
    if (!recordingStartedAt) return undefined
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000))))
    }, 220)
    return () => window.clearInterval(timer)
  }, [recordingStartedAt])

  useEffect(() => {
    if (!recording || recordingSeconds < MAX_RECORDING_SECONDS || autoCompleteRecordingRef.current) return
    autoCompleteRecordingRef.current = true
    stopVoiceRecording(true)
  }, [recording, recordingSeconds])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => () => {
    mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const sendInteraction = () => {
    if (!canSend) {
      setError('加一句想说的话，家人更知道怎么回应')
      return
    }
    setError('')
    setDraft((current) => ({ ...current, status: 'sending' }))
    window.setTimeout(() => {
      saveSentInteraction({ ...draft, mode: 'text' })
      window.sessionStorage.removeItem(SESSION_INTERACTION_DRAFT_KEY)
      setDraft((current) => ({ ...current, status: 'success' }))
      navigate('/member/home')
    }, 900)
  }

  const polishText = () => {
    if (!canPolish) return
    setError('')
    setPolishedText(polishDraft(draft.text, polishIndex).slice(0, TEXT_LIMIT))
    setPolishIndex((current) => current + 1)
  }

  const applyTranscribedText = (durationSeconds: number) => {
    setTranscribing(true)
    setPolishedText('')
    setDraft((current) => ({
      ...current,
      mode: 'text',
      text: '',
      voiceDurationSeconds: undefined,
      voiceUrl: undefined,
    }))

    window.setTimeout(() => {
      const asrText = getAsrDraft(durationSeconds).slice(0, TEXT_LIMIT)
      setDraft((current) => ({
        ...current,
        mode: 'text',
        text: asrText,
      }))
      setTranscribing(false)
    }, 900)
  }

  const beginPrototypeRecording = () => {
    setError('')
    autoCompleteRecordingRef.current = false
    setRecordingIsPrototype(true)
    setRecording(true)
    setRecordingSeconds(0)
    recordingStartedAtRef.current = Date.now()
    setRecordingStartedAt(recordingStartedAtRef.current)
  }

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      beginPrototypeRecording()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      voiceChunksRef.current = []
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data)
      }

      setError('')
      setRecordingIsPrototype(false)
      setRecording(true)
      setRecordingSeconds(0)
      autoCompleteRecordingRef.current = false
      recordingStartedAtRef.current = Date.now()
      setRecordingStartedAt(recordingStartedAtRef.current)
      recorder.start()
    } catch {
      beginPrototypeRecording()
    }
  }

  const stopVoiceRecording = (shouldKeep: boolean) => {
    if (recordingIsPrototype) {
      const rawDurationSeconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
      const voiceDurationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
      setRecording(false)
      setRecordingIsPrototype(false)
      setRecordingStartedAt(null)

      if (!shouldKeep) return

      setError('')
      applyTranscribedText(voiceDurationSeconds)
      return
    }

    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== 'recording') {
      setRecording(false)
      setRecordingStartedAt(null)
      return
    }

    recorder.onstop = () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      setRecording(false)
      setRecordingIsPrototype(false)
      setRecordingStartedAt(null)

      if (!shouldKeep) return

      const rawDurationSeconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
      const voiceDurationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
      setError('')
      applyTranscribedText(voiceDurationSeconds)
    }

    recorder.stop()
  }

  return (
    <main className="proto-page proto-page--compose" aria-label="发起互动">
      <header className="proto-topbar-static">
        <button type="button" aria-label="返回互动" onClick={() => navigate('/member/home')}>
          <ArrowLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <h1>发起互动</h1>
        <button className="compose-confirm-button" type="button" disabled={!canSend} onClick={sendInteraction}>
          <PaperPlaneTilt size={14} weight="fill" aria-hidden="true" />
          {draft.status === 'sending' ? '发送中' : '发送'}
        </button>
      </header>

      <section className="compose-photo-card">
        <img className="compose-photo-card__backdrop" src={draft.photoUrl} alt="" aria-hidden="true" />
        <img className="compose-photo-card__image" src={draft.photoUrl} alt={draft.photoAlt} />
      </section>

      <section className="compose-compose-area" aria-label="AI 文案编辑器">
        <div className="compose-ai-heading">
          <span>我想分享</span>
        </div>
        <div className="compose-textarea-label">
          <span className="compose-textarea-shell">
            <textarea
              aria-label="互动文案"
              autoCapitalize="sentences"
              autoComplete="off"
              autoCorrect="off"
              disabled={draft.status === 'sending' || transcribing}
              maxLength={TEXT_LIMIT}
              placeholder="请输入想分享的内容，也可以通过AI润色让已有表达更有温度"
              spellCheck={false}
              value={draft.text}
              onChange={(event) => {
                  setError('')
                  setDraft((current) => ({ ...current, mode: 'text', text: event.target.value.slice(0, TEXT_LIMIT) }))
                }}
              />
            {transcribing ? (
              <span className="compose-transcribing-state" role="status">
                <i aria-hidden="true" />
                正在转录文字
              </span>
            ) : null}
            <button
              className="compose-inline-polish-button"
              type="button"
              disabled={!canPolish}
              onClick={polishText}
            >
              <MagicWand size={14} weight="regular" aria-hidden="true" />
              AI润色
            </button>
            <span className="compose-textarea-tools-right">
              <button
                className="compose-clear-text-button"
                type="button"
                aria-label="清空文案"
                disabled={!draft.text.trim() || draft.status === 'sending' || transcribing}
                onClick={() => {
                  setError('')
                  setDraft((current) => ({ ...current, text: '' }))
                }}
              >
                <TrashSimple size={14} weight="regular" aria-hidden="true" />
              </button>
              <span className="compose-text-counter">{draft.text.length}/{TEXT_LIMIT}</span>
            </span>
          </span>
        </div>
        {polishedText ? (
          <section className="compose-ai-suggestions" aria-label="AI 润色结果">
            <div className="compose-ai-suggestion-list">
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setDraft((current) => ({ ...current, mode: 'text', text: polishedText }))
                  setPolishedText('')
                }}
              >
                <span>AI润色：{polishedText}</span>
                <CaretRight size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : null}
        {error ? <p className="proto-field-error">{error}</p> : null}
      </section>

      <div className="compose-bottom-voice-bar">
        <button type="button" disabled={draft.status === 'sending' || transcribing} onClick={startVoiceRecording}>
          <Microphone size={17} weight="bold" aria-hidden="true" />
          语音输入
        </button>
      </div>

      {recording ? (
        <RecordingDialog
          recordingSeconds={recordingSeconds}
          onCancel={() => stopVoiceRecording(false)}
          onConfirm={() => stopVoiceRecording(true)}
        />
      ) : null}

      {toastMessage ? <div className="home-toast" role="status">{toastMessage}</div> : null}
    </main>
  )
}
