import { BookOpenText, CalendarBlank, Camera, CaretLeft, CaretRight, CheckCircle, ClockCounterClockwise, Images, Keyboard, LockKey, MusicNotes, NotePencil, Plus, ShieldCheck, Sparkle, UserFocus, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockStudyModules } from '../mock'

function getFrameStudyVariant(searchParams: URLSearchParams) {
  if (searchParams.get('variant') === 'possibility') return 'possibility'

  try {
    if (window.self !== window.top && window.parent.location.hash.includes('variant=possibility')) {
      return 'possibility'
    }
  } catch {
    // Parent access can fail outside same-origin demos; fall back to the local URL.
  }

  return 'v1'
}

export function FrameStudyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const modules = getMockStudyModules().filter((module) => module.id !== 'drafts')
  const isV1Variant = getFrameStudyVariant(searchParams) === 'v1'
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const moduleIcons = {
    album: Images,
    drafts: NotePencil,
    recorder: MusicNotes,
    shelf: BookOpenText,
    wishlist: Sparkle,
    vault: LockKey,
  } as const

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1800)
  }

  const openStudyModule = (moduleId: string) => {
    if (moduleId === 'vault') {
      setVaultDialogOpen(true)
      return
    }
    navigate(withScenario(`/frame/study/module/${moduleId}`))
  }

  const handleStudyPhotoSelected = (source: 'camera' | 'album', input: HTMLInputElement) => {
    const count = input.files?.length || 0
    if (count > 0) {
      showToast(source === 'camera' ? '照片已拍摄，已放入故事素材' : `已选择 ${count} 张照片，已放入故事素材`)
      setUploadSheetOpen(false)
      input.value = ''
    }
  }

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario('/frame'))} aria-label="返回相框">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>个人书房</h1>
      </header>
      <main className={isV1Variant ? 'frame-study-entry frame-study-entry--v1' : 'frame-study-entry'}>
        <section className="frame-study-entry__modules" aria-label="个人书房入口">
          {modules.map((module) => (
            <button className={`frame-study-module-card frame-study-module-card--${module.id}`} key={module.id} type="button" onClick={() => openStudyModule(module.id)}>
              {(() => {
                const ModuleIcon = moduleIcons[module.id as keyof typeof moduleIcons] || BookOpenText
                return <ModuleIcon size={34} weight="duotone" />
              })()}
              <strong>{module.title}</strong>
              <p>{module.description}</p>
            </button>
          ))}
        </section>
        {isV1Variant ? null : (
          <section className="frame-study-entry__actions" aria-label="创作入口">
            <button className="frame-study-create-entry frame-study-create-entry--diary" type="button" onClick={() => navigate(withScenario('/frame/diary'))}>
              <CalendarBlank size={42} weight="duotone" />
              <strong>聊今天</strong>
              <span>和 AI 聊今天，日记打卡报平安</span>
            </button>
            <button className="frame-study-create-entry frame-study-create-entry--river" type="button" onClick={() => navigate(withScenario('/frame/river'))}>
              <BookOpenText size={42} weight="duotone" />
              <strong>聊过去</strong>
              <span>和 AI 聊往事，生成精美回忆故事</span>
            </button>
          </section>
        )}
      </main>
      {uploadSheetOpen ? (
        <div className="home-drawer-overlay frame-study-upload-drawer" role="presentation" onClick={() => setUploadSheetOpen(false)}>
          <section className="home-action-drawer" role="dialog" aria-modal="true" aria-labelledby="frame-study-upload-title" onClick={(event) => event.stopPropagation()}>
            <div className="home-action-drawer__header">
              <div>
                <h2 id="frame-study-upload-title">上传照片</h2>
              </div>
              <button className="home-action-drawer__close" type="button" aria-label="关闭上传照片" onClick={() => setUploadSheetOpen(false)}>
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <div className="home-action-drawer__body">
              <label className="home-action-option">
                <span className="home-action-option__icon" aria-hidden="true">
                  <Camera size={28} weight="regular" />
                </span>
                <span>
                  <strong>拍摄</strong>
                </span>
                <input className="home-action-option__input" type="file" accept="image/*" capture="environment" onChange={(event) => handleStudyPhotoSelected('camera', event.currentTarget)} />
              </label>
              <label className="home-action-option">
                <span className="home-action-option__icon" aria-hidden="true">
                  <Images size={28} weight="regular" />
                </span>
                <span>
                  <strong>从相册选择</strong>
                </span>
                <input className="home-action-option__input" type="file" accept="image/*" multiple onChange={(event) => handleStudyPhotoSelected('album', event.currentTarget)} />
              </label>
            </div>
          </section>
        </div>
      ) : null}
      {vaultDialogOpen ? (
        <div className="frame-study-vault-overlay" role="presentation" onClick={() => setVaultDialogOpen(false)}>
          <section className="frame-study-vault-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-study-vault-title" onClick={(event) => event.stopPropagation()}>
            <ShieldCheck size={54} weight="fill" />
            <h2 id="frame-study-vault-title">私密保险箱</h2>
            <p>请面向相框进行人脸识别</p>
            <div className="frame-study-vault-face" aria-hidden="true">
              <UserFocus size={118} weight="duotone" />
            </div>
            <div className="frame-study-vault-actions">
              <button type="button" onClick={() => setVaultDialogOpen(false)}>取消</button>
            </div>
          </section>
        </div>
      ) : null}
      {toastMessage ? <div className="frame-settings-toast">{toastMessage}</div> : null}
    </FramePageShell>
  )
}

