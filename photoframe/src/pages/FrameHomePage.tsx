import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  GearSix,
  Play,
  Sun,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveScenarioId } from '../content/scenarioStore'
import { getMockFrameDeviceStatus, getMockGalleryPhotos, getMockInteractionThreads } from '../mock'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { FrameSosDialog } from '../components/FrameSosDialog'
import { warmupFrameAiTts } from '../services/frameAiClient'
import type { GalleryPhoto, InteractionThread } from '../types'
import { getMemberAvatarSrcByName } from '../utils/familyAvatars'
import { getFrameVariant, withFrameVariant } from '../utils/frameVariant'

const FrameInteractionLetterModal = lazy(() =>
  import('./FrameInteractionLetterPage').then((module) => ({ default: module.FrameInteractionLetterModal })),
)

function formatClock() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date('2026-05-27T10:20:00+08:00'))
}

const FRAME_NOW = new Date('2026-05-27T10:20:00+08:00')

function formatDate() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(FRAME_NOW)
}

function formatWeekday() {
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
  }).format(FRAME_NOW)
}

type FrameRuntimeState = 'idle' | 'menu'

const PHOTO_ROTATION_MS = 10000
const SWIPE_THRESHOLD_PX = 64
const MENU_IDLE_TIMEOUT_MS = 10000
const FRAME_PHOTO_FALLBACK_URL = '/perf/frame/chinese-elder-background-photo-v1.jpg'
const FRAME_INBOX_ENVELOPE_URL = '/perf/frame/elder-message-envelope-front-rect-balanced.png'
const FRAME_AI_AVATAR_URL = '/perf/frame/xiaoxu-perch.png'
const FRAME_EXPLORE_ICON_URL = '/perf/frame/frame-home-icon-explore-compass-v1.png'
const FRAME_AI_TTS_WARMUP_KEY = 'frame-ai-tts-warmup-at'
const FRAME_AI_TTS_WARMUP_RETRY_KEY = 'frame-ai-tts-warmup-retry-at'
const FRAME_AI_TTS_WARMUP_INTERVAL_MS = 30 * 60 * 1000
const FRAME_AI_TTS_WARMUP_RETRY_INTERVAL_MS = 60 * 1000
const FRAME_AI_TTS_VOICE_ID = 'zh_female_peiqi_uranus_bigtts'
const FRAME_HOME_DOCK_ICONS = {
  family: '/perf/frame/frame-home-icon-family-v5.png',
  river: '/perf/frame/frame-home-icon-river-hourglass-v4.png',
  study: '/perf/frame/frame-home-icon-study-v5.png',
  square: '/perf/frame/frame-home-icon-square-plaza-v4.png',
  health: '/perf/frame/frame-home-icon-health-safety-v1.png',
  sos: '/perf/frame/frame-home-icon-sos-help-bell-v1.png',
  checkin: '/perf/frame/frame-home-icon-checkin-v1.png',
} as const

const DEFAULT_PHOTO_INTERACTION_MAP: Record<string, string> = {
  'gallery-001': 'thread-001',
  'gallery-002': 'thread-002',
  'gallery-003': 'thread-003',
}

const AMA_PHOTO_INTERACTION_MAP: Record<string, string> = {
  'interaction-gallery-001': 'thread-001',
  'interaction-gallery-002': 'thread-002',
  'interaction-gallery-003': 'thread-003',
  'interaction-gallery-004': 'thread-004',
  'interaction-gallery-005': 'thread-005',
  'interaction-gallery-006': 'thread-006',
  'interaction-gallery-007': 'thread-007',
  'interaction-gallery-008': 'thread-008',
  'interaction-gallery-009': 'thread-009',
  'interaction-gallery-010': 'thread-010',
  'interaction-gallery-011': 'thread-011',
  'interaction-gallery-012': 'thread-012',
  'interaction-gallery-013': 'thread-013',
  'interaction-gallery-014': 'thread-014',
  'interaction-gallery-015': 'thread-015',
  'interaction-gallery-016': 'thread-016',
  'interaction-gallery-017': 'thread-017',
  'interaction-gallery-018': 'thread-018',
  'interaction-gallery-019': 'thread-019',
}

