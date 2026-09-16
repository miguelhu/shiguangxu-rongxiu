import { createContext, useContext, ReactNode } from 'react'
import { CaseId, CaseInfo, Page, Role } from './data'
import { CaseState, State } from './model'
export interface DemoContext {
  role: Role
  setRole: (role: Role) => void
  c: CaseInfo
  s: CaseState
  state: State
  patch: (p: Partial<CaseState> | ((s: CaseState) => Partial<CaseState>)) => void
  setState: React.Dispatch<React.SetStateAction<State>>
  go: (p: Page) => void
  switchCase: (id: CaseId) => void
  notify: (s: string) => void
  modal: (title: string, content: ReactNode) => void
  closeModal: () => void
}
export const Context = createContext<DemoContext | null>(null)
export const useDemo = () => useContext(Context)!
