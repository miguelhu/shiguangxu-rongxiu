import { CaretLeft, Clock, Gift, MapPin, Play } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import {
  FRAME_V01_STORY_ID,
  FRAME_V01_TOPIC_STATES,
  frameV01MemoryThemes,
  frameV01RiverStages,
  type FrameV01TopicStatus,
} from '../content/frameV01LifeStory'
import {
  getMockFamilyDynamics,
  getMockGalleryPhotos,
  getMockInteractionThreads,
  getMockMemoryThemes,
  getMockRiverStageById,
  getMockRiverStages,
  getMockRiverStoryById,
  getMockStudyModules,
} from '../mock'
import type { MemoryTheme, MemoryTopicStatus } from '../types'
import { getFrameVariant, withFrameVariant } from '../utils/frameVariant'

const COMING_SOON_MESSAGE = '即将上线'
const FRAME_RIVER_STAGE_INDEX_KEY = 'frame-river-stage-index'
const FRAME_RIVER_SETTLE_MS = 560
const FRAME_RIVER_TIMELINE_STEP = 176
// “新版”保留新版相框壳层，但时光长河使用 V1.0“聊往事”的完整内容与交互。
const USE_LIFE_STORY_PROTOTYPE = false

const statusLabel: Record<MemoryTopicStatus, string> = {
  completed: '查看故事',
  recommended: '点击开聊',
  unfinished: '点击开聊',
  locked: '待聊',
}

const frameV01StatusLabel: Record<FrameV01TopicStatus, string> = {
  untold: '开始聊',
  generating: '正在整理',
  waiting: '等待联网',
  retry: '重新整理',
  done: '查看故事',
}

const frameV01StatusToast: Partial<Record<FrameV01TopicStatus, string>> = {
  generating: '故事正在整理，请稍后再来看',
  waiting: '内容已经保存，联网后会自动整理',
  retry: '正在重新整理缺失的部分',
}

const themeYearRange: Record<string, string> = {
  'theme-childhood': '1960-1970',
  'theme-family': '1978-1990',
  'theme-neighborhood': '1990-2005',
  'theme-work': '1975-2010',
  'theme-heart': '2010-至今',
}

const themeIntro: Record<string, string> = {
  'theme-childhood': '从小时候的家、上学路和那时最惦记的小事，慢慢走回最早的自己。',
  'theme-family': '把成家、养育和饭桌边的普通日子，整理成一段能被家里人反复翻看的生活章。',
  'theme-neighborhood': '街坊、老路、赶集和远行，记录一个人怎么和世界慢慢熟起来。',
  'theme-work': '工作、手艺、撑过难处的经验，都是认真生活留下来的光。',
  'theme-heart': '那些想念、感谢、没说出口的话，适合被轻轻收进最后一章。',
}

function getTopicStoryId(topicId: string) {
  return `story-${topicId.replace('topic-', '')}`
}

function getNextInterviewTopic(theme: MemoryTheme) {
  return (
    theme.topics.find((topic) => topic.status === 'recommended') ||
    theme.topics.find((topic) => topic.status === 'unfinished') ||
    theme.topics.find((topic) => topic.status !== 'locked') ||
    theme.topics[0]
  )
}

function getInterviewPath(themeId: string, topicId: string, entry: 'overview' | 'stage' | 'topic') {
  return `/frame/river/interview?stage=${themeId}&topic=${topicId}&entry=${entry}`
}

function uniqueImages(urls: Array<string | undefined>) {
  return Array.from(new Set(urls.filter(Boolean)))
}

