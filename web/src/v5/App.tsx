import { useEffect, useRef, useState, ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  FrameCorners,
  List,
  SlidersHorizontal,
  X,
  Check,
  LockSimple,
} from '@phosphor-icons/react'
import { cases, datasets, CaseId, Page, Role, Mode } from './data'
import { State, CaseState, load, initial, newCase, newDraft, STORAGE, available } from './model'
import { Context, DemoContext } from './context'
import { Button, Modal, Phone, Avatar, Note } from './ui'
import { Contributor } from './Contributor'
import { Entry, Preparation, Gifts, ShareCard } from './Preparation'
import { Account, Messages } from './Account'
import { Greeting, Guest } from './Greeting'
import Frame from './Frame'
import { PhotoImage, stopMedia } from './media'
import { roles, lifecycle, stageOf, stageEnabled, managedPages, isManager } from './workflow'
import './styles.css'
import './v5.css'
const allPages: Page[] = [
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
  'workspace',
  'organize',
  'letter',
  'product',
  'handover',
  'share',
  'waiting',
  'guest',
  'progress',
  'invite_manage',
  'gifts',
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
function route() {
  const q = new URLSearchParams(location.search)
  return {
    caseId: cases.find((c) => c.id === q.get('case'))?.id,
    role: roles.find((r) => r.id === q.get('role'))?.id,
    page: allPages.includes(q.get('page') as Page) ? (q.get('page') as Page) : undefined,
    mode: ['experience', 'overview', 'compare'].includes(q.get('mode') || '')
      ? (q.get('mode') as Mode)
      : ('experience' as Mode),
    stage: Math.max(
      0,
      Math.min(12, Number(q.get('stage')) || stageOf((q.get('page') || 'invite') as Page)),
    ),
  }
}
export default function App() {
  const [state, setState] = useState<State>(() => {
    const s = load(),
      r = route()
    if (r.caseId) s.caseId = r.caseId
    if (r.role) s.role = r.role
    if (r.page) s.cases[s.caseId].page = r.page
    return s
  })
  const [mode, setMode] = useState<Mode>(() => route().mode)
  const [viewStage, setViewStage] = useState(() =>
    route().page ? stageOf(route().page!) : stageOf(state.cases[state.caseId].page),
  )
  const [notes, setNotes] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [dialog, setDialog] = useState<{ title: string; content: ReactNode } | null>(null)
  const [compareWriter, setCompareWriter] = useState<Page>('identity')
  const [compareManager, setCompareManager] = useState<Page>('workspace')
  const [compareEnd, setCompareEnd] = useState(false)
  const popping = useRef(false)
  const c = cases.find((c) => c.id === state.caseId)!
  const s = state.cases[c.id],
    page = s.page,
    role = state.role
  const notify = (v: string) => setToast(v)
  // Bind updates to the rendered project, so delayed media saves cannot land in a newly selected project.
  const patch = (p: Partial<CaseState> | ((s: CaseState) => Partial<CaseState>)) =>
    setState((old) => ({
      ...old,
      cases: {
        ...old.cases,
        [c.id]: { ...old.cases[c.id], ...(typeof p === 'function' ? p(old.cases[c.id]) : p) },
      },
    }))
  const go = (p: Page) => {
    stopMedia()
    setDialog(null)
    setNavOpen(false)
    setViewStage(stageOf(p))
    setState((old) => ({
      ...old,
      cases: { ...old.cases, [old.caseId]: { ...old.cases[old.caseId], page: p } },
    }))
  }
  const setRole = (r: Role) => {
    stopMedia()
    setDialog(null)
    const p = stageEnabled(viewStage, r, s)
      ? lifecycle[viewStage].pages[r]!
      : r === 'recipient'
        ? s.version
          ? 'ceremony'
          : 'waiting'
        : r === 'coordinator'
          ? 'workspace'
          : 'invite'
    setViewStage(stageEnabled(viewStage, r, s) ? viewStage : stageOf(p))
    setState((old) => ({
      ...old,
      role: r,
      cases: { ...old.cases, [old.caseId]: { ...old.cases[old.caseId], page: p } },
    }))
  }

  const switchCase = (id: CaseId) => {
    stopMedia()
    setDialog(null)
    setState((old) => ({ ...old, caseId: id }))
    setViewStage(stageOf(state.cases[id].page))
    setNavOpen(false)
  }
  const modal = (title: string, content: ReactNode) => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    stopMedia()
    setDialog({ title, content })
  }
  const closeModal = () => {
    stopMedia()
    setDialog(null)
  }
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(state))
    } catch {
      notify('本机存储空间不足，刷新前请保留输入。')
    }
  }, [state])
  useEffect(() => {
    const q = new URLSearchParams()
    q.set('case', c.id)
    q.set('role', role)
    q.set('page', page)
    q.set('mode', mode)
    q.set('stage', String(viewStage))
    if (popping.current) {
      popping.current = false
      return
    }
    if (location.search !== `?${q}`) history.pushState(null, '', `${location.pathname}?${q}`)
  }, [c.id, role, page, mode, viewStage])
  useEffect(() => {
    const pop = () => {
      const r = route()
      popping.current = true
      stopMedia()
      setDialog(null)
      setMode(r.mode)
      setViewStage(r.stage)
      setState((old) => {
        const id = r.caseId || old.caseId
        return {
          ...old,
          caseId: id,
          role: r.role || old.role,
          cases: { ...old.cases, [id]: { ...old.cases[id], page: r.page || 'invite' } },
        }
      })
    }
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [c.id, page, role, mode])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  const ctx: DemoContext = {
    c,
    s,
    state,
    role,
    setRole,
    patch,
    setState,
    go,
    switchCase,
    notify,
    modal,
    closeModal,
  }
  function waiting(text = '这份礼物，正在被认真准备。') {
    return (
      <div className="waiting-view">
        <div className="waiting-seal">
          <LockSimple size={30} />
        </div>
        <div className="eyebrow">每个角色，都有自己的时刻</div>
        <h2>{text}</h2>
        <p>统筹者确认相框成品后，长者才能打开仪式、照片和大家写来的信。</p>
        <small>左侧保留完整生命周期，灰色阶段不属于当前角色的操作。</small>
      </div>
    )
  }
  function phoneContent(p: Page, r: Role = role, navigate: (p: Page) => void = go): ReactNode {
    if (managedPages.includes(p) && r !== 'coordinator')
      return (
        <div className="phone-body">
          <Note>这一步由统筹者负责。你的心意已经在礼物中，稍后可以回来查看成果。</Note>
          <Button onClick={() => navigate('people')}>我参与的人</Button>
        </div>
      )
    if (['entry', 'host'].includes(p)) return <Entry page={p} go={navigate} />
    if (p === 'gifts') return <Gifts go={navigate} />
    if (managedPages.includes(p)) return <Preparation page={p} go={navigate} />
    if (p === 'share') return <ShareCard />
    if (p === 'guest') return <Guest go={navigate} />
    if (p === 'onsite' && r === 'coordinator')
      return (
        <div className="phone-body">
          <h2>
            现场也有人，
            <br />
            想加入这份心意。
          </h2>
          <p className="prose">第一次参与的人也可以扫码留下照片或祝福。</p>
          <Note>
            已有{available(c.id, s).filter((b) => b.source === 'onsite').length}
            份现场心意。已确认的仪式和总信保持不变。
          </Note>
          <Button secondary onClick={() => patch({ onsite: !s.onsite })}>
            {s.onsite ? '关闭现场专用入口' : '开启现场专用入口（可选）'}
          </Button>
          <Button secondary onClick={() => patch({ onsiteVisible: !s.onsiteVisible })}>
            {s.onsiteVisible ? '收起现场心意' : '相框显示独立现场心意'}
          </Button>
          <button className="text-button" onClick={() => navigate('invite_manage')}>
            原共创邀请仍可用
          </button>
        </div>
      )
    if (p === 'onsite' || p === 'greeting')
      return <Greeting onsite={p === 'onsite'} go={navigate} />
    if (p === 'messages' && r === 'coordinator')
      return (
        <div className="phone-body">
          <div className="eyebrow">礼物消息</div>
          <h2>
            每一步进展，
            <br />
            都在这里。
          </h2>
          <p className="helper">当前项目的任务提示 · 演示数据，不会发送真实消息</p>
          <button className="entry-card" onClick={() => navigate('workspace')}>
            <span>
              <h3>看看共创进展</h3>
              <p>当前有 {available(c.id, s).length} 项心意，查看参与情况与待办。</p>
            </span>
            <ArrowRight />
          </button>
          <button className="entry-card" onClick={() => navigate('invite_manage')}>
            <span>
              <h3>共创截止 {s.host.deadline}</h3>
              <p>回到邀请页，继续邀请记得的人。</p>
            </span>
            <ArrowRight />
          </button>
          <button className="entry-card" onClick={() => navigate(s.version ? 'product' : 'letter')}>
            <span>
              <h3>
                {s.version
                  ? '成品已确认'
                  : s.letter.confirmed
                    ? '总信已确认，去预览成品'
                    : '大家写给你的一封信，等待确认'}
              </h3>
              <p>由统筹者检查后，再交到长者手中。</p>
            </span>
            <ArrowRight />
          </button>
        </div>
      )
    if (p === 'messages') return <Messages go={navigate} />
    if (['people', 'person', 'me', 'profile', 'relations', 'records', 'preferences'].includes(p)) {
      if (r === 'coordinator')
        return (
          <div className="phone-body">
            <Avatar name={s.coordinatorViewer} size="large" />
            <h2>{s.coordinatorViewer}</h2>
            <p className="prose">{isManager(s) ? '正在统筹这份礼物' : '已经移交这份礼物'}</p>
            <Button onClick={() => navigate('gifts')}>我的礼物</Button>
            <Button secondary onClick={() => navigate('entry')}>
              发起礼物
            </Button>
          </div>
        )
      return <Account page={p} go={navigate} />
    }
    return <Contributor page={p} go={navigate} />
  }
  function phone(p: Page, r: Role = role, navigate: (p: Page) => void = go) {
    return (
      <Context.Provider value={{ ...ctx, role: r, go: navigate }}>
        <Phone
          key={`${c.id}-${r}`}
          page={p}
          go={navigate}
          title={managedPages.includes(p) ? '整理成礼' : '拾光叙'}
          role={`${r === 'coordinator' ? '统筹者' : '共创者'} · ${r === 'coordinator' ? s.coordinatorViewer : s.draft.name}`}
        >
          <div key={`${c.id}-${p}-${r}`}>{phoneContent(p, r, navigate)}</div>
        </Phone>
      </Context.Provider>
    )
  }
  function chooseStage(i: number) {
    if (!stageEnabled(i, role, s)) return
    go(lifecycle[i].pages[role]!)
    setViewStage(i)
  }
  const previous = [...lifecycle.keys()]
    .reverse()
    .find((i) => i < viewStage && stageEnabled(i, role, s))
  const next = [...lifecycle.keys()].find((i) => i > viewStage && stageEnabled(i, role, s))
  const frameAllowed = role === 'coordinator' || (role === 'recipient' && !!s.version)
  const framePage = ['ceremony', 'received'].includes(page)
  const blocked = role === 'recipient' && (!s.version || !framePage)
  const reset = () => {
    stopMedia()
    setDialog(null)
    setState((old) => ({
      ...old,
      role: 'contributor',
      cases: { ...old.cases, [c.id]: newCase(c.id) },
    }))
    setMode('experience')
    setViewStage(1)
    setCompareWriter('identity')
    setCompareManager('workspace')
  }
  return (
    <Context.Provider value={ctx}>
      <div className={`app mode-${mode} app-v5`}>
        <header className="site-header">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              go(role === 'coordinator' ? 'gifts' : role === 'recipient' ? 'ceremony' : 'people')
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
                ['experience', '角色体验'],
                ['overview', '链路总览'],
                ['compare', '多端对照'],
              ] as const
            ).map(([m, t]) => (
              <button
                key={m}
                className={mode === m ? 'active' : ''}
                onClick={() => {
                  stopMedia()
                  setMode(m)
                }}
              >
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
                    <p>恢复当前案例的演示资料和流程，其他案例保持不变。</p>
                    <Button onClick={reset}>确认恢复当前案例</Button>
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
                {cases.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.id === 'teacher'
                      ? '老师荣休'
                      : x.id === 'leader'
                        ? '老领导荣休'
                        : x.id === 'nurse'
                          ? '护士长荣休'
                          : x.id === 'birthday'
                            ? '生日礼探索'
                            : '婚龄礼探索'}
                  </option>
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
            <span>这份礼物的一生</span>
            <small>THE GIFT JOURNEY</small>
          </div>
          <nav aria-label="礼物生命周期">
            {lifecycle.map((n, i) => {
              const enabled = stageEnabled(i, role, s)
              const done =
                i === 4
                  ? s.review.photos && s.review.stories && s.review.wishes
                  : i === 5
                    ? s.letter.confirmed
                    : i === 6
                      ? !!s.version
                      : i === 7
                        ? !!s.version
                        : i === 12
                          ? s.delivery === 'read'
                          : i < Math.min(s.stage, 4)
              return (
                <button
                  key={n.label}
                  disabled={!enabled}
                  className={`${viewStage === i ? 'active' : ''} ${done ? 'completed' : ''}`}
                  aria-label={`${String(i + 1).padStart(2, '0')} ${n.label}`}
                  title={
                    !enabled
                      ? role === 'recipient' && !s.version
                        ? '礼物正在准备中'
                        : '这个阶段由其他角色参与'
                      : n.label
                  }
                  onClick={() => chooseStage(i)}
                >
                  <i>{done ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</i>
                  <span>{n.label}</span>
                  {viewStage === i && <b />}
                </button>
              )
            })}
          </nav>
          <div className="timeline-legend">
            <span>● 当前</span>
            <span>✓ 已完成</span>
            <span>○ 灰色暂不可进入</span>
          </div>
        </aside>
        <main className="main-stage">
          <div className="role-strip">
            <span>现在，以谁的视角体验</span>
            <div role="group" aria-label="体验角色">
              {roles.map((r) => (
                <button
                  key={r.id}
                  aria-pressed={role === r.id}
                  className={role === r.id ? 'active' : ''}
                  onClick={() => {
                    setRole(r.id)
                    setMode('experience')
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <small>DEMO 05 · 09·13更新</small>
          </div>
          <div className="breadcrumb">
            <span>{c.category}</span>
            <span>›</span>
            <span>{s.host.address}</span>
            <span>›</span>
            <b>{lifecycle[viewStage].label}</b>
          </div>
          {mode === 'overview' ? (
            <>
              <div className="stage-heading">
                <div>
                  <div className="eyebrow">THE WHOLE JOURNEY</div>
                  <h1>
                    同一份礼物，
                    <br />
                    三个清楚的视角。
                  </h1>
                </div>
                <p>同一条生命周期。谁在留下、谁在整理、谁在收到，都有自己的位置。</p>
              </div>
              <div className="overview-v5">
                {roles.map((r) => (
                  <section className="overview-lane" key={r.id}>
                    <h3>{r.label}</h3>
                    <div>
                      {lifecycle.map((n, i) => (
                        <button
                          key={n.label}
                          disabled={!stageEnabled(i, r.id, s)}
                          onClick={() => {
                            setRole(r.id)
                            setMode('experience')
                            go(n.pages[r.id]!)
                            setViewStage(i)
                          }}
                        >
                          <small>{String(i + 1).padStart(2, '0')}</small>
                          <b>{n.label}</b>
                          <span>
                            {!n.pages[r.id]
                              ? '这个阶段由其他角色参与'
                              : r.id === 'recipient' && !s.version
                                ? '礼物准备中'
                                : i < 7 && s.version
                                  ? '已完成 · 查看'
                                  : '点击体验 →'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : mode === 'compare' ? (
            <>
              <div className="stage-heading">
                <div>
                  <div className="eyebrow">DIFFERENT PERSPECTIVES</div>
                  <h1>
                    同一份心意，
                    <br />
                    在三个界面发生。
                  </h1>
                </div>
                <p>
                  左边留下内容，中间整理确认，右边由长者收到。未确认的成品不会提前出现在长者端。
                </p>
              </div>
              <div className="comparison-scenes">
                {[
                  ['共创与整理', false],
                  ['提醒与再次问候', true],
                ].map(([t, end]) => (
                  <button
                    key={String(t)}
                    className={compareEnd === end ? 'active' : ''}
                    onClick={() => {
                      stopMedia()
                      setCompareEnd(Boolean(end))
                      setCompareWriter(end ? 'messages' : 'identity')
                      setCompareManager('workspace')
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="comparison-grid">
                <div>
                  {phone(compareWriter, 'contributor', (p) => {
                    stopMedia()
                    setCompareWriter(p)
                  })}
                </div>
                <div>
                  {compareEnd ? (
                    <div className="manager-sheet">
                      <h2>新心意的旅程</h2>
                      <p>提交 → 等待相框接收 → 对方打开</p>
                      <Note>
                        {s.delivery === 'none'
                          ? '还没有新的心意'
                          : s.delivery === 'waiting'
                            ? '已提交，等待相框接收'
                            : s.delivery === 'delivered'
                              ? '相框已收到'
                              : '对方已打开'}
                      </Note>
                      <Button
                        disabled={s.delivery !== 'waiting' || !s.version}
                        onClick={() => patch({ delivery: 'delivered' })}
                      >
                        演示相框接收
                      </Button>
                    </div>
                  ) : (
                    phone(compareManager, 'coordinator', (p) => {
                      stopMedia()
                      setCompareManager(p)
                    })
                  )}
                </div>
                <div className="compare-frame">
                  {s.version ? (
                    <Context.Provider
                      value={{ ...ctx, s: { ...s, previewing: false }, role: 'recipient' }}
                    >
                      <Frame compact received={compareEnd} />
                    </Context.Provider>
                  ) : (
                    waiting()
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="stage-heading">
                <div>
                  <div className="eyebrow">
                    <em>{String(viewStage + 1).padStart(2, '0')}</em>
                    {roles.find((r) => r.id === role)!.label}
                  </div>
                  <h1>
                    {page === 'invite'
                      ? c.title
                      : page === 'workspace'
                        ? '把大家的心意，\n一步一步整理成礼。'
                        : page === 'waiting'
                          ? '礼物正在准备，\n心意慢慢相聚。'
                          : lifecycle[viewStage].label}
                  </h1>
                </div>
                <p>
                  {role === 'contributor'
                    ? '你负责留下真实的记得；之后，还可以继续问候。'
                    : role === 'coordinator'
                      ? '小叙先整理，统筹者确认。进度、内容和成品都在这里。'
                      : '那些有人替你记住的片段，现在来到身边。'}
                </p>
              </div>
              {blocked ? (
                waiting()
              ) : framePage ? (
                frameAllowed ? (
                  <>
                    <div className="recipient-actions">
                      {page === 'received' && (
                        <Button
                          disabled={s.delivery !== 'waiting'}
                          onClick={() => patch({ delivery: 'delivered' })}
                        >
                          {s.delivery === 'waiting'
                            ? '演示相框收到新心意'
                            : s.delivery === 'none'
                              ? '还没有新的心意'
                              : '相框已收到'}
                        </Button>
                      )}
                      {role === 'recipient' && (
                        <span>已收到仪式版本 V{s.version?.number} · 内容由统筹者确认</span>
                      )}
                    </div>
                    <Context.Provider value={{ ...ctx, s: { ...s, previewing: false } }}>
                      <Frame received={page === 'received'} />
                    </Context.Provider>
                  </>
                ) : (
                  <div className="phone-body">
                    <Note>共创者可以查看项目完成卡，仪式由长者在相框中打开。</Note>
                    <Button onClick={() => go('share')}>查看我们完成的礼物</Button>
                  </div>
                )
              ) : (
                <div className="experience-grid">
                  <div className="experience-narrative">
                    <div className="big-quote">
                      {role === 'coordinator'
                        ? '零散的记得，\n汇成一份完整的礼物。'
                        : '不用写完一生，\n记得一件事就好。'}
                    </div>
                    <div className="narrative-rule" />
                    <p>{c.subtitle}</p>
                    <div className="mini-people">
                      {datasets[c.id].authors.slice(0, 5).map((a) => (
                        <Avatar key={a.id} name={a.name} />
                      ))}
                    </div>
                    <small>
                      {c.category === '荣休礼'
                        ? '09·13会议后的荣休礼体验'
                        : '扩展案例探索，复用展示组件'}{' '}
                      · 虚构人物与活动示例
                    </small>
                    <button className="overview-link" onClick={() => setMode('overview')}>
                      看看整条链路
                      <ArrowRight />
                    </button>
                  </div>
                  {phone(page)}
                </div>
              )}
            </>
          )}
        </main>
        <footer className="journey-footer">
          <span>
            <i />
            {roles.find((r) => r.id === role)!.label} · {lifecycle[viewStage].label}
          </span>
          <div>
            <button
              disabled={previous === undefined}
              onClick={() => previous !== undefined && chooseStage(previous)}
            >
              <ArrowLeft size={17} />
              上一步
            </button>
            <Button
              disabled={next === undefined}
              onClick={() => next !== undefined && chooseStage(next)}
            >
              {next === undefined ? '已到当前角色的最后一步' : `下一步 · ${lifecycle[next].label}`}
              <ArrowRight size={18} />
            </Button>
          </div>
        </footer>
        {notes && (
          <aside className="notes-panel">
            <button
              className="notes-close"
              aria-label="关闭讲解备注"
              onClick={() => setNotes(false)}
            >
              <X />
            </button>
            <div className="eyebrow">给讲解者</div>
            <h2>一份礼物，三个视角。</h2>
            <p>
              固定13个阶段。灰色节点保留但不可点击；角色切换不会替用户提交内容，也不会自动定稿。
            </p>
            <label className="field">
              <span>切换共创者（当前草稿会保留在本案例）</span>
              <select
                aria-label="切换演示共创者"
                value={s.draft.authorId}
                onChange={(e) => {
                  const id = e.target.value
                  stopMedia()
                  setViewStage(2)
                  setState((old) => {
                    const cs = old.cases[c.id]
                    return {
                      ...old,
                      role: 'contributor',
                      cases: {
                        ...old.cases,
                        [c.id]: {
                          ...cs,
                          authorDrafts: { ...cs.authorDrafts, [cs.draft.authorId]: cs.draft },
                          draft: cs.authorDrafts?.[id] || newDraft(c.id, id),
                          page: 'identity',
                        },
                      },
                    }
                  })
                }}
              >
                {datasets[c.id].authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            {!isManager(s) && (
              <Button
                onClick={() => {
                  patch({ coordinatorViewer: s.coordinatorName })
                  setRole('coordinator')
                  go('workspace')
                }}
              >
                以新统筹者{s.coordinatorName}体验
              </Button>
            )}
            <p>
              Demo默认：电话不强制、文字和语音可并存、礼后照片优先但可仅文字。正式产品的待定项保留在更新说明中。
            </p>
            <p>
              小叙总信使用基于当前内容的示例整理，未调用云端模型。录音和上传保存在本机；扫码、通知、设备接收为演示。
            </p>
            <Button
              secondary
              onClick={() =>
                modal(
                  '恢复全部案例',
                  <>
                    <p>清除本机五案例的演示修改。</p>
                    <Button
                      onClick={() => {
                        setState(initial())
                        setDialog(null)
                        setViewStage(1)
                        setMode('experience')
                      }}
                    >
                      确认恢复全部案例
                    </Button>
                  </>,
                )
              }
            >
              恢复全部案例
            </Button>
          </aside>
        )}
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
          </div>
        )}
        {dialog && (
          <Modal title={dialog.title} close={closeModal}>
            {dialog.content}
          </Modal>
        )}
      </div>
    </Context.Provider>
  )
}
