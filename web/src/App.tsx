import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  DotsThree,
  Envelope,
  Flower,
  FrameCorners,
  GearSix,
  Heart,
  Image as ImageIcon,
  Info,
  Leaf,
  List,
  Microphone,
  PaperPlaneTilt,
  Pause,
  Play,
  Plus,
  QrCode,
  SlidersHorizontal,
  Sparkle,
  SpeakerHigh,
  UsersThree,
  WifiHigh,
  X,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { asset, cases, steps, type CaseId, type ContentType } from './data'
import EntryFlow, { HostBadge } from './EntryFlow'
import AccountPages from './AccountPages'
import { StickerPicker, VoiceCard, voiceText } from './MediaExtras'
import { imageSource, loadState, newCase, seedToStep, STORAGE_KEY, type CaseState } from './store'

function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  secondary?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`${secondary ? 'button secondary' : 'button'} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      className={`toggle ${checked ? 'on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  )
}
function Avatar({ id, small = false }: { id: CaseId; small?: boolean }) {
  return (
    <img
      className={`avatar ${small ? 'small' : ''}`}
      src={asset(cases.find((c) => c.id === id)!.image)}
      alt={cases.find((c) => c.id === id)!.name}
    />
  )
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [casePicker, setCasePicker] = useState(false)
  const [notes, setNotes] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<
    'media' | 'settings' | 'original' | 'detail' | 'reset' | 'identity' | null
  >(null)
  const [mediaFor, setMediaFor] = useState<'photo' | 'greetingPhoto' | 'onsite'>('photo')
  const [tab, setTab] = useState<'people' | 'messages' | 'me'>('people')
  const [personDetail, setPersonDetail] = useState(false)
  const [reminderChannel, setReminderChannel] = useState<'app' | 'wechat'>('app')
  const [reminderOpen, setReminderOpen] = useState(false)
  const [ritualSlide, setRitualSlide] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [formError, setFormError] = useState('')
  const [historyDetail, setHistoryDetail] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const baseCase = cases.find((x) => x.id === state.caseId)!
  const s = state.cases[baseCase.id]
  const host = s.host
  const c = host.configured
    ? {
        ...baseCase,
        name: host.recipientName,
        address: host.address,
        profession: host.profession,
        image: host.photo,
        organization: host.organizer || '亲友相聚',
        retirement: host.date.split('-').join('.'),
        title: `把记得的瞬间，送给${host.address}。`,
        roleLabel: host.eventType === 'birthday' ? '生日相聚' : baseCase.roleLabel,
        timeline: [{ year: host.date.slice(0, 4), text: host.title }],
      }
    : baseCase
  const entryActive = state.step === 0 && state.entryView !== 'invitation'
  const eventLabel = host.configured && host.eventType === 'birthday' ? '生日相聚' : '荣休礼'
  const hasGreeting = s.delivery !== 'none' || s.greetingHistory.length > 0
  const detailContent =
    historyDetail === null
      ? {
          body: s.greeting,
          photo: s.greetingPhoto,
          delivery: s.delivery,
          sticker: s.greetingSticker,
          voice: s.greetingVoice,
        }
      : s.greetingHistory[historyDetail]
  const step = steps[state.step]
  const isFrame = step.id === 'ceremony' || step.id === 'received'
  const src = (value: string) => imageSource(value, import.meta.env.BASE_URL)
  const patch = (p: Partial<CaseState>) =>
    setState((old) => ({
      ...old,
      cases: { ...old.cases, [old.caseId]: { ...old.cases[old.caseId], ...p } },
    }))
  const inform = (message: string) => setToast(message)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      setToast('浏览器存储空间不足，当前内容仍可继续演示；刷新前请保留输入。')
    }
  }, [state])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(t)
  }, [toast])
  useEffect(() => {
    window.scrollTo(0, 0)
    phoneRef.current?.scrollTo(0, 0)
    setHistoryDetail(null)
    setFormError('')
    setModal(null)
    setRecording(false)
    setPlaying(false)
    setRitualSlide(0)
  }, [state.step, state.caseId])
  useEffect(() => {
    if (!playing || step.id !== 'ceremony') return
    const t = window.setInterval(() => setRitualSlide((x) => (x + 1) % 4), 5000)
    return () => window.clearInterval(t)
  }, [playing, step.id])
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCasePicker(false)
        setModal(null)
        setMobileNav(false)
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  function go(index: number, loadFixture = false) {
    setState((old) => ({
      ...old,
      step: index,
      entryView: 'invitation',
      cases: {
        ...old.cases,
        [old.caseId]: loadFixture
          ? seedToStep(old.cases[old.caseId], index)
          : old.cases[old.caseId],
      },
    }))
    setMobileNav(false)
    setPersonDetail(false)
    setReminderOpen(false)
    if (loadFixture && index > 2) inform('已载入本章节的演示前置数据，可以直接体验。')
  }
  function switchCase(id: CaseId) {
    setState((old) => ({ ...old, caseId: id, step: 0 }))
    setCasePicker(false)
    setPersonDetail(false)
    setTab('people')
  }
  function submitMemory() {
    if (!s.body.trim() && !s.photo && !s.sticker && !s.voice) {
      setFormError('请先留一段文字或选择一张照片。')
      return false
    }
    if (!s.consentGift) {
      setFormError(`请先确认将这份内容送给${c.address}。`)
      return false
    }
    patch({ submitted: true })
    setFormError('')
    go(3)
    inform('这份心意已收到，开始整理。')
    return true
  }
  function freeze() {
    if (s.frozen) return
    patch({
      frozen: {
        title: s.title,
        body: s.body,
        author: s.author,
        included: s.consentCeremony,
        image: s.photo,
        kind: s.kind,
        sticker: s.sticker,
        voice: s.voice,
      },
    })
    inform(s.curator ? '许岚已确认仪式版本 V1（演示）。' : '系统已生成仪式版本 V1。')
  }
  function submitGreeting() {
    if (s.paused) {
      inform(`${c.address}暂时暂停接收，内容已保留为草稿。`)
      return false
    }
    if (!s.greeting.trim() && !s.greetingPhoto && !s.greetingSticker && !s.greetingVoice) {
      setFormError('写一句祝福，或选择一张照片再送出。')
      return false
    }
    if (s.delivery !== 'none') {
      inform('这份心意已经提交，可以查看接收状态。')
      return true
    }
    patch({ delivery: 'processing', read: true, skipped: false })
    setFormError('')
    return true
  }
  function writeAnother() {
    if (s.delivery !== 'none')
      patch({
        greetingHistory: [
          ...s.greetingHistory,
          {
            body: s.greeting,
            photo: s.greetingPhoto,
            delivery: s.delivery,
            sticker: s.greetingSticker,
            voice: s.greetingVoice,
          },
        ],
        greeting: '',
        greetingPhoto: '',
        greetingSticker: '',
        greetingVoice: '',
        delivery: 'none',
      })
    setHistoryDetail(null)
    go(8)
  }
  function next() {
    if (entryActive) {
      if (state.entryView === 'choice') {
        setState((old) => ({ ...old, entryView: 'invitation' }))
      } else {
        const form = document.querySelector<HTMLFormElement>('.host-form')
        form?.requestSubmit()
      }
      return
    }
    if (state.step === 9) {
      setCasePicker(true)
      return
    }
    if (state.step === 1 && !s.body.trim() && !s.photo && !s.sticker && !s.voice) {
      setFormError('可以写一句话，或先选择一张照片。')
      return
    }
    if (state.step === 2) {
      submitMemory()
      return
    }
    if (state.step === 3) freeze()
    if (state.step === 5 && !s.onsiteSent) {
      patch({ onsiteSent: true })
      inform('现场内容已作为后续补充保存（演示）。')
    }
    if (state.step === 8) {
      if (!submitGreeting()) return
    }
    go(state.step + 1)
  }
  function media(field: 'photo' | 'greetingPhoto' | 'onsite') {
    setMediaFor(field)
    setModal('media')
  }
  function selectMedia(image: string) {
    if (mediaFor === 'onsite') patch({ onsitePhoto: image })
    else patch({ [mediaFor]: image })
    setModal(null)
  }
  async function upload(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      inform('请选择 JPG、PNG 或 WebP 图片。')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      inform('演示版请选择 2 MB 以内的照片，或使用示例素材。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => selectMedia(String(reader.result))
    reader.readAsDataURL(file)
  }

  const pill = (
    <span className="tag">
      <span className="dot" />
      {step.phase}
    </span>
  )
  const phoneHeader = (title: string, back?: () => void) => (
    <div className="mini-header">
      <button aria-label="返回" onClick={back || (() => go(Math.max(0, state.step - 1)))}>
        <CaretLeft size={19} />
      </button>
      <span>{title}</span>
      <div className="mini-capsule">
        <DotsThree size={20} />
        <i />
        <span className="mini-circle" />
      </div>
    </div>
  )
  const bottomNav = (
    <nav className="bottom-nav" aria-label="小程序导航">
      {[
        { key: 'people', label: '我参与的人', icon: UsersThree },
        { key: 'messages', label: '消息', icon: Bell },
        { key: 'me', label: '我的', icon: GearSix },
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          className={tab === key ? 'selected' : ''}
          onClick={() => {
            setTab(key as typeof tab)
            setPersonDetail(false)
            go(6)
          }}
        >
          <Icon size={21} weight={tab === key ? 'fill' : 'regular'} />
          <span>{label}</span>
          {key === 'messages' && s.eventEnabled && !s.read && <b />}
        </button>
      ))}
    </nav>
  )

  function invitation() {
    return (
      <>
        <div className="invitation-hero">
          {(!host.configured || host.sharePhoto) && (
            <img src={asset(c.image)} alt={`${c.name}的虚构人物场景照片`} />
          )}
          <span className="photo-tag">
            {c.organization} · {eventLabel}
          </span>
          <div className="hero-copy">
            <span>把时光里的谢谢，送给您</span>
            <h2>
              {c.name}
              <small>{c.profession === '教师' ? '老师' : ''}</small>
            </h2>
            <p>
              {host.configured && host.eventType === 'birthday' ? '生日快乐' : '荣休快乐'} ·{' '}
              {c.retirement}
            </p>
          </div>
        </div>
        <div className="invitation-body">
          <HostBadge host={host} />
          {host.configured && (
            <div className="recipient-basics">
              <strong>{host.title}</strong>
              {host.shareBio && <p>{host.bio}</p>}
              <small>
                {host.surprise ? '惊喜筹备 · 受礼者暂不参与' : '公开邀请 · 欢迎一起记录'}
              </small>
              <button
                className="text-link"
                onClick={() => setState((old) => ({ ...old, entryView: 'host' }))}
              >
                修改活动资料
              </button>
            </div>
          )}
          <div className="invitation-quote">
            <span className="serif quote-mark">“</span>
            <h3>
              有些瞬间，
              <br />
              我们一直记得。
            </h3>
            <p>
              一起把故事、照片与祝福，
              <br />
              收进送给{c.address}的{eventLabel}。
            </p>
          </div>
          <div className="contributors">
            <div className="tiny-avatars">
              <span>悦</span>
              <span>{c.colleague[0]}</span>
              <span>安</span>
            </div>
            <p>和大家一起，留下属于你的那一页</p>
          </div>
          <Button onClick={() => setModal('identity')}>
            我来留一份心意 <ArrowRight size={17} />
          </Button>
          <p className="fine centered">{c.collect} 前提交，可参与本次仪式</p>
          <button className="text-link full" onClick={() => go(6, true)}>
            我已经参与过 <CaretRight />
          </button>
          <div className="privacy-note">
            <Leaf size={16} />
            按你选择的用途保存，未经同意不公开宣传
          </div>
        </div>
      </>
    )
  }
  function composer() {
    const types: { id: ContentType; label: string; icon: typeof BookOpen }[] = [
      { id: 'story', label: '写回忆', icon: BookOpen },
      { id: 'wish', label: '送祝福', icon: Heart },
      { id: 'photo', label: '放照片', icon: Camera },
      { id: 'voice', label: '用声音', icon: Microphone },
    ]
    function selectKind(kind: ContentType) {
      if (kind === s.kind) return
      const drafts = { ...s.drafts, [s.kind]: { body: s.body, title: s.title, photo: s.photo } }
      const draft = drafts[kind] || {
        body: kind === 'story' ? c.story : '',
        title:
          kind === 'story'
            ? c.storyTitle
            : kind === 'photo'
              ? '一张照片'
              : kind === 'voice'
                ? '想说给您听的话'
                : '一份祝福',
        photo: '',
      }
      patch({ kind, drafts, ...draft, sticker: '', voice: '', polished: false })
    }
    return (
      <div className="phone-pad">
        <div className="person-line">
          <Avatar id={c.id} small />
          <div>
            <span className="muted">这份心意，送给</span>
            <strong>{c.address}</strong>
          </div>
          <button className="text-link" onClick={() => setModal('identity')}>
            {s.author}
            <CaretDown />
          </button>
        </div>
        <h2 className="page-title">从一个记得的瞬间开始</h2>
        <div className="type-tabs">
          {types.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={s.kind === id ? 'active' : ''}
              onClick={() => selectKind(id)}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {s.kind === 'photo' ? (
          <div className="photo-only">
            <h3>一张照片，就是一份心意</h3>
            <p>不用写文字，选好照片就能继续。</p>
            <button className="onsite-upload" onClick={() => media('photo')}>
              {s.photo ? (
                <img src={src(s.photo)} alt="纯照片投稿预览" />
              ) : (
                <>
                  <Camera size={42} />
                  <strong>选择要送出的照片</strong>
                  <span>选择示例素材或本机照片</span>
                </>
              )}
            </button>
            {s.photo && (
              <button className="text-link" onClick={() => patch({ photo: '' })}>
                移除照片
              </button>
            )}
          </div>
        ) : (
          <>
            {s.kind === 'voice' && (
              <div className="voice-recorder">
                <button
                  className={recording ? 'recording' : ''}
                  aria-label={recording ? '结束语音演示' : '开始语音演示'}
                  onClick={() => {
                    setRecording(!recording)
                    if (recording) {
                      patch({ body: voiceText, voice: 'voice-demo.wav', title: '想说给您听的话' })
                      inform('已加入示例语音，可在相框中播放。')
                    }
                  }}
                >
                  {recording ? <Pause weight="fill" /> : <Microphone />}
                </button>
                <strong>{recording ? '正在演示录音… 点击结束' : '用声音，把记忆说出来'}</strong>
                <span>使用示例配音，不调用麦克风</span>
              </div>
            )}
            <VoiceCard voice={s.voice} />
            <div className="editor-paper integrated-editor">
              {s.kind === 'story' && (
                <input
                  aria-label="回忆标题"
                  className="title-input"
                  value={s.title}
                  maxLength={60}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              )}
              <textarea
                aria-label="共创内容"
                value={s.body}
                onChange={(e) =>
                  patch({
                    body: e.target.value,
                    ...(!s.polished ? { originalBody: e.target.value } : {}),
                  })
                }
                maxLength={2000}
                placeholder={
                  s.kind === 'wish'
                    ? '可以写祝福，也可以只选下面的表情'
                    : s.kind === 'voice'
                      ? '录音完成后，转写文字会出现在这里'
                      : '留下你记得的那个瞬间'
                }
              />
              <div className="editor-bottom">
                <span>{s.body.length} / 2000</span>
                <span>
                  <Check size={12} />
                  草稿已保存在本机
                </span>
              </div>
              {s.kind !== 'voice' && (
                <button
                  className="ai-polish-panel"
                  onClick={() => {
                    if (s.body === c.story || s.body === c.polished) {
                      patch({ body: c.polished, originalBody: c.story, polished: true })
                    } else {
                      inform('已保留你的文字。此版本使用预设示例整理，不调用真实 AI。')
                    }
                  }}
                >
                  <span className="polish-icon">
                    <Sparkle size={26} />
                  </span>
                  <span>
                    <strong>{s.polished ? '已润色，可继续调整' : '让小叙帮我润色'}</strong>
                    <small>整理表达，保留原意与原稿</small>
                  </span>
                  <ArrowUpRight size={21} />
                </button>
              )}
            </div>
            {s.kind === 'wish' && (
              <StickerPicker value={s.sticker} onChange={(sticker) => patch({ sticker })} />
            )}
            {s.kind !== 'voice' && (
              <button className="add-photo" onClick={() => media('photo')}>
                {s.photo ? <img src={src(s.photo)} alt="已选共创照片" /> : <Camera size={25} />}
                <span>
                  <strong>{s.photo ? '已选 1 张照片' : '也可以配一张照片'}</strong>
                  <small>这是文字的配图，不会清空文字</small>
                </span>
                <Plus size={18} />
              </button>
            )}
          </>
        )}
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <Button onClick={next}>
          预览这份心意
          <ArrowRight size={17} />
        </Button>
      </div>
    )
  }
  function preview() {
    return (
      <div className="phone-pad">
        <p className="eyebrow green">YOUR WORDS, YOUR MEMORY</p>
        <h2 className="page-title">这是你留下的那一页</h2>
        <article className="story-paper">
          {s.photo && <img className="story-photo" src={src(s.photo)} alt="投稿照片" />}
          <span className="story-category">{s.kind === 'story' ? '一段回忆' : '一份心意'}</span>
          <h3>{s.kind === 'story' ? s.title : `送给${c.address}的话`}</h3>
          <p>{s.body}</p>
          {s.sticker && <img className="selected-sticker" src={asset(s.sticker)} alt="祝福表情" />}
          <VoiceCard voice={s.voice} />
          <div className="signature">
            <span className="signature-line" />
            {s.author} · {s.relation}
          </div>
        </article>
        <div className="review-tools">
          <button className="text-link" onClick={() => go(1)}>
            返回修改
          </button>
          <button className="text-link" onClick={() => setModal('original')}>
            查看案例原文
          </button>
        </div>
        <div className="consent-group">
          <h4>你希望这份内容用在哪里？</h4>
          {[
            {
              key: 'consentGift',
              label: `送给${c.address}，用于这次${eventLabel}`,
              required: true,
            },
            {
              key: 'consentCeremony',
              label: `同意在本次${eventLabel === '荣休礼' ? '荣休' : '生日'}仪式上展示`,
            },
            { key: 'consentKeep', label: '同意保存在对方的礼物中' },
          ].map((x) => (
            <label key={x.key}>
              <input
                type="checkbox"
                checked={s[x.key as keyof CaseState] as boolean}
                onChange={(e) => patch({ [x.key]: e.target.checked })}
              />
              <span>
                {x.label}
                {x.required && <small>本次提交需要</small>}
              </span>
            </label>
          ))}
          <p className="fine">以上选择均不包含公开宣传用途。</p>
        </div>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <Button onClick={submitMemory}>
          确认提交 <PaperPlaneTilt size={17} />
        </Button>
      </div>
    )
  }
  function preparation() {
    const own = s.consentCeremony ? 1 : 0
    return (
      <div className="phone-pad">
        <div className="success-heading">
          <span className="success-icon">
            <CheckCircle size={32} weight="light" />
          </span>
          <h2>{s.frozen ? '仪式版本准备好了' : '这份心意，已收到'}</h2>
          <p>{s.frozen ? 'V1 已定稿，等待仪式开启' : '大家的记忆，正在汇成一份礼物'}</p>
        </div>
        <div className="mode-card">
          <div className="row">
            <Sparkle size={21} />
            <strong>{s.curator ? '许岚负责筹备' : '系统自动整理'}</strong>
            <span className="tag small">{s.curator ? '可选主创' : '无主创'}</span>
          </div>
          <p>
            {s.curator
              ? '主创仅在筹备期间负责精选，仪式后卸任。'
              : '无需指定主创，按已确认资料和内容用途准备礼物。'}
          </p>
          <div className="setting-line">
            <span>
              设置一位主创 <small>可选</small>
            </span>
            <Toggle
              checked={s.curator}
              label="设置主创"
              onChange={() => {
                if (s.frozen) {
                  inform('仪式版本已定稿，模式切换不会修改历史；重置后可体验另一种模式。')
                  return
                }
                patch({ curator: !s.curator })
              }}
            />
          </div>
        </div>
        <div className="prep-stats">
          <div>
            <b>3</b>
            <span>位参与者</span>
          </div>
          <div>
            <b>4</b>
            <span>份投稿</span>
          </div>
          <div>
            <b>{2 + own}</b>
            <span>份用于仪式</span>
          </div>
        </div>
        <div className="contribution-list">
          <div>
            <span className="letter-avatar">悦</span>
            <p>
              <strong>{s.title}</strong>
              <small>
                {s.author} · {s.relation}
              </small>
            </p>
            <CheckCircle className="green" size={19} />
          </div>
          <div>
            <span className="letter-avatar sand">{c.colleague[0]}</span>
            <p>
              <strong>{c.id === 'teacher' ? '总会多留十分钟' : '并肩走过的那些日子'}</strong>
              <small>{c.colleague} · 同事</small>
            </p>
            <CheckCircle className="green" size={19} />
          </div>
          <div>
            <span className="letter-avatar gray">安</span>
            <p>
              <strong>还记得您的那句话</strong>
              <small>赵安 · 一段祝福</small>
            </p>
            <SpeakerHigh size={18} className="green" />
          </div>
        </div>
        <div className="notice warm">
          <Info size={17} />
          <p>
            1份资料待核实，暂未纳入。
            <br />
            <small>其余合格内容正常整理，不必等待。</small>
          </p>
        </div>
        <Button
          onClick={() => {
            freeze()
            go(4)
          }}
        >
          {s.frozen ? '查看仪式版本 V1' : s.curator ? '演示主创确认定稿' : '查看自动整理的礼物'}
          <ArrowRight size={17} />
        </Button>
        <button className="remind-optin" onClick={() => patch({ eventEnabled: !s.eventEnabled })}>
          <Bell size={20} />
          <span>
            <strong>
              {s.eventEnabled ? `已开启${c.event}提醒` : `以后${c.event}，也想问候${c.address}？`}
            </strong>
            <small>{s.eventEnabled ? '你可以随时关闭' : '点击开启 · 不影响本次共创'}</small>
          </span>
          {s.eventEnabled ? <CheckCircle size={22} weight="fill" /> : <Plus size={20} />}
        </button>
      </div>
    )
  }
  function onsite() {
    return (
      <div>
        <div className="onsite-top">
          <img src={asset(c.image)} alt="荣休礼人物场景示意" />
          <span>仪式进行中</span>
          <div>
            <h2>
              把今天，
              <br />
              也留给{c.address}。
            </h2>
            <p>
              {c.retirement} · {eventLabel}
            </p>
          </div>
        </div>
        <div className="phone-pad">
          <div className="welcome-back">
            <CheckCircle size={18} />
            <span>{s.author}，欢迎回来</span>
            <small>已记得你的身份</small>
          </div>
          <h3>再留一张照片，一句祝福</h3>
          <button className="onsite-upload" onClick={() => media('onsite')}>
            {s.onsitePhoto ? (
              <img src={src(s.onsitePhoto)} alt="现场补充照片" />
            ) : (
              <>
                <Camera size={34} weight="light" />
                <strong>选择今天的照片</strong>
                <span>使用示例素材，也可以选自己的照片</span>
              </>
            )}
          </button>
          <textarea
            className="short-textarea"
            aria-label="现场祝福"
            value={s.onsiteBody}
            onChange={(e) => patch({ onsiteBody: e.target.value })}
            maxLength={500}
          />
          <div className="notice">
            <Leaf size={16} />
            <p>
              作为后续补充送给{c.address}，<br />
              已定稿的仪式版本保持原样。
            </p>
          </div>
          <Button
            onClick={() => {
              if (!s.onsiteBody.trim() && !s.onsitePhoto) {
                inform('请选照片或写一句话。')
                return
              }
              patch({ onsiteSent: true })
              inform('现场心意已保存，等待对方接收（演示）。')
            }}
          >
            {s.onsiteSent ? (
              <>
                <CheckCircle size={18} />
                现场心意已提交
              </>
            ) : (
              <>
                留住今天 <PaperPlaneTilt size={17} />
              </>
            )}
          </Button>
          <p className="fine centered">新的内容仅按本次用途送给对方，不自动上大屏</p>
        </div>
      </div>
    )
  }
  function personPage() {
    if (tab === 'messages')
      return (
        <div className="phone-pad">
          <p className="eyebrow green">A LITTLE REMINDER</p>
          <h2 className="page-title">消息</h2>
          {s.eventEnabled ? (
            <button
              className="message-card"
              onClick={() => {
                patch({ read: true })
                go(7)
                setReminderOpen(true)
              }}
            >
              <span className="message-icon">
                <Bell size={24} />
              </span>
              <div>
                <strong>
                  {hasGreeting
                    ? `已送出${c.event}心意`
                    : s.skipped
                      ? `已跳过本次${c.event}`
                      : c.eventLine}
                </strong>
                <p>
                  你曾参与{c.address}的{eventLabel}
                </p>
                <small>
                  {c.eventFullDate} · {s.read ? '已读' : '未读'}
                </small>
              </div>
              <CaretRight size={16} />
            </button>
          ) : (
            <div className="empty-state">
              <Bell size={36} weight="light" />
              <h3>让问候，按你的心意来</h3>
              <p>
                暂时没有新的提醒。
                <br />
                可以为想问候的人开启重要日子提醒。
              </p>
              <Button secondary onClick={() => setModal('settings')}>
                管理提醒
              </Button>
            </div>
          )}
        </div>
      )
    if (tab === 'me')
      return (
        <AccountPages
          state={state}
          setState={setState}
          onStart={() => {
            setState((old) => ({ ...old, step: 0, entryView: 'choice' }))
          }}
        />
      )
    if (personDetail)
      return (
        <div>
          <div className="person-cover">
            <img src={asset(c.image)} alt={c.name} />
          </div>
          <div className="phone-pad person-detail">
            <Avatar id={c.id} />
            <h2>
              {c.name}
              {c.id === 'teacher' ? '老师' : ''}
            </h2>
            <p className="muted">
              {s.relation} · 参与过{c.retirement}的荣休礼
            </p>
            <Button onClick={writeAnother}>
              {s.paused ? '先存一份心意草稿' : '再送一份心意'}
              <Heart size={17} />
            </Button>
            <button className="date-row" onClick={() => setModal('settings')}>
              <Flower size={22} />
              <span>
                {c.event}
                <small>每年 {c.eventDate.replace('.', '月')}日</small>
              </span>
              <em>{s.eventEnabled ? '已开启提醒' : '设置提醒'}</em>
              <CaretRight />
            </button>
            <div className="section-heading">
              <h3>我留下的内容</h3>
              <span>
                {Number(!s.deletedRecords.includes('memory')) +
                  Number(s.onsiteSent && !s.deletedRecords.includes('onsite')) +
                  Number(s.delivery !== 'none' && !s.deletedRecords.includes('greeting')) +
                  s.greetingHistory.filter((_, i) => !s.deletedRecords.includes(`past-${i}`))
                    .length}{' '}
                份
              </span>
            </div>
            {s.delivery !== 'none' && !s.deletedRecords.includes('greeting') && (
              <button
                className="history-item"
                onClick={() => {
                  setHistoryDetail(null)
                  setModal('detail')
                }}
              >
                <img
                  src={s.greetingPhoto ? src(s.greetingPhoto) : asset('campus.png')}
                  alt="心意照片"
                />
                <span>
                  <strong>
                    送给{c.address}的{c.event}心意
                  </strong>
                  <small>
                    {c.eventFullDate} · {s.delivery === 'delivered' ? '已送达' : '已提交'}
                  </small>
                </span>
                <CaretRight />
              </button>
            )}
            {s.greetingHistory.map(
              (record, i) =>
                !s.deletedRecords.includes(`past-${i}`) && (
                  <button
                    className="history-item"
                    key={i}
                    onClick={() => {
                      setHistoryDetail(i)
                      setModal('detail')
                    }}
                  >
                    <img
                      src={record.photo ? src(record.photo) : asset('campus.png')}
                      alt="之前送出的心意"
                    />
                    <span>
                      <strong>{record.body.slice(0, 20) || '一张新的照片'}</strong>
                      <small>
                        {c.eventFullDate} · {record.delivery === 'delivered' ? '已送达' : '已提交'}
                      </small>
                    </span>
                    <CaretRight />
                  </button>
                ),
            )}
            {s.onsiteSent && !s.deletedRecords.includes('onsite') && (
              <button className="history-item" onClick={() => go(5)}>
                <img src={asset(c.image)} alt="现场内容示意" />
                <span>
                  <strong>把今天，也留下来</strong>
                  <small>{c.retirement} · 现场补充</small>
                </span>
                <CaretRight />
              </button>
            )}
            {!s.deletedRecords.includes('memory') && (
              <button className="history-item" onClick={() => setModal('original')}>
                <span className="history-icon">
                  <BookOpen size={24} />
                </span>
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.author} · 荣休礼共创</small>
                </span>
                <CaretRight />
              </button>
            )}
            <p className="fine">这里仅展示你自己的记录，受礼者其他内容按授权可见。</p>
          </div>
        </div>
      )
    return (
      <div className="phone-pad">
        <div className="greeting-title">
          <span>好久不见，也值得问候</span>
          <Leaf size={20} />
        </div>
        <h2 className="people-title">我参与的人</h2>
        <p className="muted intro-small">故事留在时光里，心意随时可以送达。</p>
        {cases.map((person, index) => {
          const ps = state.cases[person.id]
          return (
            <button
              className={`person-card ${person.id === c.id ? 'featured' : ''}`}
              key={person.id}
              onClick={() => {
                setState((old) => ({
                  ...old,
                  caseId: person.id,
                  cases: { ...old.cases, [person.id]: seedToStep(old.cases[person.id], 6) },
                }))
                setPersonDetail(true)
              }}
            >
              <div className="person-card-photo">
                <img src={asset(person.image)} alt={person.name} />
                <span>{index === 2 ? '扩展案例' : '曾一起走过一程'}</span>
              </div>
              <div className="person-card-body">
                <div>
                  <h3>
                    {person.name}
                    {person.id === 'teacher' ? '老师' : ''}
                  </h3>
                  <p>{person.relation}</p>
                </div>
                <ArrowUpRight size={21} />
                <div className="person-card-footer">
                  <span>
                    {ps.delivery !== 'none' || ps.greetingHistory.length > 0
                      ? `已送出${person.event}心意`
                      : `参与过${person.retirement}的荣休礼`}
                  </span>
                  <Heart size={14} />
                </div>
              </div>
            </button>
          )
        })}
        <p className="fine centered">演示列表已预置三段共创关系</p>
      </div>
    )
  }

  function reminder() {
    const acted = hasGreeting
    if (!reminderOpen)
      return (
        <div className="phone-pad">
          <div className="channel-tabs">
            <button
              className={reminderChannel === 'app' ? 'active' : ''}
              onClick={() => setReminderChannel('app')}
            >
              小程序内
            </button>
            <button
              className={reminderChannel === 'wechat' ? 'active' : ''}
              onClick={() => setReminderChannel('wechat')}
            >
              服务号示意
            </button>
          </div>
          <div className="calendar-mark">
            <span>{c.eventFullDate.slice(0, 4)}</span>
            <strong>{c.eventDate}</strong>
            <em>{c.event}</em>
          </div>
          {!s.eventEnabled ? (
            <div className="reminder-empty">
              <Bell size={31} weight="light" />
              <h3>要记得这个日子吗？</h3>
              <p>
                你还没有开启{c.address}的{c.event}提醒。
                <br />
                开启后，重要日子就会出现在这里。
              </p>
              <Button onClick={() => patch({ eventEnabled: true })}>开启{c.event}提醒</Button>
              <button
                className="text-link full"
                onClick={() => {
                  setReminderOpen(true)
                  patch({ read: true })
                }}
              >
                不设提醒，直接送心意
              </button>
            </div>
          ) : reminderChannel === 'wechat' && !s.channel ? (
            <div className="reminder-empty">
              <Envelope size={31} weight="light" />
              <h3>服务号渠道尚未关联</h3>
              <p>
                小程序内的提醒仍然可用。
                <br />
                可模拟“已关联且渠道可用”继续展示。
              </p>
              <Button onClick={() => patch({ channel: true })}>演示渠道可用状态</Button>
              <button className="text-link full" onClick={() => setReminderChannel('app')}>
                回到小程序提醒
              </button>
            </div>
          ) : s.paused ? (
            <div className="reminder-empty">
              <Pause size={31} />
              <h3>{c.address}暂时暂停接收</h3>
              <p>新的提醒暂不外发，你仍可以查看自己的记录或保留草稿。</p>
              <Button secondary onClick={() => go(8)}>
                先存一份草稿
              </Button>
            </div>
          ) : (
            <div className={`notification ${reminderChannel === 'wechat' ? 'wechat' : ''}`}>
              <div className="notification-brand">
                <span className="brand-square">
                  <FrameCorners size={20} />
                </span>
                <strong>拾光叙</strong>
                <small>{reminderChannel === 'wechat' ? '服务号 · 交互示意' : '重要日子'}</small>
              </div>
              <h3>
                {acted
                  ? `你已送出${c.event}心意`
                  : s.skipped
                    ? '这次先不提醒，心意随时可送'
                    : c.eventLine}
              </h3>
              <p>
                你曾参与{c.address}的{eventLabel}。
                <br />
                {acted ? '可以查看记录，也可以再补充。' : '一段祝福，一张近况，都是心意。'}
              </p>
              <button
                onClick={() => {
                  setReminderOpen(true)
                  patch({ read: true })
                }}
              >
                {acted ? '查看这份心意' : '查看并送上心意'}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
          <div className="notice">
            <Leaf size={16} />
            <p>
              {reminderChannel === 'wechat'
                ? '此处展示消息的承接方式，不发送真实微信消息。'
                : '服务号与小程序承接同一个事件，送出心意后同步更新。'}
            </p>
          </div>
          <button className="text-link full" onClick={() => setModal('settings')}>
            管理这个人的提醒 <GearSix size={15} />
          </button>
        </div>
      )
    return (
      <div className="phone-pad">
        <div className="occasion-heading">
          <Flower size={28} weight="light" />
          <span>
            {c.eventDate} · {c.event}
          </span>
          <h2>{acted ? '你的心意，已经在路上' : c.eventLine}</h2>
        </div>
        <div className="person-line occasion-person">
          <Avatar id={c.id} />
          <div>
            <strong>{c.name}</strong>
            <span>{s.relation}</span>
          </div>
        </div>
        <p className="muted centered">
          你曾在{c.retirement.slice(5, 7)}月，参与过{c.address}的荣休礼。
        </p>
        <article className="remember-card">
          <span className="eyebrow">还记得，你写过</span>
          <BookOpen size={18} />
          <h3>{s.title}</h3>
          <p>{s.body.slice(0, 90)}…</p>
          <button className="text-link" onClick={() => setModal('original')}>
            重温这段回忆 <ArrowUpRight size={13} />
          </button>
        </article>
        <p className="occasion-prompt">
          也许是今天路过的一处风景，
          <br />
          也许是一句近况，都可以送给{c.id === 'nurse' ? '她' : '他'}。
        </p>
        <Button
          onClick={() => {
            if (acted) {
              setHistoryDetail(s.delivery === 'none' ? s.greetingHistory.length - 1 : null)
              setModal('detail')
            } else go(8)
          }}
        >
          {acted ? '查看我送出的心意' : '写祝福 / 发照片'}
          <Heart size={17} />
        </Button>
        <button
          className="text-link full"
          onClick={() => {
            patch({ skipped: true })
            setReminderOpen(false)
            inform('已跳过本次事件，不影响明年的提醒设置。')
          }}
        >
          今天先不提醒我
        </button>
      </div>
    )
  }

  function greeting() {
    if (s.delivery !== 'none')
      return (
        <div className="phone-pad">
          <div className="sent-illustration">
            <Envelope size={74} weight="duotone" />
            <span>
              <Heart size={24} weight="fill" />
            </span>
          </div>
          <div className="success-heading">
            <h2>
              {s.delivery === 'delivered'
                ? '心意已送达'
                : s.delivery === 'waiting'
                  ? '等待相框接收'
                  : '心意已提交'}
            </h2>
            <p>
              {s.delivery === 'delivered'
                ? `新的祝福，已经送到${c.address}的礼物中。`
                : '整理完成后，会送到对方的礼物中。'}
            </p>
          </div>
          <div className="delivery-steps">
            <div className="done">
              <CheckCircle size={20} />
              <span>已保存这份心意</span>
            </div>
            <div className={s.delivery !== 'processing' ? 'done' : ''}>
              {s.delivery !== 'processing' ? <CheckCircle size={20} /> : <Clock size={20} />}
              <span>{s.delivery === 'processing' ? '正在整理' : '整理完成'}</span>
            </div>
            <div className={s.delivery === 'delivered' ? 'done' : ''}>
              {s.delivery === 'delivered' ? <CheckCircle size={20} /> : <Clock size={20} />}
              <span>{s.delivery === 'delivered' ? '相框已接收' : '等待接收回执'}</span>
            </div>
          </div>
          <div className="notice">
            <Bell size={17} />
            <p>
              本次{c.event}已送出心意，不再重复提醒。
              <br />
              原来的荣休仪式版本保持不变。
            </p>
          </div>
          <Button onClick={() => go(9)}>
            看看相框收到 <ArrowRight size={17} />
          </Button>
          <button className="text-link full" onClick={writeAnother}>
            还想说点什么？再补一份心意 <Plus size={13} />
          </button>
          <button
            className="text-link full"
            onClick={() => {
              setTab('people')
              go(6)
              setPersonDetail(true)
            }}
          >
            回到我的记录
          </button>
        </div>
      )
    return (
      <div className="phone-pad">
        <div className="person-line">
          <Avatar id={c.id} small />
          <div>
            <span className="muted">送给</span>
            <strong>{c.address}</strong>
          </div>
          <span className="tag small">{c.event}心意</span>
        </div>
        <h2 className="page-title">一句近况，也是一份惦念</h2>
        <div className="editor-paper greeting-editor">
          <textarea
            aria-label="节日祝福"
            value={s.greeting}
            onChange={(e) => patch({ greeting: e.target.value })}
            placeholder={`想和${c.address}说些什么？`}
            maxLength={2000}
          />
          <div className="editor-bottom">
            <span>{s.greeting.length} / 2000</span>
            <span>已保存草稿</span>
          </div>
        </div>
        <button
          className={`greeting-photo ${s.greetingPhoto ? 'has-photo' : ''}`}
          onClick={() => media('greetingPhoto')}
        >
          {s.greetingPhoto ? (
            <>
              <img src={src(s.greetingPhoto)} alt="祝福照片" />
              <span>
                换一张照片 <Camera size={16} />
              </span>
            </>
          ) : (
            <>
              <ImageIcon size={32} weight="light" />
              <strong>加一张今天的照片</strong>
              <span>一处风景、一点近况，都可以</span>
            </>
          )}
        </button>
        {s.greetingPhoto && (
          <button className="text-link" onClick={() => patch({ greetingPhoto: '' })}>
            移除照片
          </button>
        )}
        <StickerPicker
          value={s.greetingSticker}
          onChange={(greetingSticker) => patch({ greetingSticker })}
        />
        <button
          className="ai-button"
          onClick={() => patch({ greetingVoice: s.greetingVoice ? '' : 'voice-demo.wav' })}
        >
          <Microphone size={20} />
          {s.greetingVoice ? '移除语音祝福' : '再添一段声音（示例）'}
        </button>
        <VoiceCard voice={s.greetingVoice} />
        <div className="greeting-signature">
          来自 <strong>{s.author}</strong>
          <span>{s.relation}</span>
        </div>
        <div className="notice">
          <Leaf size={16} />
          <p>
            仅送给{c.address}，保存在这份心意中。
            <br />
            不会自动公开，也不改变已定稿的仪式。
          </p>
        </div>
        {s.paused && <p className="error">对方暂时暂停接收，当前内容会保留为草稿。</p>}
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <Button onClick={submitGreeting}>
          {s.paused ? '保存为草稿' : `送给${c.address}`}
          <PaperPlaneTilt size={17} />
        </Button>
      </div>
    )
  }

  function frame() {
    const snap = s.frozen
    if (step.id === 'received')
      return (
        <div className="frame-device receipt-frame">
          <div className="frame-screen">
            <img
              className="frame-background"
              src={s.greetingPhoto ? src(s.greetingPhoto) : asset('campus.png')}
              alt="相框背景照片"
            />
            <div className="frame-top">
              <span>拾光叙</span>
              <span>
                {c.eventFullDate} <WifiHigh size={17} />
              </span>
            </div>
            <div className="received-layout">
              <div className="frame-clock">
                <span>09:10</span>
                <p>今天是{c.event}</p>
                <div className="frame-weather">
                  <Leaf size={18} />
                  把日子，过得慢一点
                </div>
              </div>
              <article className="received-letter">
                <div className="envelope-stamp">
                  <Heart size={24} weight="light" />
                  <span>一份新的心意</span>
                </div>
                <p className="letter-date">{c.eventFullDate}</p>
                <h3>
                  {c.address}，{c.event}快乐。
                </h3>
                <p>{s.greeting}</p>
                {s.greetingSticker && (
                  <img
                    className="selected-sticker"
                    src={asset(s.greetingSticker)}
                    alt="新心意的表情"
                  />
                )}
                <VoiceCard voice={s.greetingVoice} />
                <div className="signature">惦记您的 {s.author}</div>
                <div className={`receipt-badge ${s.delivery === 'delivered' ? 'done' : ''}`}>
                  <CheckCircle size={15} />
                  {s.delivery === 'delivered'
                    ? '相框已接收 · 演示回执'
                    : s.delivery === 'none'
                      ? '尚未提交 · 仅预览'
                      : s.delivery === 'waiting'
                        ? '等待接收回执'
                        : '已提交 · 等待整理与接收'}
                </div>
              </article>
            </div>
            <div className="frame-bottom">
              <span>
                <BookOpen size={17} />
                原来的荣休礼，仍然珍藏在这里
              </span>
              <button onClick={() => go(4)}>
                重看仪式 V1 <CaretRight size={15} />
              </button>
            </div>
          </div>
          <span className="frame-wordmark">SHIGUANGXU</span>
        </div>
      )
    return (
      <div className="frame-device">
        <div className={`frame-screen ritual-screen slide-${ritualSlide}`}>
          <div className="frame-top">
            <span>
              <FrameCorners size={16} />
              拾光叙 · {eventLabel}
            </span>
            <span>仪式版本 V1</span>
          </div>
          {ritualSlide === 0 && (
            <div className="ritual-opening">
              <img src={asset(c.image)} alt={`${c.name}荣休仪式人物照片`} />
              <div className="ritual-opening-copy">
                <HostBadge host={host} />
                <span className="eyebrow">WITH ALL OUR GRATITUDE</span>
                <div className="gold-line" />
                <h2>
                  {c.name}
                  <small>
                    {host.configured && host.eventType === 'birthday' ? '生日快乐' : '荣休快乐'}
                  </small>
                </h2>
                <p>
                  把这些年记得的瞬间，
                  <br />
                  郑重送给您。
                </p>
                <span className="ceremony-date">
                  {c.organization} · {c.retirement}
                </span>
              </div>
            </div>
          )}
          {ritualSlide === 1 && (
            <div className="timeline-slide">
              <span className="eyebrow">THE YEARS WE SHARED</span>
              <h2>来时的路，都闪着光。</h2>
              <div className="ceremony-timeline">
                {c.timeline.map((t) => (
                  <div key={t.year}>
                    <strong>{t.year}</strong>
                    <i />
                    <p>{t.text}</p>
                  </div>
                ))}
              </div>
              <span className="timeline-caption">
                {c.id === 'teacher'
                  ? '根据发起方已确认的演示履历整理'
                  : '根据参与者回忆与已确认的荣休日期编排'}
              </span>
            </div>
          )}
          {ritualSlide === 2 && (
            <div className="ritual-story">
              <div className="ritual-photo">
                <img
                  src={snap?.image ? src(snap.image) : asset(c.image)}
                  alt="记忆中的人物场景示意"
                />
                <span>这些记忆，一直在</span>
              </div>
              <article>
                <span className="eyebrow green">
                  A MEMORY FROM {snap?.included ? snap.author : c.colleague}
                </span>
                <h2>{snap?.included ? snap.title : '总有一些陪伴，记在心里'}</h2>
                <p>
                  {snap?.included
                    ? snap.body
                    : '谢谢您把耐心留给我们。那些一起经历过的日子，会一直被认真记得。愿往后的生活从容、有趣。'}
                </p>
                {snap?.included && snap.sticker && (
                  <img
                    className="selected-sticker"
                    src={asset(snap.sticker)}
                    alt="收到的祝福表情"
                  />
                )}
                {snap?.included && (
                  <VoiceCard voice={snap.voice || ''} onPlay={() => setPlaying(false)} />
                )}
                <div className="signature">—— {snap?.included ? snap.author : c.colleague}</div>
              </article>
            </div>
          )}
          {ritualSlide === 3 && (
            <div className="ritual-ending">
              <div className="ending-flower">
                <Flower size={66} weight="light" />
              </div>
              <span className="eyebrow">AND A BEAUTIFUL CHAPTER AHEAD</span>
              <h2>{c.letter}</h2>
              <p>来自那些，曾与您同行的人。</p>
              <div className="tiny-avatars">
                <span>悦</span>
                <span>{c.colleague[0]}</span>
                <span>安</span>
              </div>
              <small>参与者寄语 · 各自署名，真诚送达</small>
            </div>
          )}
          <div className="ritual-controls">
            <button aria-label="上一张仪式内容" onClick={() => setRitualSlide((x) => (x + 3) % 4)}>
              <CaretLeft size={17} />
            </button>
            <div>
              {['开场', '来时的路', '一段回忆', '下一程'].map((x, i) => (
                <button
                  key={x}
                  aria-label={`仪式：${x}`}
                  className={i === ritualSlide ? 'active' : ''}
                  onClick={() => setRitualSlide(i)}
                >
                  <i />
                  {x}
                </button>
              ))}
            </div>
            <button
              aria-label={playing ? '暂停仪式自动播放' : '自动播放仪式'}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button aria-label="下一张仪式内容" onClick={() => setRitualSlide((x) => (x + 1) % 4)}>
              <CaretRight size={17} />
            </button>
          </div>
        </div>
        <span className="frame-wordmark">SHIGUANGXU</span>
      </div>
    )
  }

  const phoneContent = entryActive ? (
    <EntryFlow
      view={state.entryView as 'choice' | 'host' | 'recipient'}
      host={host}
      curator={s.curator}
      selfName={state.profile.name}
      onView={(entryView) => setState((old) => ({ ...old, entryView }))}
      onPatch={(p) => patch({ host: { ...host, ...p } })}
      onCurator={(curator) => patch({ curator })}
      onFinish={() => {
        patch({
          host: {
            ...host,
            configured: true,
            surprise: host.role === 'self' ? false : host.surprise,
          },
        })
        setState((old) => ({ ...old, entryView: 'invitation' }))
        inform('资料已保存，以下是共创者看到的邀请。')
      }}
    />
  ) : step.id === 'invitation' ? (
    invitation()
  ) : step.id === 'create' ? (
    composer()
  ) : step.id === 'preview' ? (
    preview()
  ) : step.id === 'prepare' ? (
    preparation()
  ) : step.id === 'onsite' ? (
    onsite()
  ) : step.id === 'people' ? (
    personPage()
  ) : step.id === 'reminder' ? (
    reminder()
  ) : (
    greeting()
  )
  const appTitle =
    step.id === 'people'
      ? personDetail
        ? `${c.address}的共创页`
        : '拾光叙'
      : step.id === 'reminder'
        ? '重要日子'
        : step.id === 'greeting'
          ? '一份新的心意'
          : entryActive
            ? '开始一份心意'
            : `一起准备${eventLabel}`

  return (
    <div className="demo-app">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => setState((old) => ({ ...old, step: 0, entryView: 'choice' }))}
          aria-label="拾光叙演示首页"
        >
          <span className="brand-symbol">
            <FrameCorners size={28} weight="light" />
            <i />
          </span>
          <strong>拾光叙</strong>
          <span className="brand-divider" />
          <span className="brand-caption">荣休礼 · 互动演示</span>
        </button>
        <div className="header-actions">
          <span className="demo-label">
            <span />
            DEMO 01
          </span>
          <button
            aria-label="讲解备注"
            className={`toolbar-button ${notes ? 'active' : ''}`}
            onClick={() => setNotes(!notes)}
          >
            <SlidersHorizontal size={17} />
            <span>讲解备注</span>
          </button>
          <button
            aria-label="重新演示"
            className="toolbar-button reset-button"
            onClick={() => setModal('reset')}
          >
            <ArrowCounterClockwise size={17} />
            <span>重新演示</span>
          </button>
          <button
            aria-label="选择演示案例"
            className="case-switch"
            onClick={() => setCasePicker(true)}
          >
            <Avatar id={c.id} small />
            <span>{c.roleLabel}</span>
            <CaretDown size={14} />
          </button>
          <button
            className="mobile-menu"
            aria-label="打开章节目录"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <List size={24} />
          </button>
        </div>
      </header>
      <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="sidebar-heading">
          <span>体验一份荣休礼</span>
          <small>THE GIFT JOURNEY</small>
        </div>
        <nav aria-label="演示章节">
          {steps.map((item, i) => (
            <button
              className={`chapter ${state.step === i ? 'active' : ''} ${state.step > i ? 'passed' : ''}`}
              key={item.id}
              onClick={() => go(i, true)}
            >
              <span className="chapter-number">
                {state.step > i ? (
                  <Check size={13} weight="bold" />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <span>{item.label}</span>
              {state.step === i && <span className="chapter-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={21} weight="light" />
            <p>
              从一次共创，
              <br />
              到下一次问候。
            </p>
          </div>
          <button className="more-stories" onClick={() => setCasePicker(true)}>
            <span>
              <strong>还有更多值得记得的人</strong>
              <small>3 个案例，3 段同行的时光</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
          <span className="sidebar-disclaimer">虚构人物与素材 · 仅用于体验演示</span>
        </div>
      </aside>
      <main className={`workspace ${isFrame ? 'frame-workspace' : ''}`}>
        <div className="workspace-top">
          <div className="breadcrumbs">
            <span>{c.roleLabel}</span>
            <CaretRight size={12} />
            <strong>{step.label}</strong>
          </div>
          <span className="view-type">
            {isFrame ? <FrameCorners size={15} /> : <span className="phone-icon" />}
            {isFrame ? '相框 / 仪式展示' : '小程序体验'}
            <span className="view-dot" />
            可点击演示
          </span>
        </div>
        <section className={`demo-stage ${isFrame ? 'frame-stage' : ''}`}>
          <div className="story-context">
            <div className="chapter-eyebrow">
              <span>{String(state.step + 1).padStart(2, '0')}</span>
              {step.english}
            </div>
            <h1>
              {entryActive
                ? '让一份心意，\n从你这里开始。'
                : state.step === 0
                  ? c.title
                  : step.title}
            </h1>
            <p className="story-description">{state.step === 0 ? c.subtitle : step.description}</p>
            <div className="context-person">
              <Avatar id={c.id} small />
              <div>
                <strong>{c.name}</strong>
                <span>
                  {c.organization} · {c.profession}
                </span>
              </div>
              {pill}
            </div>
            <div className="chapter-detail">
              {step.id === 'invitation' && (
                <>
                  <span className="detail-icon">
                    <Envelope size={23} weight="light" />
                  </span>
                  <div>
                    <strong>这份礼物，由大家一起完成</strong>
                    <p>
                      一段话、一张照片，都可以参与。
                      <br />
                      不必是主创，也能让心意到达。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'create' && (
                <>
                  <span className="detail-icon">
                    <Sparkle size={23} />
                  </span>
                  <div>
                    <strong>让表达轻一点</strong>
                    <p>
                      可以直接使用示例，也可以改写。
                      <br />
                      选择照片后，作品预览会同步更新。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'preview' && (
                <>
                  <span className="detail-icon">
                    <Leaf size={23} />
                  </span>
                  <div>
                    <strong>用途由投稿的人选择</strong>
                    <p>
                      勾选愿意开放的范围，再确认提交。
                      <br />
                      同意赠礼，不等于同意公开宣传。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'prepare' && (
                <>
                  <span className="detail-icon">
                    <UsersThree size={23} />
                  </span>
                  <div>
                    <strong>
                      {s.curator ? '有主创，也无需一直管理' : '没有主创，也能完整运转'}
                    </strong>
                    <p>
                      {s.curator
                        ? '筹备期间人工精选，仪式后可卸任。'
                        : '用已确认的资料，整理可用的内容。'}
                      <br />
                      有疑问的单项，不拖住整份礼物。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'onsite' && (
                <>
                  <span className="detail-icon">
                    <QrCode size={23} />
                  </span>
                  <div>
                    <strong>一个共创入口，贯穿全程</strong>
                    <p>演示中直接点击进入，无需扫码。</p>
                    <div className="setting-line">
                      <span>
                        现场专用码 <small>可选</small>
                      </span>
                      <Toggle
                        checked={s.onsiteCode}
                        onChange={() => patch({ onsiteCode: !s.onsiteCode })}
                        label="开启现场专用码"
                      />
                    </div>
                    <small className="muted">
                      {s.onsiteCode ? '已开启子入口，主入口依然有效' : '当前使用原共创入口'}
                    </small>
                  </div>
                </>
              )}
              {step.id === 'people' && (
                <>
                  <span className="detail-icon">
                    <Heart size={23} />
                  </span>
                  <div>
                    <strong>记住的是人，不只是一次项目</strong>
                    <p>
                      点击人物卡，重看自己的故事。
                      <br />
                      也可以直接再送一份近况。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'reminder' && (
                <>
                  <span className="detail-icon">
                    <Bell size={23} />
                  </span>
                  <div>
                    <strong>每个人、每种日子，独立选择</strong>
                    <p>
                      小程序与服务号共用同一个提醒。
                      <br />
                      点击提醒后，直接回到这个人。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'greeting' && (
                <>
                  <span className="detail-icon">
                    <PaperPlaneTilt size={23} />
                  </span>
                  <div>
                    <strong>心意可以继续，不必重新筹备</strong>
                    <p>
                      一段祝福或一张照片就够了。
                      <br />
                      原主创不再需要回来审核。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'received' && (
                <>
                  <span className="detail-icon">
                    <Envelope size={23} />
                  </span>
                  <div>
                    <strong>演示接收端回执</strong>
                    <p>
                      提交与接收分开呈现，
                      <br />
                      未确认前不标记“已送达”。
                    </p>
                  </div>
                </>
              )}
              {step.id === 'ceremony' && (
                <>
                  <span className="detail-icon">
                    <BookOpen size={23} />
                  </span>
                  <div>
                    <strong>一份可以慢慢重看的礼物</strong>
                    <p>点击下方章节浏览，或开启自动播放。</p>
                  </div>
                </>
              )}
            </div>
            {notes && (
              <div className="engineering-note">
                <span>
                  <Info size={15} />
                  给工程师的讲解备注
                </span>
                <p>{step.note}</p>
                {c.id === 'nurse' && (
                  <p>护士节为新增扩展案例，复用重要日子模型；不代表已纳入首期正式范围。</p>
                )}
                <code>
                  人物：{c.id} / 仪式：{s.frozen ? 'V1 frozen' : '未冻结'}
                  <br />
                  提醒：{s.eventEnabled ? '已开启' : '未开启'} / 投稿：{s.delivery}
                </code>
              </div>
            )}
          </div>
          <div className="device-area">
            {isFrame ? (
              frame()
            ) : (
              <div className="phone-device">
                <div className="phone-status">
                  <span>9:41</span>
                  <div className="dynamic-island" />
                  <span>
                    <i className="signal" />
                    <WifiHigh size={15} weight="bold" />
                    <i className="battery" />
                  </span>
                </div>
                {phoneHeader(
                  appTitle,
                  step.id === 'people' && personDetail ? () => setPersonDetail(false) : undefined,
                )}
                <div ref={phoneRef} className="phone-content" key={`${c.id}-${step.id}`}>
                  {phoneContent}
                </div>
                {step.id === 'people' && bottomNav}
                <div className="phone-home">
                  <i />
                </div>
              </div>
            )}
            {!isFrame && (
              <div className="device-caption">
                <span />
                {state.step === 3 ? '筹备进度 · 演示视角' : `当前体验：${s.author} · ${s.relation}`}
                <span />
              </div>
            )}
            {step.id === 'received' && (
              <div className="receipt-controls">
                <span>
                  <Info size={16} />
                  演示控制
                </span>
                <Button
                  secondary
                  onClick={() => {
                    if (s.delivery === 'none') {
                      inform('请先返回“再送一份心意”完成提交。')
                      return
                    }
                    patch({ delivery: 'waiting' })
                  }}
                >
                  模拟暂未接收
                </Button>
                <Button
                  onClick={() => {
                    if (s.delivery === 'none') {
                      inform('请先提交心意，再演示接收回执。')
                      return
                    }
                    patch({ delivery: 'delivered' })
                    inform('接收回执已模拟，人物页与消息状态已同步。')
                  }}
                >
                  模拟相框接收 <CheckCircle size={16} />
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="journey-footer">
        <div className="journey-position">
          <strong>{String(state.step + 1).padStart(2, '0')}</strong>
          <span>/ {steps.length}</span>
          <div className="journey-progress">
            <i style={{ width: `${(state.step + 1) * 10}%` }} />
          </div>
          <small>{step.phase}</small>
        </div>
        <div className="journey-actions">
          <button
            className="previous"
            disabled={state.step === 0}
            onClick={() => go(state.step - 1)}
          >
            <ArrowLeft size={17} />
            <span>上一步</span>
          </button>
          <Button onClick={next}>
            {entryActive
              ? state.entryView === 'choice'
                ? '下一步 · 参与这份共创'
                : state.entryView === 'host'
                  ? '下一步 · 人物资料'
                  : '保存并预览邀请'
              : step.next}
            <ArrowRight size={18} />
          </Button>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={18} />
          {toast}
        </div>
      )}
      {casePicker && (
        <div className="overlay" onClick={() => setCasePicker(false)}>
          <section
            className="case-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="选择演示案例"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-dialog"
              aria-label="关闭案例选择"
              onClick={() => setCasePicker(false)}
            >
              <X size={22} />
            </button>
            <p className="eyebrow green">EVERY PERSON HAS A STORY</p>
            <h2>还有更多，值得记得的人。</h2>
            <p className="muted">同一条共创链路，陪伴不同的关系，走向下一次问候。</p>
            <div className="case-grid">
              {cases.map((person, i) => (
                <button
                  className={`case-card ${c.id === person.id ? 'current' : ''}`}
                  key={person.id}
                  onClick={() => switchCase(person.id)}
                >
                  <div>
                    <img src={asset(person.image)} alt={person.name} />
                    <span>CASE 0{i + 1}</span>
                    <b>{person.curator ? '主创可卸任' : '无主创也能运行'}</b>
                  </div>
                  <article>
                    <span>
                      {person.roleLabel}
                      {person.id === 'nurse' ? ' · 扩展案例' : ''}
                    </span>
                    <h3>{person.name}</h3>
                    <p>{person.subtitle}</p>
                    <footer>
                      <span>
                        荣休礼 <ArrowRight size={14} />
                        {person.event}问候
                      </span>
                      <ArrowUpRight size={23} />
                    </footer>
                  </article>
                </button>
              ))}
            </div>
            <p className="fine">人物、单位与照片为原创虚构演示资料。护士节为本版补充的场景探索。</p>
          </section>
        </div>
      )}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <section
            className={`modal ${modal === 'media' ? 'media-modal' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === 'settings' ? '提醒设置' : modal === 'media' ? '选择照片' : '演示操作'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-dialog" aria-label="关闭弹窗" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
            {modal === 'identity' && (
              <>
                <p className="eyebrow green">A LITTLE ABOUT YOU</p>
                <h2>让{c.address}知道，你是谁</h2>
                <p className="muted">演示已填写林悦的身份，你也可以修改。</p>
                <label className="field-label">
                  你的署名
                  <input
                    value={s.author}
                    maxLength={20}
                    onChange={(e) => patch({ author: e.target.value })}
                    aria-label="你的署名"
                  />
                </label>
                <label className="field-label">
                  与对方的关系
                  <input
                    value={s.relation}
                    maxLength={30}
                    onChange={(e) => patch({ relation: e.target.value })}
                    aria-label="与对方的关系"
                  />
                </label>
                <div className="notice">
                  <Leaf size={16} />
                  <p>身份只用于这段共创关系，不会因此开启通知。</p>
                </div>
                <Button
                  disabled={!s.author.trim() || !s.relation.trim()}
                  onClick={() => {
                    setModal(null)
                    if (state.step === 0) go(1)
                  }}
                >
                  {state.step === 0 ? '开始共创' : '保存关系'}
                  <ArrowRight size={16} />
                </Button>
              </>
            )}
            {modal === 'media' && (
              <>
                <p className="eyebrow green">A PHOTO TELLS A STORY</p>
                <h2>选一张，让心意有画面</h2>
                <p className="muted">原创人物场景与校园风景，用于演示内容呈现。</p>
                <div className="media-grid">
                  {[
                    { file: c.image, title: `${c.address} · 人物场景示意` },
                    { file: 'campus.png', title: '路过的风景 · 校园树荫' },
                  ].map((x) => (
                    <button key={x.file} onClick={() => selectMedia(x.file)}>
                      <img src={asset(x.file)} alt={x.title} />
                      <span>
                        {x.title}
                        <Plus size={17} />
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    upload(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <Button secondary onClick={() => fileRef.current?.click()}>
                  <Plus size={17} />
                  选择自己的照片
                </Button>
                <p className="fine">
                  仅在此浏览器演示，不上传服务器。支持2 MB以内的 JPG、PNG、WebP。
                </p>
              </>
            )}
            {modal === 'settings' && (
              <>
                <p className="eyebrow green">REMEMBER, IN YOUR OWN WAY</p>
                <h2>{c.address}的提醒</h2>
                <div className="settings-person">
                  <Avatar id={c.id} small />
                  <span>
                    {c.name} · {s.relation}
                  </span>
                </div>
                <div className="setting-line tall">
                  <span>
                    <strong>{c.event}</strong>
                    <small>每年 {c.eventDate.replace('.', '月')}日 · 当天09:00</small>
                  </span>
                  <Toggle
                    checked={s.eventEnabled}
                    label={`${c.address}${c.event}提醒`}
                    onChange={() => patch({ eventEnabled: !s.eventEnabled })}
                  />
                </div>
                <div className="setting-line tall">
                  <span>
                    <strong>服务号渠道</strong>
                    <small>{s.channel ? '模拟已关联且可用' : '尚未关联 · 小程序仍可提醒'}</small>
                  </span>
                  <Toggle
                    checked={s.channel}
                    label="模拟服务号可用"
                    onChange={() => patch({ channel: !s.channel })}
                  />
                </div>
                <p className="fine">渠道开关仅模拟外部触达条件，不代表真实账号已获得消息权限。</p>
                <div className="notice warm">
                  <Info size={17} />
                  <p>
                    仅修改你对{c.address}的设置，
                    <br />
                    不会改变其他人物的提醒。
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setModal(null)
                    inform('提醒设置已保存在本机。')
                  }}
                >
                  完成设置 <Check size={17} />
                </Button>
              </>
            )}
            {modal === 'original' && (
              <>
                <p className="eyebrow green">THE ORIGINAL MEMORY</p>
                <h2>{s.title}</h2>
                <p className="original-story">{s.originalBody}</p>
                <div className="signature">
                  {s.author} · {s.relation}
                </div>
                <p className="fine">本演示保存案例原文与编辑稿。整理不会替代投稿者的表达。</p>
                <Button secondary onClick={() => setModal(null)}>
                  继续浏览
                </Button>
              </>
            )}
            {modal === 'detail' && detailContent && (
              <>
                <p className="eyebrow green">A THOUGHT FOR YOU</p>
                <h2>
                  送给{c.address}的{c.event}心意
                </h2>
                {detailContent.photo && (
                  <img className="detail-photo" src={src(detailContent.photo)} alt="心意照片" />
                )}
                <p className="original-story">{detailContent.body}</p>
                {detailContent.sticker && (
                  <img
                    className="selected-sticker"
                    src={asset(detailContent.sticker)}
                    alt="祝福表情"
                  />
                )}
                <VoiceCard voice={detailContent.voice || ''} />
                <div className="signature">
                  {s.author} · {c.eventFullDate}
                </div>
                <div className="notice">
                  <CheckCircle size={17} />
                  <p>
                    {detailContent.delivery === 'delivered'
                      ? '已收到相框接收回执（演示），未模拟已读。'
                      : detailContent.delivery === 'none'
                        ? '当前为草稿，尚未提交。'
                        : '已提交，等待整理与接收。'}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setModal(null)
                    if (historyDetail === null) go(9)
                  }}
                >
                  {' '}
                  {historyDetail === null ? '查看相框接收' : '返回我的记录'}{' '}
                </Button>
              </>
            )}
            {modal === 'reset' && (
              <>
                <p className="eyebrow green">START THIS STORY AGAIN</p>
                <h2>重新演示{c.name}的故事？</h2>
                <p className="muted reset-copy">
                  会清空这个案例在本浏览器内的编辑、提醒与投递状态，回到第一份邀请。其他案例保留。
                </p>
                <Button
                  onClick={() => {
                    setState((old) => ({
                      ...old,
                      step: 0,
                      cases: { ...old.cases, [old.caseId]: newCase(old.caseId) },
                    }))
                    setModal(null)
                    setTab('people')
                    setPersonDetail(false)
                    inform('本案例已重置，可以从邀请重新开始。')
                  }}
                >
                  <ArrowCounterClockwise size={17} />
                  重新开始这个案例
                </Button>
                <Button secondary onClick={() => setModal(null)}>
                  继续当前演示
                </Button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
