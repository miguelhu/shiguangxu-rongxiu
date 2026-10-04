import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

function normalizeVersion(value: string | null) {
  const normalized = String(value || '').trim().toLowerCase().replace(/^v/, '')
  return /^\d+\.\d+$/.test(normalized) ? `v${normalized}` : ''
}

function getPrototypeOrigin(version: string) {
  return `https://ai-frame-prototype-${version.replace('.', '-')}.pages.dev`
}

function getSafeRoute(value: string | null) {
  const route = String(value || '/home').trim()
  return route.startsWith('/') && !route.startsWith('//') ? route : '/home'
}

export function PrototypeRedirectPage() {
  const [searchParams] = useSearchParams()
  const version = normalizeVersion(searchParams.get('version'))
  const destination = useMemo(() => {
    if (!version) return ''

    const route = getSafeRoute(searchParams.get('route'))
    const destinationParams = new URLSearchParams()
    const demo = searchParams.get('demo')
    const device = searchParams.get('device')
    if (demo) destinationParams.set('demo', demo)
    if (device) destinationParams.set('device', device)
    const query = destinationParams.toString()
    return `${getPrototypeOrigin(version)}/#${route}${query ? `?${query}` : ''}`
  }, [searchParams, version])

  useEffect(() => {
    if (!destination) return
    window.location.replace(destination)
  }, [destination])

  return (
    <main className="prototype-redirect-page">
      <section className="prototype-redirect-card" aria-live="polite">
        <span className="prototype-redirect-mark" aria-hidden="true">拾</span>
        <h1>{destination ? `正在打开 ${version.slice(1)} 版原型` : '原型版本无效'}</h1>
        <p>{destination ? '即将进入该版本的独立演示地址……' : '请在链接中指定正确的 version，例如 v0.1。'}</p>
      </section>
    </main>
  )
}
