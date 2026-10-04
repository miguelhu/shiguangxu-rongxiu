import {
  BookmarkSimple,
  CaretLeft,
  CheckCircle,
  Clock,
  Heart,
  MapPin,
  SealCheck,
  Sparkle,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockFrameStickers, getMockSquareEventById, getMockSquareEvents, getMockSquarePosts } from '../mock'
import type { SquarePost } from '../types'

type SquareTab = 'discover' | 'follow' | 'city'

const SQUARE_TABS: { id: SquareTab; label: string }[] = [
  { id: 'discover', label: '发现' },
  { id: 'follow', label: '关注' },
  { id: 'city', label: '同城' },
]

const DISCOVER_TOPICS = ['推荐', '家庭时光', '军旅岁月', '风景摄影', '美食菜谱', '养生心得']
const CITY_CATEGORIES = ['全部', '合唱', '书法', '养生健康', '展览']
const INITIAL_STICKER_IMAGE_COUNT = 6
const AMA_SQUARE_HERO_SLIDES = [
  {
    id: 'shuimu',
    imageUrl: '/scenario/ama-letter/square/discover-banner-shuimu.png',
    title: '水木回声',
  },
  {
    id: 'ama-letter',
    imageUrl: '/scenario/ama-letter/square/discover-banner-ama-letter.png',
    title: '阿嫲的情书',
  },
]
const AMA_SQUARE_HERO = {
  kicker: '',
  title: '跨越半世纪的侨批：阿嫲的情书',
  summary: '一张红头船票，六十载隔海守望。来自汕头的叶淑柔，把那句“江海万里，心中念你”留在了家里。',
  imageUrl: '/scenario/ama-letter/square/ordinary-epic.png',
}

function initialOf(name: string) {
  return name.replace(/(阿姨|叔|老师|老|头|爱分享的|退役军人)/g, '').slice(0, 1) || name.slice(0, 1)
}

function SquareTopbar({
  title,
  backTo = '/frame',
  children,
}: {
  title?: string
  backTo?: string
  children?: ReactNode
}) {
  const navigate = useNavigate()

  return (
    <header className={`frame-memory-topbar frame-family-space__topbar frame-square-topbar frame-light-nav${children ? ' frame-square-topbar--tabs' : ''}`}>
      <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario(backTo))} aria-label="返回">
        <CaretLeft size={40} weight="bold" aria-hidden="true" />
      </button>
      {title ? <h1>{title}</h1> : null}
      {children}
    </header>
  )
}

function SquareChannelTabs({ currentTab }: { currentTab: SquareTab }) {
  const navigate = useNavigate()

  return (
    <nav className="frame-square-tabs" aria-label="广场频道">
      {SQUARE_TABS.map((tab) => (
        <button className={currentTab === tab.id ? 'is-active' : ''} key={tab.id} type="button" onClick={() => navigate(withScenario(`/frame/square?tab=${tab.id}`))}>
          <strong>{tab.label}</strong>
        </button>
      ))}
    </nav>
  )
}

