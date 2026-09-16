import { CaseId, Page, Role, cases, relationLabel } from './data'
import { CaseState, orderedStories, available, photosFor, Version, Letter } from './model'
export const roles: { id: Role; label: string }[] = [
  { id: 'contributor', label: '共创者体验' },
  { id: 'coordinator', label: '统筹者体验' },
  { id: 'recipient', label: '长者体验' },
]
export const lifecycle = [
  { label: '发起礼物', pages: { coordinator: 'entry' } },
  { label: '邀请共创', pages: { contributor: 'invite', coordinator: 'invite_manage' } },
  { label: '共创欢迎', pages: { contributor: 'welcome', coordinator: 'workspace' } },
  { label: '留下心意', pages: { contributor: 'identity', coordinator: 'workspace' } },
  { label: '共创进行中', pages: { contributor: 'progress', coordinator: 'workspace' } },
  { label: '内容整理', pages: { contributor: 'progress', coordinator: 'review_photos' } },
  { label: '成品预览', pages: { contributor: 'product', coordinator: 'product' } },
  { label: '确认仪式版本', pages: { coordinator: 'freeze' } },
  {
    label: '长者拆封',
    pages: { contributor: 'share', coordinator: 'share', recipient: 'activate' },
  },
  {
    label: '现场补充',
    pages: { contributor: 'guest', coordinator: 'onsite', recipient: 'received' },
  },
  {
    label: '礼后留存',
    pages: { contributor: 'people', coordinator: 'gifts', recipient: 'ceremony' },
  },
  { label: '重要日子提醒', pages: { contributor: 'messages' } },
  { label: '再送时光', pages: { contributor: 'greeting' } },
  { label: '相框收到新心意', pages: { contributor: 'progress', recipient: 'received' } },
] as { label: string; pages: Partial<Record<Role, Page>> }[]
export function stageOf(p: Page) {
  if (['entry', 'host'].includes(p)) return 0
  if (['invite', 'invite_manage'].includes(p)) return 1
  if (p === 'welcome') return 2
  if (['identity', 'impressions', 'photos', 'stories', 'wishes', 'preview'].includes(p)) return 3
  if (['workspace', 'success', 'progress'].includes(p)) return 4
  if (
    ['organize', 'prepare', 'curate', 'review_photos', 'review_stories', 'review_wishes'].includes(
      p,
    )
  )
    return 5
  if (p === 'letter') return 5
  if (p === 'product') return 6
  if (p === 'freeze') return 7
  if (['activate', 'share', 'waiting'].includes(p)) return 8
  if (['guest', 'onsite'].includes(p)) return 9
  if (p === 'messages') return 11
  if (['greeting', 'send'].includes(p)) return 12
  if (p === 'received') return 13
  return 10
}
export const managedPages: Page[] = [
  'workspace',
  'organize',
  'letter',
  'product',
  'handover',
  'invite_manage',
  'prepare',
  'curate',
  'freeze',
  'review_photos',
  'review_stories',
  'review_wishes',
]
export function reviewsDone(s: CaseState) {
  return s.review.photos && s.review.stories && s.review.wishes
}
export function isManager(s: CaseState) {
  return s.coordinatorName === s.coordinatorViewer
}
export function stageEnabled(index: number, role: Role, s: CaseState) {
  if (!lifecycle[index]?.pages[role]) return false
  if (role === 'recipient') return index === 8 || (!!s.version && !!s.openedAt)
  if (role === 'coordinator' && !isManager(s)) return false
  if (index === 8 && !s.version) return false
  return true
}
export function deadlineText(_s: CaseState) {
  // Fixed demo clock three days before the configured deadline, never pretend today's real date is earlier.
  return '距离共创截止还有 3 天 · 情景时间'
}
export function collected(id: CaseId, s: CaseState) {
  return available(id, s, 'ceremony').filter(
    (b) =>
      !['onsite', 'greeting'].includes(b.source) &&
      !s.excludedPhotos.includes(b.id) &&
      !(s.excludedWishes || []).includes(b.id),
  )
}
export function contentSignature(id: CaseId, s: CaseState) {
  return JSON.stringify({
    blocks: collected(id, s).map((b) => [b.id, b.revision, b.body, b.title, b.tags]),
    photos: photosFor(id, s)
      .filter((p) => collected(id, s).some((b) => b.photoIds.includes(p.id)))
      .map((p) => [p.id, p.caption, p.date, p.precision]),
    featured: s.storyOrder || s.featured,
    order: s.photoOrder,
    hero: s.heroPhotos,
    host: [s.host.name, s.host.address, s.host.bio],
  })
}
export function letterCurrent(id: CaseId, s: CaseState) {
  return !!s.letter.text && s.letter.signature === contentSignature(id, s)
}
export function generateLetter(id: CaseId, s: CaseState): Letter {
  const c = cases.find((x) => x.id === id)!
  const blocks = collected(id, s)
  const tags = new Map<string, number>()
  blocks
    .filter((b) => b.kind === 'impression')
    .forEach((b) => b.tags.forEach((t) => tags.set(t, (tags.get(t) || 0) + 1)))
  const terms = [...tags]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((x) => x[0])
  const stories = orderedStories(id, { ...s, previewing: true }, blocks)
  const captions = blocks.filter((b) => b.kind === 'photo').slice(0, 2)
  const wishes = blocks.filter((b) => b.kind === 'wish')
  const count = new Set(blocks.map((b) => b.authorId)).size
  const themes: Record<CaseId, string> = {
    teacher:
      '您留下的影响，常常藏在很小的事情里：愿意听人把话说完，在遇到困难时陪人把问题拆开，也在普通的日子里认真对待每一个人。那些曾被接住的犹疑，慢慢变成了我们面对生活的底气。',
    leader:
      '一起共事的日子里，最值得记住的并不只有事情做成的那一刻。是遇到难题时有人愿意一起商量，是年轻人的意见有人认真听，也是每个人都能在团队里找到自己的位置。这样的信任，后来成为了我们照顾身边人的方式。',
    nurse:
      '您教会大家的，不只是怎样把工作做好。忙乱的时候稳住心神，不确定的时候敢于开口，把耐心留给需要的人。如今回看，那些看似平常的陪伴，早已成为我们继续照顾别人的力量。',
    birthday:
      '家人记得生活被妥帖照顾的样子，朋友也看见您为喜欢的事认真投入。那些普通的饭桌、窗边和出门散步的片刻，连在一起，就是一个人把日子过得丰盛的模样。新的一岁，也请把更多时间留给自己。',
    anniversary:
      '四十年的相伴，不只在被庆祝的日子里。它也在出门时的一句提醒、一起张罗的饭菜、和再熟悉不过的小路上。家人与朋友看见的，是两个人在平凡生活里彼此照顾，也把温暖分给周围的人。',
  }
  const opening =
    s.letter.revision % 2
      ? '当我们把记忆慢慢放到一起，才发现，很多人一直带着您留下的影响向前走。'
      : '这一次，我们想把平时没有来得及认真说的话，放在同一封信里。'
  const represented = stories.length
    ? `从${stories.map((b) => `${b!.author}记得的《${b!.title}》`).join('，到')}，不同的人记住了不同的细节，却都在说着同一份感谢。`
    : '有些回忆没有被写成长故事，却仍留在一句简短的话和一张照片里。'
  const photoSentence = captions.length
    ? `照片里留下了“${captions[0].body}”${captions[1] ? `，也留下了“${captions[1].body}”` : ''}。这些片段不必宏大，就已经值得慢慢回看。`
    : ''
  const wishThemes = [
    [/旅行|风景|走走|小路|山|海/, '多出门看看风景'],
    [/健康|平安|身体|安康/, '把健康和平安放在心上'],
    [/慢慢|从容|自在|清晨|休息|舒展/, '按自己喜欢的节奏生活'],
    [/相聚|相见|见面|一起|陪伴|回来/, '与牵挂的人常常相聚'],
  ] as const
  const hopes = wishThemes
    .filter(([pattern]) => wishes.some((b) => pattern.test(b.body)))
    .map(([, text]) => text)
    .slice(0, 3)
  const ending = wishes.length
    ? `大家留下的${wishes.length}份祝福，汇成了相近的期待：${hopes.length ? hopes.join('，') : '往后的日子，更从容地做喜欢的事'}。也请记得，始终有人惦记着您。`
    : '愿往后的日子从容、自在；有空的时候，我们再相聚。'
  return {
    text: `亲爱的${s.host.address}：\n\n${opening}\n\n${terms.length ? `“${terms.join('”“')}”，是大家一次次提起的印象。` : ''}${themes[id]}\n\n${represented}\n\n${photoSentence}\n\n${ending}\n\n这份${c.category}，也是一个新的约定：故事留在这里，问候还会继续。\n\n一起留下心意的 ${count} 位朋友`,
    revision: s.letter.revision + 1,
    signature: contentSignature(id, s),
    confirmed: false,
    sources: blocks.map((b) => b.id),
  }
}
export function canFreeze(id: CaseId, s: CaseState) {
  return (
    isManager(s) &&
    s.review.photos &&
    s.review.stories &&
    s.review.wishes &&
    s.review.previewed &&
    s.letter.confirmed &&
    letterCurrent(id, s) &&
    collected(id, s).length > 0
  )
}
export function freezeVersion(id: CaseId, s: CaseState): Version {
  if (!canFreeze(id, s)) throw Error('请先完成内容整理和成品预览')
  return {
    number: (s.version?.number || 0) + 1,
    blocks: structuredClone(collected(id, s)),
    featured: orderedStories(id, { ...s, previewing: true }, collected(id, s)).map((b) => b.id),
    storyOrder: orderedStories(id, { ...s, previewing: true }, collected(id, s)).map((b) => b.id),
    photos: structuredClone(photosFor(id, s)),
    photoOrder: [...s.photoOrder],
    heroes: [...s.heroPhotos],
    host: { ...s.host },
    letter: structuredClone(s.letter),
    at: new Date().toISOString(),
  }
}
export const birthdays: Record<CaseId, string> = {
  teacher: '04月18日',
  leader: '11月12日',
  nurse: '08月24日',
  birthday: '10月26日',
  anniversary: '许正安 03月09日 · 苏文澜 08月16日',
}
export function relationship(codes: string[], primary: string) {
  return [primary, ...codes.filter((c) => c !== primary)]
    .filter(Boolean)
    .map(relationLabel)
    .join(' · ')
}

export function validPhotoDate(date: string, precision: string) {
  if (precision === 'unknown') return true
  const parts = date.split('-').map(Number)
  if (!/^\d{4}$/.test(date.slice(0, 4)) || parts[0] < 1) return false
  if (precision === 'year') return /^\d{4}$/.test(date)
  if (precision === 'month') return /^\d{4}-(0[1-9]|1[0-2])$/.test(date)
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)) return false
  const d = new Date(date + 'T00:00:00Z')
  return (
    d.getUTCFullYear() === parts[0] &&
    d.getUTCMonth() + 1 === parts[1] &&
    d.getUTCDate() === parts[2]
  )
}
