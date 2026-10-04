import { ArrowsClockwise, CaretLeft, CaretRight, Timer } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockFrameDeviceStatus } from '../mock'

const SLIDESHOW_INTERVALS = [10, 30, 60, 300, 600]
const FRAME_VERSION = 'v1.2.0'

function formatSlideshowInterval(seconds: number) {
  if (seconds < 60) return `${seconds}秒`
  return `${Math.round(seconds / 60)}分钟`
}

export function FrameSettingsPage() {
  const { mode } = useFrameDisplayMode()
  const navigate = useNavigate()
  const device = getMockFrameDeviceStatus()
  const [slideshowInterval, setSlideshowInterval] = useState(device.slideshowIntervalSeconds)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (!toastMessage) return

    const timer = window.setTimeout(() => {
      setToastMessage('')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const cycleSlideshowInterval = () => {
    setSlideshowInterval((current) => {
      const currentIndex = SLIDESHOW_INTERVALS.indexOf(current)
      return SLIDESHOW_INTERVALS[(currentIndex + 1) % SLIDESHOW_INTERVALS.length]
    })
  }

  return (
    <FramePageShell className="frame-settings-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-settings-topbar frame-light-nav">
        <button className="frame-memory-back-button frame-settings-back-button" type="button" aria-label="返回相框" onClick={() => navigate(withScenario('/frame'))}>
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>设置</h1>
      </header>

      <main className="frame-settings-view">
        <section className="frame-settings-menu-group" aria-label="相框功能">
          <button className="frame-settings-menu-row frame-settings-menu-row--button" type="button" onClick={cycleSlideshowInterval}>
            <span className="frame-settings-menu-row__icon" aria-hidden="true">
              <Timer size={30} weight="bold" />
            </span>
            <span className="frame-settings-menu-row__main">
              <strong>照片轮播</strong>
            </span>
            <span className="frame-settings-menu-row__value">{formatSlideshowInterval(slideshowInterval)}</span>
            <span className="frame-settings-menu-row__chevron" aria-hidden="true">
              <CaretRight size={26} weight="bold" aria-hidden="true" />
            </span>
          </button>
          <button className="frame-settings-menu-row frame-settings-menu-row--button" type="button" onClick={() => setToastMessage('已是最新版本')}>
            <span className="frame-settings-menu-row__icon" aria-hidden="true">
              <ArrowsClockwise size={30} weight="bold" />
            </span>
            <span className="frame-settings-menu-row__main">
              <strong>检查更新</strong>
            </span>
            <span className="frame-settings-menu-row__value">{FRAME_VERSION}</span>
            <span className="frame-settings-menu-row__chevron" aria-hidden="true">
              <CaretRight size={26} weight="bold" aria-hidden="true" />
            </span>
          </button>
        </section>
      </main>

      {toastMessage ? (
        <div className="frame-settings-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
    </FramePageShell>
  )
}
