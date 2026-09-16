import content from './content.json' with { type: 'json' }
import relationData from './relations.json' with { type: 'json' }

export type CaseId = 'teacher' | 'leader' | 'nurse' | 'birthday' | 'anniversary'
export type Mode = 'experience' | 'overview' | 'compare'
export type Role = 'contributor' | 'coordinator' | 'recipient'
export type Page =
  | 'settings'
  | 'welcome'
  | 'activate'
  | 'send'
  | 'review_photos'
  | 'review_stories'
  | 'review_wishes'
  | 'gifts'
  | 'workspace'
  | 'organize'
  | 'letter'
  | 'product'
  | 'handover'
  | 'share'
  | 'waiting'
  | 'guest'
  | 'progress'
  | 'invite_manage'
  | 'invite'
  | 'identity'
  | 'impressions'
  | 'photos'
  | 'stories'
  | 'wishes'
  | 'preview'
  | 'success'
  | 'entry'
  | 'host'
  | 'prepare'
  | 'curate'
  | 'freeze'
  | 'ceremony'
  | 'onsite'
  | 'people'
  | 'person'
  | 'me'
  | 'profile'
  | 'relations'
  | 'records'
  | 'preferences'
  | 'messages'
  | 'greeting'
  | 'received'
export type Scope = { gift: boolean; ceremony: boolean; keep: boolean }
export interface Photo {
  id: string
  authorId: string
  date: string
  precision: string
  scene: string
  caption: string
  path: string
  source: string
}
export interface Author {
  id: string
  userId: string
  name: string
  relationCodes: string[]
  relationNote: string
  impressions: string[]
  wishId: string
  wish: string
}
export interface Story {
  id: string
  authorId: string
  title: string
  body: string
  photoIds: string[]
  featured: boolean
}
export interface Voice {
  id: string
  author: string
  blockId: string
  text: string
  path: string
}
export interface Shot {
  id: string
  layout: string
  photoIds: string[]
  seconds: number
  caption: string
}
export interface Content {
  authors: Author[]
  photos: Photo[]
  stories: Story[]
  shots: Shot[]
  voices: Voice[]
  polished: Record<string, string>
}
export interface CaseInfo {
  id: CaseId
  prefix: string
  category: string
  name: string
  address: string
  recipients: string[]
  title: string
  subtitle: string
  bio: string
  host: string
  operator: string
  date: string
  deadline: string
  event: string
  eventDate: string
  cover: string
  curator: string
  actor: string
  phrase: string
  color: string
  nextWish: string
}
export const cases: CaseInfo[] = [
  {
    id: 'teacher',
    prefix: 'T',
    category: '荣休礼',
    name: '陈明远',
    address: '陈老师',
    recipients: ['陈明远'],
    title: '把记得的那个瞬间，\n送给陈老师。',
    subtitle: '一间教室，许多种记得。',
    bio: '喜欢把复杂的问题拆开讲，也愿意多留一点时间，听学生把话说完。最近开始学着养花，想把从前匆忙经过的地方慢慢走一遍。',
    host: '清华大学',
    operator: '周宁',
    date: '2026-07-18',
    deadline: '2026-07-15',
    event: '教师节',
    eventDate: '2026-09-10',
    cover: 'images/teacher.png',
    curator: '',
    actor: 'T-U01',
    phrase: '愿接下来的日子，\n有时间慢慢做喜欢的事。',
    color: '#687b5e',
    nextWish:
      '陈老师，教师节快乐！最近带新人时，我也开始说“先看看已经做到的部分”。原来您的耐心，还能再往前传一点。',
  },
  {
    id: 'leader',
    prefix: 'L',
    category: '荣休礼',
    name: '周启山',
    address: '周老师',
    recipients: ['周启山'],
    title: '那些一起做成的事，\n也有你记得的一部分。',
    subtitle: '把难题放到桌面上。',
    bio: '做事稳，愿意听不同意见。年轻同事遇到问题时，他常说先把问题放到桌面上。退休后想多走走，也想把家里的旧物修一修。',
    host: '远川装备',
    operator: '许岚',
    date: '2026-06-20',
    deadline: '2026-06-17',
    event: '生日',
    eventDate: '2026-11-12',
    cover: 'images/leader.png',
    curator: '许岚',
    actor: 'L-U01',
    phrase: '愿日子从容，\n也愿我们，常常相见。',
    color: '#738187',
    nextWish:
      '周老师，生日快乐！最近带新人时，又想起您说的“把最担心的问题先放到桌面上”。愿您日子自在，有空一起走走。',
  },
  {
    id: 'nurse',
    prefix: 'N',
    category: '荣休礼',
    name: '沈知秋',
    address: '沈老师',
    recipients: ['沈知秋'],
    title: '您留下的那份温柔，\n我们一直带在身上。',
    subtitle: '今天，把温柔留给您。',
    bio: '带新人时，总愿意再多留一会儿。喜欢清晨散步，也喜欢和朋友交换好看的植物。想在荣休之后，把照顾别人的耐心分一点给自己。',
    host: '晴川医院护理团队',
    operator: '唐薇',
    date: '2026-10-16',
    deadline: '2026-10-13',
    event: '护士节',
    eventDate: '2027-05-12',
    cover: 'images/nurse.png',
    curator: '',
    actor: 'N-U01',
    phrase: '愿照顾过别人的日子，\n也化作照顾自己的温柔。',
    color: '#92a08d',
    nextWish:
      '沈老师，今天和新同事聊起第一次值夜班，忽然又想起您的耐心。我们都很好，愿您每天自在，有空一起喝茶。',
  },
  {
    id: 'birthday',
    prefix: 'B',
    category: '生日礼',
    name: '顾雅琴',
    address: '雅琴',
    recipients: ['顾雅琴'],
    title: '把日子过成，\n自己喜欢的样子。',
    subtitle: '新的一岁，喜欢的事慢慢做。',
    bio: '爱做家常菜，也喜欢画植物。最近报名了水彩课，想把阳台上每一盆花都画下来。喜欢热闹，也享受一个人慢慢做事的下午。',
    host: '家人与朋友',
    operator: '顾宁',
    date: '2026-10-26',
    deadline: '2026-10-23',
    event: '生日',
    eventDate: '2027-10-26',
    cover: 'images/cases/birthday/birthday-cover.jpg',
    curator: '',
    actor: 'B-U01',
    phrase: '新的一岁，\n慢慢做喜欢的自己。',
    color: '#a17d62',
    nextWish: '妈，新的一岁，希望您的画本又多了好多页。这个周末我们回去，听您讲讲最近画了什么。',
  },
  {
    id: 'anniversary',
    prefix: 'A',
    category: '婚龄礼',
    name: '许正安与苏文澜',
    address: '正安与文澜',
    recipients: ['许正安', '苏文澜'],
    title: '四十年，\n相伴如常。',
    subtitle: '我们与大家的四十年。',
    bio: '一个喜欢修修补补，一个喜欢把阳台种满。两个人最常做的事，是饭后沿着熟悉的小路散步。四十年里，有许多普通日子，也有许多人一起见证。',
    host: '家人与老朋友',
    operator: '许知远',
    date: '2026-11-20',
    deadline: '2026-11-17',
    event: '结婚纪念日',
    eventDate: '2027-11-20',
    cover: 'images/cases/anniversary/anniversary-cover.jpg',
    curator: '',
    actor: 'A-U01',
    phrase: '往后的普通日子，\n也一起认真过。',
    color: '#9b8770',
    nextWish: '爸妈，纪念日快乐。这个周末一起走走吧，还是你们常去的那条路。',
  },
]
export const datasets = content as Record<CaseId, Content>
export const relations = relationData as {
  group: string
  code: string
  label: string
  explain: string
}[]
export const relationLabel = (code: string) =>
  relations.find((r) => r.code === code)?.label || '参与者'
