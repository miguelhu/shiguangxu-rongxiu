import { useEffect, useState, type ReactNode } from 'react'
import { FrameCorners } from '@phosphor-icons/react'
import Frame from './v6/Frame'
import { Activate } from './v6/Activation'
import { Context, type DemoContext } from './v6/context'
import { cases, type CaseId, type Page, type Role } from './v6/data'
import { initial, newCase, type CaseState, type State } from './v6/model'
import { freezeVersion, generateLetter } from './v6/workflow'
import { Modal } from './v6/ui'
import { stopMedia } from './v6/media'
import './v6/styles.css'
import './v6/v5.css'
import './shell.css'

const STORE = 'sgx-rongxiu-frame-extract-v1'
const honorCases = cases.filter((item) => item.category === '荣休礼')

function preparedCase(id: CaseId): CaseState {
  const s = newCase(id)
  s.letter = { ...generateLetter(id, s), confirmed: true }
  s.review = { photos: true, stories: true, wishes: true, previewed: true }
  s.version = freezeVersion(id, s)
  s.page = 'activate'
  return s
}

function readState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null') as State | null
    if (saved?.schema === 5 && saved.cases?.teacher) return saved
  } catch {
    // The local preview can safely start again after corrupted browser storage.
  }
  const state = initial()
  state.role = 'recipient'
  state.caseId = 'teacher'
  for (const item of honorCases) state.cases[item.id] = preparedCase(item.id)
  return state
}

export default function App() {
  const [state, setState] = useState<State>(readState)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<{ title: string; content: ReactNode } | null>(null)
  const [received, setReceived] = useState(false)
  const c = cases.find((item) => item.id === state.caseId) || cases[0]
  const s = state.cases[c.id]
  const role: Role = 'recipient'
  const patch: DemoContext['patch'] = (update) => {
    setState((old) => {
      const id = old.caseId
      const current = old.cases[id]
      const change = typeof update === 'function' ? update(current) : update
      return { ...old, cases: { ...old.cases, [id]: { ...current, ...change } } }
    })
  }
  const go = (page: Page) => {
    stopMedia()
    setState((old) => {
      const id = old.caseId
      return { ...old, cases: { ...old.cases, [id]: { ...old.cases[id], page } } }
    })
    setReceived(page === 'received')
  }
  const switchCase = (id: CaseId) => {
    stopMedia()
    setReceived(false)
    setState((old) => ({ ...old, caseId: id }))
  }
  const modal = (title: string, content: ReactNode) => setDialog({ title, content })
  const closeModal = () => setDialog(null)
  const context: DemoContext = {
    c, s, state, role, setRole: () => {}, patch, setState, go, switchCase,
    notify: setNotice, modal, closeModal,
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(state))
    } catch {
      setNotice('本机空间不足，状态可能无法保存。')
    }
  }, [state])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <Context.Provider value={context}>
      <div className="standalone-frame app-v5">
        <header className="extract-header">
          <FrameCorners size={26} />
          <strong>拾光叙 · 相框端</strong>
          {s.activated && (
            <label>
              <span>查看礼物</span>
              <select value={c.id} onChange={(event) => switchCase(event.target.value as CaseId)}>
                {honorCases.map((item) => <option key={item.id} value={item.id}>{item.address}</option>)}
              </select>
            </label>
          )}
        </header>
        {s.page === 'activate' || !s.activated ? (
          <main className="activation-stage"><Activate go={go} /></main>
        ) : (
          <main>
            <nav className="frame-sections" aria-label="相框内容">
              <button className={!received ? 'active' : ''} onClick={() => setReceived(false)}>荣休礼</button>
              <button className={received ? 'active' : ''} onClick={() => setReceived(true)}>新的心意</button>
              <button onClick={() => go('activate')}>绑定信息</button>
            </nav>
            <Frame key={`${c.id}-${received ? 'received' : 'ceremony'}`} received={received} />
          </main>
        )}
        {notice && <div className="extract-toast" role="status">{notice}</div>}
        {dialog && <Modal title={dialog.title} close={closeModal}>{dialog.content}</Modal>}
      </div>
    </Context.Provider>
  )
}