const TEACHER_PHOTO_INTERACTION_MAP: Record<string, string> = {
  'teacher-photo-01': 'teacher-thread-1',
  'teacher-photo-02': 'teacher-thread-2',
  'teacher-photo-03': 'teacher-thread-3',
  'teacher-photo-04': 'teacher-thread-4',
  'teacher-photo-05': 'teacher-thread-5',
}

function getFrameSosContactName(isAmaScenario: boolean) {
  return isAmaScenario ? '晓伟' : '知夏'
}

const AMA_HOME_LETTER_THREAD_IDS = ['thread-017', 'thread-018', 'thread-008', 'thread-013', 'thread-019']

const AMA_HOME_PHOTO_SEQUENCE = [
  'interaction-gallery-017',
  'interaction-gallery-018',
  'gallery-109',
  'gallery-110',
  'interaction-gallery-008',
  'interaction-gallery-013',
  'gallery-111',
  'interaction-gallery-019',
  'gallery-104',
  'interaction-gallery-012',
  'gallery-101',
  'interaction-gallery-006',
  'gallery-105',
  'interaction-gallery-004',
  'interaction-gallery-010',
  'gallery-108',
  'interaction-gallery-014',
  'gallery-106',
  'gallery-103',
  'gallery-107',
  'interaction-gallery-015',
  'interaction-gallery-002',
  'interaction-gallery-005',
  'interaction-gallery-001',
]

const AMA_HOME_EXCLUDED_PHOTO_IDS = new Set([
  'interaction-gallery-003',
  'interaction-gallery-007',
  'interaction-gallery-016',
])

type WeatherTone = {
  Icon: Icon
  color: string
  label: string
}

function getWeatherTone(weatherLabel: string): WeatherTone {
  if (/雷|暴雨|雷阵雨/.test(weatherLabel)) {
    return { Icon: CloudLightning, color: '#d5b7ff', label: '雷雨' }
  }
  if (/雪|冰|冻雨/.test(weatherLabel)) {
    return { Icon: CloudSnow, color: '#ccecff', label: '雪' }
  }
  if (/雨|阵雨|小雨|中雨|大雨/.test(weatherLabel)) {
    return { Icon: CloudRain, color: '#9fd0ff', label: '雨' }
  }
  if (/雾|霾|沙尘/.test(weatherLabel)) {
    return { Icon: CloudFog, color: '#d4d5d0', label: '雾' }
  }
  if (/阴/.test(weatherLabel)) {
    return { Icon: Cloud, color: '#c8d0dc', label: '阴' }
  }
  if (/多云|少云|晴间多云/.test(weatherLabel)) {
    return { Icon: CloudSun, color: '#f8cc63', label: '多云' }
  }
  if (/晴/.test(weatherLabel)) {
    return { Icon: Sun, color: '#ffd15c', label: '晴' }
  }
  return { Icon: CloudSun, color: '#f8cc63', label: '天气' }
}

function getWeatherCity(weatherLabel: string) {
  return weatherLabel
    .replace(/雷阵雨|晴间多云|多云|少云|阵雨|小雨|中雨|大雨|暴雨|雷雨|晴|阴|雨|雪|雾|霾|沙尘|冰|冻雨/g, '')
    .trim() || '苏州'
}

function getDemoState(value: string | null): FrameRuntimeState {
  if (value === 'menu') return value
  return 'idle'
}

function getHomeRuntimeState(searchParams: URLSearchParams): FrameRuntimeState {
  if (searchParams.get('menu') === '1') return 'menu'
  return getDemoState(searchParams.get('demo'))
}

function getPhotoInteraction(photo: GalleryPhoto | undefined, threads: InteractionThread[]) {
  if (!photo) return undefined

  const scenario = getActiveScenarioId()
  const map = scenario === 'ama-letter'
    ? AMA_PHOTO_INTERACTION_MAP
    : scenario === 'teacher-retirement'
      ? TEACHER_PHOTO_INTERACTION_MAP
      : DEFAULT_PHOTO_INTERACTION_MAP
  const mappedThreadId = map[photo.id]
  return threads.find((thread) => thread.id === mappedThreadId)
}

