import { Play, X } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { FrameElderReplyPanel } from '../components/FrameElderReplyPanel'
import { getMockInteractionThreadById, getMockInteractionThreads } from '../mock'
import type { InteractionResponse } from '../types'
import { getMemberAvatarSrcByName } from '../utils/familyAvatars'

type FrameInteractionLetterModalProps = {
  threadId?: string
  threadIds?: string[]
  onClose: () => void
  onSelectThread: (threadId: string) => void
}

export function FrameInteractionLetterModal({
  threadId,
  threadIds,
  onClose,
  onSelectThread,
}: FrameInteractionLetterModalProps) {
  const thread = getMockInteractionThreadById(threadId || '') ?? getMockInteractionThreads()[0]
  const allThreads = getMockInteractionThreads()
  const threads = threadIds?.length
    ? threadIds
        .map((itemId) => allThreads.find((item) => item.id === itemId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : allThreads
  const currentIndex = threads.findIndex((item) => item.id === thread.id)
  const previousThread = currentIndex > 0
    ? threads[currentIndex - 1]
    : threadIds?.length && threads.length > 1
      ? threads[threads.length - 1]
      : undefined
  const nextThread = currentIndex >= 0 && currentIndex < threads.length - 1
    ? threads[currentIndex + 1]
    : threadIds?.length && threads.length > 1
      ? threads[0]
      : undefined
  const [photoOrientation, setPhotoOrientation] = useState<'landscape' | 'portrait' | 'square'>('landscape')
  const [playingVoice, setPlayingVoice] = useState<{ id: string; durationSeconds: number; remainingSeconds: number } | null>(null)

  const timeline = useMemo<InteractionResponse[]>(
    () => [...thread.responses].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [thread.responses],
  )
  const initialVoiceDurationSeconds = thread.initialMethod === 'voice' ? timeline.find((response) => response.authorId === thread.senderId && response.method === 'voice')?.durationSeconds : undefined
  const initialPreviewText = thread.initialContent.trim() || thread.latestSnippet.trim() || '家人发来一段语音，点开听听家人的声音。'
  const senderAvatarSrc = getMemberAvatarSrcByName(thread.senderName)

  useEffect(() => {
    setPhotoOrientation('landscape')
    setPlayingVoice(null)
  }, [thread.id])


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
    if (playingVoice?.id === voiceId) return `${String(playingVoice.remainingSeconds).padStart(2, '0')}”`
    return durationSeconds ? `${durationSeconds}”` : ''
  }


  return (
    <div className="home-app-shell frame-family-shell frame-letter-modal-shell" onClick={onClose}>
      <main className="home-page frame-letter-page" aria-label="相框端拆信阅读">
        <img
          className="frame-letter-page__backdrop-photo"
          src={thread.photoUrl}
          alt=""
          aria-hidden="true"
          onClick={onClose}
        />
        <section className="frame-letter-layout" onClick={(event) => event.stopPropagation()}>
          <button className="frame-letter-close" type="button" aria-label="关闭来信" onClick={onClose}>
            <X size={30} weight="bold" aria-hidden="true" />
          </button>

          <article className="frame-letter-sheet" aria-label={`${thread.senderName}发来的信`}>
            <div className="frame-letter-visual">
              <figure className={`frame-letter-photo frame-letter-photo--${photoOrientation}`} aria-label={thread.photoAlt}>
                <img className="frame-letter-photo__backdrop" src={thread.photoUrl} alt="" aria-hidden="true" />
                <img
                  className="frame-letter-photo__image"
                  src={thread.photoUrl}
                  alt={thread.photoAlt}
                  onLoad={(event) => {
                    const image = event.currentTarget
                    const ratio = image.naturalWidth / image.naturalHeight
                    setPhotoOrientation(ratio > 1.12 ? 'landscape' : ratio < 0.88 ? 'portrait' : 'square')
                  }}
                />
              </figure>

              <section className="frame-home__interaction-card frame-letter-message-card" aria-label="来信内容">
                <span className="frame-home__interaction-source">
                  <span className={senderAvatarSrc ? 'frame-home__interaction-avatar frame-home__interaction-avatar--image' : 'frame-home__interaction-avatar'} aria-hidden="true">
                    {senderAvatarSrc ? <img src={senderAvatarSrc} alt="" draggable={false} /> : thread.senderName.slice(-1)}
                  </span>
                  <strong>{thread.senderName}</strong>
                </span>
                {thread.initialMethod === 'voice' ? (
                  <>
                    <button
                      className={playingVoice?.id === `initial-${thread.id}` ? 'frame-home__interaction-voice frame-home__interaction-voice--playing' : 'frame-home__interaction-voice'}
                      type="button"
                      aria-label={playingVoice?.id === `initial-${thread.id}` ? `停止来信语音 ${playingVoice.remainingSeconds} 秒` : `播放来信语音 ${initialVoiceDurationSeconds || ''} 秒`}
                      aria-pressed={playingVoice?.id === `initial-${thread.id}`}
                      onClick={() => toggleVoicePlayback(`initial-${thread.id}`, initialVoiceDurationSeconds)}
                    >
                      <span className="frame-home__interaction-voice-icon" aria-hidden="true">
                        {renderVoiceIcon(playingVoice?.id === `initial-${thread.id}`)}
                      </span>
                      <strong>{renderVoiceLabel(`initial-${thread.id}`, initialVoiceDurationSeconds)}</strong>
                    </button>
                    <span className="frame-home__interaction-copy">{initialPreviewText}</span>
                  </>
                ) : (
                  <span className="frame-home__interaction-copy">{initialPreviewText}</span>
                )}
              </section>
            </div>
          </article>

          <div className="frame-letter-reply-stack">
            <FrameElderReplyPanel className="frame-letter-reply-panel" scene="family" />
          </div>

          {previousThread ? (
            <aside className="frame-letter-side-action frame-letter-side-action--previous" aria-label="上一封来信">
              <button
                className="frame-letter-side-next-button"
                type="button"
                aria-label={`查看上一封，${previousThread.senderName}发来的信`}
                onClick={() => onSelectThread(previousThread.id)}
              >
                上一封
              </button>
            </aside>
          ) : null}

          {nextThread ? (
            <aside className="frame-letter-side-action frame-letter-side-action--next" aria-label="下一封来信">
              <button
                className="frame-letter-side-next-button"
                type="button"
                aria-label={`查看下一封，${nextThread.senderName}发来的信`}
                onClick={() => onSelectThread(nextThread.id)}
              >
                下一封
              </button>
            </aside>
          ) : null}
        </section>
      </main>
    </div>
  )
}

export function FrameInteractionLetterPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <FrameInteractionLetterModal
      threadId={id}
      onClose={() => navigate(withScenario('/frame'))}
      onSelectThread={(threadId) => navigate(withScenario(`/frame/interactions/${threadId}/letter`))}
    />
  )
}
