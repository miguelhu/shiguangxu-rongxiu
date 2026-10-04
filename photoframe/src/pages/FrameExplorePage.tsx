import {
  CaretLeft,
  ClipboardText,
  HeadCircuit,
  LinkSimple,
  LockKey,
  MapPin,
  Notebook,
  Pill,
  Siren,
  Sparkle,
  Stethoscope,
  Storefront,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { FrameSosDialog } from '../components/FrameSosDialog'
import { getMockExploreFeatures } from '../mock'
import type { ExploreFeatureItem, ExploreFeatureSection } from '../types'
import { withFrameVariant } from '../utils/frameVariant'

const FEATURE_ICONS: Record<string, Icon> = {
  'map-pin': MapPin,
  storefront: Storefront,
  stethoscope: Stethoscope,
  'head-circuit': HeadCircuit,
  link: LinkSimple,
  pill: Pill,
  'clipboard-text': ClipboardText,
  'lock-key': LockKey,
  notebook: Notebook,
  sparkle: Sparkle,
  siren: Siren,
}

const SECTION_TITLES: Record<ExploreFeatureSection, string> = {
  life: '生活服务',
  health: '健康守望',
  optional: '自选专区',
}

const FEATURE_ACTION_LABELS: Record<string, string> = {
  'local-services': '查看服务',
  'silver-market': '去逛逛',
}

const SINGLE_CARD_TONES: Record<string, string> = {
  'cognition-emotion': 'frame-health-module-card--cognition',
  'medical-links': 'frame-health-module-card--records',
  'medicine-reminder': 'frame-health-module-card--medicine',
  'report-archive': 'frame-health-module-card--records',
  'family-wish': 'frame-health-module-card--cognition',
  'ai-diary': 'frame-health-module-card--tips',
  wishlist: 'frame-health-module-card--cognition',
  sos: 'frame-health-module-card--records',
}

export function FrameExplorePage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const [toastMessage, setToastMessage] = useState('')
  const [isSosDialogOpen, setIsSosDialogOpen] = useState(false)
  const features = getMockExploreFeatures()

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 1900)
  }

  const openFeature = (feature: ExploreFeatureItem) => {
    if (feature.action === 'sos') {
      setIsSosDialogOpen(true)
      return
    }
    if (feature.action.startsWith('toast:')) {
      showToast(feature.action.slice(6))
      return
    }
    navigate(withFrameVariant(feature.action))
  }

  return (
    <FramePageShell className="frame-space-page frame-explore-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav frame-explore-topbar">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withFrameVariant('/frame'))} aria-label="返回相框">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <main className="frame-explore-content">
        {(['life', 'health', 'optional'] as ExploreFeatureSection[]).map((section) => {
          const sectionFeatures = features.filter((feature) => feature.section === section)
          return (
            <section className={`frame-explore-section frame-explore-section--${section}`} key={section} aria-labelledby={`explore-${section}-title`}>
              <header>
                <h2 id={`explore-${section}-title`}>{SECTION_TITLES[section]}</h2>
              </header>
              <div className="frame-explore-grid">
                {sectionFeatures.map((feature) => {
                  const FeatureIcon = FEATURE_ICONS[feature.icon] || Sparkle
                  const isAiDoctor = feature.id === 'ai-doctor'
                  const actionLabel = FEATURE_ACTION_LABELS[feature.id]

                  if (isAiDoctor) {
                    return (
                      <button
                        className="frame-health-module-card frame-health-module-card--service frame-explore-feature--ai-doctor"
                        key={feature.id}
                        type="button"
                        onClick={() => openFeature(feature)}
                      >
                        <span className="frame-health-module-card__doctor-avatar" aria-hidden="true">
                          <img src="/elder-ai-boy-doctor-halfbody-v1.png" alt="" draggable={false} />
                        </span>
                        <strong>{feature.title}</strong>
                        <p>{feature.description}</p>
                      </button>
                    )
                  }

                  if (section === 'optional') {
                    return (
                      <button
                        className={`frame-explore-optional-card frame-explore-single-card frame-explore-feature--${feature.id}`}
                        key={feature.id}
                        type="button"
                        onClick={() => openFeature(feature)}
                      >
                        <FeatureIcon size={36} weight="duotone" aria-hidden="true" />
                        <strong>{feature.title}</strong>
                      </button>
                    )
                  }

                  if (section !== 'life') {
                    return (
                      <button
                        className={`frame-health-module-card frame-explore-single-card ${SINGLE_CARD_TONES[feature.id] || ''} frame-explore-feature--${feature.id}`}
                        key={feature.id}
                        type="button"
                        onClick={() => openFeature(feature)}
                      >
                        <FeatureIcon size={36} weight="duotone" aria-hidden="true" />
                        <strong>{feature.title}</strong>
                        <p>{feature.description}</p>
                        {feature.badge ? <i>{feature.badge}</i> : null}
                      </button>
                    )
                  }

                  return (
                    <button className={`frame-explore-feature frame-explore-feature--${feature.id}`} key={feature.id} type="button" onClick={() => openFeature(feature)}>
                      <span className="frame-explore-feature__visual">
                        <FeatureIcon size={36} weight="duotone" aria-hidden="true" />
                      </span>
                      <strong>{feature.title}</strong>
                      <p>{feature.description}</p>
                      {actionLabel ? <span className="frame-explore-feature__action">{actionLabel}</span> : null}
                      {feature.badge ? <i>{feature.badge}</i> : null}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      {toastMessage ? <div className="frame-settings-toast" role="status">{toastMessage}</div> : null}
      {isSosDialogOpen ? <FrameSosDialog contactName="家人" onClose={() => setIsSosDialogOpen(false)} /> : null}
    </FramePageShell>
  )
}
