import { CaretLeft, CaretRight, Gift, MagicWand, NotePencil, X } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getMockFamilyDynamics,
  getMockGalleryPhotos,
  getMockInteractionThreads,
  getMockMemoryStoryById,
  getMockMemoryThemes,
  getMockStudyModules,
} from '../mock'
import type { MemoryTheme, MemoryTopicStatus } from '../types'

const MEMBER_MEMORY_STAGE_INDEX_KEY = 'member-memory-stage-index'
const MEMBER_MEMORY_SETTLE_MS = 560

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

const statusLabel: Record<MemoryTopicStatus, string> = {
  completed: '查看故事',
  recommended: '点击开聊',
  unfinished: '点击开聊',
  locked: '待聊',
}

function getTopicStoryId(topicId: string) {
  return `story-${topicId.replace('topic-', '')}`
}

function uniqueImages(urls: Array<string | undefined>) {
  return Array.from(new Set(urls.filter(Boolean)))
}

function getMemberMemoryImages() {
  return uniqueImages([
    ...getMockGalleryPhotos().map((photo) => photo.url),
    ...getMockInteractionThreads().map((thread) => thread.photoUrl),
    ...getMockFamilyDynamics().flatMap((dynamic) => [dynamic.photoUrl, ...(dynamic.photoUrls || [])]),
    ...getMockStudyModules().flatMap((module) => [module.coverUrl, ...module.items.map((item) => item.photoUrl)]),
  ])
}

