import { cases, type CaseId, type ContentType } from './data'

export interface MemorySnapshot {
  title: string
  body: string
  author: string
  included: boolean
  image: string
  kind?: ContentType
  sticker?: string
  voice?: string
}
export interface HostConfig {
  configured: boolean
  role: 'organization' | 'personal' | 'self'
  organizer: string
  operatorRole: string
  eventType: 'retirement' | 'birthday'
  title: string
  date: string
  logo: string
  showLogo: boolean
  recipientName: string
  address: string
  profession: string
  photo: string
  bio: string
  shareBio: boolean
  sharePhoto: boolean
  surprise: boolean
}
export interface GreetingRecord {
  sticker?: string
  voice?: string
  body: string
  photo: string
  delivery: 'processing' | 'waiting' | 'delivered'
}
export interface CaseState {
  author: string
  relation: string
  title: string
  body: string
  originalBody: string
  kind: ContentType
  drafts: Partial<Record<ContentType, { body: string; title: string; photo: string }>>
  sticker: string
  voice: string
  greetingSticker: string
  greetingVoice: string
  host: HostConfig
  deletedRecords: string[]
  photo: string
  consentGift: boolean
  consentCeremony: boolean
  consentKeep: boolean
  polished: boolean
  submitted: boolean
  frozen: MemorySnapshot | null
  curator: boolean
  onsiteCode: boolean
  onsiteBody: string
  onsitePhoto: string
  onsiteSent: boolean
  eventEnabled: boolean
  channel: boolean
  read: boolean
  skipped: boolean
  greeting: string
  greetingPhoto: string
  delivery: 'none' | 'processing' | 'waiting' | 'delivered'
  paused: boolean
  greetingHistory: GreetingRecord[]
}
export interface DemoState {
  schema: 1
  caseId: CaseId
  step: number
  cases: Record<CaseId, CaseState>
  profile: { name: string; avatar: string; bio: string; city: string }
  entryView: 'choice' | 'host' | 'recipient' | 'invitation'
}
export const STORAGE_KEY = 'shiguangxu-rongxiu-demo-v1'
export function newCase(id: CaseId): CaseState {
  const c = cases.find((x) => x.id === id)!
  return {
    author: '林悦',
    relation: c.relation,
    title: c.storyTitle,
    body: c.story,
    originalBody: c.story,
    kind: 'story',
    drafts: {},
    sticker: '',
    voice: '',
    greetingSticker: '',
    greetingVoice: '',
    deletedRecords: [],
    host: {
      configured: false,
      role: 'organization',
      organizer: c.organization,
      operatorRole: '活动经办人',
      eventType: 'retirement',
      title: `${c.name}荣休礼`,
      date: c.retirement.split('.').join('-'),
      logo: id === 'teacher' ? 'tsinghua-logo.jpg' : '',
      showLogo: true,
      recipientName: c.name,
      address: c.address,
      profession: c.profession,
      photo: c.image,
      bio: `${c.name}，${c.profession}。想把大家一起走过的时光，留在这份礼物里。`,
      shareBio: true,
      sharePhoto: true,
      surprise: true,
    },
    photo: '',
    consentGift: false,
    consentCeremony: false,
    consentKeep: false,
    polished: false,
    submitted: false,
    frozen: null,
    curator: !!c.curator,
    onsiteCode: false,
    onsiteBody: `今天又站到${c.address}身边。愿下一次相见，我们都更从容。`,
    onsitePhoto: '',
    onsiteSent: false,
    eventEnabled: false,
    channel: false,
    read: false,
    skipped: false,
    greeting: c.wish,
    greetingPhoto: '',
    delivery: 'none',
    paused: false,
    greetingHistory: [],
  }
}
export function initialState(): DemoState {
  return {
    schema: 1,
    profile: { name: '林悦', avatar: '', bio: '留下回忆，也带来新的心意', city: '' },
    entryView: 'choice',
    caseId: 'teacher',
    step: 0,
    cases: { teacher: newCase('teacher'), leader: newCase('leader'), nurse: newCase('nurse') },
  }
}
export function loadState(): DemoState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (
      raw?.schema !== 1 ||
      !cases.some((c) => c.id === raw.caseId) ||
      !Number.isInteger(raw.step) ||
      raw.step < 0 ||
      raw.step > 9
    )
      return initialState()
    const seed = initialState()
    for (const c of cases) {
      const item = raw.cases?.[c.id]
      if (!item || typeof item.body !== 'string' || typeof item.greeting !== 'string') return seed
      seed.cases[c.id] = {
        ...seed.cases[c.id],
        ...item,
        host: { ...seed.cases[c.id].host, ...item.host },
      }
    }
    return {
      ...seed,
      caseId: raw.caseId,
      step: raw.step,
      profile: { ...seed.profile, ...raw.profile },
      entryView: raw.entryView || 'choice',
    }
  } catch {
    return initialState()
  }
}

// Jumping chapters loads explicit demo prerequisites, never real business records.
export function seedToStep(item: CaseState, target: number): CaseState {
  const s = { ...item }
  if (target >= 3 && !s.submitted) {
    s.submitted = true
    s.consentGift = true
    s.consentCeremony = true
    s.consentKeep = true
  }
  if (target >= 4 && !s.frozen)
    s.frozen = {
      title: s.title,
      body: s.body,
      author: s.author,
      included: s.consentCeremony,
      image: s.photo,
      kind: s.kind,
      sticker: s.sticker,
      voice: s.voice,
    }
  if (target >= 6) s.onsiteSent = true
  // Reminder and receipt chapters intentionally do not invent user opt-in or delivery.
  return s
}

export function imageSource(value: string, base: string) {
  if (value.startsWith('data:image/')) return value
  const embedded = (window as Window & { __DEMO_IMAGES__?: Record<string, string> }).__DEMO_IMAGES__
  return embedded?.[value] || `${base}images/${value}`
}