export function FrameStudyWritePage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const [activeTopicId, setActiveTopicId] = useState('daily')
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([])
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isAutoSosEnabled, setIsAutoSosEnabled] = useState(true)
  const [isAutoSosDialogOpen, setIsAutoSosDialogOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const activeScenarioId = getActiveScenarioId()
  const sosContactName = activeScenarioId === 'ama-letter' ? '晓伟' : '知夏'

  const fixedTopics = [
    {
      id: 'daily',
      title: '今天都做了什么？',
      navLabel: '今天做了什么',
      hint: '淑柔阿嫲，又到每天记日记的时候了。我们先聊聊今天，上午有没有发生什么让您印象比较深的事？',
    },
    {
      id: 'mood',
      title: '今天有什么开心、幸福或难过的事？',
      navLabel: '心情小事',
      hint: '今天有没有一个小瞬间，让您心里觉得开心、踏实，或者有点难过？',
    },
    {
      id: 'body',
      title: '今天身体感觉怎么样？',
      navLabel: '身体感受',
      hint: '今天身体有没有给您什么提醒？睡觉、吃饭、走路里，哪一样感觉最明显？',
    },
  ]

  const freeTopic = {
    id: 'free',
    title: '随便聊',
    navLabel: '随便聊',
    hint: activeScenarioId === 'ama-letter'
      ? '淑柔阿嫲，楚龙前几天给您带了凤凰单丛。我发现您很爱喝茶，今天想不想从这杯茶聊起？'
      : '不按题目也可以。今天脑子里最常冒出来的一件事，是什么？',
  }

  const allTopics = [...fixedTopics, freeTopic]
  const guidedTopics = fixedTopics
  const activeTopic = allTopics.find((topic) => topic.id === activeTopicId) || fixedTopics[0]
  const completedFixedCount = fixedTopics.filter((topic) => completedTopicIds.includes(topic.id)).length
  const completedGuidedCount = guidedTopics.filter((topic) => completedTopicIds.includes(topic.id)).length
  const activeTopicIndex = allTopics.findIndex((topic) => topic.id === activeTopicId)
  const isActiveFixedTopic = activeTopicIndex >= 0 && activeTopicIndex < fixedTopics.length
  const diaryDone = completedFixedCount >= fixedTopics.length
  const checkinDone = isCheckedIn || diaryDone
  const getNextTopicButtonLabel = () => {
    if (activeTopic.id === 'free') return '记好了'
    if (isActiveFixedTopic && completedFixedCount === fixedTopics.length - 1 && !completedTopicIds.includes(activeTopic.id)) return '完成打卡'
    return '下一个'
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1800)
  }

  const goNextTopic = () => {
    const nextCompletedTopicIds = completedTopicIds.includes(activeTopicId) ? completedTopicIds : [...completedTopicIds, activeTopicId]
    setCompletedTopicIds(nextCompletedTopicIds)
    const topicIndex = allTopics.findIndex((topic) => topic.id === activeTopicId)
    const nextTopic = allTopics[Math.min(topicIndex + 1, allTopics.length - 1)]
    setActiveTopicId(nextTopic.id)
    if (fixedTopics.every((topic) => nextCompletedTopicIds.includes(topic.id))) {
      setIsCheckedIn(true)
      showToast('今日打卡已完成')
    }
  }

  const quickCheckin = () => {
    setIsCheckedIn(true)
    showToast('已直接报平安，稍后也可以继续聊日记')
  }

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-diary-page frame-light-nav-page" mode={mode}>
      <main className="frame-diary-workspace" aria-label="AI日记">
        <aside className="frame-diary-sidebar" aria-label="AI日记引导">
          <div className="frame-diary-sidebar__top">
            <button className="frame-diary-back" type="button" onClick={() => navigate(withScenario('/frame'))} aria-label="返回相框首页">
              <CaretLeft size={34} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <section className={`frame-diary-checkin-card ${checkinDone ? 'is-done' : ''}`} aria-label="今日打卡状态">
            <span className="frame-diary-checkin-card__icon" aria-hidden="true">
              {checkinDone ? <CheckCircle size={42} weight="fill" /> : <ClockCounterClockwise size={42} weight="duotone" />}
            </span>
            <div>
              <strong>6月13日</strong>
              <span>{checkinDone ? '已打卡' : '未打卡'}</span>
            </div>
          </section>

          <section className="frame-diary-topic-panel" aria-label="今日话题进度">
            <div className="frame-diary-topic-panel__header">
              <span>今日话题</span>
              <strong>{completedGuidedCount}/{guidedTopics.length}</strong>
            </div>
            <ol>
              {allTopics.map((topic, index) => {
                const isFixedTopic = index < fixedTopics.length
                const isDone = isFixedTopic && completedTopicIds.includes(topic.id)
                const isActive = topic.id === activeTopicId

                return (
                  <li key={topic.id} className={`${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}>
                    <button type="button" onClick={() => setActiveTopicId(topic.id)}>
                      <span>{index + 1}</span>
                      <p>{topic.navLabel}</p>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="frame-diary-sidebar-actions" aria-label="打卡操作">
            <button className="frame-diary-action-entry" type="button" onClick={() => navigate(withScenario('/frame/health/checkin?from=diary'))}>
              <ClockCounterClockwise size={28} weight="duotone" />
              <span>打卡记录与奖励</span>
            </button>
            <button className="frame-diary-action-entry" type="button" onClick={() => setIsAutoSosDialogOpen(true)}>
              <ShieldCheck size={28} weight="duotone" />
              <span>自动SOS{isAutoSosEnabled ? '已开' : '已关'}</span>
            </button>
            <button className="frame-diary-action-checkin-note" type="button" onClick={quickCheckin} disabled={checkinDone}>
              <span>聊三个话题完成打卡，不想聊可报个</span>
              <span className="frame-diary-action-checkin-note__tail">
                平安，
                <strong>
                  {checkinDone ? '已报平安' : '立即打卡'}
                  {!checkinDone ? <CaretRight size={16} weight="bold" aria-hidden="true" /> : null}
                </strong>
              </span>
            </button>
          </div>
        </aside>

        <section className="frame-diary-main" aria-label="今日日记聊天">
          <div className="frame-diary-chat-header">
            <h2>{activeTopic.title}</h2>
            <button type="button" onClick={goNextTopic}>{getNextTopicButtonLabel()}</button>
          </div>
          <div className="frame-diary-chat-stream">
            <article>
              <p>{activeTopic.hint}</p>
            </article>
          </div>
          <div className="frame-diary-compose">
            <button type="button" aria-label="切换键盘输入">
              <Keyboard size={34} weight="bold" aria-hidden="true" />
            </button>
            <button className="frame-diary-compose__hold" type="button" aria-label="按住说话">
              按住说话
            </button>
            <button type="button" aria-label="添加图片或附件">
              <Plus size={34} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
      {toastMessage ? <div className="frame-settings-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
      {isAutoSosDialogOpen ? (
        <div className="frame-health-auto-sos-modal" role="dialog" aria-modal="true" aria-labelledby="frame-diary-auto-sos-title" onClick={() => setIsAutoSosDialogOpen(false)}>
          <section className="frame-health-auto-sos-card" onClick={(event) => event.stopPropagation()}>
            <button className="frame-health-auto-sos-card__close" type="button" onClick={() => setIsAutoSosDialogOpen(false)} aria-label="关闭自动SOS说明">
              <X size={30} weight="bold" />
            </button>
            <h2 id="frame-diary-auto-sos-title">自动SOS</h2>
            <button
              className={isAutoSosEnabled ? 'frame-health-auto-sos-card__switch is-on' : 'frame-health-auto-sos-card__switch'}
              type="button"
              aria-pressed={isAutoSosEnabled}
              onClick={() => setIsAutoSosEnabled((current) => !current)}
            >
              <span aria-hidden="true" />
              <strong>{isAutoSosEnabled ? '已开启' : '已关闭'}</strong>
            </button>
            <p>连续 3 天未打卡，SOS 自动通知{sosContactName}。</p>
          </section>
        </div>
      ) : null}
    </FramePageShell>
  )
}

export function FrameStudyResultPage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()

  return (
    <FramePageShell className="frame-space-page" mode={mode}>
      <header className="frame-space-topbar">
        <button type="button" onClick={() => navigate(withScenario('/frame/study/write'))} aria-label="返回创作页">
          <CaretLeft size={36} weight="bold" />
        </button>
        <div>
          <span>成稿阅读</span>
          <h1>小时候的家</h1>
        </div>
      </header>
      <article className="frame-space-paper">
        <p>小时候的家不大，院子却像一整个世界。门口有一棵香椿树，春天刚冒芽时，家里人就知道又到了换季的时候。</p>
        <p>傍晚最热闹。大人收工回来，孩子们从巷口跑进跑出，厨房里先响起锅铲声，再慢慢飘出饭香。</p>
        <div className="frame-space-actions">
          <button type="button" onClick={() => navigate(withScenario('/frame/study/write'))}>继续润色</button>
          <button type="button" onClick={() => navigate(withScenario('/frame/family'))}>分享给家人</button>
        </div>
      </article>
    </FramePageShell>
  )
}