function getThreadPreviewText(thread: InteractionThread) {
  if (thread.initialContent.trim()) return thread.initialContent
  if (thread.latestSnippet.trim()) return thread.latestSnippet
  return '家人发来了一段语音，点开可以听完整内容。'
}

function getThreadVoiceLabel(thread: InteractionThread) {
  const voiceMessage = thread.responses.find((response) => response.method === 'voice' && response.authorId === thread.senderId)
  if (!voiceMessage?.durationSeconds) return null
  return `语音 ${voiceMessage.durationSeconds} 秒`
}

function getThreadVoicePreview(thread: InteractionThread) {
  return thread.responses.find((response) => response.method === 'voice' && response.authorId === thread.senderId && response.durationSeconds)
}

function getAmaHomeLetterThreads(threads: InteractionThread[]) {
  return AMA_HOME_LETTER_THREAD_IDS
    .map((threadId) => threads.find((thread) => thread.id === threadId))
    .filter((thread): thread is InteractionThread => Boolean(thread))
}

function getHomeCarouselPhotos(photos: GalleryPhoto[], isAmaScenario: boolean) {
  if (!isAmaScenario) return photos

  const eligiblePhotos = photos.filter((photo) => !AMA_HOME_EXCLUDED_PHOTO_IDS.has(photo.id))
  const photoById = new Map(eligiblePhotos.map((photo) => [photo.id, photo]))
  const sequencedPhotos = AMA_HOME_PHOTO_SEQUENCE
    .map((photoId) => photoById.get(photoId))
    .filter((photo): photo is GalleryPhoto => Boolean(photo))
  const usedIds = new Set(sequencedPhotos.map((photo) => photo.id))
  return [...sequencedPhotos, ...eligiblePhotos.filter((photo) => !usedIds.has(photo.id))]
}

function getSenderAvatarLabel(senderName: string) {
  return senderName.slice(-1)
}

function renderSenderAvatar(senderName: string) {
  const avatarSrc = getMemberAvatarSrcByName(senderName)
  return (
    <span className={avatarSrc ? 'frame-home__interaction-avatar frame-home__interaction-avatar--image' : 'frame-home__interaction-avatar'} aria-hidden="true">
      {avatarSrc ? <img src={avatarSrc} alt="" draggable={false} /> : getSenderAvatarLabel(senderName)}
    </span>
  )
}

function renderHomeVoiceIcon(isPlaying: boolean) {
  return isPlaying ? (
    <i className="home-voice-wave">
      <b />
      <b />
      <b />
    </i>
  ) : (
    <Play size={13} weight="fill" />
  )
}

