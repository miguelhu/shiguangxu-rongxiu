import { CaretLeft, MagicWand, Microphone, Play, X } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS, RecordingDialog } from '../components/RecordingDialog'
import { getActiveScenarioId } from '../content/scenarioStore'
import { getMockInteractionThreadById, getMockInteractionThreads, getMockMembers } from '../mock'
import type { FamilyMember, InteractionResponse, InteractionThread } from '../types'
import { getMemberAvatarSrc } from '../utils/familyAvatars'

const AMA_PDF_RESPONSE_THREAD_IDS = new Set(['thread-008', 'thread-013', 'thread-018'])

function polishReplyText(text: string) {
  const normalized = text.trim()
  if (!normalized) return ''
  return normalized.length > 46
    ? `${normalized.slice(0, 44)}，我也很想听听你看到后想起了什么。`
    : `${normalized}，我也很想听听你看到后想起了什么。`
}

const DETAIL_EXTRA_THREADS: InteractionThread[] = [
  {
    id: 'home-thread-009',
    title: '晚饭后的散步',
    photoUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
    photoAlt: '傍晚一家人在公园小路散步',
    photoLabel: '公园散步',
    photoMeta: '4月28日',
    photoTone: 'moss',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，我们晚饭后出来散步，路边的花开得很好。',
    initialMethod: 'text',
    latestSnippet: '天暖了，多出来走走是好事',
    latestAt: '2026-04-28T19:42:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-009-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '外婆，我们晚饭后出来散步，路边的花开得很好。',
        createdAt: '2026-04-28T19:12:00+08:00',
      },
      {
        id: 'home-response-009-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'voice',
        content: '天暖了，多出来走走是好事。',
        createdAt: '2026-04-28T19:42:00+08:00',
        durationSeconds: 11,
      },
    ],
  },
  {
    id: 'home-thread-010',
    title: '阳光下晒被子',
    photoUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=82',
    photoAlt: '家人在阳光下整理家务',
    photoLabel: '晒被子',
    photoMeta: '4月21日',
    photoTone: 'peach',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，今天太阳特别好，我们把被子都拿出来晒了。',
    initialMethod: 'ai_generated',
    latestSnippet: '晒过太阳的被子睡着最舒服',
    latestAt: '2026-04-21T16:20:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-010-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'ai_generated',
        content: '妈，今天太阳特别好，我们把被子都拿出来晒了。',
        createdAt: '2026-04-21T15:48:00+08:00',
      },
      {
        id: 'home-response-010-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'text',
        content: '晒过太阳的被子睡着最舒服。',
        createdAt: '2026-04-21T16:20:00+08:00',
      },
    ],
  },
]

function formatDetailTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date('2026-05-27T10:20:00+08:00')
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000)

  if (diffDays === 0) return `今天 ${time}`
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays === 2) return `前天 ${time}`
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}

function getSenderLabel(member?: FamilyMember, fallbackName?: string) {
  return member?.avatar || member?.name.slice(0, 1) || fallbackName?.slice(0, 1) || ''
}

function getReplyAsrText(durationSeconds: number) {
  if (durationSeconds >= 8) {
    return '我看到这张照片也想起很多以前的事，等你有空的时候，我们再慢慢聊。'
  }
  return '我看到这张照片也想起你了，等你有空我们再聊聊。'
}

