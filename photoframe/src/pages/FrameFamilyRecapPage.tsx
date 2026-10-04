import { CaretLeft } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockFamilyWeeklyRecap } from '../mock'

export function FrameFamilyRecapPage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const recap = getMockFamilyWeeklyRecap()
  const [activeIndex, setActiveIndex] = useState(0)
  const activeScene = recap.scenes[activeIndex]

  return (
    <FramePageShell className="frame-space-page" mode={mode}>
      <header className="frame-space-topbar">
        <button type="button" onClick={() => navigate(withScenario('/frame/family'))} aria-label="返回家庭空间">
          <CaretLeft size={36} weight="bold" />
        </button>
        <div>
          <span>家庭周报</span>
          <h1>{recap.title}</h1>
        </div>
      </header>
      <main className="frame-space-layout frame-space-layout--two">
        <section className="frame-space-panel frame-recap-preview">
          <img src={activeScene.photoUrl} alt="" />
          <h2>{activeScene.title}</h2>
          <p>{activeScene.summary}</p>
        </section>
        <aside className="frame-space-panel frame-recap-list">
          <span>{recap.subtitle}</span>
          {recap.scenes.map((scene, index) => (
            <button className={index === activeIndex ? 'is-active' : ''} key={scene.id} type="button" onClick={() => setActiveIndex(index)}>
              <strong>{scene.title}</strong>
              <small>{scene.summary}</small>
            </button>
          ))}
        </aside>
      </main>
    </FramePageShell>
  )
}
