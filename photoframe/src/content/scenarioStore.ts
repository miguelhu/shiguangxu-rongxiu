import { AMA_LETTER_SCENARIO } from './scenarios/amaLetterScenario'
import { TEACHER_RETIREMENT_SCENARIO } from './scenarios/teacherRetirementScenario'
import type { PrototypeScenario, ScenarioId } from './scenarioTypes'

export const SCENARIO_STORAGE_KEY = 'shiguangxu:scenario'

const DEFAULT_SCENARIO: PrototypeScenario = {
  id: 'default',
  label: '默认原型',
}

const SCENARIOS: Record<ScenarioId, PrototypeScenario> = {
  default: DEFAULT_SCENARIO,
  'ama-letter': AMA_LETTER_SCENARIO,
  'teacher-retirement': TEACHER_RETIREMENT_SCENARIO,
}

let activeScenarioId: ScenarioId = readStoredScenarioId()

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return value === 'default' || value === 'ama-letter' || value === 'teacher-retirement'
}

function readStoredScenarioId(): ScenarioId {
  if (typeof window === 'undefined') return 'default'

  try {
    const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY)
    return isScenarioId(stored) ? stored : 'default'
  } catch {
    return 'default'
  }
}

function writeStoredScenarioId(id: ScenarioId) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, id)
  } catch {
    // Storage can be unavailable in private contexts; in-memory state still works.
  }
}

export function getActiveScenarioId(): ScenarioId {
  return activeScenarioId
}

export function setActiveScenarioId(id: ScenarioId): ScenarioId {
  activeScenarioId = id
  writeStoredScenarioId(id)
  return activeScenarioId
}

function isDefaultEntryPath(pathname?: string): boolean {
  return pathname === '/' || pathname === '/frame' || pathname === '/member' || pathname === '/member/home'
}

export function resolveScenarioFromLocation(search: string, pathname?: string): ScenarioId {
  const params = new URLSearchParams(search)
  const scenarioParam = params.get('scenario')

  if (isScenarioId(scenarioParam)) {
    return setActiveScenarioId(scenarioParam)
  }

  if (isDefaultEntryPath(pathname)) {
    return setActiveScenarioId('default')
  }

  activeScenarioId = readStoredScenarioId()
  return activeScenarioId
}

export function getScenarioSearchFromWindowLocation(location: Pick<Location, 'hash' | 'search'>): string {
  const hashQueryStart = location.hash.indexOf('?')
  if (hashQueryStart >= 0) {
    return location.hash.slice(hashQueryStart)
  }

  return location.search
}

function getParentScenarioSearch() {
  if (typeof window === 'undefined' || window.self === window.top) return ''

  try {
    const parentHash = window.parent.location.hash
    const parentHashQueryStart = parentHash.indexOf('?')
    if (parentHashQueryStart >= 0) {
      return parentHash.slice(parentHashQueryStart)
    }
    return window.parent.location.search
  } catch {
    return ''
  }
}

export function getScenarioPathnameFromWindowLocation(location: Pick<Location, 'hash' | 'pathname'>): string {
  if (location.hash.startsWith('#/')) {
    const hashPath = location.hash.slice(1)
    return hashPath.split('?')[0] || '/'
  }

  return location.pathname || '/'
}

export function getActiveScenario(): PrototypeScenario {
  return SCENARIOS[activeScenarioId] || DEFAULT_SCENARIO
}

export function syncScenarioFromCurrentLocation() {
  const ownSearch = getScenarioSearchFromWindowLocation(window.location)
  const ownParams = new URLSearchParams(ownSearch)
  const parentSearch = getParentScenarioSearch()
  const parentParams = new URLSearchParams(parentSearch)
  const scenarioSearch = ownParams.has('scenario') || !parentParams.has('scenario') ? ownSearch : parentSearch

  return resolveScenarioFromLocation(
    scenarioSearch,
    getScenarioPathnameFromWindowLocation(window.location),
  )
}

export function withScenario(path: string): string {
  const scenarioId = getActiveScenarioId()
  if (scenarioId === 'default') return path
  if (/^https?:\/\//.test(path)) return path

  const [pathname, hash = ''] = path.split('#')
  const [basePath, search = ''] = pathname.split('?')
  const params = new URLSearchParams(search)
  params.set('scenario', scenarioId)
  const query = params.toString()

  return `${basePath}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`
}
