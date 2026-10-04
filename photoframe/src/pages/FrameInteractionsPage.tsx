import { CaretLeft, HandHeart, Play } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { getMockInteractionThreads, getMockMembers } from '../mock'
import type { FamilyMember, InteractionThread } from '../types'

const SESSION_INTERACTIONS_KEY = 'shiguangxu:sent-interactions'

type VoicePlaybackState = {
  id: string
  durationSeconds: number
  remainingSeconds: number
}

function getSessionInteractionThreads(): InteractionThread[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_INTERACTIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as InteractionThread[]
  } catch {
    return []
  }
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date('2026-05-27T10:20:00+08:00')
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000)

  if (diffDays === 0) return time
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays === 2) return `前天 ${time}`
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}

function InteractionCard({
  currentMemberId,
  members,
  onOpen,
  onToggleVoice,
  playingVoice,
  thread,
}: {
  currentMemberId: string
  members: FamilyMember[]
  onOpen: (threadId: string) => void
  onToggleVoice: (voiceId: string, durationSeconds?: number) => void
  playingVoice: VoicePlaybackState | null
  thread: InteractionThread
}) {
  const latestResponse = [...thread.responses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const latestVoice = latestResponse?.method === 'voice' && latestResponse.durationSeconds ? latestResponse : undefined
  const latestReplyText = latestVoice ? '发来一段语音回应' : latestResponse?.content?.trim()
  const latestAuthorId = latestResponse?.authorId || thread.senderId
  const latestReplyAuthor = latestAuthorId === currentMemberId ? '我' : members.find((member) => member.id === latestAuthorId)?.name || latestResponse?.authorName || thread.senderName
  const isPlaying = latestVoice ? playingVoice?.id === latestVoice.id : false

  return (
    <article
      className="home-message-row"
      aria-label={thread.title}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(thread.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(thread.id)
        }
      }}
    >
      <div className="home-message-row__photo">
        <img src={thread.photoUrl} alt={thread.photoAlt} />
        {thread.unread ? <span className="home-message-row__unread-dot" aria-label="有新回应" /> : null}
      </div>
      <div className="home-message-row__content">
        <div className="home-message-row__topline">
          <h3>{latestReplyAuthor}</h3>
          <time>{formatRelativeTime(thread.latestAt)}</time>
        </div>
        <p>{latestReplyText || thread.latestSnippet}</p>
        {latestVoice ? (
          <button
            className={isPlaying ? 'home-voice-pill home-voice-pill--playing' : 'home-voice-pill'}
            type="button"
            aria-label={isPlaying ? `暂停语音回应 ${latestVoice.durationSeconds} 秒` : `播放语音回应 ${latestVoice.durationSeconds} 秒`}
            aria-pressed={isPlaying}
            onClick={(event) => {
              event.stopPropagation()
              onToggleVoice(latestVoice.id, latestVoice.durationSeconds)
            }}
          >
            <span className="home-voice-pill__icon" aria-hidden="true">
              {isPlaying ? (
                <i className="home-voice-wave">
                  <b />
                  <b />
                  <b />
                </i>
              ) : (
                <Play size={11} weight="fill" aria-hidden="true" />
              )}
            </span>
            <span className="home-voice-pill__time">
              {isPlaying ? `${String(playingVoice?.remainingSeconds || latestVoice.durationSeconds).padStart(2, '0')}”` : `${latestVoice.durationSeconds}”`}
            </span>
          </button>
        ) : null}
      </div>
    </article>
  )
}

function HomeEmptyState({ title }: { title: string }) {
  return (
    <section className="home-empty-state" aria-label={title}>
      <span className="home-empty-state__icon" aria-hidden="true">
        <HandHeart size={25} weight="duotone" />
      </span>
      <h2>{title}</h2>
    </section>
  )
}

export function FrameInteractionsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [playingVoice, setPlayingVoice] = useState<VoicePlaybackState | null>(null)
  const [topbarPinned, setTopbarPinned] = useState(false)
  const pageInnerRef = useRef<HTMLDivElement>(null)

  const members = getMockMembers()
  const [sessionInteractionThreads, setSessionInteractionThreads] = useState<InteractionThread[]>(() => getSessionInteractionThreads())
  const emptyPreview = searchParams.get('empty')
  const interactionThreads = emptyPreview === 'interaction' || emptyPreview === 'all'
    ? []
    : [...sessionInteractionThreads, ...getMockInteractionThreads()]
  const currentMemberId = 'member-child-yu'

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

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(timer)
  }, [])

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

  useEffect(() => {
    const refreshSessionThreads = () => setSessionInteractionThreads(getSessionInteractionThreads())
    window.addEventListener('focus', refreshSessionThreads)
    window.addEventListener('shiguangxu:interaction-sent', refreshSessionThreads)
    return () => {
      window.removeEventListener('focus', refreshSessionThreads)
      window.removeEventListener('shiguangxu:interaction-sent', refreshSessionThreads)
    }
  }, [])

  useEffect(() => {
    if (loading) {
      setTopbarPinned(false)
      return undefined
    }

    const scrollContainer = pageInnerRef.current
    if (!scrollContainer) return undefined

    const updateTopbarState = () => {
      setTopbarPinned(scrollContainer.scrollTop > 8)
    }

    updateTopbarState()
    scrollContainer.addEventListener('scroll', updateTopbarState, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', updateTopbarState)
    }
  }, [loading])

  return (
    <div className="home-app-shell frame-family-shell">
      <main className="home-page frame-family-page" aria-label="相框端家庭互动">
        <div className="home-page__inner home-page__inner--no-bottom-nav frame-family-page__inner" ref={pageInnerRef}>
          <header className={topbarPinned ? 'home-topbar home-topbar--fixed home-topbar--pinned frame-family-topbar' : 'home-topbar home-topbar--fixed frame-family-topbar'}>
            <button className="home-icon-button home-icon-button--left" type="button" aria-label="返回相框" onClick={() => navigate(withScenario('/frame'))}>
              <CaretLeft size={21} weight="bold" aria-hidden="true" />
            </button>
            <h1 className="home-topbar__title">家庭互动</h1>
            <span className="home-topbar__spacer" aria-hidden="true" />
          </header>

          {loading ? (
            <section className="home-content-stack home-skeleton-stack" aria-label="正在加载家庭互动">
              <div className="home-skeleton-card" />
              <div className="home-skeleton-card" />
            </section>
          ) : (
            <section className="home-content-stack" aria-label="家庭互动内容">
              <section className="home-list-section" aria-label="最新互动">
                {interactionThreads.length > 0 ? (
                  <div className="home-message-list" role="list">
                    {interactionThreads.map((thread) => (
                      <InteractionCard
                        currentMemberId={currentMemberId}
                        members={members}
                        playingVoice={playingVoice}
                        thread={thread}
                        key={thread.id}
                        onOpen={(threadId) => navigate(withScenario(`/frame/interactions/${threadId}`))}
                        onToggleVoice={toggleVoicePlayback}
                      />
                    ))}
                  </div>
                ) : (
                  <HomeEmptyState title="暂无互动" />
                )}
              </section>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