export function FrameRiverPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const frameVariant = getFrameVariant(searchParams)
  const isV1Variant = frameVariant === 'v1'
  const isNewVariant = frameVariant === 'new'
  const memoryThemes = USE_LIFE_STORY_PROTOTYPE ? frameV01MemoryThemes : getMockMemoryThemes()
  const riverStages = USE_LIFE_STORY_PROTOTYPE ? frameV01RiverStages : getMockRiverStages()
  const stageIndexStorageKey = isNewVariant
    ? `${FRAME_RIVER_STAGE_INDEX_KEY}-new`
    : FRAME_RIVER_STAGE_INDEX_KEY
  const riverStageByThemeId = new Map(riverStages.map((stage, index) => [memoryThemes[index]?.id, stage]))
  const frameImages = uniqueImages([
    ...getMockGalleryPhotos().map((photo) => photo.url),
    ...getMockInteractionThreads().map((thread) => thread.photoUrl),
    ...getMockFamilyDynamics().flatMap((dynamic) => [dynamic.photoUrl, ...(dynamic.photoUrls || [])]),
    ...getMockStudyModules().flatMap((module) => [module.coverUrl, ...module.items.map((item) => item.photoUrl)]),
    ...riverStages.flatMap((stage) => [stage.coverUrl, ...stage.stories.map((story) => story.photoUrl)]),
  ])
  const [stageIndex, setStageIndex] = useState(() => {
    const savedIndex = Number(window.localStorage.getItem(stageIndexStorageKey))
    return Number.isFinite(savedIndex) ? savedIndex % memoryThemes.length : 0
  })
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [settleOffset, setSettleOffset] = useState(0)
  const dragStartX = useRef<number | null>(null)
  const dragDidMove = useRef(false)
  const pendingTapThemeId = useRef<string | null>(null)
  const settleTimer = useRef<number | null>(null)
  const getLoopIndex = (index: number) => (index + memoryThemes.length) % memoryThemes.length
  useEffect(() => {
    const normalizedIndex = (stageIndex + memoryThemes.length) % memoryThemes.length
    window.localStorage.setItem(stageIndexStorageKey, String(normalizedIndex))
  }, [memoryThemes.length, stageIndex, stageIndexStorageKey])
  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current)
      }
    }
  }, [])
  const shiftStage = (direction: -1 | 1) => {
    setStageIndex((current) => getLoopIndex(current + direction))
  }
  const handleRiverPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (settleOffset !== 0) return
    if ((event.target as Element).closest('.frame-river-overview-chat-button')) return
    if (settleTimer.current !== null) {
      window.clearTimeout(settleTimer.current)
      settleTimer.current = null
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pendingTapThemeId.current = (event.target as Element).closest<HTMLElement>('.frame-river-stage-window')?.dataset.themeId || null
    dragStartX.current = event.clientX
    dragDidMove.current = false
    setIsDragging(true)
    setDragOffset(0)
  }
  const handleRiverPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (dragStartX.current === null) return

    const distance = event.clientX - dragStartX.current
    setDragOffset(Math.max(-140, Math.min(140, distance)))
  }
  const finishRiverDrag = (clientX: number) => {
    if (dragStartX.current === null) return

    const distance = clientX - dragStartX.current
    dragStartX.current = null
    setIsDragging(false)
    setDragOffset(0)
    if (Math.abs(distance) < 48) {
      const themeId = pendingTapThemeId.current
      pendingTapThemeId.current = null
      if (themeId) {
        navigate(withFrameVariant(`/frame/river/stage/${themeId}`))
      }
      return
    }

    pendingTapThemeId.current = null
    dragDidMove.current = true
    const direction = distance > 0 ? -1 : 1
    setSettleOffset(-direction)
    settleTimer.current = window.setTimeout(() => {
      shiftStage(direction)
      setSettleOffset(0)
      dragDidMove.current = false
      settleTimer.current = null
    }, FRAME_RIVER_SETTLE_MS)
  }
  const handleRiverPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    finishRiverDrag(event.clientX)
  }
  const settleClass = settleOffset < 0 ? ' is-settling-next' : settleOffset > 0 ? ' is-settling-prev' : ''
  const dragDirection = dragOffset < -8 ? 'next' : dragOffset > 8 ? 'prev' : undefined
  const dragProgress = Math.min(Math.abs(dragOffset) / 140, 1)
  const activeDragScale = 1.12 - 0.18 * dragProgress
  const nearDragScale = 0.88 + 0.18 * dragProgress
  const activeTheme = memoryThemes[getLoopIndex(stageIndex)]
  const activeInterviewTopic = activeTheme ? getNextInterviewTopic(activeTheme) : null
  const timelineShift = dragOffset + settleOffset * FRAME_RIVER_TIMELINE_STEP

  return (
    <FramePageShell className={`frame-space-page frame-river-page${USE_LIFE_STORY_PROTOTYPE ? ' frame-river-page--new' : ''}`} mode={mode}>
      <header className="frame-space-topbar frame-river-overview-topbar">
        <button type="button" onClick={() => navigate(withFrameVariant(isV1Variant || isNewVariant ? '/frame' : '/frame/study'))} aria-label={isV1Variant || isNewVariant ? '返回相框首页' : '返回个人书房'}>
          <CaretLeft size={36} weight="bold" />
        </button>
        <div>
          <h1>{isNewVariant ? '时光长河' : '回忆录'}</h1>
        </div>
      </header>

      <main
        className={`frame-river-overview${isDragging ? ' is-dragging' : ''}${settleClass}`}
        aria-label={isNewVariant ? '时光长河主题总览' : '回忆录主题总览'}
        onPointerDown={handleRiverPointerDown}
        onPointerMove={handleRiverPointerMove}
        onPointerUp={handleRiverPointerUp}
        onPointerCancel={() => {
          dragStartX.current = null
          pendingTapThemeId.current = null
          setIsDragging(false)
          setDragOffset(0)
        }}
        data-drag-direction={dragDirection}
        style={
          {
            '--river-active-drag-scale': activeDragScale,
            '--river-drag-progress': dragProgress,
            '--river-drag-x': `${dragOffset}px`,
            '--river-near-drag-scale': nearDragScale,
            '--river-settle-x': settleOffset,
          } as CSSProperties
        }
      >
        <section className="frame-river-carousel" aria-label="按时间滑动选择主题">
          <div className="frame-river-carousel__track">
            {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
              const themeIndex = getLoopIndex(stageIndex + offset)
              const theme = memoryThemes[themeIndex]
              const stage = riverStageByThemeId.get(theme.id)

              const stateClass = offset === 0 ? 'active' : Math.abs(offset) === 1 ? 'near' : Math.abs(offset) === 2 ? 'far' : 'buffer'
              const imageIndex = memoryThemes.slice(0, themeIndex).reduce((sum, item) => sum + item.topics.length + 1, 0)

              return (
                <button
                  className={`frame-river-stage-window frame-river-stage-window--${stateClass}`}
                  data-offset={offset}
                  data-theme-id={theme.id}
                  key={`${theme.id}-${offset}`}
                  type="button"
                  onClick={() => {
                    if (dragDidMove.current || settleOffset !== 0) return
                    navigate(withFrameVariant(`/frame/river/stage/${theme.id}`))
                  }}
                >
                  <figure>
                    <img src={stage?.coverUrl || frameImages[imageIndex % frameImages.length]} alt="" />
                  </figure>
                  <div className="frame-river-stage-window__copy">
                    <div className="frame-river-stage-window__title">
                      <strong>{theme.title}</strong>
                      <em>{theme.completedCount}/{theme.totalCount} 已完成</em>
                    </div>
                    {!USE_LIFE_STORY_PROTOTYPE && <span className="frame-river-stage-window__year">{stage?.years || theme.subtitle || themeYearRange[theme.id]}</span>}
                    <p>{theme.subtitle || stage?.summary || themeIntro[theme.id]}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {USE_LIFE_STORY_PROTOTYPE ? (
          <nav className="frame-river-timeline" aria-label="时光长河时间轴">
            <span className="frame-river-timeline__line" aria-hidden="true" />
            {memoryThemes.map((theme, index) => {
              let relativeIndex = index - getLoopIndex(stageIndex)
              const half = Math.floor(memoryThemes.length / 2)
              if (relativeIndex > half) relativeIndex -= memoryThemes.length
              if (relativeIndex < -half) relativeIndex += memoryThemes.length

              const position = relativeIndex * FRAME_RIVER_TIMELINE_STEP + timelineShift
              const distance = Math.min(Math.abs(position) / FRAME_RIVER_TIMELINE_STEP, 1)
              const scale = 1 - distance * 0.06
              const opacity = 1 - distance * 0.3
              const isCurrent = Math.abs(position) < FRAME_RIVER_TIMELINE_STEP / 2
              const stage = riverStageByThemeId.get(theme.id)

              return (
                <button
                  className={`frame-river-timeline__item${isCurrent ? ' is-current' : ''}`}
                  key={theme.id}
                  type="button"
                  style={{
                    opacity,
                    transform: `translateX(calc(-50% + ${position}px)) scale(${scale})`,
                    transitionProperty: isDragging ? 'none' : undefined,
                  }}
                  aria-current={index === getLoopIndex(stageIndex) ? 'true' : undefined}
                  aria-label={`查看 ${theme.title}，${stage?.years || themeYearRange[theme.id]}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onClick={() => {
                    if (settleOffset !== 0 || index === getLoopIndex(stageIndex)) return
                    setStageIndex(index)
                  }}
                >
                  <span>{stage?.years || themeYearRange[theme.id]}</span>
                  <i aria-hidden="true" />
                </button>
              )
            })}
          </nav>
        ) : (
          <>
            <button
              className="frame-river-overview-chat-button"
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={() => {
                if (!activeTheme || !activeInterviewTopic) return
                navigate(withFrameVariant(getInterviewPath(activeTheme.id, activeInterviewTopic.id, 'overview')))
              }}
            >
              开始访谈
            </button>
            <div className="frame-river-carousel__dots" aria-hidden="true">
              {memoryThemes.map((theme, index) => (
                <span className={index === stageIndex ? 'is-active' : ''} key={theme.id} />
              ))}
            </div>
          </>
        )}
      </main>

    </FramePageShell>
  )
}

export function FrameRiverStagePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { mode } = useFrameDisplayMode()
  const isNewVariant = getFrameVariant() === 'new'
  const memoryThemes = USE_LIFE_STORY_PROTOTYPE ? frameV01MemoryThemes : getMockMemoryThemes()
  const riverStages = USE_LIFE_STORY_PROTOTYPE ? frameV01RiverStages : getMockRiverStages()
  const theme = memoryThemes.find((item) => item.id === id) || memoryThemes[0]
  const stage = riverStages[memoryThemes.findIndex((item) => item.id === theme.id)]
  const frameImages = uniqueImages([
    ...getMockGalleryPhotos().map((photo) => photo.url),
    ...getMockInteractionThreads().map((thread) => thread.photoUrl),
    ...getMockFamilyDynamics().flatMap((dynamic) => [dynamic.photoUrl, ...(dynamic.photoUrls || [])]),
    ...riverStages.flatMap((stage) => [stage.coverUrl, ...stage.stories.map((story) => story.photoUrl)]),
  ])
  const themeIndex = memoryThemes.findIndex((item) => item.id === theme.id)
  const themeImageStart = Math.max(themeIndex, 0) * 4
  const [toastMessage, setToastMessage] = useState('')
  const stageInterviewTopic = getNextInterviewTopic(theme)
  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1800)
  }
  const startStageInterview = () => {
    if (!stageInterviewTopic) return
    navigate(withFrameVariant(getInterviewPath(theme.id, stageInterviewTopic.id, 'stage')))
  }
  const openTopic = (topicId: string, status: MemoryTopicStatus) => {
    if (USE_LIFE_STORY_PROTOTYPE) {
      const sourceStatus = FRAME_V01_TOPIC_STATES[topicId]
      if (sourceStatus === 'done' || status === 'completed') {
        navigate(withFrameVariant(`/frame/river/stage/${theme.id}/story/${FRAME_V01_STORY_ID}`))
        return
      }
      const statusMessage = frameV01StatusToast[sourceStatus]
      if (statusMessage) {
        showToast(statusMessage)
        return
      }
      navigate(withFrameVariant(getInterviewPath(theme.id, topicId, 'topic')))
      return
    }
    if (status === 'completed') {
      const storyId = getTopicStoryId(topicId)
      navigate(withFrameVariant(`/frame/river/stage/${theme.id}/story/${storyId}`))
      return
    }
    if (status === 'locked') {
      showToast('先完成前面的往事')
      return
    }
    navigate(withFrameVariant(getInterviewPath(theme.id, topicId, 'topic')))
  }
  const openReward = (memoryTheme: MemoryTheme) => {
    if (memoryTheme.rewardStatus === 'unlocked') {
      navigate(withFrameVariant(`/frame/river/stage/${theme.id}/story/story-${memoryTheme.id.replace('theme-', '')}-chapter`))
      return
    }
    showToast(`还差 ${Math.max(memoryTheme.totalCount - memoryTheme.completedCount, 1)} 段，完成后生成《${memoryTheme.rewardTitle}》`)
  }

  return (
    <FramePageShell className={`frame-space-page frame-river-page frame-river-page--stage frame-light-nav-page${USE_LIFE_STORY_PROTOTYPE ? ' frame-river-page--stage-new' : ''}`} mode={mode}>
      <header className="frame-memory-topbar frame-river-stage-topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withFrameVariant('/frame/river'))} aria-label={isNewVariant ? '返回时光长河' : '返回回忆录'}>
          <CaretLeft size={40} weight="bold" />
        </button>
        <h1 aria-hidden="true" />
        {!USE_LIFE_STORY_PROTOTYPE ? (
          <button className="frame-river-stage-topbar__topic" type="button" onClick={startStageInterview}>
            开始访谈
          </button>
        ) : null}
      </header>
      <main className="frame-river-stage-detail" aria-label={`${theme.title}章节`}>
        <section
          className="frame-river-stage-detail__hero"
          style={USE_LIFE_STORY_PROTOTYPE
            ? { '--frame-river-stage-cover': `url(${stage?.coverUrl || frameImages[themeImageStart % frameImages.length]})` } as CSSProperties
            : undefined}
        >
          <div className="frame-river-stage-detail__copy">
            <div className="frame-river-stage-detail__title-row">
              <h2>
                {theme.title}
                <span>{stage?.years || themeYearRange[theme.id]}</span>
              </h2>
              <div className="frame-river-stage-detail__meta-row">
                <div className="frame-river-stage-detail__progress" aria-label={`${theme.completedCount}/${theme.totalCount} 已完成`}>
                  <strong>{theme.completedCount}/{theme.totalCount}</strong>
                  <span>已完成</span>
                </div>
              </div>
            </div>
            <p>{theme.subtitle || stage?.summary || themeIntro[theme.id]}</p>
          </div>
        </section>

        <section className="frame-river-photo-grid frame-river-photo-grid--stage" aria-label="主题章节卡片">
          {theme.topics.map((topic, topicIndex) => (
            <button
              className={`frame-river-photo-card frame-river-photo-card--${topic.status} frame-river-photo-card--${topic.status === 'completed' ? 'lit' : 'dim'}${USE_LIFE_STORY_PROTOTYPE ? ` frame-river-photo-card--v01-${FRAME_V01_TOPIC_STATES[topic.id]}` : ''} frame-river-photo-card--tilt-${(topicIndex % 6) + 1}`}
              key={topic.id}
              type="button"
              onClick={() => openTopic(topic.id, topic.status)}
            >
              <figure>
                <img src={topic.photoUrl || frameImages[(themeImageStart + topicIndex) % frameImages.length]} alt="" />
              </figure>
              <strong>{topic.title}</strong>
              <span>{USE_LIFE_STORY_PROTOTYPE ? frameV01StatusLabel[FRAME_V01_TOPIC_STATES[topic.id]] : statusLabel[topic.status]}</span>
            </button>
          ))}
          {!USE_LIFE_STORY_PROTOTYPE ? <button
            className={`frame-river-photo-card frame-river-photo-card--reward frame-river-photo-card--${theme.rewardStatus} frame-river-photo-card--tilt-${((theme.topics.length + 1) % 6) + 1}`}
            type="button"
            onClick={() => openReward(theme)}
          >
            <figure>
              <img src={frameImages[(themeImageStart + theme.topics.length) % frameImages.length]} alt="" />
              <i aria-hidden="true">
                <Gift size={34} weight={theme.rewardStatus === 'unlocked' ? 'fill' : 'duotone'} />
              </i>
            </figure>
            <strong>{theme.rewardTitle}</strong>
            <span>{theme.rewardStatus === 'unlocked' ? '查看一章故事' : '聊完本章生成'}</span>
          </button> : null}
        </section>
      </main>
      {toastMessage ? <div className="frame-settings-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </FramePageShell>
  )
}

export function FrameRiverStoryPage() {
  const navigate = useNavigate()
  const { id, storyId } = useParams()
  const { mode } = useFrameDisplayMode()
  const isNewVariant = getFrameVariant() === 'new'
  const stage = getMockRiverStageById(id || '') || getMockRiverStages()[0]
  const story = getMockRiverStoryById(stage.id, storyId || '') || stage.stories[0]
  const [toastMessage, setToastMessage] = useState('')

  const showComingSoon = () => {
    setToastMessage(COMING_SOON_MESSAGE)
    window.setTimeout(() => setToastMessage(''), 2200)
  }

  return (
    <FramePageShell className="frame-space-page" mode={mode}>
      <header className="frame-space-topbar">
        <button type="button" onClick={() => navigate(withFrameVariant(`/frame/river/stage/${stage.id}`))} aria-label="返回阶段">
          <CaretLeft size={36} weight="bold" />
        </button>
        <div>
          <span>{stage.title}</span>
          <h1>{story.title}</h1>
        </div>
      </header>
      <main className="frame-space-layout frame-space-layout--two frame-river-story-layout">
        <figure className="frame-space-panel frame-river-story-photo">
          <img src={story.photoUrl} alt="" />
          <button type="button" onClick={showComingSoon}>
            <Play size={28} weight="fill" />
            朗读这段故事
          </button>
        </figure>
        <article className="frame-space-paper">
          <div className="frame-river-story-meta">
            <span><Clock size={22} weight="duotone" /> {stage.years}</span>
            <span><MapPin size={22} weight="duotone" /> 家庭记忆</span>
          </div>
          {story.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="frame-space-actions">
            <button type="button" onClick={() => navigate(withFrameVariant('/frame/family'))}>分享给家人</button>
            <button type="button" onClick={() => navigate(withFrameVariant(isNewVariant ? '/frame/fragments' : '/frame/study'))}>{isNewVariant ? '回拾光碎片继续整理' : '回书房继续整理'}</button>
          </div>
        </article>
      </main>
      {toastMessage ? <div className="frame-settings-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </FramePageShell>
  )
}