export function InteractionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const members = getMockMembers()
  const thread = getMockInteractionThreadById(id || '') ?? DETAIL_EXTRA_THREADS.find((item) => item.id === id) ?? getMockInteractionThreads()[0]
  const usesAmaPdfResponses = getActiveScenarioId() === 'ama-letter' && AMA_PDF_RESPONSE_THREAD_IDS.has(thread.id)
  const [localResponses, setLocalResponses] = useState<InteractionResponse[]>([])
  const [replyText, setReplyText] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordingIsPrototype, setRecordingIsPrototype] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [photoOrientation, setPhotoOrientation] = useState<'landscape' | 'portrait' | 'square'>('landscape')
  const [polishedReplyText, setPolishedReplyText] = useState('')
  const [playingVoice, setPlayingVoice] = useState<{ id: string; durationSeconds: number; remainingSeconds: number } | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const voiceChunksRef = useRef<BlobPart[]>([])
  const recordingStartedAtRef = useRef(0)
  const autoCompleteRecordingRef = useRef(false)
  const timeline = useMemo<InteractionResponse[]>(
    () => [...thread.responses, ...localResponses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [localResponses, thread.responses],
  )
  const replyTimeline = useMemo(
    () =>
      timeline
        .filter((response, index) => {
          if (index !== 0) return true
          if (response.authorId !== thread.senderId) return true
          if (thread.initialMethod === 'voice' && response.method === 'voice') return false
          return response.content.trim() !== thread.initialContent.trim()
        })
        .sort((a, b) => usesAmaPdfResponses
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [thread.initialContent, thread.initialMethod, thread.senderId, timeline, usesAmaPdfResponses],
  )
  const canSend = replyText.trim().length > 0 && !transcribing
  const canPolishReply = replyText.trim().length > 0 && !transcribing
  const firstResponseTime = timeline[0]?.createdAt || thread.latestAt
  const initialVoiceDurationSeconds = thread.initialMethod === 'voice' ? timeline.find((response) => response.authorId === thread.senderId && response.method === 'voice')?.durationSeconds : undefined

  useEffect(() => {
    setLocalResponses([])
    setReplyText('')
    setTranscribing(false)
    setPhotoOrientation('landscape')
    setPolishedReplyText('')
    setPlayingVoice(null)
    setToastMessage('')
  }, [id])

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

  useEffect(() => {
    if (!playingVoice) return undefined
    const timer = window.setInterval(() => {
      setPlayingVoice((current) => {
        if (!current) return null
        const nextRemaining = current.remainingSeconds - 1
        return nextRemaining > 0 ? { ...current, remainingSeconds: nextRemaining } : null
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [playingVoice?.id])

  useEffect(() => () => {
    mediaRecorderRef.current?.state === 'recording' && mediaRecorderRef.current.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const beginPrototypeRecording = () => {
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

  const applyTranscribedReply = (durationSeconds: number) => {
    setTranscribing(true)
    setReplyText('')
    setPolishedReplyText('')
    window.setTimeout(() => {
      setReplyText(getReplyAsrText(durationSeconds))
      setTranscribing(false)
    }, 900)
  }

  const stopVoiceRecording = (shouldKeep: boolean) => {
    if (recordingIsPrototype) {
      const rawDurationSeconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
      const durationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
      setRecording(false)
      setRecordingIsPrototype(false)
      setRecordingStartedAt(null)

      if (shouldKeep) {
        applyTranscribedReply(durationSeconds)
      }
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
      const durationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
      applyTranscribedReply(durationSeconds)
    }

    recorder.stop()
  }

  const sendReply = () => {
    if (!canSend) return
    const now = new Date().toISOString()
    setLocalResponses((current) => [
      ...current,
      {
        id: `local-response-${Date.now()}`,
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: replyText.trim(),
        createdAt: now,
      },
    ])
    setReplyText('')
    setPolishedReplyText('')
  }

  const renderAvatar = (authorId: string, authorName: string) => {
    const member = members.find((item) => item.id === authorId)
    const avatarSrc = getMemberAvatarSrc(member?.id || authorId)
    const label = getSenderLabel(member, authorName)
    return (
      <span className={avatarSrc ? 'thread-avatar thread-avatar--image' : 'thread-avatar'} aria-label={`${member?.name || authorName}的头像`}>
        {avatarSrc ? <img src={avatarSrc} alt="" draggable={false} /> : <span>{label}</span>}
      </span>
    )
  }

  const renderVoiceIcon = (isPlaying: boolean) =>
    isPlaying ? (
      <i className="home-voice-wave">
        <b />
        <b />
        <b />
      </i>
    ) : (
      <Play size={10} weight="fill" />
    )

  const toggleVoicePlayback = (voiceId: string, durationSeconds?: number) => {
    const normalizedDuration = Math.max(1, durationSeconds || 1)
    setPlayingVoice((current) =>
      current?.id === voiceId
        ? null
        : {
            id: voiceId,
            durationSeconds: normalizedDuration,
            remainingSeconds: normalizedDuration,
          },
    )
  }

  const renderVoiceLabel = (voiceId: string, durationSeconds?: number) => {
    if (playingVoice?.id === voiceId) {
      return `${String(playingVoice.remainingSeconds).padStart(2, '0')}”`
    }
    return durationSeconds ? `${durationSeconds}”` : ''
  }

  return (
    <main className="proto-page proto-page--thread" aria-label="互动线程详情">
      <header className="proto-topbar-static thread-topbar">
        <button type="button" aria-label="返回互动" onClick={() => navigate('/member/home')}>
          <CaretLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <h1>互动详情</h1>
        <span className="proto-topbar-static__spacer" aria-hidden="true" />
      </header>

      <section className="thread-dialog-area" aria-label="互动详情">
        <article className="thread-memory-post" aria-label="互动主线">
          <div className="thread-memory-post__meta">
            {renderAvatar(thread.senderId, thread.senderName)}
            <div className="thread-memory-post__meta-main">
              <strong>{thread.senderName}</strong>
              <time dateTime={firstResponseTime}>{formatDetailTime(firstResponseTime)}</time>
            </div>
          </div>
          <figure className="thread-memory-post__film-card">
            <figure className={`thread-photo-message thread-photo-message--post thread-photo-message--${photoOrientation}`} aria-label={thread.photoAlt}>
              <img className="thread-photo-message__backdrop" src={thread.photoUrl} alt="" aria-hidden="true" />
              <img
                className="thread-photo-message__image"
                src={thread.photoUrl}
                alt={thread.photoAlt}
                onLoad={(event) => {
                  const image = event.currentTarget
                  const ratio = image.naturalWidth / image.naturalHeight
                  setPhotoOrientation(ratio > 1.12 ? 'landscape' : ratio < 0.88 ? 'portrait' : 'square')
                }}
              />
            </figure>
            <figcaption className="thread-memory-post__content-body">
              {thread.initialMethod === 'voice' ? (
                <button
                  className={playingVoice?.id === `initial-${thread.id}` ? 'thread-voice-message thread-voice-message--playing thread-memory-post__voice' : 'thread-voice-message thread-memory-post__voice'}
                  type="button"
                  aria-label={playingVoice?.id === `initial-${thread.id}` ? `停止发起语音 ${playingVoice.remainingSeconds} 秒` : `播放发起语音 ${initialVoiceDurationSeconds || ''} 秒`}
                  aria-pressed={playingVoice?.id === `initial-${thread.id}`}
                  onClick={() => toggleVoicePlayback(`initial-${thread.id}`, initialVoiceDurationSeconds)}
                >
                  <span className="thread-voice-message__icon" aria-hidden="true">
                    {renderVoiceIcon(playingVoice?.id === `initial-${thread.id}`)}
                  </span>
                  <span className="thread-voice-message__time">{renderVoiceLabel(`initial-${thread.id}`, initialVoiceDurationSeconds)}</span>
                </button>
              ) : (
                <p>{thread.initialContent}</p>
              )}
            </figcaption>
          </figure>
        </article>

        <div className="thread-comment-list" aria-label="互动回复">
          {replyTimeline.map((response) => {
            const isVoice = response.method === 'voice'
            const author = members.find((member) => member.id === response.authorId)
            return (
              <article className="thread-comment" key={response.id}>
                <span className="thread-comment__avatar-wrap">
                  {renderAvatar(response.authorId, response.authorName)}
                  {response.unread ? <i aria-label="未读回复" /> : null}
                </span>
                <div className="thread-comment__body">
                  <div className="thread-comment__meta">
                    <strong>{author?.name || response.authorName}</strong>
                    <span className="thread-comment__time">
                      <time dateTime={response.createdAt}>{formatDetailTime(response.createdAt)}</time>
                    </span>
                  </div>
                  {isVoice ? (
                    <button
                      className={playingVoice?.id === response.id ? 'thread-voice-message thread-voice-message--playing' : 'thread-voice-message'}
                      type="button"
                      aria-label={playingVoice?.id === response.id ? `停止语音回应 ${playingVoice.remainingSeconds} 秒` : `播放语音回应 ${response.durationSeconds} 秒`}
                      aria-pressed={playingVoice?.id === response.id}
                      onClick={() => toggleVoicePlayback(response.id, response.durationSeconds)}
                    >
                      <span className="thread-voice-message__icon" aria-hidden="true">
                        {renderVoiceIcon(playingVoice?.id === response.id)}
                      </span>
                      <span className="thread-voice-message__time">{renderVoiceLabel(response.id, response.durationSeconds)}</span>
                    </button>
                  ) : (
                    <p>{response.content}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="thread-reply-panel" aria-label="回应">
        <div className="thread-reply-tools" aria-label="回应辅助操作">
          <button
            className="thread-reply-tool-button thread-reply-tool-button--primary"
            type="button"
            disabled={transcribing}
            onClick={startVoiceRecording}
          >
            <Microphone size={14} weight="bold" aria-hidden="true" />
            发语音
          </button>
          <button
            className="thread-reply-tool-button"
            type="button"
            disabled={!canPolishReply}
            onClick={() => setPolishedReplyText(polishReplyText(replyText))}
          >
            <MagicWand size={14} weight="regular" aria-hidden="true" />
            AI润色
          </button>
        </div>
        <div className="thread-input-row">
          <input
            value={replyText}
            disabled={transcribing}
            enterKeyHint="send"
            placeholder={transcribing ? '' : '请输入想回复的内容'}
            onChange={(event) => setReplyText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                sendReply()
              }
            }}
          />
          {transcribing ? (
            <span className="thread-transcribing-state" role="status">
              <i aria-hidden="true" />
              正在转录文字
            </span>
          ) : null}
          <button className="thread-send-button" type="button" aria-label="发送回应" disabled={!canSend} onClick={sendReply}>
            发送
          </button>
        </div>
      </section>

      {polishedReplyText ? (
        <div className="home-dialog-backdrop" role="presentation" onClick={() => setPolishedReplyText('')}>
          <section
            className="thread-polish-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="thread-polish-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="settings-dialog__header">
              <span aria-hidden="true" />
              <h2 id="thread-polish-dialog-title">AI润色</h2>
              <button className="settings-dialog__close" type="button" aria-label="关闭弹窗" onClick={() => setPolishedReplyText('')}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="thread-polish-dialog__body">
              <p>{polishedReplyText}</p>
            </div>
            <div className="thread-polish-dialog__actions">
              <button
                type="button"
                onClick={() => {
                  setReplyText(polishedReplyText)
                  setPolishedReplyText('')
                }}
              >
                应用
              </button>
            </div>
          </section>
        </div>
      ) : null}

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
