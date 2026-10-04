import { CaretDown, CaretLeft } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FrameVariant as FrameDemoVariant } from '../utils/frameVariant'

type DemoDevicePreset = {
  key: string
  type: 'frame' | 'phone'
  label: string
  width: number
  height: number
}

const FRAME_DEVICE_PRESETS: DemoDevicePreset[] = [
  { key: 'frame-10', type: 'frame', label: '10.2 英寸', width: 1024, height: 768 },
  { key: 'frame-11', type: 'frame', label: '11 英寸', width: 1194, height: 834 },
  { key: 'frame-wide-16-9', type: 'frame', label: '15.6 英寸宽屏', width: 1366, height: 768 },
]

const PHONE_DEVICE_PRESETS: DemoDevicePreset[] = [
  { key: 'phone-regular', type: 'phone', label: '手机', width: 390, height: 844 },
  { key: 'phone-large', type: 'phone', label: '大屏手机', width: 430, height: 932 },
]

const DEMO_BEZEL_X = 34
const DEMO_BEZEL_TOP = 34
const DEMO_BEZEL_BOTTOM = 34
const PHONE_BEZEL_X = 16
const PHONE_BEZEL_TOP = 46
const PHONE_BEZEL_BOTTOM = 18
const DEMO_STAGE_PADDING_X = 40
const DEMO_STAGE_PADDING_Y = 66
const DEMO_MAX_SCALE = 1.34
const DEFAULT_FRAME_DEVICE_KEY = 'frame-11'
const DEFAULT_PHONE_DEVICE_KEY = 'phone-regular'
const FRAME_DEMO_AUTO_DISMISSED_KEY = 'shiguangxu:frame-demo-auto-dismissed'
const FRAME_DEMO_EMBED_PARAM = 'frameDemoEmbed'
const FRAME_VARIANT_PARAM = 'variant'
const FRAME_SCENARIO_PARAM = 'scenario'
let frameDemoDismissedInMemory = false

type FrameContentScenario = 'default' | 'ama-letter' | 'teacher-retirement'
const DEFAULT_FRAME_VARIANT: FrameDemoVariant = 'new'
const DEFAULT_DEMO_SCENARIO: FrameContentScenario = 'ama-letter'
type DemoToolbarOption = {
  value: string
  label: string
}

function DemoToolbarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: DemoToolbarOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const activeLabel = options.find((option) => option.value === value)?.label || options[0]?.label || ''

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className={`frame-demo-toolbar__select${open ? ' is-open' : ''}`} ref={rootRef}>
      <span>{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {activeLabel}
        <CaretDown size={14} weight="bold" aria-hidden="true" />
      </button>
      {open ? (
        <div className="frame-demo-toolbar__menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              className={option.value === value ? 'is-active' : ''}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function getHashParts(hash: string) {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash
  const [path = '/', search = ''] = normalizedHash.split('?')
  return { path, search }
}

function getHashParams(hash: string) {
  return new URLSearchParams(getHashParts(hash).search)
}

function getDemoParam(hash: string) {
  return getHashParams(hash).get('demo')
}

function getVariantParam(hash: string): FrameDemoVariant {
  const variant = getHashParams(hash).get(FRAME_VARIANT_PARAM)
  if (variant === 'possibility' || variant === 'new') return variant
  if (variant === 'v1') return 'v1'
  return DEFAULT_FRAME_VARIANT
}

function getScenarioParam(hash: string, fallback: FrameContentScenario = 'default'): FrameContentScenario {
  const scenario = getHashParams(hash).get(FRAME_SCENARIO_PARAM)
  if (scenario === 'ama-letter' || scenario === 'teacher-retirement' || scenario === 'default') return scenario
  return fallback
}

function isFramePath(hash: string) {
  return getHashParts(hash).path.startsWith('/frame')
}

function getDevicePresetsForHash(hash: string) {
  const { path } = getHashParts(hash)
  return path.startsWith('/member') ? PHONE_DEVICE_PRESETS : FRAME_DEVICE_PRESETS
}

function isExplicitDemoOn(hash: string) {
  const demoValue = getDemoParam(hash)
  return demoValue === 'tablet' || demoValue === 'frame'
}

function isExplicitDemoOff(hash: string) {
  const demoValue = getDemoParam(hash)
  return demoValue === 'off' || demoValue === 'false' || demoValue === 'none'
}

function hasAutoDemoDismissed() {
  if (frameDemoDismissedInMemory) return true
  try {
    return window.sessionStorage.getItem(FRAME_DEMO_AUTO_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function dismissAutoDemoForSession() {
  frameDemoDismissedInMemory = true
  try {
    window.sessionStorage.setItem(FRAME_DEMO_AUTO_DISMISSED_KEY, '1')
  } catch {
    // Ignore storage failures; the URL still exits the explicit demo mode.
  }
}

function isLikelyPhoneViewport() {
  if (typeof window === 'undefined') return false

  const width = Math.min(window.innerWidth || 0, window.screen?.width || window.innerWidth || 0)
  const height = Math.min(window.innerHeight || 0, window.screen?.height || window.innerHeight || 0)
  const shortestSide = Math.min(width || window.innerWidth, height || window.innerHeight)
  const ua = window.navigator.userAgent
  const hasPhoneUa = /iPhone|iPod|Android.*Mobile|Mobile Safari|Windows Phone/i.test(ua)

  return hasPhoneUa && shortestSide <= 620
}

function isPortraitViewport() {
  if (typeof window === 'undefined') return false
  return window.innerHeight >= window.innerWidth
}

function shouldAutoUseDemo(hash: string) {
  const { path } = getHashParts(hash)
  const isPhone = isLikelyPhoneViewport()

  if (path.startsWith('/member')) return !isPhone
  if (path.startsWith('/frame')) return true
  return false
}

function removeDemoParamsFromHash(hash: string) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  params.delete('demo')
  params.delete('device')
  params.delete('size')
  params.delete(FRAME_DEMO_EMBED_PARAM)
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function withDemoParams(hash: string, deviceKey: string) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  params.set('demo', 'tablet')
  params.set('device', deviceKey)
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function withFrameDemoEmbedParam(hash: string) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  params.set(FRAME_DEMO_EMBED_PARAM, '1')
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function withVariantParam(hash: string, variant: FrameDemoVariant) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  if (variant === DEFAULT_FRAME_VARIANT) {
    params.delete(FRAME_VARIANT_PARAM)
  } else {
    params.set(FRAME_VARIANT_PARAM, variant)
  }
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function withScenarioParam(hash: string, scenario: FrameContentScenario) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  params.set(FRAME_SCENARIO_PARAM, scenario)
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function withDemoContentParams(hash: string, variant: FrameDemoVariant, scenario: FrameContentScenario) {
  return withScenarioParam(withVariantParam(hash, variant), scenario)
}

function getVariantHomeHash(variant: FrameDemoVariant, scenario: FrameContentScenario) {
  return withDemoContentParams('#/frame?menu=1', variant, scenario)
}

function withDemoOffParam(hash: string) {
  const { path, search } = getHashParts(hash)
  const params = new URLSearchParams(search)
  params.delete('device')
  params.delete('size')
  params.delete(FRAME_DEMO_EMBED_PARAM)
  params.set('demo', 'off')
  const nextSearch = params.toString()
  return `#${path}${nextSearch ? `?${nextSearch}` : ''}`
}

function getInitialDeviceKey(hash: string) {
  const params = getHashParams(hash)
  const requestedKey = params.get('device') || params.get('size')
  const presets = getDevicePresetsForHash(hash)
  if (presets.some((preset) => preset.key === requestedKey)) return requestedKey!
  return presets[0].type === 'phone' ? DEFAULT_PHONE_DEVICE_KEY : DEFAULT_FRAME_DEVICE_KEY
}

function isDeviceKeyInPresets(deviceKey: string, presets: DemoDevicePreset[]) {
  return presets.some((preset) => preset.key === deviceKey)
}

function getFrameSrc(hash: string) {
  const url = new URL(`${window.location.origin}${window.location.pathname}`)
  url.hash = withFrameDemoEmbedParam(removeDemoParamsFromHash(hash))
  return url.toString()
}

function getDeviceChrome(preset: DemoDevicePreset) {
  if (preset.type === 'phone') {
    return {
      bezelX: PHONE_BEZEL_X,
      bezelTop: PHONE_BEZEL_TOP,
      bezelBottom: PHONE_BEZEL_BOTTOM,
    }
  }

  return {
    bezelX: DEMO_BEZEL_X,
    bezelTop: DEMO_BEZEL_TOP,
    bezelBottom: DEMO_BEZEL_BOTTOM,
  }
}

function getViewportScale(preset: DemoDevicePreset, forceLandscape = false) {
  if (typeof window === 'undefined') return 1

  const chrome = getDeviceChrome(preset)
  const deviceWidth = preset.width + chrome.bezelX * 2
  const deviceHeight = preset.height + chrome.bezelTop + chrome.bezelBottom
  const visualWidth = forceLandscape ? deviceHeight : deviceWidth
  const visualHeight = forceLandscape ? deviceWidth : deviceHeight
  const availableWidth = Math.max(320, window.innerWidth - (forceLandscape ? 12 : DEMO_STAGE_PADDING_X))
  const availableHeight = Math.max(280, window.innerHeight - (forceLandscape ? 54 : DEMO_STAGE_PADDING_Y))

  return Math.min(DEMO_MAX_SCALE, availableWidth / visualWidth, availableHeight / visualHeight)
}

export function shouldUseFrameDemoShell() {
  if (typeof window === 'undefined') return false
  if (window.self !== window.top) return false
  const hash = window.location.hash || '#/frame'
  if (new URLSearchParams(window.location.search).get(FRAME_DEMO_EMBED_PARAM) === '1') return false
  if (getHashParams(hash).get(FRAME_DEMO_EMBED_PARAM) === '1') return false
  if (isExplicitDemoOff(hash)) return false
  if (isExplicitDemoOn(hash)) return true
  if (hasAutoDemoDismissed()) return false
  return shouldAutoUseDemo(hash)
}

export function FrameDemoShell() {
  const initialHash = window.location.hash || '#/frame'
  const initialVariant = getVariantParam(initialHash)
  const initialScenario = getScenarioParam(initialHash, DEFAULT_DEMO_SCENARIO)
  const initialContentHash = withDemoContentParams(removeDemoParamsFromHash(initialHash), initialVariant, initialScenario)
  const [activeVariant, setActiveVariant] = useState<FrameDemoVariant>(() => getVariantParam(initialHash))
  const [activeScenario, setActiveScenario] = useState<FrameContentScenario>(() => initialScenario)
  const [contentHash, setContentHash] = useState(() => initialContentHash)
  const shouldForceLandscape = isFramePath(contentHash) && isLikelyPhoneViewport() && isPortraitViewport()
  const devicePresets = useMemo(() => getDevicePresetsForHash(contentHash), [contentHash])
  const [activeDeviceKey, setActiveDeviceKey] = useState(() => getInitialDeviceKey(initialHash))
  const activeDevice = useMemo(
    () => devicePresets.find((preset) => preset.key === activeDeviceKey) || devicePresets[0],
    [activeDeviceKey, devicePresets],
  )
  const deviceChrome = useMemo(() => getDeviceChrome(activeDevice), [activeDevice])
  const [scale, setScale] = useState(() => getViewportScale(activeDevice, shouldForceLandscape))
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const latestFrameHashRef = useRef(initialContentHash)
  const [frameSrc, setFrameSrc] = useState(() => getFrameSrc(initialContentHash))

  useEffect(() => {
    const updateScale = () => setScale(getViewportScale(activeDevice, shouldForceLandscape))

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [activeDevice, shouldForceLandscape])

  useEffect(() => {
    const frameWindow = iframeRef.current?.contentWindow
    if (!frameWindow) return

    const syncParentHash = () => {
      const frameHash = frameWindow.location.hash || latestFrameHashRef.current
      latestFrameHashRef.current = withDemoContentParams(removeDemoParamsFromHash(frameHash), activeVariant, activeScenario)
      const nextPresets = getDevicePresetsForHash(latestFrameHashRef.current)
      const nextDeviceKey = isDeviceKeyInPresets(activeDeviceKey, nextPresets) ? activeDeviceKey : nextPresets[0].key
      if (!isDeviceKeyInPresets(activeDeviceKey, nextPresets)) {
        setActiveDeviceKey(nextDeviceKey)
      }
      setContentHash(latestFrameHashRef.current)
      window.history.replaceState(null, '', withDemoParams(latestFrameHashRef.current, nextDeviceKey))
    }

    frameWindow.addEventListener('hashchange', syncParentHash)
    return () => frameWindow.removeEventListener('hashchange', syncParentHash)
  }, [activeDeviceKey, activeVariant, activeScenario])

  useEffect(() => {
    const syncFrameFromParentHash = () => {
      const nextVariant = getVariantParam(window.location.hash || '#/frame')
      const nextScenario = getScenarioParam(window.location.hash || '#/frame', DEFAULT_DEMO_SCENARIO)
      const nextHash = withDemoContentParams(removeDemoParamsFromHash(window.location.hash || '#/frame'), nextVariant, nextScenario)
      if (nextHash === latestFrameHashRef.current) return

      setActiveVariant(nextVariant)
      setActiveScenario(nextScenario)
      latestFrameHashRef.current = nextHash
      setContentHash(nextHash)
      const nextPresets = getDevicePresetsForHash(nextHash)
      if (!isDeviceKeyInPresets(activeDeviceKey, nextPresets)) {
        setActiveDeviceKey(nextPresets[0].key)
      }
      setFrameSrc(getFrameSrc(nextHash))
    }

    window.addEventListener('hashchange', syncFrameFromParentHash)
    return () => window.removeEventListener('hashchange', syncFrameFromParentHash)
  }, [activeDeviceKey])

  const handleDeviceChange = (deviceKey: string) => {
    setActiveDeviceKey(deviceKey)
    window.history.replaceState(null, '', withDemoParams(latestFrameHashRef.current, deviceKey))
  }

  const handleVariantChange = (variant: FrameDemoVariant) => {
    const nextHash = getVariantHomeHash(variant, activeScenario)
    setActiveVariant(variant)
    latestFrameHashRef.current = nextHash
    setContentHash(nextHash)
    setFrameSrc(getFrameSrc(nextHash))
    window.history.replaceState(null, '', withDemoParams(nextHash, activeDevice.key))
  }

  const handleScenarioChange = (scenario: FrameContentScenario) => {
    const nextHash = getVariantHomeHash(activeVariant, scenario)
    setActiveScenario(scenario)
    latestFrameHashRef.current = nextHash
    setContentHash(nextHash)
    setFrameSrc(getFrameSrc(nextHash))
    window.history.replaceState(null, '', withDemoParams(nextHash, activeDevice.key))
  }

  const exitDemoMode = () => {
    dismissAutoDemoForSession()
    window.location.hash = withDemoOffParam(latestFrameHashRef.current)
  }

  const deviceWidth = activeDevice.width + deviceChrome.bezelX * 2
  const deviceHeight = activeDevice.height + deviceChrome.bezelTop + deviceChrome.bezelBottom
  const scaledDeviceWidth = deviceWidth * scale
  const scaledDeviceHeight = deviceHeight * scale

  return (
    <div className={`frame-demo-root frame-demo-root--${activeDevice.type}${shouldForceLandscape ? ' frame-demo-root--force-landscape' : ''}`}>
      <header className="frame-demo-toolbar" aria-label="相框演示模式">
        <div className="frame-demo-toolbar__control">
          <button className="frame-demo-toolbar__exit" type="button" onClick={exitDemoMode}>
            <CaretLeft size={20} weight="bold" aria-hidden="true" />
            退出演示
          </button>
          <span className="frame-demo-toolbar__divider" aria-hidden="true" />
          <DemoToolbarSelect
            label="尺寸"
            value={activeDevice.key}
            options={devicePresets.map((preset) => ({ value: preset.key, label: preset.label }))}
            onChange={handleDeviceChange}
          />
          {activeDevice.type === 'frame' ? (
            <>
              <span className="frame-demo-toolbar__divider" aria-hidden="true" />
              <DemoToolbarSelect
                label="版本"
                value={activeVariant}
                options={[
                  { value: 'new', label: '新版' },
                  { value: 'possibility', label: '可能性版' },
                  { value: 'v1', label: 'V1.0' },
                ]}
                onChange={(nextVariant) => handleVariantChange(nextVariant as FrameDemoVariant)}
              />
              <span className="frame-demo-toolbar__divider" aria-hidden="true" />
              <DemoToolbarSelect
                label="内容"
                value={activeScenario}
                options={[
                  { value: 'teacher-retirement', label: '陈老师荣休礼' },
                  { value: 'default', label: '常规版' },
                  { value: 'ama-letter', label: '阿嫲版' },
                ]}
                onChange={(nextScenario) => handleScenarioChange(nextScenario as FrameContentScenario)}
              />
            </>
          ) : null}
        </div>
      </header>

      <section className="frame-demo-stage" aria-label={`${activeDevice.label}演示画布`}>
        <div
          className="frame-demo-device-slot"
          style={{
            width: `${scaledDeviceWidth}px`,
            height: `${scaledDeviceHeight}px`,
          }}
        >
          <div
            className={`frame-demo-device frame-demo-device--${activeDevice.type}`}
            style={{
              width: `${deviceWidth}px`,
              height: `${deviceHeight}px`,
              transform: `scale(${scale})`,
              padding: `${deviceChrome.bezelTop}px ${deviceChrome.bezelX}px ${deviceChrome.bezelBottom}px`,
            }}
          >
            <span className="frame-demo-device__camera" aria-hidden="true" />
            <iframe
              key={frameSrc}
              ref={iframeRef}
              className="frame-demo-device__screen"
              src={frameSrc}
              title="拾光叙相框端演示画布"
              width={activeDevice.width}
              height={activeDevice.height}
              onLoad={() => {
                const frameWindow = iframeRef.current?.contentWindow
                if (!frameWindow) return
                latestFrameHashRef.current = withDemoContentParams(removeDemoParamsFromHash(frameWindow.location.hash || latestFrameHashRef.current), activeVariant, activeScenario)
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
