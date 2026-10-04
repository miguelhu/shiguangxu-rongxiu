import { ArrowLeft, BookOpenText, CheckCircle, Play } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getMockMemoryStoryById } from '../mock'

const COMING_SOON_MESSAGE = '即将上线'

export function MemoryStoryDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [toastMessage, setToastMessage] = useState('')
  const story = getMockMemoryStoryById(id || '') ?? getMockMemoryStoryById('story-childhood-home')
  const justGenerated = searchParams.get('generated') === '1' || story?.isNew

  const showComingSoon = () => {
    setToastMessage(COMING_SOON_MESSAGE)
  }

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  if (!story) {
    return (
      <main className="proto-page">
        <section className="proto-card empty-detail">
          <h1>这段往事还在整理</h1>
          <button className="proto-primary-button" type="button" onClick={() => navigate('/member/memories')}>返回回忆录</button>
        </section>
      </main>
    )
  }

  return (
    <main className="proto-page proto-page--story" aria-label="回忆录内容详情">
      <header className="proto-topbar-static">
        <button type="button" aria-label="返回回忆录" onClick={() => navigate('/member/memories')}>
          <ArrowLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <h1>回忆录</h1>
        <span aria-hidden="true" />
      </header>

      {justGenerated ? (
        <aside className="story-success-tip">
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
          这段往事已经整理好了
        </aside>
      ) : null}

      <article className="story-paper">
        <span className="story-type">
          <BookOpenText size={18} weight="duotone" aria-hidden="true" />
          {story.type === 'chapter' ? '一章故事' : story.themeTitle}
        </span>
        <h2>{story.title}</h2>
        <p className="story-meta">整理于 {new Date(story.generatedAt).getMonth() + 1}月{new Date(story.generatedAt).getDate()}日 · 约 {Math.round(story.readDurationSeconds / 60)} 分钟</p>
        <button className="story-play-button" type="button" onClick={showComingSoon}>
          <Play size={13} weight="fill" aria-hidden="true" />
          朗读这段故事
        </button>
        <div className="story-body">
          {story.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
      {toastMessage ? <div className="home-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </main>
  )
}
