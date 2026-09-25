import { cases, datasets, CaseId, Page, Scope, Photo, relationLabel, Role } from './data'
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
  /** 独立授权：是否允许在礼前向同项目共创者展示摘要。 */
  peerPreviewAllowed?: boolean
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
  boardMode?: 'surprise' | 'open'
}
export interface Letter {
  text: string
  revision: number
  signature: string
  confirmed: boolean
  sources: string[]
}
export interface Version {
  storyOrder?: string[]
  letter?: Letter
  photoOrder?: string[]
  heroes?: string[]
  photos?: Photo[]
  number: number
  blocks: Block[]
  featured: string[]
  host: Host
  at: string
}
export interface CaseState {
  collectionEnded?: boolean
  storyOrder?: string[]
  excludedWishes?: string[]
  excludedStories?: string[]
  activated?: boolean
  openedAt?: string
  notifyAfterOpen?: boolean
  lastContributionPage?: Page
  contributionStarted?: boolean
  coordinatorName: string
  coordinatorViewer: string
  transferTo: string
  targetCount: number
  owned: boolean
  guestName: string
  guestRelation: string
  photoOrder: string[]
  excludedPhotos: string[]
  heroPhotos: string[]
  review: { photos: boolean; stories: boolean; wishes: boolean; previewed: boolean }
  letter: Letter
  organizeTab?: number
  authorDrafts?: Record<string, Draft>
  stage: number
  lastSent: string
  submittedDraftSignature: string
  formStep: number
  shareReady: boolean
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
  demoRevision62?: boolean
  role: Role
  schema: 5
  caseId: CaseId
  cases: Record<CaseId, CaseState>
  profiles?: Record<string, { name: string; bio: string; phone: string; avatar: string }>
  profile: { name: string; bio: string; phone: string; avatar: string }
}
export const STORAGE = 'sgx-demo-v6'
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
    scope: { ...allScope },
    blockScopes: {},
  }
}
export function newCase(id: CaseId): CaseState {
  const c = cases.find((c) => c.id === id)!
  const d = datasets[id]
  return {
    coordinatorName: c.operator,
    coordinatorViewer: c.operator,
    transferTo: '',
    targetCount: id === 'teacher' ? 20 : 12,
    contributionStarted: id === 'teacher',
    lastContributionPage: id === 'teacher' ? 'identity' : undefined,
    owned: false,
    guestName: '',
    guestRelation: 'friend',
    photoOrder: [],
    excludedPhotos: [],
    heroPhotos: [],
    review: { photos: false, stories: false, wishes: false, previewed: false },
    letter: { text: '', revision: 0, signature: '', confirmed: false, sources: [] },
    stage: 3,
    lastSent: '',
    submittedDraftSignature: '',
    formStep: 0,
    shareReady: false,
    draft: newDraft(id),
    hiddenSeed: [],
    blocks: [],
    withdrawn: [],
    featured: d.stories.filter((s) => s.featured).map((s) => s.id),
    curator: true,
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
      age: id === 'birthday' ? '60' : '',
      surprise: false,
      strict: false,
      boardMode: 'surprise',
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
    schema: 5,
    demoRevision62: true,
    role: 'contributor',
    caseId: 'teacher',
    cases: Object.fromEntries(cases.map((c) => [c.id, newCase(c.id)])) as State['cases'],
    profile: { name: '林悦', bio: '留下回忆，也带来新的心意', phone: '', avatar: '' },
  }
}
export function load(): State {
  try {
    const v = JSON.parse(
      localStorage.getItem(STORAGE) || localStorage.getItem('sgx-demo-v5') || 'null',
    )
    if (v?.schema !== 5 || !cases.every((c) => v.cases?.[c.id]?.draft)) return initial()
    if (!v.demoRevision62) {
      v.cases.teacher.contributionStarted = true
      v.cases.teacher.submission = 0
      v.cases.teacher.submittedDraftSignature = ''
      v.demoRevision62 = true
    }
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
      sticker: '',
    })
  }
  for (const p of d.photos) {
    const a = d.authors.find((a) => a.id === p.authorId)!
    blocks.push({ ...base(a), id: p.id, kind: 'photo', photoIds: [p.id], body: p.caption })
  }
  for (const [storyIndex, s] of d.stories.entries()) {
    const a = d.authors.find((a) => a.id === s.authorId)!
    blocks.push({
      ...base(a),
      id: s.id,
      kind: 'story',
      title: s.title,
      body: s.body,
      photoIds: [],
      audio: '',
      audioText: '',
      // 演示数据中仅部分故事取得了独立的共创看板摘要授权。
      peerPreviewAllowed: storyIndex < 3,
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
      : available(id, s, 'ceremony').filter(
          (b) =>
            b.source !== 'onsite' &&
            b.source !== 'greeting' &&
            !s.excludedPhotos.includes(b.id) &&
            !(s.excludedStories || []).includes(b.id) &&
            !(s.excludedWishes || []).includes(b.id),
        )
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
// Story dates come only from photos explicitly linked to that story; unknown dates stay last.
export function orderedStories(id: CaseId, s: CaseState, blocks: Block[]) {
  const frozen = s.version && !s.previewing
  const order = (frozen ? s.version?.storyOrder : s.storyOrder) || []
  const media = (frozen && s.version!.photos) || photosFor(id, s)
  const date = (b: Block) => {
    const linked = b.photoIds.length
      ? b.photoIds
      : datasets[id].stories.find((x) => x.id === b.id)?.photoIds || []
    return (
      media
        .filter((p) => linked.includes(p.id) && p.date)
        .map((p) => p.date)
        .sort()[0] || '9999'
    )
  }
  return blocks
    .filter((b) => b.kind === 'story')
    .sort((a, b) => {
      if (order.length) {
        const ai = order.indexOf(a.id),
          bi = order.indexOf(b.id)
        if (ai !== bi) return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi)
      }
      return date(a).localeCompare(date(b))
    })
}
export function orderedPhotos(id: CaseId, s: CaseState, blocks: Block[]) {
  const ids = new Set(blocks.flatMap((b) => (b.kind === 'photo' ? b.photoIds : [])))
  return (s.version && !s.previewing && s.version.photos ? s.version.photos : photosFor(id, s))
    .filter((p) => ids.has(p.id))
    .sort((a, b) => {
      const order = s.version && !s.previewing ? s.version.photoOrder || [] : s.photoOrder
      if (order.length) {
        const ai = order.indexOf(a.id),
          bi = order.indexOf(b.id)
        if (ai !== bi) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi)
      }
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
        photoIds: [],
        audio: '',
        audioText: '',
      }),
    )
  if (d.wish.trim() || d.audio)
    list.push({
      ...base,
      id: prefix + '-wish',
      kind: 'wish',
      body: d.wish,
      photoIds: [],
      sticker: '',
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
        return {
          id: x.id,
          title: x.title,
          body: x.body,
          original: x.body,
          photoIds: [],
          audio: '',
          audioText: '',
        }
      })
  if (step === 'wishes') {
    out.wish = a.wish
    out.sticker = ''
    out.audio = v?.path || ''
    out.audioText = v?.text || ''
  }
  return out
}