function SquareStickerActions({
  post,
  onToast,
}: {
  post: SquarePost
  onToast: (message: string) => void
}) {
  const stickers = getMockFrameStickers('square')
  const [selectedStickerId, setSelectedStickerId] = useState('')
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false)
  const [visibleStickerImageCount, setVisibleStickerImageCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!stickerPickerOpen) {
      setVisibleStickerImageCount(0)
      return undefined
    }

    setVisibleStickerImageCount(Math.min(INITIAL_STICKER_IMAGE_COUNT, stickers.length))
    if (stickers.length <= INITIAL_STICKER_IMAGE_COUNT) return undefined

    const timer = window.setTimeout(() => {
      setVisibleStickerImageCount(stickers.length)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [stickerPickerOpen, stickers.length])

  return (
    <div className="frame-square-card__actions">
      <button type="button" className={liked ? 'is-active' : ''} onClick={() => {
        setLiked((current) => !current)
        onToast(liked ? '已取消点赞' : `已给${post.authorName}点一个赞`)
      }}>
        <Heart size={22} weight={liked ? 'fill' : 'bold'} />
        {post.likes ? post.likes + (liked ? 1 : 0) : '点赞'}
      </button>
      <button
        type="button"
        className={selectedStickerId ? 'is-active' : ''}
        aria-haspopup="dialog"
        aria-expanded={stickerPickerOpen}
        onClick={() => setStickerPickerOpen(true)}
      >
        <Sparkle size={22} weight="duotone" />
        {selectedStickerId ? '已贴纸' : '贴纸'}
      </button>
      <button type="button" className={saved ? 'is-active' : ''} onClick={() => {
        setSaved((current) => !current)
        onToast(saved ? '已取消收藏' : '已收藏这条内容')
      }}>
        <BookmarkSimple size={22} weight={saved ? 'fill' : 'bold'} />
        收藏
      </button>

      {stickerPickerOpen ? createPortal(
        <div className="frame-square-sticker-dialog-backdrop" role="presentation" onClick={() => setStickerPickerOpen(false)}>
          <section
            className="frame-square-sticker-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="选择贴纸"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="frame-square-sticker-dialog__heading">
              <h2>发送贴纸</h2>
              <button type="button" aria-label="关闭贴纸选择" onClick={() => setStickerPickerOpen(false)}>
                <X size={30} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="frame-square-sticker-dialog__grid">
              {stickers.map((sticker, index) => {
                const shouldLoadStickerImage = index < visibleStickerImageCount

                return (
                  <button
                    key={sticker.id}
                    className={selectedStickerId === sticker.id ? 'frame-elder-sticker frame-elder-sticker--selected' : 'frame-elder-sticker'}
                    type="button"
                    aria-pressed={selectedStickerId === sticker.id}
                    aria-label={`用${sticker.label}贴纸回应`}
                    onClick={() => {
                      setSelectedStickerId(sticker.id)
                      setStickerPickerOpen(false)
                      onToast(`已送出「${sticker.label}」贴纸`)
                    }}
                  >
                    {shouldLoadStickerImage ? (
                      <img
                        src={sticker.src}
                        alt=""
                        aria-hidden="true"
                        loading={index < INITIAL_STICKER_IMAGE_COUNT ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ) : (
                      <i className="frame-elder-sticker__placeholder" aria-hidden="true" />
                    )}
                    <span>{sticker.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

export function FrameSquarePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const currentTab = (searchParams.get('tab') as SquareTab) || 'discover'
  const posts = getMockSquarePosts()
  const events = getMockSquareEvents()
  const squareHero = getActiveScenarioId() === 'ama-letter'
    ? AMA_SQUARE_HERO
    : {
        kicker: '',
        title: '凡人史诗',
        summary: '点进来看那些未必拥有丰功伟绩，但真正参与过时代的人。普通人的一生，也值得被认真讲述。',
        imageUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
      }
  const [toast, setToast] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('推荐')
  const [selectedAuthor, setSelectedAuthor] = useState('全部')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [amaHeroSlideIndex, setAmaHeroSlideIndex] = useState(0)
  const isAmaScenario = getActiveScenarioId() === 'ama-letter'

  useEffect(() => {
    if (!isAmaScenario || currentTab !== 'discover') return undefined

    const timer = window.setInterval(() => {
      setAmaHeroSlideIndex((current) => (current + 1) % AMA_SQUARE_HERO_SLIDES.length)
    }, 4200)

    return () => window.clearInterval(timer)
  }, [currentTab, isAmaScenario])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1700)
  }

  const discoverPosts = useMemo(() => {
    if (selectedTopic === '推荐') return posts.filter((post) => post.tag === '发现').slice(0, 3)
    const matched = posts.filter((post) => post.topic === selectedTopic)
    return matched.length ? matched : posts.filter((post) => post.tag === '发现').slice(0, 3)
  }, [posts, selectedTopic])

  const followPeople = useMemo(() => posts.filter((post) => post.tag === '关注'), [posts])
  const followPosts = selectedAuthor === '全部' ? followPeople : followPeople.filter((post) => post.authorName === selectedAuthor)
  const visibleEvents = selectedCategory === '全部' ? events : events.filter((event) => event.category === selectedCategory)

  return (
    <FramePageShell className="frame-space-page frame-square-page frame-light-nav-page" mode={mode}>
      <SquareTopbar>
        <SquareChannelTabs currentTab={currentTab} />
      </SquareTopbar>

      <main className="frame-square-layout">
        {currentTab === 'discover' ? (
          <>
            {isAmaScenario ? (
              <button className="frame-square-hero-carousel" type="button" onClick={() => navigate(withScenario('/frame/square/heroes'))} aria-label="查看银发广场发现专题">
                <span className="frame-square-hero-carousel__track">
                  {AMA_SQUARE_HERO_SLIDES.map((slide, index) => (
                    <img
                      key={slide.id}
                      className={index === amaHeroSlideIndex ? 'is-active' : ''}
                      src={slide.imageUrl}
                      alt={slide.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  ))}
                </span>
                <span className="frame-square-hero-carousel__dots" aria-hidden="true">
                  {AMA_SQUARE_HERO_SLIDES.map((slide, index) => (
                    <i className={index === amaHeroSlideIndex ? 'is-active' : ''} key={slide.id} />
                  ))}
                </span>
              </button>
            ) : (
              <button className="frame-square-hero-feature" type="button" onClick={() => navigate(withScenario('/frame/square/heroes'))}>
                <div>
                  {squareHero.kicker ? <span>{squareHero.kicker}</span> : null}
                  <h2>{squareHero.title}</h2>
                  <p>{squareHero.summary}</p>
                </div>
                <img src={squareHero.imageUrl} alt="" />
              </button>
            )}

            <section className="frame-square-topic-rail" aria-label="发现主题">
              {DISCOVER_TOPICS.map((topic) => (
                <button key={topic} className={selectedTopic === topic ? 'is-active' : ''} type="button" onClick={() => setSelectedTopic(topic)}>
                  {topic}
                </button>
              ))}
            </section>

            <section className="frame-square-discover-grid" aria-label={`${selectedTopic}内容`}>
              {discoverPosts.map((post) => (
                <article className="frame-square-discover-card" key={post.id}>
                  <img src={post.photoUrl} alt="" />
                  <div className="frame-square-discover-card__body">
                    <h2>{post.title}</h2>
                    <p>{post.summary}</p>
                    <div className="frame-square-author-row">
                      <span>{initialOf(post.authorName)}</span>
                      <strong>{post.authorName}</strong>
                      <small>{post.likes || 0} 人喜欢</small>
                    </div>
                    <SquareStickerActions post={post} onToast={showToast} />
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}

        {currentTab === 'follow' ? (
          <>
            <section className="frame-square-follow-rail" aria-label="关注的人">
              <button className={selectedAuthor === '全部' ? 'is-active' : ''} type="button" onClick={() => setSelectedAuthor('全部')}>
                <span>全</span>
                <strong>全部关注</strong>
                <small>看看大家</small>
              </button>
              {followPeople.map((person) => (
                <button key={person.id} className={selectedAuthor === person.authorName ? 'is-active' : ''} type="button" onClick={() => setSelectedAuthor(person.authorName)}>
                  <img src={person.photoUrl} alt="" />
                  <strong>{person.authorName}</strong>
                  <small>{person.authorTitle}</small>
                </button>
              ))}
            </section>

            <section className="frame-square-follow-grid" aria-label="关注动态">
              {followPosts.map((post) => (
                <article className="frame-square-follow-card" key={post.id}>
                  <img src={post.photoUrl} alt="" />
                  <div>
                    <span>{post.tags?.join(' · ')}</span>
                    <h2>{post.title}</h2>
                    <p>{post.summary}</p>
                    <div className="frame-square-author-row">
                      <span>{initialOf(post.authorName)}</span>
                      <strong>{post.authorName}</strong>
                      <small>{post.authorTitle}</small>
                    </div>
                    <SquareStickerActions post={post} onToast={showToast} />
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : null}

        {currentTab === 'city' ? (
          <>
            <section className="frame-square-city-heading frame-square-city-operator">
              <div>
                <h2>泰康之家·鹏园</h2>
                <p>面向长辈的高品质养老社区，提供康养照护、文化活动和家庭友好的线下空间。</p>
              </div>
              <img src="/frame-gallery/optimized/03-weekend-visit-grandma.jpg" alt="" />
            </section>

            <section className="frame-square-topic-rail frame-square-topic-rail--city" aria-label="活动分类">
              {CITY_CATEGORIES.map((category) => (
                <button key={category} className={selectedCategory === category ? 'is-active' : ''} type="button" onClick={() => setSelectedCategory(category)}>
                  {category}
                </button>
              ))}
            </section>

            <section className="frame-square-event-grid" aria-label="同城活动列表">
              {visibleEvents.map((event) => (
                <button className="frame-square-event-card" key={event.id} type="button" onClick={() => navigate(withScenario(`/frame/square/event/${event.id}`))}>
                  <div>
                    <img src={event.photoUrl} alt="" />
                    <em>免费</em>
                  </div>
                  <span>{event.category}</span>
                  <h2>{event.title}</h2>
                  <p>{event.summary}</p>
                  <small><Clock size={20} weight="duotone" /> {event.dateLabel}</small>
                  <small><MapPin size={20} weight="fill" /> {event.location}</small>
                </button>
              ))}
            </section>
          </>
        ) : null}
      </main>
      {toast ? <div className="frame-settings-toast">{toast}</div> : null}
    </FramePageShell>
  )
}

export function FrameSquareEventPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { mode } = useFrameDisplayMode()
  const event = getMockSquareEventById(id || '') || getMockSquareEvents()[0]
  const [joined, setJoined] = useState(false)
  const [shareFull, setShareFull] = useState(true)

  return (
    <FramePageShell className="frame-space-page frame-square-page frame-light-nav-page" mode={mode}>
      <SquareTopbar title="活动详情" backTo="/frame/square?tab=city" />
      <main className="frame-square-event-detail-layout">
        <article className="frame-square-event-reading">
          <span>{event.category || '同城活动'}</span>
          <h2>{event.title}</h2>
          <img src={event.photoUrl} alt="" />
          <div className="frame-square-event-facts">
            <p><Clock size={28} weight="duotone" /> 时间：{event.dateLabel}</p>
            <p><MapPin size={28} weight="fill" /> 地点：{event.location}</p>
            <p><UsersThree size={28} weight="duotone" /> 招募：{event.capacityLabel || '20人（已报12人）'}</p>
            <p><SealCheck size={28} weight="duotone" /> 主办：{event.organizer || '社区长者服务站'}</p>
          </div>
          <h3>活动介绍</h3>
          <p>{event.description || event.summary}</p>
        </article>

        <aside className="frame-square-signup-panel">
          <button className={shareFull ? 'is-active' : ''} type="button" onClick={() => setShareFull((current) => !current)}>
            <CheckCircle size={30} weight={shareFull ? 'fill' : 'regular'} />
            <span>
              <strong>同步给子女</strong>
              <small>{shareFull ? '发送完整活动信息，让他们放心。' : '仅同步时间、地点和主办方。'}</small>
            </span>
          </button>
          <button type="button" onClick={() => setJoined(true)}>{joined ? '已报名，家人也知道了' : '报名参加'}</button>
          <button type="button" onClick={() => navigate(withScenario('/frame/family'))}>回家庭空间看看</button>
        </aside>
      </main>
    </FramePageShell>
  )
}

export function FrameSquareHeroesPage() {
  const { mode } = useFrameDisplayMode()
  const posts = getMockSquarePosts()

  return (
    <FramePageShell className="frame-space-page frame-square-page frame-light-nav-page" mode={mode}>
      <SquareTopbar title="凡人史诗" backTo="/frame/square" />
      <main className="frame-square-heroes-page">
        <section className="frame-square-heroes-intro">
          <span>发现专题</span>
          <h2>把普通人的故事认真留下</h2>
          <p>这些故事不一定宏大，却像一本慢慢翻开的生活史：家常饭、旧照片、一次晨练、一次社区分享，都是可以被记住的时代片段。</p>
        </section>
        <section className="frame-square-heroes-grid">
          {posts.map((post) => (
            <article key={post.id}>
              <img src={post.photoUrl} alt="" />
              <div>
                <span>{post.topic || post.tag}</span>
                <h2>{post.authorName}</h2>
                <strong>{post.title}</strong>
                <p>{post.summary}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </FramePageShell>
  )
}
