import { useEffect, useState, type ReactNode } from 'react'
import { FrameCorners, CaretDown } from '@phosphor-icons/react'
import { Account, Messages } from './v6/Account'
import { Contributor } from './v6/Contributor'
import { Entry, Gifts, Preparation, ShareCard } from './v6/Preparation'
import { Greeting, Guest } from './v6/Greeting'
import { Welcome, SendChoose } from './v6/LifecyclePages'
import Frame from './v6/Frame'
import { Context, type DemoContext } from './v6/context'
import { cases, type CaseId, type Page, type Role } from './v6/data'
import { available, initial, type State } from './v6/model'
import { managedPages } from './v6/workflow'
import { stopMedia } from './v6/media'
import { Button, Modal, Note, Phone } from './v6/ui'
import './v6/styles.css'
import './v6/v5.css'
import './shell.css'

const STORE = 'sgx-rongxiu-miniapp-extract-v1'
const honorCases = cases.filter((item) => item.category === '荣休礼')

function readState(): State {
  try {
    const value = JSON.parse(localStorage.getItem(STORE) || 'null') as State | null
    if (value?.schema === 5 && value.cases?.teacher) return value
  } catch {
    // A damaged local preview should not prevent the prototype from opening.
  }
  const value = initial()
  value.caseId = 'teacher'
  value.cases.teacher.page = 'people'
  return value
}

export default function App() {
  const [state, setState] = useState<State>(readState)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<{ title: string; content: ReactNode } | null>(null)
  const c = cases.find((item) => item.id === state.caseId) || cases[0]
  const s = state.cases[c.id]
  const page = s.page
  const role: Role = managedPages.includes(page) || ['entry', 'host', 'invite_manage'].includes(page)
    ? 'coordinator'
    : 'contributor'

  const patch: DemoContext['patch'] = (update) => {
    setState((old) => {
      const id = old.caseId
      const current = old.cases[id]
      const change = typeof update === 'function' ? update(current) : update
      return { ...old, cases: { ...old.cases, [id]: { ...current, ...change } } }
    })
  }
  const go = (next: Page) => {
    stopMedia()
    setDialog(null)
    setState((old) => {
      const id = old.caseId
      const current = old.cases[id]
      const writing = ['identity', 'impressions', 'photos', 'stories', 'wishes', 'preview'].includes(next)
      return {
        ...old,
        cases: {
          ...old.cases,
          [id]: {
            ...current,
            page: next,
            ...(writing ? { lastContributionPage: next, contributionStarted: true } : {}),
          },
        },
      }
    })
  }
  const switchCase = (id: CaseId) => {
    stopMedia()
    setDialog(null)
    setState((old) => ({ ...old, caseId: id }))
  }
  const setRole = (next: Role) => {
    go(next === 'coordinator' ? 'workspace' : 'people')
  }
  const notify = (message: string) => setNotice(message)
  const modal = (title: string, content: ReactNode) => setDialog({ title, content })
  const closeModal = () => setDialog(null)
  const context: DemoContext = {
    c, s, state, role, setRole, patch, setState, go, switchCase, notify, modal, closeModal,
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(state))
    } catch {
      setNotice('本机空间不足，当前更改可能无法保存。')
    }
  }, [state])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  let content: ReactNode
  if (page === 'welcome' || page === 'invite') content = <Welcome go={go} />
  else if (page === 'send') content = <SendChoose go={go} />
  else if (page === 'entry' || page === 'host') content = <Entry page={page} go={go} />
  else if (page === 'gifts') content = <Gifts go={go} />
  else if (managedPages.includes(page)) content = <Preparation page={page} go={go} />
  else if (page === 'share') content = <ShareCard />
  else if (page === 'guest') content = <Guest go={go} />
  else if (page === 'greeting' || page === 'onsite') content = <Greeting onsite={page === 'onsite'} go={go} />
  else if (page === 'messages') content = <Messages go={go} />
  else if (['people', 'person', 'me', 'settings', 'profile', 'relations', 'records', 'preferences'].includes(page))
    content = <Account page={page} go={go} />
  else if (page === 'product') content = <div className="phone-body"><Frame compact /></div>
  else if (page === 'progress') content = (
    <div className="phone-body">
      <h2>大家的心意，正在汇集。</h2>
      <Note>目前有 {available(c.id, s).length} 项内容。已提交内容可在“我的共创记录”管理。</Note>
      <Button onClick={() => go('people')}>我参与的人</Button>
    </div>
  )
  else content = <Contributor page={page} go={go} />

  return (
    <Context.Provider value={context}>
      <div className="standalone-miniapp app-v5">
        <header className="extract-header">
          <FrameCorners size={24} />
          <strong>拾光叙 · 荣休礼小程序</strong>
          <label>
            <span className="sr-only">选择人物</span>
            <select value={c.id} onChange={(event) => switchCase(event.target.value as CaseId)}>
              {honorCases.map((item) => <option key={item.id} value={item.id}>{item.address}</option>)}
            </select>
            <CaretDown size={14} />
          </label>
        </header>
        <Phone page={page} go={go} title={managedPages.includes(page) ? '整理成礼' : '拾光叙'}>
          {content}
        </Phone>
        {notice && <div className="extract-toast" role="status">{notice}</div>}
        {dialog && <Modal title={dialog.title} close={closeModal}>{dialog.content}</Modal>}
      </div>
    </Context.Provider>
  )
}
