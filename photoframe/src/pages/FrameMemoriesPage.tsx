import {
  Backpack,
  BookOpenText,
  Cake,
  Camera,
  CaretLeft,
  CookingPot,
  Couch,
  Gift,
  Heart,
  HouseLine,
  Storefront,
  Student,
  Tree,
  UsersThree,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockMemoryThemes } from '../mock'
import type { MemoryTheme, MemoryTopicStatus } from '../types'

type MemoryTone =
  | 'coral'
  | 'apricot'
  | 'amber'
  | 'olive'
  | 'sage'
  | 'pine'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'violet'
  | 'mauve'
  | 'rose'

const MEMORY_TONES: MemoryTone[] = ['coral', 'sky', 'amber', 'violet', 'pine', 'apricot', 'blue', 'sage', 'rose', 'teal', 'mauve', 'olive']
const FEATURE_STORY_PATH = '/frame/memories/story/story-sewing-machine'
const PHOSPHOR_THEME_ICONS: PhosphorIcon[][] = [
  [Tree, Student, Storefront, Backpack, HouseLine, Heart],
  [Camera, HouseLine, CookingPot, UsersThree, Heart, Gift],
  [Storefront, CookingPot, Couch, UsersThree, Cake, Gift],
]

function getMemoryStatusLabel(status: MemoryTopicStatus): string {
  if (status === 'completed') return '查看故事'
  return '待聊'
}

function MemoryTopicIcon({
  index,
  reward,
  themeIndex,
}: {
  index: number
  reward?: boolean
  themeIndex: number
}) {
  const iconIndex = reward ? 5 : index
  const icons = PHOSPHOR_THEME_ICONS[themeIndex % PHOSPHOR_THEME_ICONS.length]
  const Icon = reward ? BookOpenText : icons[iconIndex % icons.length]
  return <Icon size={46} weight="duotone" />
}

function MemoryThemeSection({
  onOpenStory,
  onOpenTopic,
  theme,
  themeIndex,
}: {
  onOpenStory: (storyId: string) => void
  onOpenTopic: (topicId: string) => void
  theme: MemoryTheme
  themeIndex: number
}) {
  const toneOffset = (themeIndex * 5) % MEMORY_TONES.length

  return (
    <section className="frame-memory-theme" aria-label={theme.title}>
      <div className="frame-memory-heading">
        <div className="frame-memory-heading__copy">
          <h2>{theme.title}</h2>
          {theme.subtitle ? <p>{theme.subtitle}</p> : null}
        </div>
        <span>
          {theme.completedCount}/{theme.totalCount}
        </span>
      </div>
      <div className="frame-memory-grid">
        {theme.topics.map((topic, topicIndex) => {
          const tone = MEMORY_TONES[(topicIndex + toneOffset) % MEMORY_TONES.length]

          return (
            <button
              className={`frame-memory-card frame-memory-card--${topic.status} frame-memory-card--tone-${tone}`}
              key={topic.id}
              type="button"
              onClick={() => {
                if (topic.status === 'completed') {
                  onOpenStory(`story-${topic.id.replace('topic-', '')}`)
                } else {
                  onOpenTopic(topic.id)
                }
              }}
            >
              <i className="frame-memory-card__icon" aria-hidden="true">
                <MemoryTopicIcon index={topicIndex} themeIndex={themeIndex} />
              </i>
              <strong>{topic.title}</strong>
              <span>{getMemoryStatusLabel(topic.status)}</span>
            </button>
          )
        })}
        <button
          className={
            theme.rewardStatus === 'unlocked'
              ? `frame-memory-card frame-memory-card--reward frame-memory-card--completed frame-memory-card--tone-${MEMORY_TONES[(theme.topics.length + toneOffset) % MEMORY_TONES.length]}`
              : `frame-memory-card frame-memory-card--reward frame-memory-card--locked frame-memory-card--tone-${MEMORY_TONES[(theme.topics.length + toneOffset) % MEMORY_TONES.length]}`
          }
          type="button"
          onClick={() => {
            if (theme.rewardStatus === 'unlocked') onOpenStory(`story-${theme.id.replace('theme-', '')}-chapter`)
          }}
        >
          <i className="frame-memory-card__reward-badge" aria-hidden="true">
            <Gift size={20} weight="fill" />
          </i>
          <i className="frame-memory-card__icon" aria-hidden="true">
            <MemoryTopicIcon index={theme.topics.length} reward themeIndex={themeIndex} />
          </i>
          <strong>{theme.rewardTitle}</strong>
          <span>{theme.rewardStatus === 'unlocked' ? '查看一章故事' : '聊完本章生成'}</span>
        </button>
      </div>
    </section>
  )
}

export function FrameMemoriesPage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const themes = getMockMemoryThemes()
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (!toastMessage) return undefined

    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const showComingSoon = () => {
    setToastMessage('即将上线')
  }

  const openFeatureStory = () => {
    navigate(withScenario(FEATURE_STORY_PATH))
  }

  return (
    <FramePageShell className="frame-list-page frame-memory-page" mode={mode}>
      <header className="frame-memory-topbar">
        <button className="frame-memory-back-button" type="button" aria-label="返回相框" onClick={() => navigate(withScenario('/frame'))}>
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>往事</h1>
      </header>

      <main className="frame-memory-view" aria-label="往事">
        <section className="frame-memory-feature-card" aria-label="往事提示">
          <div>
            <h2>把往事慢慢整理成章</h2>
            <p>每聊完一个话题，AI会自动生成一段故事</p>
          </div>
          <img
            className="frame-memory-feature-card__art"
            src="/past-memories-tab-keepsake-transparent.png"
            alt=""
            aria-hidden="true"
          />
        </section>

        {themes.map((theme, themeIndex) => (
          <MemoryThemeSection
            key={theme.id}
            onOpenStory={openFeatureStory}
            onOpenTopic={showComingSoon}
            theme={theme}
            themeIndex={themeIndex}
          />
        ))}
      </main>

      {toastMessage ? (
        <div className="frame-settings-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </FramePageShell>
  )
}