export function FrameHomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const runtimeStateParam = `${searchParams.get('demo') || ''}:${searchParams.get('menu') || ''}`
  const frameVariant = getFrameVariant(searchParams)
  const isV1Variant = frameVariant === 'v1'
  const isNewVariant = frameVariant === 'new'
  const isAmaScenario = getActiveScenarioId() === 'ama-letter'
  const isRetirementScenario = getActiveScenarioId() === 'teacher-retirement'
  const [runtimeState, setRuntimeState] = useState<FrameRuntimeState>(() => getHomeRuntimeState(searchParams))
  const device = getMockFrameDeviceStatus()
  const photos = getHomeCarouselPhotos(getMockGalleryPhotos().filter((photo) => photo.isCached), isAmaScenario)
  const threads = getMockInteractionThreads()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [menuActivityKey, setMenuActivityKey] = useState(0)
  const [activeLetterThreadId, setActiveLetterThreadId] = useState<string | null>(null)
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false)
  const [playingHomeVoice, setPlayingHomeVoice] = useState<{ id: string; durationSeconds: number; remainingSeconds: number } | null>(null)
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressTapRef = useRef(false)
  const weatherTone = getWeatherTone(device.weatherLabel)
  const WeatherIcon = weatherTone.Icon
  const weatherCity = getWeatherCity(device.weatherLabel)
  const currentPhoto = photos[photoIndex % photos.length]
  const displayPhoto = photoLoadFailed ? { url: FRAME_PHOTO_FALLBACK_URL, alt: '本地相框兜底照片' } : currentPhoto
  const photoInteraction = getPhotoInteraction(currentPhoto, threads)
  const homePreviewThreads = photoInteraction ? [photoInteraction] : []
  const amaInboxThreads = getAmaHomeLetterThreads(threads)
  const inboxThreads = isAmaScenario ? amaInboxThreads : threads.filter((thread) => thread.unread)
  const firstInboxThread = inboxThreads[0]
  const inboxCount = inboxThreads.length
  const hasInboxInteraction = inboxCount > 0

  const switchPhoto = useCallback((direction: 'next' | 'previous') => {
    setPhotoIndex((current) => {
      if (direction === 'next') return (current + 1) % photos.length
      return (current - 1 + photos.length) % photos.length
    })
  }, [photos.length])

  useEffect(() => {
    if (photos.length <= 1) return

    const timer = window.setTimeout(() => {
      switchPhoto('next')
    }, PHOTO_ROTATION_MS)

    return () => window.clearTimeout(timer)
  }, [photoIndex, photos.length, switchPhoto])

  useEffect(() => {
    setRuntimeState(getHomeRuntimeState(searchParams))
  }, [runtimeStateParam, searchParams])

  useEffect(() => {
    const lastWarmupAt = Number(window.sessionStorage.getItem(FRAME_AI_TTS_WARMUP_KEY) || 0)
    if (Date.now() - lastWarmupAt < FRAME_AI_TTS_WARMUP_INTERVAL_MS) return undefined

    const lastRetryAt = Number(window.sessionStorage.getItem(FRAME_AI_TTS_WARMUP_RETRY_KEY) || 0)
    if (Date.now() - lastRetryAt < FRAME_AI_TTS_WARMUP_RETRY_INTERVAL_MS) return undefined

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(FRAME_AI_TTS_WARMUP_RETRY_KEY, String(Date.now()))
      void warmupFrameAiTts({
        sessionId: `frame-home-warmup-${getActiveScenarioId()}`,
        voiceId: FRAME_AI_TTS_VOICE_ID,
      }).then((isReady) => {
        if (!isReady) return
        window.sessionStorage.setItem(FRAME_AI_TTS_WARMUP_KEY, String(Date.now()))
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    setPhotoLoadFailed(false)
  }, [currentPhoto.url])

  useEffect(() => {
    if (runtimeState !== 'menu') return

    const timer = window.setTimeout(() => {
      setRuntimeState('idle')
    }, MENU_IDLE_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [menuActivityKey, runtimeState])

  useEffect(() => {
    if (!playingHomeVoice) return undefined

    const timer = window.setInterval(() => {
      setPlayingHomeVoice((current) => {
        if (!current) return null
        const nextRemaining = current.remainingSeconds - 1
        return nextRemaining > 0 ? { ...current, remainingSeconds: nextRemaining } : null
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [playingHomeVoice?.id])

  useEffect(() => {
    if (!toastMessage) return undefined

    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const showMenu = runtimeState === 'menu'
  const sosContactName = getFrameSosContactName(isAmaScenario)

  const openHomeLetter = (thread: InteractionThread) => {
    setActiveLetterThreadId(thread.id)
  }

  const toggleHomeLetterVoicePlayback = (thread: InteractionThread) => {
    const voicePreview = getThreadVoicePreview(thread)
    if (!voicePreview?.durationSeconds) return
    const voiceId = `home-${thread.id}-${voicePreview.id}`
    const durationSeconds = Math.max(1, voicePreview.durationSeconds)

    setPlayingHomeVoice((current) =>
      current?.id === voiceId
        ? null
        : {
            id: voiceId,
            durationSeconds,
            remainingSeconds: durationSeconds,
          },
    )
  }

  const triggerSosCall = () => {
    setMenuActivityKey((current) => current + 1)
    setIsSosDialogOpen(true)
  }

  const openAiDiary = () => {
    setMenuActivityKey((current) => current + 1)
    navigate(withFrameVariant('/frame/diary'))
  }

  const renderHomeLetterCard = (thread: InteractionThread) => {
    const previewText = getThreadPreviewText(thread)
    const voiceLabel = getThreadVoiceLabel(thread)
    const voicePreview = getThreadVoicePreview(thread)
    const voiceId = voicePreview ? `home-${thread.id}-${voicePreview.id}` : ''
    const isVoicePlaying = Boolean(voiceId && playingHomeVoice?.id === voiceId)
    const displayedVoiceLabel = isVoicePlaying
      ? `播放中 ${String(playingHomeVoice?.remainingSeconds || 0).padStart(2, '0')} 秒`
      : voiceLabel

    return (
      <div
        key={thread.id}
        className={showMenu ? 'frame-home__interaction-card frame-home__interaction-card--compact' : 'frame-home__interaction-card'}
        role="button"
        tabIndex={0}
        aria-label={`查看${thread.senderName}发来的互动`}
        onClick={() => openHomeLetter(thread)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          openHomeLetter(thread)
        }}
      >
        <span className="frame-home__interaction-source">
          {renderSenderAvatar(thread.senderName)}
          <strong>{thread.senderName}</strong>
        </span>
        <span className="frame-home__interaction-copy">{previewText}</span>
        {voiceLabel ? (
          <button
            className={isVoicePlaying ? 'frame-home__interaction-voice frame-home__interaction-voice--playing' : 'frame-home__interaction-voice'}
            type="button"
            aria-label={isVoicePlaying ? `停止播放${thread.senderName}的语音` : `播放${thread.senderName}的语音`}
            aria-pressed={isVoicePlaying}
            onClick={(event) => {
              event.stopPropagation()
              toggleHomeLetterVoicePlayback(thread)
            }}
          >
            <span className="frame-home__interaction-voice-icon" aria-hidden="true">
              {renderHomeVoiceIcon(isVoicePlaying)}
            </span>
            <strong>{displayedVoiceLabel}</strong>
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <FramePageShell
      className={`${showMenu ? 'frame-home frame-home--menu' : 'frame-home'}${isRetirementScenario ? ' frame-home--retirement' : ''}`}
      mode={mode}
    >
      <button
        className="frame-home__touch-layer"
        type="button"
        aria-label="显示相框菜单，左右滑动切换照片"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          swipeStartRef.current = { x: event.clientX, y: event.clientY }
          suppressTapRef.current = false
          if (runtimeState === 'menu') setMenuActivityKey((current) => current + 1)
        }}
        onPointerUp={(event) => {
          const start = swipeStartRef.current
          swipeStartRef.current = null
          if (!start) return

          const deltaX = event.clientX - start.x
          const deltaY = event.clientY - start.y
          const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY) * 1.4

          if (isHorizontalSwipe) {
            suppressTapRef.current = true
            switchPhoto(deltaX < 0 ? 'next' : 'previous')
          }
        }}
        onPointerCancel={() => {
          swipeStartRef.current = null
        }}
        onClick={() => {
          if (suppressTapRef.current) {
            suppressTapRef.current = false
            return
          }
          if (runtimeState === 'idle') setRuntimeState('menu')
          if (runtimeState === 'menu') setRuntimeState('idle')
        }}
      />
      <img key={`bg-${displayPhoto.url}`} className="frame-home__photo-bg" src={displayPhoto.url} alt="" aria-hidden="true" draggable={false} />
      <img
        key={`photo-${displayPhoto.url}`}
        className="frame-home__photo"
        src={displayPhoto.url}
        alt={displayPhoto.alt}
        draggable={false}
        onError={() => setPhotoLoadFailed(true)}
      />
      <div className="frame-home__shade" />

      {isRetirementScenario ? (
        <div className="frame-home__gift-mark" aria-label="陈老师的荣休礼已经打开">
          <small>拾光叙 · 荣休礼</small>
          <strong>陈老师，这些时光都为您留着。</strong>
          <span>{currentPhoto.title}</span>
        </div>
      ) : null}

      <header className="frame-home__status" aria-label="相框状态">
        {showMenu ? (
          <>
            <div className="frame-home__weather">
              <WeatherIcon
                className="frame-home__weather-icon"
                color={weatherTone.color}
                size={70}
                weight="duotone"
                aria-label={weatherTone.label}
              />
              <span>
                <strong>{device.temperatureCelsius}°C</strong>
                <small>{weatherCity}</small>
              </span>
            </div>
            <div className="frame-home__clock">
              <time>{formatClock()}</time>
              <span className="frame-home__date">
                <span>{formatDate()}</span>
                <span>{formatWeekday()}</span>
              </span>
            </div>
          </>
        ) : null}
        <button
          className={hasInboxInteraction ? 'frame-home__mail-button frame-home__mail-button--unread' : 'frame-home__mail-button'}
          type="button"
          aria-label={`打开来信，${inboxCount}封`}
          onClick={(event) => {
            event.stopPropagation()
            if (firstInboxThread) setActiveLetterThreadId(firstInboxThread.id)
            else navigate(withFrameVariant('/frame/interactions'))
          }}
        >
          <span className="frame-home__mail-ring" aria-hidden="true" />
          <span className="frame-home__mail-aura" aria-hidden="true" />
          <span className="frame-home__mail-aura frame-home__mail-aura--soft" aria-hidden="true" />
          {hasInboxInteraction ? (
            <>
              <span className="frame-home__mail-spark frame-home__mail-spark--one" aria-hidden="true" />
              <span className="frame-home__mail-spark frame-home__mail-spark--two" aria-hidden="true" />
            </>
          ) : null}
          <img className="frame-home__mail-envelope" src={FRAME_INBOX_ENVELOPE_URL} alt="" aria-hidden="true" draggable={false} />
          {hasInboxInteraction ? <span className="frame-home__mail-count">{inboxCount}</span> : null}
        </button>
      </header>

      {homePreviewThreads.length ? (
        <div className="frame-home__interaction-stack frame-home__interaction-stack--single">
          {homePreviewThreads.map(renderHomeLetterCard)}
        </div>
      ) : null}

      {showMenu && !activeLetterThreadId && !isSosDialogOpen ? <button
        className="frame-home__xiaoxu-perch"
        type="button"
        aria-label="和AI小叙聊聊"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          navigate(withFrameVariant('/frame/ai'))
        }}
      >
        <span className="frame-home__xiaoxu-bubble">
          <b>小叙</b>
          {isRetirementScenario
            ? '陈老师，您好呀！大家送给您的时光都在这里，咱们慢慢看。'
            : isAmaScenario
              ? '阿嫲，我在这儿。想看照片，还是聊聊从前？'
              : '您好呀，我是小叙。想看照片，还是聊聊天？'}
        </span>
        <img src={FRAME_AI_AVATAR_URL} alt="AI小叙" draggable={false} />
      </button> : null}

      {showMenu ? (
        <div className="frame-home__quick-actions" aria-label="快捷安全入口">
          {frameVariant === 'possibility' ? (
            <button
              className="frame-home__quick-entry frame-home__quick-entry--checkin"
              type="button"
              aria-label="进入AI日记"
              onPointerDown={(event) => {
                event.stopPropagation()
                setMenuActivityKey((current) => current + 1)
              }}
              onClick={(event) => {
                event.stopPropagation()
                openAiDiary()
              }}
            >
              <span className="frame-home__quick-entry-avatar" aria-hidden="true">
                <img src={FRAME_HOME_DOCK_ICONS.checkin} alt="" draggable={false} />
              </span>
              <span className="frame-home__quick-entry-label">AI日记</span>
            </button>
          ) : null}
          {frameVariant === 'possibility' ? (
            <button
              className="frame-home__quick-entry frame-home__quick-entry--sos"
              type="button"
              aria-label="SOS一键呼叫"
              onPointerDown={(event) => {
                event.stopPropagation()
                setMenuActivityKey((current) => current + 1)
              }}
              onClick={(event) => {
                event.stopPropagation()
                triggerSosCall()
              }}
            >
              <span className="frame-home__quick-entry-avatar" aria-hidden="true">
                <img src={FRAME_HOME_DOCK_ICONS.sos} alt="" draggable={false} />
              </span>
              <span className="frame-home__quick-entry-label">SOS</span>
            </button>
          ) : null}
          {isNewVariant ? (
            <button
              className="frame-home__quick-entry frame-home__quick-entry--explore"
              type="button"
              aria-label="进入探索专区"
              onPointerDown={(event) => {
                event.stopPropagation()
                setMenuActivityKey((current) => current + 1)
              }}
              onClick={(event) => {
                event.stopPropagation()
                navigate(withFrameVariant('/frame/explore', frameVariant))
              }}
            >
              <span className="frame-home__quick-entry-avatar" aria-hidden="true">
                <img src={FRAME_EXPLORE_ICON_URL} alt="" draggable={false} />
              </span>
              <span className="frame-home__quick-entry-label">探索专区</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {showMenu ? (
        <nav
          className="frame-home__dock"
          aria-label="相框常驻入口"
          onPointerDown={() => setMenuActivityKey((current) => current + 1)}
        >
          <button
            className="frame-home__dock-card frame-home__dock-card--family"
            type="button"
            onClick={() => navigate(withFrameVariant('/frame/family'))}
          >
            <span className="frame-home__dock-visual" aria-hidden="true">
              <img src={FRAME_HOME_DOCK_ICONS.family} alt="" draggable={false} />
            </span>
            <span className="frame-home__dock-copy">
              <strong>家庭空间</strong>
              <small>互动历史和家谱</small>
            </span>
          </button>
          {isV1Variant ? (
            <>
              <button className="frame-home__dock-card frame-home__dock-card--checkin" type="button" onClick={() => navigate(withFrameVariant('/frame/diary'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.checkin} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>AI日记</strong>
                  <small>随便聊记录今天</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--river" type="button" onClick={() => navigate(withFrameVariant('/frame/river'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.river} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>聊往事</strong>
                  <small>AI 整理成故事</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--study" type="button" onClick={() => navigate(withFrameVariant('/frame/study'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.study} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>个人书房</strong>
                  <small>你的专属私密空间</small>
                </span>
              </button>
            </>
          ) : isNewVariant ? (
            <>
              <button className="frame-home__dock-card frame-home__dock-card--study" type="button" onClick={() => navigate(withFrameVariant('/frame/fragments', frameVariant))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.study} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>时光碎片</strong>
                  <small>照片、声音与作品</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--river" type="button" onClick={() => navigate(withFrameVariant('/frame/river', frameVariant))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.river} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>时光长河</strong>
                  <small>随口聊，写成故事</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--square" type="button" onClick={() => navigate(withFrameVariant('/frame/square', frameVariant))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.square} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>银发广场</strong>
                  <small>老朋友的新鲜事</small>
                </span>
              </button>
            </>
          ) : (
            <>
              <button className="frame-home__dock-card frame-home__dock-card--study" type="button" onClick={() => navigate(withFrameVariant('/frame/study'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.study} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>个人书房</strong>
                  <small>回忆录和日记</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--health" type="button" onClick={() => navigate(withFrameVariant('/frame/health'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.health} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>健康守望</strong>
                  <small>身心记忆守护</small>
                </span>
              </button>
              <button className="frame-home__dock-card frame-home__dock-card--square" type="button" onClick={() => navigate(withFrameVariant('/frame/square'))}>
                <span className="frame-home__dock-visual" aria-hidden="true">
                  <img src={FRAME_HOME_DOCK_ICONS.square} alt="" draggable={false} />
                </span>
                <span className="frame-home__dock-copy">
                  <strong>银发广场</strong>
                  <small>老朋友的新鲜事</small>
                </span>
              </button>
            </>
          )}
          <button className="frame-home__dock-settings-button" type="button" onClick={() => navigate(withFrameVariant('/frame/settings'))}>
            <GearSix size={38} weight="duotone" aria-hidden="true" />
            <span>设置</span>
          </button>
        </nav>
      ) : null}

      {toastMessage ? <div className="frame-home__toast" role="status" aria-live="polite">{toastMessage}</div> : null}

      {isSosDialogOpen ? <FrameSosDialog contactName={sosContactName} onClose={() => setIsSosDialogOpen(false)} /> : null}

      {activeLetterThreadId ? (
        <Suspense fallback={<div className="frame-letter-modal-loading" aria-label="来信加载中" />}>
          <FrameInteractionLetterModal
            threadId={activeLetterThreadId}
            threadIds={isAmaScenario ? amaInboxThreads.map((thread) => thread.id) : undefined}
            onClose={() => setActiveLetterThreadId(null)}
            onSelectThread={(threadId) => setActiveLetterThreadId(threadId)}
          />
        </Suspense>
      ) : null}
    </FramePageShell>
  )
}