export const coSteps: Page[] = ['impressions', 'photos', 'stories', 'wishes']
export const coLabels = ['印象标签', '时光碎片', '话题故事', '祝福']
export const navigation: { page: Page; label: string; phase: string; note: string }[] = [
  {
    page: 'invite',
    label: '一份共创邀请',
    phase: '仪式之前',
    note: '先认识这份礼物，再留下属于你的心意。',
  },
  {
    page: 'impressions',
    label: '四步留下心意',
    phase: '仪式之前',
    note: '印象、照片、故事、祝福，一页一页慢慢来。',
  },
  {
    page: 'preview',
    label: '确认这份心意',
    phase: '仪式之前',
    note: '每一份内容都有署名，也由作者选择使用范围。',
  },
  {
    page: 'prepare',
    label: '一起准备礼物',
    phase: '仪式之前',
    note: '有人张罗，也可以安心交给系统整理。',
  },
  {
    page: 'ceremony',
    label: '走进这场仪式',
    phase: '仪式当天',
    note: '回忆、照片和大家的话，在这里成为一份礼物。',
  },
  {
    page: 'onsite',
    label: '把今天也留下',
    phase: '仪式当天',
    note: '仍然是同一个入口，旧朋友也能继续补充。',
  },
  { page: 'people', label: '我参与过的人', phase: '仪式之后', note: '仪式会结束，关系会留下来。' },
  {
    page: 'messages',
    label: '重要日子，再问候',
    phase: '再一次问候',
    note: '记得的人，在你选择的日子，得到一次问候的提醒。',
  },
  {
    page: 'greeting',
    label: '再送一份心意',
    phase: '再一次问候',
    note: '一句近况，一张照片，不必重新发起一份礼物。',
  },
  {
    page: 'received',
    label: '心意，在身边',
    phase: '再一次问候',
    note: '新的心意来到相框里，原来的礼物依然在。',
  },
]
export const stickers = [
  ['thanks', '谢谢'],
  ['respect', '致敬'],
  ['happy', '开心每一天'],
  ['peace', '岁岁平安'],
  ['health', '福寿安康'],
  ['miss', '想你'],
]
export function resource(path: string) {
  if (/^(data:|blob:|https?:)/.test(path)) return path
  const embedded = (window as Window & { __DEMO_MEDIA__?: Record<string, string> }).__DEMO_MEDIA__
  return embedded?.[path] || `${import.meta.env.BASE_URL}${path}`
}
export function topics(codes: string[]) {
  const code = codes[0]
  if (['student', 'research_student', 'mentee'].includes(code))
    return ['哪一次，你从紧张变得安心？', '他（她）说过哪句话？', '后来，你把什么传给了别人？']
  if (['leader', 'teacher', 'academic_advisor', 'mentor'].includes(code))
    return ['第一次看见对方独当一面', '曾让你放心的一件事', '你欣赏的变化']
  if (code === 'subordinate')
    return ['第一次得到信任', '被接住的一次失误', '带新人时，你会想起什么？']
  if (
    ['colleague', 'project_partner', 'business_partner', 'client', 'service_partner'].includes(code)
  )
    return ['一起解决过的一个难题', '不在汇报里的小事', '一次难忘的合作']
  if (code === 'spouse') return ['两个人的一个日常习惯', '一起完成的小愿望', '一直记得的一句普通话']
  if (['child', 'grandchild', 'child_in_law'].includes(code))
    return ['家里哪个场景最让你安心？', '一道菜或一个习惯', '长大以后才明白的事']
  if (['parent', 'grandparent', 'parent_in_law'].includes(code))
    return ['第一次看见对方照顾别人', '让你开心的变化', '现在最想对他说什么？']
  return ['你记得的一件小事', '第一次熟悉起来的场景', '一张照片背后的故事']
}
