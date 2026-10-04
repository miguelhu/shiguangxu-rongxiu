import { ArrowLeft, GearSix, HouseLine } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import type { FrameDisplayMode } from '../types'

export function useFrameDisplayMode() {
  const [mode, setMode] = useState<FrameDisplayMode>('elder')

  useEffect(() => {
    try {
      window.localStorage.removeItem('shiguangxu:frame-display-mode')
    } catch {
      // The frame side now uses one default clear-reading scale.
    }
  }, [])

  const value = useMemo(
    () => ({
      mode,
      isElderMode: mode === 'elder',
      toggleMode: () => setMode((current) => (current === 'elder' ? 'standard' : 'elder')),
      setMode,
    }),
    [mode],
  )

  return value
}

export function FrameTopBar({
  title,
  backTo = '/frame',
  showSettings = true,
}: {
  mode: FrameDisplayMode
  onToggleMode: () => void
  title: string
  backTo?: string
  showSettings?: boolean
}) {
  const navigate = useNavigate()

  return (
    <header className="frame-topbar">
      <button className="frame-topbar__button" type="button" onClick={() => navigate(backTo)}>
        <ArrowLeft size={28} weight="bold" aria-hidden="true" />
        <span>回到相框</span>
      </button>
      <h1>{title}</h1>
      <div className="frame-topbar__actions">
        {showSettings ? (
          <button className="frame-topbar__icon" type="button" aria-label="相框设置" onClick={() => navigate(withScenario('/frame/settings'))}>
            <GearSix size={30} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  )
}

export function FramePageShell({
  children,
  className = '',
  mode,
}: {
  children: ReactNode
  className?: string
  mode: FrameDisplayMode
}) {
  return <main className={`frame-shell frame-shell--${mode} ${className}`}>{children}</main>
}

export function FrameHomeButton() {
  const navigate = useNavigate()

  return (
    <button className="frame-home-button" type="button" onClick={() => navigate(withScenario('/frame'))}>
      <HouseLine size={28} weight="fill" aria-hidden="true" />
      回到相框
    </button>
  )
}
