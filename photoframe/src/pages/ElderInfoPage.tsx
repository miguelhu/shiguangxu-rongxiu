import { ArrowLeft, CaretRight, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const genderOptions = [
  { label: '点击选择', value: '' },
  { label: '女', value: 'female' },
  { label: '男', value: 'male' },
]

const relationOptions = ['点击选择', '外婆', '奶奶', '妈妈', '爷爷', '外公', '爸爸', '其他']
const birthYearOptions = Array.from({ length: 2026 - 1920 + 1 }, (_, index) => String(2026 - index))
const PROFILE_TAG_LIMIT = 3

const profileSections = [
  {
    title: '生活与兴趣',
    items: [
      {
        id: 'interests',
        label: '兴趣爱好',
        selected: ['做饭', '养花', '听戏'],
        options: ['做饭', '养花', '听戏', '散步', '唱歌', '下棋', '看电视剧', '拍照'],
      },
      {
        id: 'dailyRhythm',
        label: '日常习惯',
        selected: ['早起', '饭后散步'],
        options: ['早起', '午睡', '饭后散步', '晚饭早', '喜欢晒太阳', '常看新闻', '睡前听广播', '周末赶集'],
      },
      {
        id: 'memoryTopics',
        label: '爱聊往事',
        selected: ['老家', '年轻工作', '孩子小时候'],
        options: ['老家', '年轻工作', '孩子小时候', '结婚故事', '邻里旧事', '节日习俗', '拿手菜', '旅行经历'],
      },
    ],
  },
  {
    title: '沟通偏好',
    items: [
      {
        id: 'conversationTopics',
        label: '爱聊话题',
        selected: ['天气', '家里近况'],
        options: ['天气', '家里近况', '吃饭', '照片', '健康', '孩子近况', '节日安排', '老朋友'],
      },
      {
        id: 'careStyle',
        label: '关心方式',
        selected: ['多问近况', '少催促'],
        options: ['多问近况', '少催促', '先分享再询问', '语气轻松', '多夸奖', '少讲道理', '慢慢解释', '多发照片'],
      },
      {
        id: 'avoidTopics',
        label: '少提内容',
        selected: ['催就医', '反复提醒'],
        options: ['催就医', '反复提醒', '比较同龄人', '花钱多少', '责备语气', '太复杂的问题', '隐私细节', '旧矛盾'],
      },
    ],
  },
]

type ProfileSection = (typeof profileSections)[number]
type ProfileItem = ProfileSection['items'][number]
type BasicPickerType = 'gender' | 'birthYear' | 'relation'
type WizardQuestion =
  | { id: 'name'; title: string; description: string; type: 'name' }
  | { id: 'gender'; title: string; description: string; type: 'single'; options: typeof genderOptions }
  | { id: 'birthYear'; title: string; description: string; type: 'birthYear' }
  | { id: 'relation'; title: string; description: string; type: 'relation' }
  | { id: string; title: string; description: string; type: 'tags'; item: ProfileItem }

const profileItems = profileSections.flatMap((section) => section.items)
const genderPickerOptions = genderOptions.filter((option) => option.value)
const relationPickerOptions = relationOptions.filter((option) => option !== '点击选择').map((option) => ({ label: option, value: option }))
const birthYearPickerOptions = birthYearOptions.map((year) => ({ label: year, value: year }))

const wizardQuestions: WizardQuestion[] = [
  { id: 'name', title: '老人怎么称呼？', description: '填一个家里最常叫的名字就好。', type: 'name' },
  { id: 'gender', title: '老人性别是？', description: '用于让 AI 选择更合适的称呼。', type: 'single', options: genderOptions.filter((option) => option.value) },
  { id: 'birthYear', title: '老人是哪一年出生的？', description: '请选择老人的出生年份，帮助 AI 理解年龄阶段。', type: 'birthYear' },
  { id: 'relation', title: '你平时怎么称呼 TA？', description: '这个称呼会影响后续互动里的语气。', type: 'relation' },
  ...profileItems.map((item) => ({
    id: item.id,
    title: `${item.label}有哪些？`,
    description: `最多选择${PROFILE_TAG_LIMIT}个，选你最确定的就好。`,
    type: 'tags' as const,
    item,
  })),
]

export function ElderInfoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromProfile = searchParams.get('from') === 'profile'
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [relation, setRelation] = useState('')
  const [customRelation, setCustomRelation] = useState('')
  const [profileTags, setProfileTags] = useState<Record<string, string[]>>(
    Object.fromEntries(profileItems.map((item) => [item.id, fromProfile ? item.selected : []])),
  )
  const [activeBasicPicker, setActiveBasicPicker] = useState<BasicPickerType | null>(null)
  const [activeProfileItem, setActiveProfileItem] = useState<ProfileItem | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [wizardStarted, setWizardStarted] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [topbarPinned, setTopbarPinned] = useState(false)
  const basicPickerListRef = useRef<HTMLDivElement | null>(null)
  const normalizedRelation = relation === '其他' ? customRelation.trim() : relation
  const canSubmit =
    name.trim().length > 0 &&
    gender.length > 0 &&
    birthYear.length > 0 &&
    normalizedRelation.length > 0 &&
    !submitting
  const isSetupWizard = !fromProfile
  const backTarget = fromProfile ? '/member/profile' : '/member/entry'
  const submitTarget = fromProfile ? '/member/profile' : '/member/home?created=1'
  const currentWizardQuestion = wizardQuestions[wizardStep]
  const wizardProgress = Math.round(((wizardStep + 1) / wizardQuestions.length) * 100)
  const selectedGenderLabel = genderOptions.find((option) => option.value === gender)?.label || '点击选择'

  const basicPickerConfig = (() => {
    if (activeBasicPicker === 'gender') {
      return {
        title: '选择性别',
        value: gender,
        options: genderPickerOptions,
        onSelect: (value: string) => setGender(value),
      }
    }

    if (activeBasicPicker === 'birthYear') {
      return {
        title: '选择出生年份',
        value: birthYear,
        options: birthYearPickerOptions,
        onSelect: (value: string) => setBirthYear(value),
      }
    }

    if (activeBasicPicker === 'relation') {
      return {
        title: '选择关系',
        value: relation,
        options: relationPickerOptions,
        onSelect: (value: string) => setRelation(value),
      }
    }

    return null
  })()

  const submitProfile = () => {
    if (!canSubmit) return
    setSubmitting(true)
    window.setTimeout(() => {
      navigate(submitTarget)
    }, 800)
  }

  useEffect(() => {
    const updateTopbarState = () => setTopbarPinned(window.scrollY > 8)

    updateTopbarState()
    window.addEventListener('scroll', updateTopbarState, { passive: true })
    window.addEventListener('resize', updateTopbarState)

    return () => {
      window.removeEventListener('scroll', updateTopbarState)
      window.removeEventListener('resize', updateTopbarState)
    }
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (activeBasicPicker !== 'birthYear') return undefined

    const frame = window.requestAnimationFrame(() => {
      const targetYear = birthYear || '1970'
      const target = basicPickerListRef.current?.querySelector<HTMLButtonElement>(`[data-picker-value="${targetYear}"]`)
      target?.scrollIntoView({ block: 'center' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeBasicPicker, birthYear])

  const toggleProfileTag = (item: ProfileItem, tag: string) => {
    setProfileTags((current) => {
      const currentTags = current[item.id] ?? []
      if (currentTags.includes(tag)) {
        return { ...current, [item.id]: currentTags.filter((selectedTag) => selectedTag !== tag) }
      }

      if (currentTags.length >= PROFILE_TAG_LIMIT) {
        setToastMessage(`最多只能选择${PROFILE_TAG_LIMIT}个标签`)
        return current
      }

      return { ...current, [item.id]: [...currentTags, tag] }
    })
  }

  const goToNextWizardStep = () => {
    if (wizardStep >= wizardQuestions.length - 1) {
      submitProfile()
      return
    }

    setWizardStep((current) => Math.min(wizardQuestions.length - 1, current + 1))
  }

  const goToPreviousWizardStep = () => {
    if (wizardStep === 0) {
      setWizardStarted(false)
      return
    }

    setWizardStep((current) => Math.max(0, current - 1))
  }

  const selectWizardTag = (item: ProfileItem, tag: string) => {
    const currentTags = profileTags[item.id] ?? []
    if (currentTags.includes(tag)) {
      setProfileTags((current) => ({
        ...current,
        [item.id]: (current[item.id] ?? []).filter((selectedTag) => selectedTag !== tag),
      }))
      return
    }

    if (currentTags.length >= PROFILE_TAG_LIMIT) {
      setToastMessage(`最多只能选择${PROFILE_TAG_LIMIT}个标签`)
      return
    }

    setProfileTags((current) => ({
      ...current,
      [item.id]: [...(current[item.id] ?? []), tag],
    }))
  }

  const renderWizardAnswer = (question: WizardQuestion) => {
    if (question.type === 'name') {
      return (
        <div className="elder-wizard-answer">
          <input
            className="elder-wizard-input"
            value={name}
            maxLength={12}
            autoComplete="off"
            enterKeyHint="next"
            placeholder="比如：林秀兰"
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </div>
      )
    }

    if (question.type === 'single') {
      return (
        <div className="elder-wizard-options">
          {question.options.map((option) => (
            <button
              className={gender === option.value ? 'elder-wizard-option elder-wizard-option--selected' : 'elder-wizard-option'}
              type="button"
              key={option.value}
              onClick={() => setGender(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    }

    if (question.type === 'birthYear') {
      return (
        <div className="elder-wizard-answer">
          <button
            className={birthYear ? 'elder-wizard-select' : 'elder-wizard-select elder-wizard-select--empty'}
            type="button"
            onClick={() => setActiveBasicPicker('birthYear')}
          >
            <span className="elder-wizard-select__value">{birthYear || '点击选择出生年份'}</span>
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )
    }

    if (question.type === 'relation') {
      return (
        <div className="elder-wizard-answer">
          <div className="elder-wizard-options">
            {relationOptions
              .filter((option) => option !== '点击选择')
              .map((option) => (
                <button
                  className={relation === option ? 'elder-wizard-option elder-wizard-option--selected' : 'elder-wizard-option'}
                  type="button"
                  key={option}
                  onClick={() => setRelation(option)}
                >
                  {option}
                </button>
              ))}
          </div>
          {relation === '其他' ? (
            <input
              className="elder-wizard-input elder-wizard-input--inline"
              value={customRelation}
              maxLength={8}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="比如：姨婆"
              onChange={(event) => setCustomRelation(event.currentTarget.value)}
            />
          ) : null}
        </div>
      )
    }

    const selectedTags = profileTags[question.item.id] ?? []
    return (
      <div className="elder-wizard-answer">
        <div className="elder-wizard-tags">
          {question.item.options.map((tag) => (
            <button
              className={selectedTags.includes(tag) ? 'elder-wizard-option elder-wizard-option--selected' : 'elder-wizard-option'}
              type="button"
              key={tag}
              onClick={() => selectWizardTag(question.item, tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const canContinueWizard = (() => {
    if (!currentWizardQuestion || submitting) return false
    if (currentWizardQuestion.type === 'name') return name.trim().length > 0
    if (currentWizardQuestion.type === 'relation') return normalizedRelation.length > 0
    if (currentWizardQuestion.type === 'tags') return (profileTags[currentWizardQuestion.item.id] ?? []).length > 0
    if (currentWizardQuestion.type === 'single') return gender.length > 0
    if (currentWizardQuestion.type === 'birthYear') return birthYear.length > 0
    return false
  })()

  if (isSetupWizard && !wizardStarted) {
    return (
      <main className="proto-page proto-page--form elder-wizard-page" aria-label="首次填写老人信息">
        <header className={topbarPinned ? 'proto-topbar-static elder-wizard-topbar elder-wizard-topbar--pinned' : 'proto-topbar-static elder-wizard-topbar'}>
          <button type="button" aria-label="返回" onClick={() => navigate(backTarget)}>
            <ArrowLeft size={21} weight="bold" aria-hidden="true" />
          </button>
          <h1>创建家庭</h1>
          <span className="proto-topbar-static__spacer" aria-hidden="true" />
        </header>

        <section className="elder-wizard-intro" aria-label="开始填写老人信息">
          <img className="elder-wizard-intro__art" src="/elderly-couple-reference-transparent-cropped.png" alt="" aria-hidden="true" />
          <h2>花30秒，让AI更懂你的家人</h2>
          <p>回答几个很轻的问题，AI 就能更自然地理解老人的生活习惯、爱聊的话题和不适合打扰的地方。</p>
          <button className="proto-primary-button" type="button" onClick={() => setWizardStarted(true)}>
            开始填写
          </button>
        </section>
      </main>
    )
  }

  if (isSetupWizard && currentWizardQuestion) {
    return (
      <main className="proto-page proto-page--form elder-wizard-page" aria-label="首次填写老人信息">
        <header className={topbarPinned ? 'proto-topbar-static elder-wizard-topbar elder-wizard-topbar--pinned' : 'proto-topbar-static elder-wizard-topbar'}>
          <button type="button" aria-label="返回上一题" onClick={goToPreviousWizardStep}>
            <ArrowLeft size={21} weight="bold" aria-hidden="true" />
          </button>
          <h1>老人信息</h1>
          <span className="elder-wizard-count">{wizardStep + 1}/{wizardQuestions.length}</span>
        </header>

        <section className="elder-wizard-progress" aria-label={`当前第 ${wizardStep + 1} 题，共 ${wizardQuestions.length} 题`}>
          <span style={{ width: `${wizardProgress}%` }} />
        </section>

        <section className="elder-wizard-card" aria-label={currentWizardQuestion.title}>
          <p className="elder-wizard-kicker">第 {wizardStep + 1} 题</p>
          <h2>{currentWizardQuestion.title}</h2>
          <p>{currentWizardQuestion.description}</p>
          {renderWizardAnswer(currentWizardQuestion)}
        </section>

        <div className="proto-bottom-action elder-wizard-bottom">
          <button className="proto-primary-button" type="button" disabled={!canContinueWizard} onClick={goToNextWizardStep}>
            {wizardStep >= wizardQuestions.length - 1 ? (submitting ? '创建中' : '完成创建') : '下一题'}
          </button>
        </div>

        {toastMessage ? <div className="home-toast" role="status">{toastMessage}</div> : null}
        {basicPickerConfig ? (
          <div className="home-drawer-overlay" role="presentation" onClick={() => setActiveBasicPicker(null)}>
            <section
              className="home-action-drawer elder-basic-picker-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="elder-basic-picker-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="home-action-drawer__header">
                <div>
                  <h2 id="elder-basic-picker-title">{basicPickerConfig.title}</h2>
                </div>
                <button className="home-action-drawer__close" type="button" aria-label="关闭选择" onClick={() => setActiveBasicPicker(null)}>
                  <X size={18} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <div
                className={activeBasicPicker === 'birthYear' ? 'elder-basic-picker-list elder-basic-picker-list--scroll' : 'elder-basic-picker-list'}
                ref={activeBasicPicker === 'birthYear' ? basicPickerListRef : undefined}
              >
                {basicPickerConfig.options.map((option) => (
                  <button
                    className={basicPickerConfig.value === option.value ? 'elder-basic-picker-option elder-basic-picker-option--selected' : 'elder-basic-picker-option'}
                    data-picker-value={option.value}
                    type="button"
                    key={option.value}
                    onClick={() => {
                      basicPickerConfig.onSelect(option.value)
                      setActiveBasicPicker(null)
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="proto-page proto-page--form" aria-label="老人信息">
      <form autoComplete="off" onSubmit={(event) => event.preventDefault()}>
        <header className={topbarPinned ? 'proto-topbar-static proto-topbar-static--pinned' : 'proto-topbar-static'}>
          <button type="button" aria-label="返回" onClick={() => navigate(backTarget)}>
            <ArrowLeft size={21} weight="bold" aria-hidden="true" />
          </button>
          <h1>老人信息</h1>
          <span className="proto-topbar-static__spacer" aria-hidden="true" />
        </header>

        <div className="proto-section-heading elder-section-heading elder-section-heading--outside">
          <h2>基础信息</h2>
        </div>
        <section className="proto-card elder-form-card" aria-label="基础信息">
          <label className="elder-form-row">
            <span>老人名字</span>
            <input
              name="elder-name"
              value={name}
              maxLength={12}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="请填写老人名字"
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <button className="elder-form-row elder-form-row--button" type="button" onClick={() => setActiveBasicPicker('gender')}>
            <span>性别</span>
            <span className={gender ? 'elder-select-shell' : 'elder-select-shell elder-select-shell--empty'}>
              <span className="elder-select-shell__value">{selectedGenderLabel}</span>
              <CaretRight size={15} weight="bold" aria-hidden="true" />
            </span>
          </button>
          <button className="elder-form-row elder-form-row--button" type="button" onClick={() => setActiveBasicPicker('birthYear')}>
            <span>出生年份</span>
            <span className={birthYear ? 'elder-select-shell' : 'elder-select-shell elder-select-shell--empty'}>
              <span className="elder-select-shell__value">{birthYear || '点击选择'}</span>
              <CaretRight size={15} weight="bold" aria-hidden="true" />
            </span>
          </button>
          <button className="elder-form-row elder-form-row--button" type="button" onClick={() => setActiveBasicPicker('relation')}>
            <span>与我的关系</span>
            <span className={relation ? 'elder-select-shell' : 'elder-select-shell elder-select-shell--empty'}>
              <span className="elder-select-shell__value">{relation || '点击选择'}</span>
              <CaretRight size={15} weight="bold" aria-hidden="true" />
            </span>
          </button>
          {relation === '其他' ? (
            <label className="elder-form-row elder-form-row--custom">
              <span>关系称呼</span>
              <input
                name="elder-custom-relation"
                value={customRelation}
                maxLength={8}
                autoComplete="off"
                enterKeyHint="next"
                placeholder="比如：姨婆"
                onChange={(event) => setCustomRelation(event.currentTarget.value)}
              />
            </label>
          ) : null}
        </section>

        {profileSections.map((section) => (
          <div key={section.title}>
            <div className="proto-section-heading elder-section-heading elder-section-heading--outside">
              <h2>{section.title}</h2>
            </div>
            <section className="proto-card elder-form-card elder-profile-card" aria-label={section.title}>
              {section.items.map((item) => {
                const selectedTags = profileTags[item.id] ?? []
                return (
                  <button className="elder-form-row elder-form-row--button" type="button" key={item.id} onClick={() => setActiveProfileItem(item)}>
                    <span>{item.label}</span>
                    <span className={selectedTags.length ? 'elder-tag-summary' : 'elder-tag-summary elder-tag-summary--empty'}>
                      <span>{selectedTags.length ? selectedTags.join(' ') : '点击选择'}</span>
                      <CaretRight size={15} weight="bold" aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </section>
          </div>
        ))}
      </form>

      {activeProfileItem ? (
        <div className="home-drawer-overlay" role="presentation" onClick={() => setActiveProfileItem(null)}>
          <section
            className="home-action-drawer elder-tag-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="elder-tag-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-action-drawer__header">
              <div>
                <h2 id="elder-tag-drawer-title">{activeProfileItem.label}</h2>
              </div>
              <button className="home-action-drawer__close" type="button" aria-label="关闭选择" onClick={() => setActiveProfileItem(null)}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <p className="elder-tag-drawer__hint">最多选择{PROFILE_TAG_LIMIT}个</p>
            <div className="elder-tag-grid">
              {activeProfileItem.options.map((tag) => {
                const selected = profileTags[activeProfileItem.id]?.includes(tag) ?? false
                return (
                  <button
                    className={selected ? 'elder-tag-option elder-tag-option--selected' : 'elder-tag-option'}
                    type="button"
                    key={tag}
                    onClick={() => toggleProfileTag(activeProfileItem, tag)}
                  >
                    <span>{tag}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
      {basicPickerConfig ? (
        <div className="home-drawer-overlay" role="presentation" onClick={() => setActiveBasicPicker(null)}>
          <section
            className="home-action-drawer elder-basic-picker-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="elder-basic-picker-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-action-drawer__header">
              <div>
                <h2 id="elder-basic-picker-title">{basicPickerConfig.title}</h2>
              </div>
              <button className="home-action-drawer__close" type="button" aria-label="关闭选择" onClick={() => setActiveBasicPicker(null)}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div
              className={activeBasicPicker === 'birthYear' ? 'elder-basic-picker-list elder-basic-picker-list--scroll' : 'elder-basic-picker-list'}
              ref={activeBasicPicker === 'birthYear' ? basicPickerListRef : undefined}
            >
              {basicPickerConfig.options.map((option) => (
                <button
                  className={basicPickerConfig.value === option.value ? 'elder-basic-picker-option elder-basic-picker-option--selected' : 'elder-basic-picker-option'}
                  data-picker-value={option.value}
                  type="button"
                  key={option.value}
                  onClick={() => {
                    basicPickerConfig.onSelect(option.value)
                    setActiveBasicPicker(null)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {toastMessage ? <div className="home-toast" role="status">{toastMessage}</div> : null}
    </main>
  )
}
