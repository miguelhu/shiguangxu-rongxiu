import { cases, datasets, CaseId, Page, Scope, Photo, relationLabel } from './data'
export interface Block {
  id: string
  kind: 'impression' | 'photo' | 'story' | 'wish'
  authorId: string
  author: string
  relation: string
  title: string
  body: string
  photoIds: string[]
  tags: string[]
  sticker: string
  audio: string
  audioText: string
  scope: Scope
  source: 'seed' | 'contribution' | 'onsite' | 'greeting'
  revision: number
  groupId: string
}
export interface Draft {
  authorId: string
  name: string
  phone: string
  codes: string[]
  secondaryCodes: string[]
  primary: string
  note: string
  period: string
  tags: string[]
  tagNote: string
  target: string
  photos: string[]
  stories: {
    id: string
    title: string
    body: string
    original: string
    photoIds: string[]
    audio: string
    audioText: string
  }[]
  wish: string
  wishMode: 'text' | 'photo'
  wishPhotos: string[]
  sticker: string
  audio: string
  audioText: string
  skipped: string[]
  visited: string[]
  scope: Scope
  blockScopes: Record<string, Scope>
}
export interface Host {
  age?: string
  configured: boolean
  role: 'organization' | 'personal' | 'self'
  operatorRole: string
  organizer: string
  name: string
  secondName: string
  address: string
  bio: string
  cover: string
  introPhotos: string[]
  date: string
  deadline: string
  logo: string
  showLogo: boolean
  showInviteLogo: boolean
  showEndLogo: boolean
  showBio: boolean
  showPhoto: boolean
  showAge: boolean
  surprise: boolean
  strict: boolean
}
export interface Version {
  photos?: Photo[]
  number: number
  blocks: Block[]
  featured: string[]
  host: Host
  at: string
}
export interface CaseState {
  previewing?: boolean
  greetingDrafts?: Record<
    string,
    {
      body: string
      imageIds: string[]
      sticker: string
      audio: string
      audioText: string
      photoOnly: boolean
      gift: boolean
      ceremony: boolean
    }
  >
  draft: Draft
  hiddenSeed: string[]
  blocks: Block[]
  withdrawn: string[]
  featured: string[]
  curator: boolean
  curatorPending: boolean
  host: Host
  version: Version | null
  onsite: boolean
  onsiteVisible: boolean
  remind: boolean
  channel: boolean
  advance: boolean
  notification: boolean
  notificationRead: boolean
  greetingSent: boolean
  delivery: 'none' | 'waiting' | 'delivered' | 'read'
  receive: boolean
  assets: Photo[]
  connections: Record<
    string,
    { codes: string[]; secondaryCodes?: string[]; primary: string; note: string; period: string }
  >
  submission: number
  page: Page
}
export interface State {
  schema: 4
  caseId: CaseId
  cases: Record<CaseId, CaseState>
  profile: { name: string; bio: string; phone: string; avatar: string }
}
export const STORAGE = 'sgx-demo-v4'
export const allScope: Scope = { gift: true, ceremony: true, keep: true }
export const noScope: Scope = { gift: false, ceremony: false, keep: false }
export function newDraft(id: CaseId, authorId?: string): Draft {
  const c = cases.find((c) => c.id === id)!
  const a = datasets[id].authors.find((a) => a.id === (authorId || c.actor))!
  const primaryCodes = id === 'anniversary' ? a.relationCodes.slice(0, 1) : a.relationCodes
  const secondaryCodes = id === 'anniversary' ? a.relationCodes.slice(-1) : []
  return {
    authorId: a.id,
    name: a.name,
    phone: '',
    codes: primaryCodes,
    secondaryCodes,
    primary: a.relationCodes[0],
    period: 'former',
    note: '',
    tags: [],
    tagNote: '',
    target: id === 'anniversary' ? 'pair' : 'person',
    photos: [],
    stories: [],
    wish: '',
    wishMode: 'text',
    wishPhotos: [],
    sticker: '',
    audio: '',
    audioText: '',
    skipped: [],
    visited: ['impressions'],
    scope: { ...noScope },
    blockScopes: {},
  }
}
export function newCase(id: CaseId): CaseState {
  const c = cases.find((c) => c.id === id)!
  const d = datasets[id]
  return {
    draft: newDraft(id),
    hiddenSeed: [],
    blocks: [],
    withdrawn: [],
    featured: d.stories.filter((s) => s.featured).map((s) => s.id),
    curator: !!c.curator,
    curatorPending: false,
    host: {
      configured: false,
      role: 'organization',
      operatorRole: '团队代表',
      organizer: c.host,
      name: c.recipients[0],
      secondName: c.recipients[1] || '',
      address: c.address,
      bio: c.bio,
      cover: c.cover,
      introPhotos: [],
      date: c.date,
      deadline: c.deadline,
      logo: id === 'teacher' ? 'images/tsinghua-logo.jpg' : '',
      showLogo: true,
      showInviteLogo: true,
      showEndLogo: true,
      showBio: true,
      showPhoto: true,
      showAge: true,
      age: id==='birthday'?'60':'',
      surprise: false,
      strict: false,
    },
    version: null,
    onsite: false,
    onsiteVisible: false,
    remind: false,
    channel: false,
    advance: true,
    notification: false,
    notificationRead: false,
    greetingSent: false,
    delivery: 'none',
    receive: true,
    assets: [],
    connections: Object.fromEntries(
      d.authors.map((a) => [
        a.id,
        {
          codes: id === 'anniversary' ? a.relationCodes.slice(0, 1) : a.relationCodes,
          secondaryCodes: id === 'anniversary' ? a.relationCodes.slice(-1) : [],
          primary: a.relationCodes[0],
          note: a.relationNote,
          period: 'former',
        },
      ]),
    ),
    submission: 0,
    page: 'invite',
  }
}
export function initial(): State {
  return {
    schema: 4,
    caseId: 'teacher',
    cases: Object.fromEntries(cases.map((c) => [c.id, newCase(c.id)])) as State['cases'],
    profile: { name: '林悦', bio: '留下回忆，也带来新的心意', phone: '', avatar: '' },
  }
}
export function load(): State {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || 'null')
    if (v?.schema !== 4 || !cases.every((c) => v.cases?.[c.id]?.draft)) return initial()
    return v
  } catch {
    return initial()
  }
}
export function seedBlocks(id: CaseId): Block[] {
  const d = datasets[id]
  const blocks: Block[] = []
  const base = (a: (typeof d.authors)[number]): Omit<Block, 'id' | 'kind'> => ({
    authorId: a.id,
    author: a.name,
    relation: relationLabel(a.relationCodes[0]),
    title: '',
    body: '',
    photoIds: [],
    tags: [],
    sticker: '',
    audio: '',
    audioText: '',
    scope: { ...allScope },
    source: 'seed',
    revision: 1,
    groupId: a.id.replace('-U', '-C'),
  })
  for (const a of d.authors) {
    blocks.push({ ...base(a), id: a.id + '-tags', kind: 'impression', tags: a.impressions })
    const v = d.voices.find((v) => v.blockId === a.wishId)
    blocks.push({
      ...base(a),
      id: a.wishId,
      kind: 'wish',
      body: a.wish,
      audio: v?.path || '',
      audioText: v?.text || '',
      sticker: a.id.endsWith('01') ? 'thanks' : a.id.endsWith('05') ? 'happy' : '',
    })
  }
  for (const p of d.photos) {
    const a = d.authors.find((a) => a.id === p.authorId)!
    blocks.push({ ...base(a), id: p.id, kind: 'photo', photoIds: [p.id], body: p.caption })
  }
  for (const s of d.stories) {
    const a = d.authors.find((a) => a.id === s.authorId)!
    const v = d.voices.find((v) => v.blockId === s.id)
    blocks.push({
      ...base(a),
      id: s.id,
      kind: 'story',
      title: s.title,
      body: s.body,
      photoIds: s.photoIds,
      audio: v?.path || '',
      audioText: v?.text || '',
    })
  }
  return blocks
}
export function available(id: CaseId, s: CaseState, scope?: keyof Scope) {
  return [
    ...new Map(
      [...seedBlocks(id).filter((b) => !s.hiddenSeed.includes(b.authorId)), ...s.blocks].map(
        (b) => [b.id, b],
      ),
    ).values(),
  ].filter((b) => !s.withdrawn.includes(b.id) && (!scope || b.scope[scope]))
}
export function ceremonyBlocks(id: CaseId, s: CaseState) {
  const latest = new Map(s.blocks.map((b) => [b.id, b]))
  const list = (
    s.version && !s.previewing
      ? s.version.blocks
      : available(id, s, 'ceremony').filter((b) => b.source !== 'onsite' && b.source !== 'greeting')
  ).filter(
    (b) =>
      !s.withdrawn.includes(b.id) && b.scope.ceremony && (latest.get(b.id)?.scope.ceremony ?? true),
  )
  const known = new Set(
    [...seedBlocks(id), ...s.blocks].filter((b) => b.kind === 'photo').flatMap((b) => b.photoIds),
  )
  const allowed = new Set(list.filter((b) => b.kind === 'photo').flatMap((b) => b.photoIds))
  return list.map((b) =>
    b.kind !== 'photo'
      ? { ...b, photoIds: b.photoIds.filter((pid) => !known.has(pid) || allowed.has(pid)) }
      : b,
  )
}
export function photosFor(id: CaseId, s: CaseState) {
  return [...new Map([...datasets[id].photos, ...s.assets].map((p) => [p.id, p])).values()]
}
export function orderedPhotos(id: CaseId, s: CaseState, blocks: Block[]) {
  const ids = new Set(blocks.flatMap((b) => (b.kind === 'photo' ? b.photoIds : [])))
  return (s.version && !s.previewing && s.version.photos ? s.version.photos : photosFor(id, s))
    .filter((p) => ids.has(p.id))
    .sort((a, b) => {
      const key = (p: Photo) => (p.date ? p.date.padEnd(10, '-01').slice(0, 10) : '9999')
      return key(a).localeCompare(key(b)) || a.id.localeCompare(b.id)
    })
}
export function draftBlocks(
  id: CaseId,
  s: CaseState,
  source: Block['source'] = 'contribution',
): Block[] {
  const d = s.draft
  const prefix = `${id}-${d.authorId}-${s.submission + 1}`
  const base = {
    authorId: d.authorId,
    author: d.name,
    relation: relationLabel(d.primary),
    title: '',
    body: '',
    photoIds: [] as string[],
    tags: [] as string[],
    sticker: '',
    audio: '',
    audioText: '',
    scope: d.scope,
    source,
    revision: 1,
    groupId: prefix,
  }
  const list: Block[] = []
  if (d.tags.length)
    list.push({ ...base, id: prefix + '-tags', kind: 'impression', tags: d.tags, body: d.tagNote })
  d.photos.forEach((pid) => {
    const p = photosFor(id, s).find((p) => p.id === pid)
    list.push({
      ...base,
      id: prefix + '-' + pid,
      kind: 'photo',
      photoIds: [pid],
      body: p?.caption || '',
    })
  })
  d.stories
    .filter((x) => x.body.trim())
    .forEach((x, i) =>
      list.push({
        ...base,
        id: prefix + '-s' + i,
        kind: 'story',
        title: x.title,
        body: x.body,
        photoIds: x.photoIds,
        audio: x.audio,
        audioText: x.audioText,
      }),
    )
  if ((d.wishMode === 'text' && d.wish.trim()) || d.wishPhotos.length || d.sticker || d.audio)
    list.push({
      ...base,
      id: prefix + '-wish',
      kind: 'wish',
      body: d.wishMode === 'text' ? d.wish : '',
      photoIds: d.wishPhotos,
      sticker: d.sticker,
      audio: d.audio,
      audioText: d.audioText,
    })
  return list.map((b) => ({ ...b, scope: d.blockScopes[b.id] || b.scope }))
}
export function sampleDraft(id: CaseId, s: CaseState, step: string): Draft {
  const d = datasets[id]
  const a = d.authors.find((a) => a.id === s.draft.authorId)!
  const v = d.voices.find((v) => v.blockId === a.wishId)
  const out = { ...s.draft }
  if (step === 'impressions') out.tags = a.impressions
  if (step === 'photos') out.photos = d.photos.filter((p) => p.authorId === a.id).map((p) => p.id)
  if (step === 'stories')
    out.stories = d.stories
      .filter((x) => x.authorId === a.id)
      .map((x) => {
        const v = d.voices.find((v) => v.blockId === x.id)
        return {
          id: x.id,
          title: x.title,
          body: x.body,
          original: x.body,
          photoIds: x.photoIds,
          audio: v?.path || '',
          audioText: v?.text || '',
        }
      })
  if (step === 'wishes') {
    out.wish = a.wish
    out.sticker = 'thanks'
    out.audio = v?.path || ''
    out.audioText = v?.text || ''
  }
  return out
}
