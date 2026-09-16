import { useEffect, useState, ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  FrameCorners,
  Leaf,
  List,
  SlidersHorizontal,
  X,
  Check,
  Devices,
} from '@phosphor-icons/react'
import { cases, datasets, navigation, CaseId, Page, Mode, coSteps } from './data'
import { load, newCase, newDraft, STORAGE, CaseState, initial } from './model'
import { Context } from './context'
import { Button, Modal, Phone, Avatar } from './ui'
import { Contributor } from './Contributor'
import { Entry, Preparation } from './Preparation'
import { Account, Greeting, Messages } from './Account'
import Frame from './Frame'
import { PhotoImage, stopMedia } from './media'
import './styles.css'

const pages: Page[] = [
  'invite',
  'identity',
  'impressions',
  'photos',
  'stories',
  'wishes',
  'preview',
  'success',
  'entry',
  'host',
  'prepare',
  'curate',
  'freeze',
  'ceremony',
  'onsite',
  'people',
  'person',
  'me',
  'profile',
  'relations',
  'records',
  'preferences',
  'messages',
  'greeting',
  'received',
]
function readRoute() {
  const q = new URLSearchParams(location.search)
  return {
    caseId: cases.find((c) => c.id === q.get('case'))?.id,
    page: pages.includes(q.get('page') as Page) ? (q.get('page') as Page) : undefined,
    mode: ['experience', 'overview', 'compare'].includes(q.get('mode') || '')
      ? (q.get('mode') as Mode)
      : undefined,
  }
}
export default function App() {
  const [state, setState] = useState(() => {
    const s = load(),
      r = readRoute()
    if (r.caseId) s.caseId = r.caseId
    if (r.page) s.cases[s.caseId].page = r.page
    return s
  })
  const [mode, setMode] = useState<Mode>(() => readRoute().mode || 'experience')
  const [notes, setNotes] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [dialog, setDialog] = useState<{ title: string; content: ReactNode } | null>(null)
  const [scene, setScene] = useState('contribution')
  const c = cases.find((c) => c.id === state.caseId)!
  const s = state.cases[c.id]
  const page = s.page
  const patch = (p: Partial<CaseState> | ((s: CaseState) => Partial<CaseState>)) =>
    setState((old) => ({
      ...old,
      cases: {
        ...old.cases,
        [old.caseId]: {
          ...old.cases[old.caseId],
          ...(typeof p === 'function' ? p(old.cases[old.caseId]) : p),
        },
      },
    }))
  const notify = (v: string) => setToast(v)
  const go = (p: Page) => {
    stopMedia()
    setDialog(null)
    setNavOpen(false)
    patch({ page: p })
  }
  const switchCase = (id: CaseId) => {
    stopMedia()
    setDialog(null)
    setState((old) => ({ ...old, caseId: id }))
    setNavOpen(false)
  }
  const modal = (title: string, content: ReactNode) => {
    stopMedia()
    setDialog({ title, content })
  }
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state))
    } catch {
      notify('存储空间不足，当前内容仍在页面中；刷新前请保留输入。')
    }
  }, [state])
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    q.set('case', state.caseId)
    q.set('mode', mode)
    q.set('page', page)
    const url = `${location.pathname}?${q}`
    if (location.search !== `?${q}`) history.pushState(null, '', url)
  }, [state.caseId, page, mode])
  useEffect(() => {
    const pop = () => {
      const r = readRoute()
      stopMedia()
      if (r.mode) setMode(r.mode)
      setState((old) => {
        const id = r.caseId || old.caseId
        return {
          ...old,
          caseId: id,
          cases: { ...old.cases, [id]: { ...old.cases[id], page: r.page || 'invite' } },
        }
      })
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4200)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page, state.caseId, mode])
  const reset = (clear: boolean) => {
    stopMedia()
    setDialog(null)
    setScene('contribution')
    setMode('experience')
    setState((old) => ({
      ...old,
      cases: {
        ...old.cases,
        [old.caseId]: clear ? newCase(old.caseId) : { ...old.cases[old.caseId], page: 'invite' },
      },
    }))
    notify(clear ? '本案例已恢复初始演示状态' : '已回到邀请，草稿继续保留')
  }
  const activeNav =
    coSteps.includes(page) || page === 'identity'
      ? 'impressions'
      : ['host', 'entry'].includes(page)
        ? 'invite'
        : ['curate', 'freeze'].includes(page)
          ? 'prepare'
          : ['me', 'profile', 'relations', 'records', 'person', 'preferences'].includes(page)
            ? 'people'
            : page === 'success'
              ? 'preview'
              : page
  const navIndex = Math.max(
    0,
    navigation.findIndex((n) => n.page === activeNav),
  )
  const navItem = navigation[navIndex]
  function showPhone(p: Page = page) {
    let content: ReactNode
    let role = `共创者 · ${s.draft.name}`
    let title = '拾光叙'
    if (['entry', 'host'].includes(p)) {
      content = <Entry page={p} go={go} />
      role = '发起方 · ' + c.operator
      title = '发起一份礼物'
    } else if (['prepare', 'curate', 'freeze'].includes(p)) {
      content = <Preparation compact go={go} />
      role = s.curator ? `主创 · ${c.curator || c.operator}` : '系统整理结果'
    } else if (
      ['people', 'person', 'me', 'profile', 'relations', 'records', 'preferences'].includes(p)
    )
      content = <Account key={p + c.id} page={p} go={go} />
    else if (p === 'messages') content = <Messages go={go} />
    else if (p === 'greeting' || p === 'onsite')
      content = <Greeting key={p + c.id} onsite={p === 'onsite'} go={go} />
    else {
      content = <Contributor key={p + c.id} page={p} go={go} />
      title = `一起准备${c.category}`
    }
    return (
      <Phone page={p} go={go} title={title} role={role}>
        {content}
      </Phone>
    )
  }
  function selectMode(m: Mode) {
    stopMedia()
    setMode(m)
    setNavOpen(false)
  }
  return (
    <Context.Provider
      value={{
        c,
        s,
        state,
        patch,
        setState,
        go,
        switchCase,
        notify,
        modal,
        closeModal: () => setDialog(null),
      }}
    >
      <div className={`app mode-${mode}`}>
        <header className="site-header">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go('invite')
            }}
          >
            <span className="brand-icon">
              <FrameCorners size={28} />
              <i />
            </span>
            <strong>拾光叙</strong>
            <span className="brand-divider" />
            <small>一份礼物 · 许多人的心意</small>
          </a>
          <nav className="mode-switch" aria-label="展示模式">
            {(
              [
                ['experience', '单人体验'],
                ['overview', '链路总览'],
                ['compare', '多端对照'],
              ] as const
            ).map(([v, t]) => (
              <button key={v} className={mode === v ? 'active' : ''} onClick={() => selectMode(v)}>
                {t}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button notes-toggle"
              aria-label="讲解备注"
              onClick={() => setNotes(!notes)}
            >
              <SlidersHorizontal size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="重新演示"
              onClick={() =>
                modal(
                  '重新演示当前案例',
                  <>
                    <p className="prose">
                      可以回到开头继续使用草稿，也可以把当前案例恢复到初始状态。其他案例的内容会保留。
                    </p>
                    <Button onClick={() => reset(false)}>回到开头，保留草稿</Button>
                    <Button secondary onClick={() => reset(true)}>
                      清除本次修改，重新演示
                    </Button>
                  </>,
                )
              }
            >
              <ArrowCounterClockwise size={21} />
            </button>
            <div className="case-selector">
              <PhotoImage path={s.host.cover} alt={s.host.name} />
              <select
                aria-label="选择案例"
                value={c.id}
                onChange={(e) => switchCase(e.target.value as CaseId)}
              >
                {['荣休礼', '生日礼', '婚龄礼'].map((category) => (
                  <optgroup key={category} label={category}>
                    {cases
                      .filter((c) => c.category === category)
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.id === 'teacher'
                            ? '老师荣休'
                            : x.id === 'leader'
                              ? '老领导荣休'
                              : x.id === 'nurse'
                                ? '护士长荣休'
                                : x.id === 'birthday'
                                  ? '顾雅琴生日'
                                  : '四十年婚龄礼'}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <button
              className="icon-button mobile-menu"
              aria-label="流程目录"
              onClick={() => setNavOpen(!navOpen)}
            >
              <List size={23} />
            </button>
          </div>
        </header>
        <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
          <div className="sidebar-intro">
            <span>体验一份{c.category}</span>
            <small>THE GIFT JOURNEY</small>
          </div>
          <nav>
            {navigation.map((n, i) => (
              <button
                key={n.page}
                className={activeNav === n.page ? 'active' : ''}
                onClick={() => go(n.page)}
                title={n.label}
              >
                <i>{i < navIndex ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</i>
                <span>{n.label}</span>
                {activeNav === n.page && <b />}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Leaf size={25} />
            <p>
              从一次共创，
              <br />
              到下一次问候。
            </p>
            <small>三种礼物，五段值得留住的时光。</small>
            <button onClick={() => go('entry')}>
              发起一份礼物
              <ArrowRight size={17} />
            </button>
          </div>
        </aside>
        <main className="main-stage">
          <div className="breadcrumb">
            <span>{c.category}</span>
            <span>›</span>
            <span>{s.host.address}</span>
            <span>›</span>
            <b>
              {mode === 'overview'
                ? '整件事，怎样发生'
                : mode === 'compare'
                  ? '一次操作，几个界面的变化'
                  : navItem.label}
            </b>
            <small>DEMO 04 · 可点击体验</small>
          </div>
          {mode === 'overview' ? (
            <Overview
              onNode={(p) => {
                go(p)
                selectMode('experience')
              }}
              onCompare={(v, p) => {
                setScene(v)
                go(p)
                selectMode('compare')
              }}
            />
          ) : mode === 'compare' ? (
            <>
              <div className="stage-heading">
                <div>
                  <div className="eyebrow">ONE STORY, DIFFERENT PERSPECTIVES</div>
                  <h1>
                    同一份心意，
                    <br />
                    在几个界面慢慢发生。
                  </h1>
                </div>
                <p>
                  左边亲手操作，右边看到变化。
                  <br />
                  每个人都有自己的视角，大家共同完成一份礼物。
                </p>
              </div>
              <div className="comparison-scenes">
                {[
                  ['contribution', '共创进入礼物'],
                  ['curation', '主创精选故事'],
                  ['onsite', '现场再添一句'],
                  ['reminder', '提醒与再次问候'],
                ].map(([v, t]) => (
                  <button
                    key={v}
                    className={scene === v ? 'active' : ''}
                    onClick={() => {
                      setScene(v)
                      go(
                        v === 'onsite'
                          ? 'onsite'
                          : v === 'reminder'
                            ? 'messages'
                            : v === 'curation'
                              ? 'success'
                              : 'impressions',
                      )
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className={`comparison-grid scene-${scene}`}>
                <div>
                  {showPhone(
                    scene === 'onsite'
                      ? 'onsite'
                      : scene === 'reminder'
                        ? ['messages', 'greeting', 'success'].includes(page)
                          ? page
                          : 'messages'
                        : ['prepare', 'ceremony', 'received', 'people', 'entry', 'host'].includes(
                              page,
                            )
                          ? 'preview'
                          : page,
                  )}
                </div>
                <div className="manager-panel">
                  <div className="role-label">
                    <i />
                    {scene === 'reminder'
                      ? '提醒与接收状态'
                      : s.curator
                        ? `主创 · ${c.curator || c.operator}`
                        : '系统整理结果'}
                  </div>
                  <div className="manager-sheet">
                    {scene === 'reminder' ? (
                      <>
                        <div className="eyebrow">同一个人，同一次问候</div>
                        <h2>
                          {c.event}，<br />
                          还想起了对方。
                        </h2>
                        <p className="prose">
                          {c.eventDate} · {s.host.address}
                        </p>
                        <Button
                          secondary
                          onClick={() => {
                            if (!s.remind) {
                              notify('请先在左侧选择开启提醒')
                              return
                            }
                            patch({ notification: true })
                            go('messages')
                          }}
                        >
                          模拟重要日子提醒
                        </Button>
                        <div className="delivery-status">
                          <span className={s.greetingSent ? 'done' : ''}>① 提交新的心意</span>
                          <span
                            className={['delivered', 'read'].includes(s.delivery) ? 'done' : ''}
                          >
                            ② 相框收到
                          </span>
                          <span className={s.delivery === 'read' ? 'done' : ''}>③ 对方打开</span>
                        </div>
                        <Button
                          disabled={s.delivery !== 'waiting'}
                          onClick={() => patch({ delivery: 'delivered' })}
                        >
                          模拟相框接收
                        </Button>
                        <p className="helper">服务号消息与设备回执为演示操作。</p>
                      </>
                    ) : (
                      <Preparation compact go={go} />
                    )}
                  </div>
                </div>
                <div className="compare-frame">
                  <Frame compact received={scene === 'reminder'} />
                </div>
              </div>
              <div className="comparison-explanation">
                <Devices size={21} />
                <p>
                  {scene === 'reminder'
                    ? '点击提醒回到这个人，新的祝福进入相框，原来的礼物仍然在。'
                    : scene === 'onsite'
                      ? '现场投稿独立留下。打开“相框显示独立现场心意”，再查看相框祝福章节。'
                      : '草稿只属于作者。提交且确认用途以后，整理页和相框预览才会出现这份内容。'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="stage-heading">
                <div>
                  <div className="eyebrow">
                    <em>{String(navIndex + 1).padStart(2, '0')}</em>
                    {navItem.phase}
                  </div>
                  <h1>
                    {page === 'ceremony'
                      ? '把这些年的谢谢，\n郑重说给你听。'
                      : page === 'received'
                        ? '新的心意，\n又来到你身边。'
                        : page === 'impressions' || coSteps.includes(page)
                          ? '不用写完一生，\n记得一件事就好。'
                          : page === 'invite'
                            ? c.title
                            : navItem.label}
                  </h1>
                </div>
                <p>{navItem.note}</p>
              </div>
              {['ceremony', 'received'].includes(page) ? (
                <div className="single-frame">
                  <Frame received={page === 'received'} />
                </div>
              ) : (
                <div className="experience-grid">
                  <div className="experience-narrative">
                    <div className="big-quote">
                      “
                      {c.id === 'teacher'
                        ? '先看看自己，\n已经走到了哪儿。'
                        : c.id === 'leader'
                          ? '负责，不等于\n一个人扛住所有事。'
                          : c.id === 'nurse'
                            ? '遇到不确定的事，\n就问。'
                            : c.id === 'birthday'
                              ? '不用先问自己，\n是不是太晚。'
                              : '普通的话，\n也愿意一起说很多年。'}
                      ”
                    </div>
                    <div className="narrative-rule" />
                    <p>{c.subtitle}</p>
                    <div className="mini-people">
                      {datasets[c.id].authors.slice(0, 5).map((a) => (
                        <Avatar name={a.name} key={a.id} />
                      ))}
                      <span>和许多记得的人一起</span>
                    </div>
                    <small>虚构人物与活动示例，内容可直接体验。</small>
                    <button className="overview-link" onClick={() => selectMode('overview')}>
                      看看整条链路
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  {showPhone()}
                </div>
              )}
            </>
          )}
        </main>
        <footer className="journey-footer">
          <span>
            <i />
            {c.category} ·{' '}
            {mode === 'overview' ? '链路总览' : mode === 'compare' ? '多端联动演示' : navItem.label}
          </span>
          <div>
            <button onClick={() => go(navigation[Math.max(0, navIndex - 1)].page)}>
              <ArrowLeft size={17} />
              上一步
            </button>
            <Button onClick={() => go(navigation[(navIndex + 1) % navigation.length].page)}>
              {navIndex === navigation.length - 1
                ? '回到这份礼物'
                : `下一步 · ${navigation[(navIndex + 1) % navigation.length].label}`}
              <ArrowRight size={18} />
            </Button>
          </div>
        </footer>
        {notes && (
          <aside className="notes-panel">
            <button
              className="notes-close"
              onClick={() => setNotes(false)}
              aria-label="关闭讲解备注"
            >
              <X size={21} />
            </button>
            <div className="eyebrow">给讲解者</div>
            <h2>每一步，为什么这样做。</h2>
            <label className="field">
              <span>以谁的身份参与</span>
              <select
                aria-label="切换演示共创者"
                value={s.draft.authorId}
                onChange={(e) => {
                  stopMedia()
                  patch({ draft: newDraft(c.id, e.target.value), page: 'identity' })
                  setNotes(false)
                }}
              >
                {datasets[c.id].authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <p>{navItem.note}</p>
            <ul>
              <li>主创可选，系统整理是完整的一条路径。</li>
              <li>关系是“我是对方的什么人”，和管理权限分开。</li>
              <li>仪式影集默认手动，点击播放才会推进。</li>
              <li>作者确认用途后，内容才进入相应展示。</li>
              <li>同一个入口，可以从礼前一直用到礼后。</li>
            </ul>
            <Button
              secondary
              onClick={() => {
                patch((x) => ({
                  hiddenSeed: [...new Set([...x.hiddenSeed, x.draft.authorId])],
                  draft: newDraft(c.id),
                  version: null,
                  page: 'identity',
                }))
                setNotes(false)
              }}
            >
              从头演示一次共创
            </Button>
            <Button
              secondary
              onClick={() => {
                modal(
                  '恢复全部演示案例',
                  <>
                    <p>将清除五个案例在本浏览器里的修改，保留原始案例素材。</p>
                    <Button
                      onClick={() => {
                        stopMedia()
                        setState(initial())
                        setDialog(null)
                        setNotes(false)
                        setMode('experience')
                      }}
                    >
                      确认恢复全部案例
                    </Button>
                  </>,
                )
              }}
            >
              恢复全部案例
            </Button>
            <small>本版为静态Demo。媒体保存在本机，消息及AI处理以明确示例演示。</small>
          </aside>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
          </div>
        )}
        {dialog && (
          <Modal title={dialog.title} close={() => setDialog(null)}>
            {dialog.content}
          </Modal>
        )}
      </div>
    </Context.Provider>
  )
}

function Overview({
  onNode,
  onCompare,
}: {
  onNode: (p: Page) => void
  onCompare: (scene: string, p: Page) => void
}) {
  const { c, s } = requireContext()
  const phases = [
    ['发起与邀请', '一份礼物，从一个人开始'],
    ['四步共创', '让每个人都留下自己的片段'],
    ['整理成礼', '把大家的心意放在一起'],
    ['仪式与现场', '郑重送出，也继续补充'],
    ['日子继续', '记住参与过的人'],
    ['再一次问候', '重要的日子，又想起对方'],
  ]
  const lanes = [
    {
      name: '主办 / 主创',
      subtitle: '有人牵头，也可以自动整理',
      pages: ['host', 'prepare', 'prepare', 'prepare', null, null],
      titles: [
        '填写人物与主办资料',
        '看看大家的投稿',
        '精选、预览与定稿',
        '查看仪式版本',
        '主创可以卸任',
        '无需主创介入',
      ],
    },
    {
      name: '共创者',
      subtitle: '我留下的心意，我自己决定',
      pages: ['invite', 'impressions', 'preview', 'onsite', 'people', 'greeting'],
      titles: [
        '打开邀请，认识对方',
        '印象 → 照片 → 故事 → 祝福',
        '预览并确认用途',
        '同一入口，补一句祝福',
        '我参与过的人',
        '再送一份心意',
      ],
    },
    {
      name: '相框 / 受礼者',
      subtitle: '一份作品，和后来的新心意',
      pages: ['ceremony', 'ceremony', 'ceremony', 'ceremony', 'received', 'received'],
      titles: [
        '人物封面预览',
        '资料还在汇集',
        '未定稿的礼物预览',
        '回忆影集与大家的祝福',
        '原礼物，留在相框',
        '新心意，在身边',
      ],
    },
  ]
  return (
    <>
      <div className="stage-heading">
        <div>
          <div className="eyebrow">THE WHOLE JOURNEY</div>
          <h1>
            一场相聚，
            <br />
            和此后很多次想起。
          </h1>
        </div>
        <p>
          横向看事情怎样发生，纵向看每个人在做什么。
          <br />
          点击一张页面卡片，就能走进那一步。
        </p>
      </div>
      <div className="overview-toolbar">
        <span>
          <i />
          业务阶段与角色视角
        </span>
        <Button secondary onClick={() => onCompare('contribution', 'impressions')}>
          并排演示一次共创
          <Devices size={18} />
        </Button>
      </div>
      <div className="flow-scroll">
        <div className="flow-grid">
          <div className="flow-corner">
            一份{c.category}
            <small>{s.host.address}</small>
          </div>
          {phases.map(([title, sub], i) => (
            <div className="phase-heading" key={title}>
              <small>0{i + 1}</small>
              <h3>{title}</h3>
              <p>{sub}</p>
            </div>
          ))}
          {lanes.map((lane, li) => (
            <div className="flow-lane" key={lane.name}>
              <div className="lane-label">
                <span>0{li + 1}</span>
                <h3>{lane.name}</h3>
                <p>{lane.subtitle}</p>
              </div>
              {lane.titles.map((title, i) => (
                <button
                  className={`flow-node lane-${li}`}
                  disabled={!lane.pages[i]}
                  key={i}
                  onClick={() => onNode(lane.pages[i] as Page)}
                >
                  <div className="screen-thumbnail">
                    <div className="mini-top">
                      9:41 <span>···</span>
                    </div>
                    {li === 2 || i === 0 ? (
                      <PhotoImage path={s.host.cover} alt={s.host.name} />
                    ) : li === 1 && i === 1 ? (
                      <div className="mini-four">
                        <span>1 印象</span>
                        <span>2 照片</span>
                        <span>3 故事</span>
                        <span>4 祝福</span>
                      </div>
                    ) : li === 0 ? (
                      <div className="mini-stats">
                        <b>
                          {datasets[c.id].authors.length}
                          <small>位参与者</small>
                        </b>
                        <b>
                          {datasets[c.id].photos.length}
                          <small>张照片</small>
                        </b>
                      </div>
                    ) : (
                      <div className="mini-avatar">
                        <Avatar name={s.host.name} />
                        <span>{s.host.address}</span>
                      </div>
                    )}
                    <div className="mini-lines">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="mini-button" />
                  </div>
                  <span className="node-title">{title}</span>
                  {lane.pages[i] && (
                    <small>
                      点击体验 <ArrowRight size={12} />
                    </small>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="overview-bottom">
        <Leaf size={26} />
        <div>
          <h3>相聚那天，礼物完成了。之后的问候，还可以继续。</h3>
          <p>这里的时间线记录业务阶段；相框里呈现的是照片、故事和人的心意。</p>
        </div>
        <Button onClick={() => onCompare('reminder', 'messages')}>
          看看礼后的联动
          <ArrowRight size={18} />
        </Button>
      </div>
    </>
  )
}
import { useDemo as requireContext } from './context'