export function MemberMemoriesPage() {
  const navigate = useNavigate()
  const memoryThemes = getMockMemoryThemes()
  const frameImages = getMemberMemoryImages()
  const [stageIndex, setStageIndex] = useState(() => {
    const savedIndex = Number(window.localStorage.getItem(MEMBER_MEMORY_STAGE_INDEX_KEY))
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
    window.localStorage.setItem(MEMBER_MEMORY_STAGE_INDEX_KEY, String(normalizedIndex))
  }, [memoryThemes.length, stageIndex])

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current)
      }
    }
  }, [])

  const finishDrag = (clientX: number) => {
    if (dragStartX.current === null) return

    const distance = clientX - dragStartX.current
    dragStartX.current = null
    setIsDragging(false)
    setDragOffset(0)

    if (Math.abs(distance) < 48) {
      const themeId = pendingTapThemeId.current
      pendingTapThemeId.current = null
      if (themeId) {
        navigate(`/member/memories/stage/${themeId}`)
      }
      return
    }

    pendingTapThemeId.current = null
    dragDidMove.current = true
    const direction = distance > 0 ? -1 : 1
    setSettleOffset(-direction)
    settleTimer.current = window.setTimeout(() => {
      setStageIndex((current) => getLoopIndex(current + direction))
      setSettleOffset(0)
      dragDidMove.current = false
      settleTimer.current = null
    }, MEMBER_MEMORY_SETTLE_MS)
  }

  const dragProgress = Math.min(Math.abs(dragOffset) / 140, 1)
  const activeDragScale = 1 - 0.12 * dragProgress
  const nearDragScale = 0.82 + 0.18 * dragProgress

  return (
    <main className="member-memory-page" aria-label="回忆录">
      <header className="member-memory-topbar">
        <button type="button" aria-label="返回家庭空间" onClick={() => navigate('/member/treasure')}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <h1>林秀兰的回忆录</h1>
        <span aria-hidden="true" />
      </header>

      <section
        className={`member-memory-river${isDragging ? ' is-dragging' : ''}${settleOffset < 0 ? ' is-settling-next' : settleOffset > 0 ? ' is-settling-prev' : ''}`}
        aria-label="按时间滑动选择回忆主题"
        onPointerDown={(event) => {
          if (settleOffset !== 0) return
          if (settleTimer.current !== null) {
            window.clearTimeout(settleTimer.current)
            settleTimer.current = null
          }
          event.currentTarget.setPointerCapture?.(event.pointerId)
          pendingTapThemeId.current = (event.target as Element).closest<HTMLElement>('.member-memory-stage-card')?.dataset.themeId || null
          dragStartX.current = event.clientX
          dragDidMove.current = false
          setIsDragging(true)
          setDragOffset(0)
        }}
        onPointerMove={(event) => {
          if (dragStartX.current === null) return
          const distance = event.clientX - dragStartX.current
          setDragOffset(Math.max(-140, Math.min(140, distance)))
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture?.(event.pointerId)
          finishDrag(event.clientX)
        }}
        onPointerCancel={() => {
          dragStartX.current = null
          pendingTapThemeId.current = null
          setIsDragging(false)
          setDragOffset(0)
        }}
        data-drag-direction={dragOffset < -8 ? 'next' : dragOffset > 8 ? 'prev' : undefined}
        style={
          {
            '--member-memory-active-drag-scale': activeDragScale,
            '--member-memory-drag-x': `${dragOffset}px`,
            '--member-memory-near-drag-scale': nearDragScale,
            '--member-memory-settle-x': settleOffset,
          } as CSSProperties
        }
      >
        <div className="member-memory-river__track">
          {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
            const themeIndex = getLoopIndex(stageIndex + offset)
            const theme = memoryThemes[themeIndex]
            const imageIndex = memoryThemes.slice(0, themeIndex).reduce((sum, item) => sum + item.topics.length + 1, 0)
            const stateClass = offset === 0 ? 'active' : Math.abs(offset) === 1 ? 'near' : Math.abs(offset) === 2 ? 'far' : 'buffer'

            return (
              <button
                className={`member-memory-stage-card member-memory-stage-card--${stateClass}`}
                data-offset={offset}
                data-theme-id={theme.id}
                key={`${theme.id}-${offset}`}
                type="button"
                onClick={() => {
                  if (dragDidMove.current || settleOffset !== 0) return
                  navigate(`/member/memories/stage/${theme.id}`)
                }}
              >
                <figure>
                  <img src={frameImages[imageIndex % frameImages.length]} alt="" />
                </figure>
                <div>
                  <div className="member-memory-stage-card__title">
                    <strong>{theme.title}</strong>
                    <em>{theme.completedCount}/{theme.totalCount} 已完成</em>
                  </div>
                  <span>{themeYearRange[theme.id]}</span>
                  <p>{themeIntro[theme.id]}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="member-memory-dots" aria-hidden="true">
        {memoryThemes.map((theme, index) => (
          <span className={index === stageIndex ? 'is-active' : ''} key={theme.id} />
        ))}
      </div>
    </main>
  )
}

export function MemberMemoryStagePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const memoryThemes = getMockMemoryThemes()
  const frameImages = getMemberMemoryImages()
  const theme = memoryThemes.find((item) => item.id === id) || memoryThemes[0]
  const themeIndex = memoryThemes.findIndex((item) => item.id === theme.id)
  const themeImageStart = Math.max(themeIndex, 0) * 4
  const [toastMessage, setToastMessage] = useState('')
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1800)
  }

  const openTopic = (topicId: string, status: MemoryTopicStatus) => {
    if (status === 'completed') {
      const storyId = getTopicStoryId(topicId)
      if (getMockMemoryStoryById(storyId)) {
        navigate(`/member/memories/story/${storyId}`)
        return
      }
      showToast('这段故事正在整理成稿')
      return
    }
    if (status === 'locked') {
      showToast('先完成前面的往事')
      return
    }
    showToast('已同步给相框，可由长辈继续点亮')
  }

  const openReward = (memoryTheme: MemoryTheme) => {
    if (memoryTheme.rewardStatus === 'unlocked') {
      navigate(`/member/memories/story/story-${memoryTheme.id.replace('theme-', '')}-chapter`)
      return
    }
    showToast(`还差 ${Math.max(memoryTheme.totalCount - memoryTheme.completedCount, 1)} 段，完成后生成《${memoryTheme.rewardTitle}》`)
  }

  return (
    <main className="member-memory-page member-memory-page--stage" aria-label={`${theme.title}回忆录章节`}>
      <header className="member-memory-topbar">
        <button type="button" aria-label="返回回忆录" onClick={() => navigate('/member/memories')}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <h1 aria-hidden="true" />
        <button className="member-memory-topbar__topic" type="button" aria-label="生成新话题" onClick={() => setTopicDialogOpen(true)}>
          <span>新话题</span>
        </button>
      </header>

      <section className="member-memory-stage-hero">
        <div>
          <h2>
            {theme.title}
            <span>{themeYearRange[theme.id]}</span>
          </h2>
          <p>{themeIntro[theme.id]}</p>
        </div>
        <em>
          <strong>{theme.completedCount}/{theme.totalCount}</strong>
          <span>已完成</span>
        </em>
      </section>

      <section className="member-memory-topic-grid" aria-label="主题章节卡片">
        {theme.topics.map((topic, topicIndex) => (
          <button
            className={`member-memory-topic-card member-memory-topic-card--${topic.status} member-memory-topic-card--tilt-${(topicIndex % 6) + 1}`}
            key={topic.id}
            type="button"
            onClick={() => openTopic(topic.id, topic.status)}
          >
            <figure>
              <img src={frameImages[(themeImageStart + topicIndex) % frameImages.length]} alt="" />
            </figure>
            <strong>{topic.title}</strong>
            <span>{statusLabel[topic.status]}</span>
          </button>
        ))}
        <button
          className={`member-memory-topic-card member-memory-topic-card--reward member-memory-topic-card--${theme.rewardStatus} member-memory-topic-card--tilt-${((theme.topics.length + 1) % 6) + 1}`}
          type="button"
          onClick={() => openReward(theme)}
        >
          <figure>
            <img src={frameImages[(themeImageStart + theme.topics.length) % frameImages.length]} alt="" />
            <i aria-hidden="true">
              <Gift size={22} weight={theme.rewardStatus === 'unlocked' ? 'fill' : 'duotone'} />
            </i>
          </figure>
          <strong>{theme.rewardTitle}</strong>
          <span>{theme.rewardStatus === 'unlocked' ? '查看一章故事' : '聊完本章生成'}</span>
        </button>
      </section>

      {topicDialogOpen ? (
        <div className="member-memory-topic-dialog-backdrop" role="presentation" onClick={() => setTopicDialogOpen(false)}>
          <section
            className="member-memory-topic-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-memory-topic-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="member-memory-topic-dialog-title">生成新话题</h2>
              <button type="button" aria-label="关闭新话题" onClick={() => setTopicDialogOpen(false)}>
                <X size={20} weight="bold" aria-hidden="true" />
              </button>
            </header>
            <button type="button" onClick={() => {
              setTopicDialogOpen(false)
              showToast('AI 正在生成新话题')
            }}>
              <MagicWand size={24} weight="duotone" aria-hidden="true" />
              <strong>随机生成</strong>
              <CaretRight size={20} weight="bold" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => {
              setTopicDialogOpen(false)
              showToast('可以自定义想聊的一段往事')
            }}>
              <NotePencil size={24} weight="duotone" aria-hidden="true" />
              <strong>自定义生成</strong>
              <CaretRight size={20} weight="bold" aria-hidden="true" />
            </button>
          </section>
        </div>
      ) : null}
      {toastMessage ? <div className="home-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </main>
  )
}
