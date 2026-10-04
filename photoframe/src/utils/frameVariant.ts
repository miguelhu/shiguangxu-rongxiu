import { withScenario } from '../content/scenarioStore'

export type FrameVariant = 'v1' | 'possibility' | 'new'

function parseFrameVariant(value: string | null): FrameVariant | null {
  if (value === 'possibility' || value === 'new') return value
  if (value === 'v1') return 'v1'
  return null
}

function getVariantFromHash(hash: string) {
  const search = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  return parseFrameVariant(new URLSearchParams(search).get('variant'))
}

export function getFrameVariant(searchParams?: URLSearchParams): FrameVariant {
  const localVariant = parseFrameVariant(searchParams?.get('variant') ?? null)
    || getVariantFromHash(window.location.hash)
  if (localVariant) return localVariant

  try {
    if (window.self !== window.top) {
      const parentVariant = getVariantFromHash(window.parent.location.hash)
      if (parentVariant) return parentVariant
    }
  } catch {
    // Parent access can fail outside same-origin demos; use the Showcase default.
  }

  return 'new'
}

export function withFrameVariant(path: string, variant: FrameVariant = getFrameVariant()): string {
  const scenarioPath = withScenario(path)
  if (/^https?:\/\//.test(scenarioPath)) return scenarioPath

  const [pathname, hash = ''] = scenarioPath.split('#')
  const [basePath, search = ''] = pathname.split('?')
  const params = new URLSearchParams(search)

  if (variant === 'new') params.delete('variant')
  else params.set('variant', variant)

  const query = params.toString()
  return `${basePath}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`
}
