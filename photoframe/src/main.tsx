import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { FrameDemoShell, shouldUseFrameDemoShell } from './components/FrameDemoShell'
import { router } from './router'
import { syncScenarioFromCurrentLocation } from './content/scenarioStore'
import './index.css'

syncScenarioFromCurrentLocation()

function syncViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty('--app-viewport-height', `${viewportHeight}px`)

  const hashPath = (window.location.hash || '#/frame').slice(1).split('?')[0] || '/frame'
  const hashQuery = (window.location.hash || '').split('?')[1] || ''
  const ua = window.navigator.userAgent
  const isFrameDemoEmbed = new URLSearchParams(window.location.search).get('frameDemoEmbed') === '1' || new URLSearchParams(hashQuery).get('frameDemoEmbed') === '1'
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const screenShortSide = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight)
  const isTouchTablet = (window.navigator.maxTouchPoints > 1 || hasCoarsePointer) && screenShortSide >= 700 && (
    /iPad|Android(?!.*Mobile)/i.test(ua) ||
    (/Macintosh/i.test(ua) && Math.min(window.screen.width, window.screen.height) <= 1024)
  )
  const isShortFrameViewport = !isFrameDemoEmbed && hashPath.startsWith('/frame') && isTouchTablet && window.innerWidth >= 721 && viewportHeight <= 810
  document.documentElement.toggleAttribute('data-frame-home-tight-actions', isShortFrameViewport)
}

function AppRoot() {
  return shouldUseFrameDemoShell() ? (
    <FrameDemoShell key={window.location.hash} />
  ) : (
    <RouterProvider router={router} />
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
let isFrameDemoMode = shouldUseFrameDemoShell()

function renderApp() {
  root.render(
    <React.StrictMode>
      <AppRoot />
    </React.StrictMode>,
  )
}

syncViewportHeight()
window.addEventListener('resize', syncViewportHeight)
window.visualViewport?.addEventListener('resize', syncViewportHeight)
window.visualViewport?.addEventListener('scroll', syncViewportHeight)

renderApp()

window.addEventListener('hashchange', () => {
  syncViewportHeight()
  syncScenarioFromCurrentLocation()
  const nextIsFrameDemoMode = shouldUseFrameDemoShell()
  if (nextIsFrameDemoMode === isFrameDemoMode) return
  isFrameDemoMode = nextIsFrameDemoMode
  renderApp()
})
