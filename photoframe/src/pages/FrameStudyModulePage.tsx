import { BookOpenText, CaretLeft, CaretRight, Camera, CheckCircle, Circle, Images, LockKey, MagnifyingGlass, Microphone, MusicNotes, NotePencil, Pause, PencilSimpleLine, Play, Plus, ShieldCheck, Sparkle, TrashSimple, UserFocus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS, RecordingDialog } from '../components/RecordingDialog'
import { getMockFamilyExplorationItems, getMockGalleryPhotos, getMockMembers, getMockStudyModuleById, getMockStudyModules } from '../mock'
import type { FamilyExplorationItem, FamilyMember, GalleryPhoto, StudyItem, StudyModule } from '../types'
import { FAMILY_FILTER_ALL, getFamilyAvatarSrc, getMemberAvatarSrc } from '../utils/familyAvatars'
import { getWishlistPresentation } from '../utils/wishlistPresentation'

const moduleIntros: Record<string, string> = {
  album: '照片区放大到左侧主画面，人物、年代和修复入口都直接浮在照片上。',
  drafts: '草稿像摊在桌上的纸，点哪一张，右边就展开哪一段。',
  recorder: '这里收着最想留住的声音，有孩子们的问候，也有自己讲故事时的原声。',
  shelf: '作品书架换成温暖书柜，整理好的文章会像一本本书一样摆进去。',
  wishlist: '把想去的地方、想见的人、想完成的小心愿都放进愿望清单里。',
  vault: '有些照片和心事先不急着给别人看，可以只留给自己。',
}

const itemActionLabel: Record<string, string> = {
  drafts: '继续写这篇',
  shelf: '打开阅读',
  recorder: '打开回听',
  album: '打开查看',
  wishlist: '看看愿望',
  vault: '验证后查看',
}

type FrameAlbumTab = 'latest' | 'people' | 'place' | 'event' | 'group' | 'object' | 'old-photo'

type FrameAlbumFilter = {
  key: string
  label: string
  category: string
}

type FrameAlbumVoiceState = 'idle' | 'listening' | 'typing' | 'ready'

type FrameRecorderTab = 'latest' | 'family' | 'story' | 'sealed' | 'scene' | 'festival' | 'todo' | 'time'

type FrameWishlistFilter = typeof FAMILY_FILTER_ALL | string

type FrameAmaWishlistView = 'self' | 'family'

type FrameAlbumPhotoDetail = {
  remark: string
  voiceLabel?: string
  tags: string[]
  metadata: string[]
}

type FrameAlbumAiReference = {
  name: string
  url: string
}

const FRAME_ALBUM_PHOTO_POSES = [
  { lift: 0, tilt: 0 },
  { lift: 6, tilt: -1.45 },
  { lift: -3, tilt: 1.2 },
  { lift: 4, tilt: 0 },
  { lift: -5, tilt: -0.9 },
  { lift: 5, tilt: 1.55 },
  { lift: 0, tilt: -0.25 },
  { lift: -4, tilt: 0.85 },
]

const FRAME_ALBUM_TABS: { id: FrameAlbumTab; label: string }[] = [
  { id: 'latest', label: '最新' },
  { id: 'people', label: '人物' },
  { id: 'place', label: '城市' },
  { id: 'event', label: '事件' },
  { id: 'group', label: '合照' },
  { id: 'object', label: '物件' },
  { id: 'old-photo', label: '怀旧' },
]

const FRAME_ALBUM_FILTER_PREFIXES: Record<FrameAlbumTab, string[]> = {
  latest: ['时间'],
  people: ['人物'],
  place: ['城市', '地点'],
  event: ['事件'],
  group: ['合照'],
  object: ['物件', '食物', '衣物'],
  'old-photo': ['怀旧'],
}

const FRAME_ALBUM_SECONDARY_LABELS: Record<FrameAlbumTab, string> = {
  latest: '时间',
  people: '人物',
  place: '城市',
  event: '事件',
  group: '合照',
  object: '物件',
  'old-photo': '怀旧',
}

const AMA_ALBUM_PEOPLE_ORDER = ['叶淑柔', '谢南枝', '郑木生', '郑楚龙', '郑晓伟', '林素琴', '郑楚卿', '郑楚远']
const AMA_ALBUM_DEMO_QUERY = '找晓伟去年带孩子去海边玩的照片'

function getAlbumFilterLabel(category: string) {
  const separatorIndex = category.indexOf('/')
  return separatorIndex >= 0 ? category.slice(separatorIndex + 1) : category
}

function getAlbumPhotoYear(photo: GalleryPhoto) {
  const category = photo.aiCategories?.find((item) => item.startsWith('时间/'))
  if (category) return getAlbumFilterLabel(category)
  const year = new Date(photo.uploadedAt).getFullYear()
  return Number.isFinite(year) ? `${year}年` : ''
}

function getAlbumFilterOptions(photos: GalleryPhoto[], tab: FrameAlbumTab) {
  const categories = new Map<string, FrameAlbumFilter>()
  const prefixes = FRAME_ALBUM_FILTER_PREFIXES[tab]

  photos.forEach((photo) => {
    if (tab === 'latest') {
      const year = getAlbumPhotoYear(photo)
      if (year) categories.set(`时间/${year}`, { key: `时间/${year}`, label: year, category: `时间/${year}` })
      return
    }

    photo.aiCategories?.forEach((category) => {
      if (!prefixes.some((prefix) => category.startsWith(`${prefix}/`))) return
      categories.set(category, { key: category, label: getAlbumFilterLabel(category), category })
    })
  })

  const options = [...categories.values()]
  if (tab === 'people') {
    return options.sort((left, right) => {
      const leftIndex = AMA_ALBUM_PEOPLE_ORDER.indexOf(left.label)
      const rightIndex = AMA_ALBUM_PEOPLE_ORDER.indexOf(right.label)
      if (leftIndex < 0 && rightIndex < 0) return left.label.localeCompare(right.label, 'zh-CN')
      if (leftIndex < 0) return 1
      if (rightIndex < 0) return -1
      return leftIndex - rightIndex
    })
  }
  if (tab === 'latest') {
    return options.sort((left, right) => {
      const leftYear = Number(left.label.replace('年', ''))
      const rightYear = Number(right.label.replace('年', ''))
      if (Number.isFinite(leftYear) && Number.isFinite(rightYear)) return rightYear - leftYear
      if (Number.isFinite(leftYear)) return -1
      if (Number.isFinite(rightYear)) return 1
      return left.label.localeCompare(right.label, 'zh-CN')
    })
  }
  return options.sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'))
}

function photoMatchesAlbumFilter(photo: GalleryPhoto, filter: FrameAlbumFilter) {
  if (filter.category.startsWith('时间/')) return getAlbumPhotoYear(photo) === filter.label
  return Boolean(photo.aiCategories?.includes(filter.category))
}

function parseAmaAlbumQuery(query: string, photos: GalleryPhoto[]) {
  const normalized = query.trim()
  const filters: FrameAlbumFilter[] = []
  const addFilter = (category: string, label = getAlbumFilterLabel(category)) => {
    if (!filters.some((filter) => filter.category === category)) {
      filters.push({ key: category, category, label })
    }
  }

  if (/晓伟/.test(normalized)) addFilter('人物/郑晓伟', '晓伟')
  if (/去年|2025/.test(normalized)) addFilter('时间/2025年', '2025年')
  if (/海边|看海/.test(normalized)) addFilter('地点/海边', '海边')
  if (/出游|出去玩|玩的照片|看海/.test(normalized)) addFilter('事件/出游', '出游')

  photos.forEach((photo) => {
    photo.aiCategories?.forEach((category) => {
      if (category === '人物/孩子' || category === '事件/带孩子') return
      const label = getAlbumFilterLabel(category)
      if (label.length >= 2 && normalized.includes(label)) addFilter(category)
    })
  })

  return {
    filters,
    requiresChildTrip: /带孩子/.test(normalized),
  }
}

const AMA_ALBUM_CITY_BY_PHOTO_ID: Record<string, { title: string; meta: string }> = {
  'gallery-101': { title: '汕头', meta: '骑楼老街、戏院灯牌和阿嫲年轻时走过的街口' },
  'gallery-102': { title: '汕头', meta: '老街榕树下的英歌和正月热闹' },
  'gallery-103': { title: '汕头', meta: '白天的骑楼街、黄包车和茶楼布店' },
  'gallery-104': { title: '汕头', meta: '老宅茶桌边的姐妹和家人' },
  'gallery-105': { title: '汕头', meta: '侨批局门口和等信的日子' },
  'gallery-106': { title: '曼谷', meta: '木生在南洋办事、汇钱和问船期的地方' },
  'gallery-107': { title: '汕头', meta: '潮汕田边树下的年轻心事' },
  'gallery-108': { title: '曼谷', meta: '木生常走过的泰国街口' },
  'gallery-109': { title: '汕头', meta: '1945年扛标旗队伍穿过的老街' },
  'gallery-110': { title: '曼谷', meta: '1952年暹罗唐人街与木生的南洋往事' },
  'gallery-111': { title: '汕头', meta: '老宅留下的旧怀表与AI复原对照' },
  'interaction-gallery-001': { title: '汕头', meta: '老宅院子里的相框和第一条动态' },
  'interaction-gallery-002': { title: '汕头', meta: '老宅厨房里的无米粿和家常味' },
  'interaction-gallery-003': { title: '汕头', meta: '夜里相框前重新听见木生的信' },
  'interaction-gallery-004': { title: '汕头', meta: '老宅院子里晾晒木生旧信' },
  'interaction-gallery-005': { title: '深圳', meta: '晓伟周末运动和城市生活近况' },
  'interaction-gallery-006': { title: '深圳', meta: '晓伟在深圳复刻潮汕蚝烙' },
  'interaction-gallery-007': { title: '汕头', meta: '楚卿想给阿嫲露一手的厨房现场' },
  'interaction-gallery-008': { title: '汕头', meta: '楚卿陪阿嫲逛老街市场' },
  'interaction-gallery-009': { title: '汕头', meta: 'AI生成阿嫲年轻时扛标旗的盛况' },
  'interaction-gallery-010': { title: '汕头', meta: '楚龙回老宅清院子、买单丛' },
  'interaction-gallery-011': { title: '汕头', meta: '老宅杂物间里翻出的旧怀表' },
  'interaction-gallery-012': { title: '曼谷', meta: '南枝从湄南河边发来的木棉花' },
  'interaction-gallery-013': { title: '深圳', meta: '楚远加班夜里的乡味和牵挂' },
  'interaction-gallery-014': { title: '深圳', meta: '素琴在商场给阿嫲挑香云纱' },
  'interaction-gallery-015': { title: '曼谷', meta: '泽华陪南枝逛曼谷唐人街' },
  'interaction-gallery-016': { title: '曼谷', meta: '楚龙发来的暹罗唐人街旧事' },
  'interaction-gallery-017': { title: '深圳', meta: '晓伟一家教孩子第一次包饺子' },
  'interaction-gallery-018': { title: '曼谷', meta: '南枝和泽华在庭院里翻看照片' },
  'interaction-gallery-019': { title: '汕头', meta: '晓伟一家带孩子去海边捡贝壳' },
}

const AMA_ALBUM_NOSTALGIA_GROUPS = [
  {
    id: 'ama-nostalgia-old-street',
    title: '老街旧影',
    meta: '骑楼、戏院、黄包车和英歌锣鼓',
    photoIds: ['gallery-101', 'gallery-102', 'gallery-103', 'gallery-109'],
  },
  {
    id: 'ama-nostalgia-qiaopi',
    title: '侨批与旧信',
    meta: '侨批局、旧信和相框里的木生声音',
    photoIds: ['gallery-105', 'interaction-gallery-003', 'interaction-gallery-004'],
  },
  {
    id: 'ama-nostalgia-nanyang',
    title: '南洋旧场景',
    meta: '木生在泰国办事、走街口的日子',
    photoIds: ['gallery-106', 'gallery-108', 'gallery-110', 'interaction-gallery-015'],
  },
  {
    id: 'ama-nostalgia-youth',
    title: '年轻时候',
    meta: '树下约会、茶桌姐妹和早年的自己',
    photoIds: ['gallery-107', 'gallery-104', 'gallery-102'],
  },
  {
    id: 'ama-nostalgia-old-things',
    title: '老物件',
    meta: '怀表、单丛茶和那些能把人带回去的东西',
    photoIds: ['gallery-111', 'interaction-gallery-011', 'interaction-gallery-010', 'gallery-105'],
  },
]

const FRAME_RECORDER_TABS: { id: FrameRecorderTab; label: string }[] = [
  { id: 'latest', label: '时间' },
  { id: 'family', label: '家人' },
  { id: 'story', label: '故事' },
  { id: 'sealed', label: '待拆封' },
]

const FRAME_AMA_RECORDER_TABS = [
  FRAME_RECORDER_TABS[2],
  FRAME_RECORDER_TABS[0],
  FRAME_RECORDER_TABS[1],
  FRAME_RECORDER_TABS[3],
]

const FRAME_AMA_WISHLIST_POSTERS: Record<FrameAmaWishlistView, { label: string; src: string; alt: string }> = {
  self: {
    label: '我的',
    src: '/scenario/ama-letter/wishlist/ama-wishlist-self.png',
    alt: '阿嫲自己的心愿清单，包含听潮剧、喝南场亲手泡的茶、穿白旗袍等心愿。',
  },
  family: {
    label: '全家',
    src: '/scenario/ama-letter/wishlist/ama-wishlist-family.png',
    alt: '家人的拾光计划，包含拍全家福、看海和邮轮、给南枝带糖葱薄饼等计划。',
  },
}

const FRAME_ALBUM_PHOTO_DETAILS: Record<string, FrameAlbumPhotoDetail> = {
  'gallery-001': {
    remark: '知夏说这是小满晚饭前画好的，还特意把我的茶杯画在餐桌中间。她说小满画完以后一直举着给大家看，弟弟也在旁边凑热闹，问太婆看到会不会笑。',
    voiceLabel: '外孙女语音 12秒',
    tags: ['孩子作品', '餐桌记忆', '外孙女', '适合回忆录'],
    metadata: ['2026年5月27日', '上传人：外孙女知夏', 'AI识别：2个孩子、画纸、餐桌'],
  },
  'gallery-002': {
    remark: '嘉禾说今天照着我以前写的菜谱做菜，大家边做边想起以前家里的味道。他还说孩子们边帮忙边问当年外婆怎么调馅，饭桌上聊了好一会儿。',
    voiceLabel: '儿子语音 9秒',
    tags: ['厨房', '家常菜', '儿子嘉禾', '家庭日常'],
    metadata: ['2026年5月26日', '上传人：儿子嘉禾', 'AI识别：厨房、餐具、家人协作'],
  },
  'gallery-003': {
    remark: '两个孩子已经收好小书包，说周末要带着画和橘子来看我。知夏说他们一路上都在商量要给太婆讲什么，怕到时候一高兴又忘了。',
    tags: ['周末探望', '孩子们', '亲情互动', '近期'],
    metadata: ['2026年5月24日', '上传人：外孙女知夏', 'AI识别：书包、门口、儿童'],
  },
  'gallery-004': {
    remark: '这张像老屋下午三点的光，茶杯和相框都在原来的位置。拍的时候还特意留了窗边那束花，像以前家里有人来做客前会慢慢收拾好的样子。',
    voiceLabel: '本人备注 16秒',
    tags: ['老屋', '客厅', '茶桌', '空间记忆'],
    metadata: ['2026年5月20日', '上传人：儿子嘉禾', 'AI识别：客厅、茶杯、相框'],
  },
  'gallery-005': {
    remark: '这是年轻时候第一次认真拍合影，那天回家后把照片看了很久。那时候拍照不容易，一张照片要放进相册里反复看，连衣服和站姿都记得很清楚。',
    tags: ['年轻时候', '老照片', '夫妻合影', '可修复'],
    metadata: ['原片约1978年', '来源：老相册电子化', 'AI识别：双人人像、胶片纹理'],
  },
  'gallery-009': {
    remark: '旧相册第一页一直舍不得换位置，里面每张照片都有那时家里的味道。翻到这一页时，会想起老桌子、台灯和那几年大家围在一起看照片的声音。',
    voiceLabel: '本人备注 21秒',
    tags: ['旧相册', '老照片', '泛黄照片', '待整理'],
    metadata: ['原片约1980年代', '上传人：儿子嘉禾', 'AI识别：相册、纸质照片、桌面'],
  },
  'gallery-010': {
    remark: '那时候拍照很少笑得这么自然，看到这张就想起照相馆门口的风。拍完以后还舍不得马上回家，站在街边说了好一阵那天的天气。',
    tags: ['年轻时候', '人像', '老照片修复', '个人回忆'],
    metadata: ['原片约1970年代', '上传人：外孙女知夏', 'AI识别：人像、胶片、室内光'],
  },
}

const FRAME_RECORDER_TAPE_POSES = [
  { lift: 0, tilt: 0 },
  { lift: 5, tilt: -1.2 },
  { lift: -4, tilt: 1.15 },
  { lift: 3, tilt: 0 },
  { lift: -5, tilt: -0.8 },
  { lift: 4, tilt: 1.35 },
]

const FRAME_RECORDER_TAPE_COLORS = [
  { body: '#DDEADA', accent: '#5F7B68', label: '#FFF8EC' },
  { body: '#F2D9C8', accent: '#9A6657', label: '#FFF9F0' },
  { body: '#D8E5F0', accent: '#566F86', label: '#FFF9EF' },
  { body: '#EFE0B8', accent: '#8A7044', label: '#FFF8E7' },
  { body: '#E6DDF0', accent: '#736287', label: '#FFF9F2' },
  { body: '#D9E1D7', accent: '#6C7661', label: '#FFF8EC' },
]

function getFrameAlbumPhotoDetail(photo: GalleryPhoto): FrameAlbumPhotoDetail {
  if (photo.metadataSummary || photo.aiCategories?.length) {
    const formattedDate = new Date(photo.uploadedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    return {
      remark: photo.voiceNoteText || photo.metadataSummary || `这张《${photo.title}》已经由 AI 归入相册，会结合人物、地点和时间继续整理。`,
      voiceLabel: photo.voiceNoteDurationSeconds ? `语音备注 ${photo.voiceNoteDurationSeconds}秒` : undefined,
      tags: photo.aiCategories || ['自动分类'],
      metadata: [
        formattedDate,
        `上传人：${photo.uploadedByName}`,
        photo.aiTitle ? `AI标题：${photo.aiTitle}` : `AI识别：${photo.alt}`,
      ],
    }
  }

  return FRAME_ALBUM_PHOTO_DETAILS[photo.id] || {
    remark: `这张《${photo.title}》上传时留下了简短备注，AI 会结合画面、时间、人物和讲述内容继续归档。以后再翻到这张照片时，不只看到画面，也能想起当时家人为什么想把它留下来。`,
    tags: ['自动分类', photo.uploadedByName, photo.isCached ? '相框播放中' : '待精选'],
    metadata: [
      new Date(photo.uploadedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
      `上传人：${photo.uploadedByName}`,
      `AI识别：${photo.alt}`,
    ],
  }
}

function getAlbumCategoryValue(photo: GalleryPhoto, prefix: string) {
  const category = photo.aiCategories?.find((item) => item.startsWith(`${prefix}/`))
  return category?.slice(prefix.length + 1)
}

function groupAlbumPhotosByCategory(photos: GalleryPhoto[], prefix: string, fallbackTitle: string, fallbackMeta: string, limit = 8) {
  const groups = new Map<string, GalleryPhoto[]>()

  photos.forEach((photo) => {
    const value = getAlbumCategoryValue(photo, prefix)
    if (!value) return
    const current = groups.get(value) || []
    current.push(photo)
    groups.set(value, current)
  })

  const sortedGroups = [...groups.entries()]
    .sort(([, leftPhotos], [, rightPhotos]) => rightPhotos.length - leftPhotos.length)
    .map(([title, groupPhotos]) => ({
      id: `${prefix}-${title}`,
      title,
      meta: `${groupPhotos.length} 张照片`,
      photos: groupPhotos.slice(0, limit),
    }))

  if (sortedGroups.length) return sortedGroups

  return [
    {
      id: `${prefix}-fallback`,
      title: fallbackTitle,
      meta: fallbackMeta,
      photos: photos.slice(0, limit),
    },
  ]
}

function pickAlbumPhotosByIds(photos: GalleryPhoto[], ids: string[]) {
  return ids.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is GalleryPhoto => Boolean(photo))
}

function getAmaAlbumCityGroups(photos: GalleryPhoto[]) {
  const groups = new Map<string, { meta: string; photos: GalleryPhoto[] }>()

  photos.forEach((photo) => {
    const city = AMA_ALBUM_CITY_BY_PHOTO_ID[photo.id]
    if (!city) return
    const current = groups.get(city.title) || { meta: city.meta, photos: [] }
    current.photos.push(photo)
    groups.set(city.title, current)
  })

  const cityOrder = ['汕头', '深圳', '曼谷']
  return cityOrder
    .map((cityName) => {
      const group = groups.get(cityName)
      if (!group) return null

      return {
        id: `ama-city-${cityName}`,
        title: cityName,
        meta: group.meta,
        photos: group.photos,
      }
    })
    .filter((group): group is { id: string; title: string; meta: string; photos: GalleryPhoto[] } => Boolean(group))
}

function getAmaAlbumNostalgiaGroups(photos: GalleryPhoto[]) {
  return AMA_ALBUM_NOSTALGIA_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    meta: group.meta,
    photos: pickAlbumPhotosByIds(photos, group.photoIds),
  })).filter((group) => group.photos.length > 0)
}

function getFrameAlbumGeneratedPhoto(prompt: string, reference: FrameAlbumAiReference | null): GalleryPhoto {
  const isAmaLetter = getActiveScenarioId() === 'ama-letter'
  const cleanPrompt = prompt.trim()
  const generatedTitle = cleanPrompt
    ? `AI生成：${cleanPrompt.slice(0, 12)}${cleanPrompt.length > 12 ? '…' : ''}`
    : 'AI生成照片'

  return {
    id: `ai-generated-gallery-${Date.now()}`,
    url: isAmaLetter ? '/scenario/ama-letter/photos/ama-frame-memory.png' : '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    alt: cleanPrompt || 'AI根据描述生成的相册照片',
    title: generatedTitle,
    uploadedAt: new Date().toISOString(),
    uploadedById: 'ai-image-generator',
    uploadedByName: 'AI生图',
    isCached: true,
    voiceNoteDurationSeconds: 16,
    voiceNoteText: reference
      ? `这张是根据“${reference.name}”作为参考图生成的。描述里说：${cleanPrompt || '希望补出一张适合放进相册的回忆照片'}。`
      : `这张是根据文字描述生成的。描述里说：${cleanPrompt || '希望补出一张适合放进相册的回忆照片'}。`,
    aiTitle: cleanPrompt || 'AI生成的回忆照片',
    aiCategories: isAmaLetter
      ? ['AI生图', '城市/汕头', '怀旧/AI复原', '事件/回忆补图']
      : ['AI生图', '怀旧/AI复原', '事件/回忆补图'],
    metadataSummary: reference
      ? `AI根据文字描述和参考图《${reference.name}》生成，用于补足相册里的回忆画面。`
      : 'AI根据文字描述生成，用于补足相册里的回忆画面。',
  }
}

function getFrameAlbumGroups(photos: GalleryPhoto[], tab: FrameAlbumTab) {
  const isAmaLetter = getActiveScenarioId() === 'ama-letter'

  if (tab === 'latest') {
    return [
      { id: 'latest-week', title: '最近一周', meta: '刚传进来的照片', photos: photos.slice(0, 3) },
      { id: 'latest-month', title: '这个月', meta: '家里慢慢存下来的日常', photos: photos.slice(3, 9) },
      { id: 'latest-earlier', title: '更早', meta: '旧照片和早些时候的回忆', photos: photos.slice(9, 15) },
    ]
  }

  if (tab === 'people') {
    return groupAlbumPhotosByCategory(photos, '人物', '家人照片', '按人物自动归档')
  }

  if (tab === 'place') {
    if (isAmaLetter) {
      return getAmaAlbumCityGroups(photos)
    }

    return groupAlbumPhotosByCategory(photos, '地点', '生活城市', '按城市自动归档')
  }

  if (tab === 'event') {
    return groupAlbumPhotosByCategory(photos, '事件', '生活事件', '按事件自动归档')
  }

  if (tab === 'group') {
    return groupAlbumPhotosByCategory(photos, '合照', '合照', '多人照片自动归档')
  }

  if (tab === 'object') {
    const objectGroups = [
      ...groupAlbumPhotosByCategory(photos, '物件', '老物件', '按物件自动归档'),
      ...groupAlbumPhotosByCategory(photos, '食物', '家常味道', '饭菜和厨房记忆'),
      ...groupAlbumPhotosByCategory(photos, '衣物', '衣物', '衣服和穿戴记忆'),
    ]
    const seen = new Set<string>()
    return objectGroups.filter((group) => {
      if (seen.has(group.id)) return false
      seen.add(group.id)
      return group.photos.length > 0
    })
  }

  if (isAmaLetter) {
    return getAmaAlbumNostalgiaGroups(photos)
  }

  return groupAlbumPhotosByCategory(photos, '老照片', '怀旧照片', '早年照片自动归档')
}

function getFrameRecorderItems(module: StudyModule): StudyItem[] {
  if (getActiveScenarioId() === 'ama-letter') return module.items

  if (getActiveScenarioId() !== 'ama-letter') {
    const extraItems: StudyItem[] = [
      { id: 'voice-4', title: '除夕夜大家一起笑', summary: '32 秒', note: '饭桌上大家同时说话，后来孩子们还补了一句祝福。', meta: '节日团圆', durationSeconds: 32, type: 'voice', updatedAt: '2月9日' },
      { id: 'voice-5', title: '我讲老屋门前那棵树', summary: '74 秒', note: '讲到小时候乘凉、邻居搬凳子聊天，还有夏天的蝉声。', meta: '故事原声', durationSeconds: 74, type: 'voice', updatedAt: '1月18日' },
      { id: 'voice-6', title: '厨房里切菜和炖汤声', summary: '28 秒', note: '儿媳说这是周末做饭时录下来的，听起来很像家里。', meta: '生活声景', durationSeconds: 28, type: 'voice', updatedAt: '1月6日' },
      { id: 'voice-7', title: '小满背第一首古诗', summary: '16 秒', note: '有几个字念得含糊，但特别认真，最后还问太婆听见没有。', meta: '孩子声音', durationSeconds: 16, type: 'voice', updatedAt: '12月22日' },
      { id: 'voice-8', title: '清晨公园里的鸟叫', summary: '24 秒', note: '散步时顺手录的，旁边还有推车经过和人打招呼的声音。', meta: '生活声景', durationSeconds: 24, type: 'voice', updatedAt: '12月3日' },
      { id: 'voice-9', title: '没讲完的冬衣故事', summary: '58 秒', note: '已经讲到给孩子们量尺寸，后面还可以继续补一段。', meta: '待整理', durationSeconds: 58, type: 'voice', updatedAt: '11月16日' },
      { id: 'voice-10', title: '女儿发来的晚安', summary: '10 秒', note: '很短的一句晚安，但每次听都像她就在旁边。', meta: '家人问候', durationSeconds: 10, type: 'voice', updatedAt: '10月31日' },
      { id: 'voice-11', title: '生日歌的最后一句', summary: '21 秒', note: '孩子们唱到最后笑场了，蛋糕蜡烛刚好被吹灭。', meta: '节日团圆', durationSeconds: 21, type: 'voice', updatedAt: '9月28日' },
    ]

    return [...module.items, ...extraItems]
  }

  return module.items
}

function getFrameRecorderGroups(tapes: StudyItem[], tab: FrameRecorderTab) {
  const byMeta = (meta: string) => tapes.filter((item) => item.meta === meta)
  const pick = (ids: string[]) => ids.map((id) => tapes.find((item) => item.id === id)).filter((item): item is StudyItem => Boolean(item))
  const sealedTapes = tapes.filter((item) => item.sealed)
  const isAmaLetter = getActiveScenarioId() === 'ama-letter'

  if (tab === 'latest') {
    if (isAmaLetter) {
      const recentTapes = tapes.filter((item) => !/20\d{2}年/.test(item.updatedAt)).slice(0, 4)
      const previousTapes = tapes.filter((item) => !recentTapes.some((recentTape) => recentTape.id === item.id))
      const years = Array.from(new Set(previousTapes.map((item) => item.updatedAt.match(/20\d{2}年/)?.[0]).filter((year): year is string => Boolean(year))))
        .sort((a, b) => Number(b.replace('年', '')) - Number(a.replace('年', '')))

      return [
        { id: 'recorder-recent', title: '最近', tapes: recentTapes },
        ...years.map((year) => ({
          id: `recorder-year-${year}`,
          title: year,
          tapes: previousTapes.filter((item) => item.updatedAt.includes(year)),
        })),
      ]
    }

    return [
      { id: 'recorder-recent', title: '最近收进来', tapes: tapes.slice(0, 6) },
      { id: 'recorder-earlier', title: '早些时候', tapes: tapes.slice(6) },
    ]
  }

  if (tab === 'family') {
    if (isAmaLetter) {
      return [
        { id: 'recorder-family-musheng', title: '写给木生', tapes: byMeta('木生') },
        { id: 'recorder-family-nanzhi', title: '写给南枝', tapes: byMeta('南枝') },
        { id: 'recorder-family-xiaowei', title: '写给晓伟', tapes: byMeta('晓伟') },
        { id: 'recorder-family-whole', title: '写给全家', tapes: [...byMeta('家族'), ...byMeta('家书')] },
      ]
    }

    return [
      { id: 'recorder-family-greeting', title: '家人问候', tapes: [...byMeta('家人问候'), ...pick(['voice-7'])] },
      { id: 'recorder-family-far', title: '远方声音', tapes: byMeta('远方声音') },
      { id: 'recorder-family-kids', title: '孩子声音', tapes: byMeta('孩子声音') },
    ]
  }

  if (tab === 'story') {
    if (isAmaLetter) {
      return [
        { id: 'recorder-story-advice', title: '人生叮嘱', tapes: byMeta('人生叮嘱') },
        { id: 'recorder-story-family', title: '家族记忆', tapes: byMeta('家族') },
        { id: 'recorder-story-love', title: '婚姻与新生', tapes: byMeta('婚姻与新生') },
        { id: 'recorder-story-self', title: '自我回望', tapes: byMeta('自我回望') },
        { id: 'recorder-story-letter', title: '留给未来', tapes: byMeta('家书') },
      ]
    }

    return [
      { id: 'recorder-story-original', title: '故事原声', tapes: byMeta('故事原声') },
      { id: 'recorder-story-memory', title: '适合整理成回忆录', tapes: pick(['voice-3', 'voice-5', 'voice-9']) },
    ]
  }

  if (tab === 'sealed') {
    return [
      { id: 'recorder-sealed-upcoming', title: '待拆封', tapes: sealedTapes },
    ]
  }

  if (tab === 'time') {
    if (isAmaLetter) {
      return [
        { id: 'recorder-time-this-week', title: '本周', tapes: tapes.slice(0, 5) },
        { id: 'recorder-time-june', title: '六月', tapes: tapes.slice(5) },
      ]
    }

    return [
      { id: 'recorder-scene-home', title: '家里的声音', tapes: byMeta('生活声景') },
      { id: 'recorder-scene-outside', title: '外面的声音', tapes: pick(['voice-8', 'voice-2']) },
    ]
  }

  return [
    { id: 'recorder-todo-unfinished', title: '待补充', tapes: byMeta('待整理') },
    { id: 'recorder-todo-ai', title: 'AI建议整理', tapes: pick(['voice-3', 'voice-5', 'voice-9']) },
  ]
}

function getModuleIcon(moduleId: string) {
  const moduleIcons = {
    album: Images,
    drafts: NotePencil,
    recorder: MusicNotes,
    shelf: BookOpenText,
    wishlist: Sparkle,
    vault: LockKey,
  } as const
  return moduleIcons[moduleId as keyof typeof moduleIcons] || BookOpenText
}

function FrameStudyModuleVisual({
  module,
  item,
  selectedItemId,
  onSelectItem,
  onContinueWrite,
  isVaultUnlocked,
}: {
  module: StudyModule
  item: StudyItem
  selectedItemId: string | undefined
  onSelectItem: (itemId: string) => void
  onContinueWrite: () => void
  isVaultUnlocked?: boolean
}) {
  const ModuleIcon = getModuleIcon(module.id)

  if (module.id === 'album') {
    return (
      <div className="frame-study-module-visual frame-study-module-visual--album">
        <img src={item.photoUrl || module.coverUrl} alt="" />
        <div>
          <span>{item.meta || '照片归档'}</span>
          <strong>{item.title}</strong>
          <small>人物识别 · 年代候选 · 老照片修复</small>
        </div>
      </div>
    )
  }

  if (module.id === 'drafts') {
    return (
      <div className="frame-study-module-visual frame-study-module-visual--drafts">
        <div className="frame-study-draft-desk__surface">
          <div className="frame-study-draft-desk__heading">
            <div>
              <span>书桌草稿</span>
              <strong>点一张草稿，右侧看内容</strong>
            </div>
            <NotePencil size={36} weight="duotone" />
          </div>
          <div className="frame-study-draft-paper-stage">
            {module.items.map((draft, index) => (
              <button
                className={draft.id === selectedItemId ? 'is-active' : ''}
                key={draft.id}
                type="button"
                onClick={() => onSelectItem(draft.id)}
                style={{ ['--draft-index' as string]: index }}
              >
                <span>
                  <i />
                  自动保存
                </span>
                <strong>{draft.title}</strong>
                <p>{draft.note || draft.summary}</p>
              </button>
            ))}
          </div>
          <div className="frame-study-draft-desk__actions">
            <button type="button" onClick={() => onSelectItem(item.id)}>整理标题</button>
            <button type="button" onClick={onContinueWrite}>继续写</button>
          </div>
        </div>
      </div>
    )
  }

  if (module.id === 'recorder') {
    return (
      <div className="frame-study-module-visual frame-study-module-visual--recorder">
        <MusicNotes size={62} weight="duotone" />
        <strong>{item.durationSeconds || 12} 秒</strong>
        <p>{item.title}</p>
        <div className="frame-study-module-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    )
  }

  if (module.id === 'shelf') {
    const referenceBooks = [
      { id: 'ref-1', title: '毛泽东选集', meta: '红皮精装' },
      { id: 'ref-2', title: '资本论', meta: '旧版精读' },
      { id: 'ref-3', title: '家庭相册', meta: '照片归档' },
    ]
    const shelfBooks = [...module.items, ...referenceBooks]

    return (
      <div className="frame-study-module-visual frame-study-module-visual--shelf">
        <div className="frame-study-bookshelf">
          {[0, 1].map((rowIndex) => (
            <div className="frame-study-bookshelf__row" key={rowIndex}>
              {shelfBooks.slice(rowIndex * 4, rowIndex * 4 + 4).map((book, bookIndex) => {
                const isWork = 'summary' in book
                const isActive = isWork && book.id === selectedItemId

                return (
                  <button
                    className={isActive ? 'is-active' : ''}
                    key={book.id}
                    type="button"
                    onClick={() => {
                      if (isWork) {
                        onSelectItem(book.id)
                      }
                    }}
                  >
                    <span />
                    <strong>{book.title}</strong>
                    <small>{book.meta || (bookIndex % 2 === 0 ? '个人作品' : '旧版精读')}</small>
                  </button>
                )
              })}
              {rowIndex === 1 ? <em>新作品成册后会放到这里</em> : null}
            </div>
          ))}
        </div>
        <div className="frame-study-bookshelf__caption">
          <strong>{item.title}</strong>
          <small>{item.meta || '个人作品'}</small>
        </div>
      </div>
    )
  }

  if (module.id === 'vault') {
    return (
      <div className="frame-study-module-visual frame-study-module-visual--vault">
        <div className={isVaultUnlocked ? 'frame-study-vault-safe is-unlocked' : 'frame-study-vault-safe'}>
          <LockKey size={72} weight="fill" />
          <strong>{isVaultUnlocked ? '已临时解锁' : '人脸识别保护'}</strong>
          <p>{isVaultUnlocked ? item.title : '里面的照片、录音和心里话，只给自己慢慢看。'}</p>
          <small>{isVaultUnlocked ? '本次演示中可查看内容' : '面向相框后进入保险箱'}</small>
        </div>
      </div>
    )
  }

  return (
    <div className="frame-study-module-visual frame-study-module-visual--wishlist">
      <div className="frame-study-wishlist-board">
        <div className="frame-study-wishlist-bottle">
          <ModuleIcon size={64} weight="duotone" />
          <strong>愿望清单</strong>
          <small>慢慢一起实现</small>
        </div>
        <div className="frame-study-wish-cards">
          {module.items.map((wish) => (
            <button className={wish.id === selectedItemId ? 'is-active' : ''} key={wish.id} type="button" onClick={() => onSelectItem(wish.id)}>
              <span>{wish.meta || wish.summary}</span>
              <strong>{wish.title}</strong>
              <p>{wish.note || wish.summary}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function FramePersonalAlbumPage({
  onBack,
  mode,
  module,
}: {
  onBack: () => void
  mode: ReturnType<typeof useFrameDisplayMode>['mode']
  module: StudyModule
}) {
  const isAmaLetter = getActiveScenarioId() === 'ama-letter'
  const [albumTab, setAlbumTab] = useState<FrameAlbumTab>('latest')
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null)
  const [isManaging, setIsManaging] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [photos, setPhotos] = useState(() => getMockGalleryPhotos())
  const [albumSearchQuery, setAlbumSearchQuery] = useState('')
  const [albumSearchText, setAlbumSearchText] = useState('')
  const [albumFilters, setAlbumFilters] = useState<FrameAlbumFilter[]>([])
  const [requiresChildTrip, setRequiresChildTrip] = useState(false)
  const [albumVoiceState, setAlbumVoiceState] = useState<FrameAlbumVoiceState>('idle')
  const albumVoiceDelayRef = useRef<number | null>(null)
  const albumVoiceTypingRef = useRef<number | null>(null)
  const [aiImageDialogOpen, setAiImageDialogOpen] = useState(false)
  const [aiImagePrompt, setAiImagePrompt] = useState('')
  const [aiImageReference, setAiImageReference] = useState<FrameAlbumAiReference | null>(null)
  const [aiImageGenerating, setAiImageGenerating] = useState(false)
  const [aiPromptRecording, setAiPromptRecording] = useState(false)
  const [aiPromptRecordingStartedAt, setAiPromptRecordingStartedAt] = useState<number | null>(null)
  const [aiPromptRecordingSeconds, setAiPromptRecordingSeconds] = useState(0)
  const aiPromptRecordingStartedAtRef = useRef(0)
  const aiReferenceInputRef = useRef<HTMLInputElement>(null)
  const albumFilterOptions = isAmaLetter ? getAlbumFilterOptions(photos, albumTab) : []
  const hasAlbumFilters = albumFilters.length > 0 || Boolean(albumSearchText) || requiresChildTrip
  const filteredPhotos = hasAlbumFilters
    ? photos.filter((photo) => {
        if (!albumFilters.every((filter) => photoMatchesAlbumFilter(photo, filter))) return false
        if (requiresChildTrip && !photo.aiCategories?.includes('事件/带孩子')) return false
        if (!albumSearchText) return true
        const searchableText = [
          photo.title,
          photo.alt,
          photo.aiTitle,
          photo.voiceNoteText,
          photo.metadataSummary,
          ...(photo.aiCategories || []),
        ].filter(Boolean).join(' ')
        return searchableText.includes(albumSearchText)
      })
    : photos
  const groups = hasAlbumFilters
    ? [{ id: 'album-filter-results', title: '筛选结果', meta: `共 ${filteredPhotos.length} 张`, photos: filteredPhotos }]
    : getFrameAlbumGroups(photos, albumTab)
  const visiblePhotos = groups.flatMap((group) => group.photos)
  const activeDetail = activePhoto ? getFrameAlbumPhotoDetail(activePhoto) : null
  const activePhotoIndex = activePhoto ? visiblePhotos.findIndex((photo) => photo.id === activePhoto.id) : -1
  const selectedCount = selectedPhotoIds.length

  useEffect(() => {
    if (!aiPromptRecordingStartedAt) return undefined
    const timer = window.setInterval(() => {
      setAiPromptRecordingSeconds(Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.floor((Date.now() - aiPromptRecordingStartedAt) / 1000))))
    }, 220)
    return () => window.clearInterval(timer)
  }, [aiPromptRecordingStartedAt])

  useEffect(() => () => {
    if (aiImageReference?.url.startsWith('blob:')) {
      URL.revokeObjectURL(aiImageReference.url)
    }
  }, [aiImageReference])

  useEffect(() => () => {
    if (albumVoiceDelayRef.current !== null) window.clearTimeout(albumVoiceDelayRef.current)
    if (albumVoiceTypingRef.current !== null) window.clearInterval(albumVoiceTypingRef.current)
  }, [])

  const toggleManageMode = () => {
    setIsManaging((current) => {
      if (current) {
        setSelectedPhotoIds([])
      }
      return !current
    })
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((current) => (
      current.includes(photoId)
        ? current.filter((id) => id !== photoId)
        : [...current, photoId]
    ))
  }

  const showAdjacentPhoto = (direction: -1 | 1) => {
    if (!visiblePhotos.length || activePhotoIndex < 0) return
    const nextIndex = (activePhotoIndex + direction + visiblePhotos.length) % visiblePhotos.length
    setActivePhoto(visiblePhotos[nextIndex])
  }

  const deleteSelectedPhotos = () => {
    if (!selectedCount) return
    setPhotos((current) => current.filter((photo) => !selectedPhotoIds.includes(photo.id)))
    setSelectedPhotoIds([])
  }

  const clearAlbumFilters = () => {
    setAlbumSearchQuery('')
    setAlbumSearchText('')
    setAlbumFilters([])
    setRequiresChildTrip(false)
  }

  const toggleAlbumFilter = (filter: FrameAlbumFilter) => {
    setAlbumSearchText('')
    setAlbumFilters((current) => (
      current.some((item) => item.key === filter.key)
        ? current.filter((item) => item.key !== filter.key)
        : [...current, filter]
    ))
  }

  const submitAlbumSearch = (query: string) => {
    const cleanQuery = query.trim()
    if (!cleanQuery) {
      clearAlbumFilters()
      return
    }

    const parsed = parseAmaAlbumQuery(cleanQuery, photos)
    setAlbumSearchQuery(cleanQuery)
    setAlbumFilters(parsed.filters)
    setRequiresChildTrip(parsed.requiresChildTrip)
    setAlbumSearchText(parsed.filters.length || parsed.requiresChildTrip ? '' : cleanQuery)
  }

  const clearAlbumVoiceTimers = () => {
    if (albumVoiceDelayRef.current !== null) {
      window.clearTimeout(albumVoiceDelayRef.current)
      albumVoiceDelayRef.current = null
    }
    if (albumVoiceTypingRef.current !== null) {
      window.clearInterval(albumVoiceTypingRef.current)
      albumVoiceTypingRef.current = null
    }
  }

  const beginAlbumVoiceTyping = () => {
    clearAlbumVoiceTimers()
    setAlbumVoiceState('typing')
    setAlbumSearchQuery('')
    let nextLength = 0
    albumVoiceTypingRef.current = window.setInterval(() => {
      nextLength += 1
      setAlbumSearchQuery(AMA_ALBUM_DEMO_QUERY.slice(0, nextLength))
      if (nextLength >= AMA_ALBUM_DEMO_QUERY.length) {
        if (albumVoiceTypingRef.current !== null) window.clearInterval(albumVoiceTypingRef.current)
        albumVoiceTypingRef.current = null
        setAlbumVoiceState('ready')
      }
    }, 90)
  }

  const handleAlbumVoiceButton = () => {
    if (albumVoiceState === 'idle') {
      clearAlbumVoiceTimers()
      setAlbumSearchQuery('')
      setAlbumVoiceState('listening')
      albumVoiceDelayRef.current = window.setTimeout(beginAlbumVoiceTyping, 3000)
      return
    }
    clearAlbumVoiceTimers()
    setAlbumVoiceState('idle')
  }

  const openAiImageDialog = () => {
    setActivePhoto(null)
    setIsManaging(false)
    setSelectedPhotoIds([])
    setAiImageDialogOpen(true)
  }

  const closeAiImageDialog = () => {
    if (aiImageGenerating) return
    setAiImageDialogOpen(false)
    setAiPromptRecording(false)
    setAiPromptRecordingStartedAt(null)
  }

  const startAiPromptRecording = () => {
    setAiPromptRecording(true)
    setAiPromptRecordingSeconds(0)
    aiPromptRecordingStartedAtRef.current = Date.now()
    setAiPromptRecordingStartedAt(aiPromptRecordingStartedAtRef.current)
  }

  const stopAiPromptRecording = (shouldKeep: boolean) => {
    setAiPromptRecording(false)
    setAiPromptRecordingStartedAt(null)
    if (!shouldKeep) return

    setAiImagePrompt((current) => (
      current.trim()
        ? current
        : '帮我生成一张老宅茶桌边，家人围坐喝工夫茶的回忆照片。'
    ))
  }

  const handleAiReferenceSelected = (input: HTMLInputElement) => {
    const file = input.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAiImageReference((current) => {
      if (current?.url.startsWith('blob:')) {
        URL.revokeObjectURL(current.url)
      }
      return { name: file.name, url }
    })
    input.value = ''
  }

  const removeAiReference = () => {
    setAiImageReference((current) => {
      if (current?.url.startsWith('blob:')) {
        URL.revokeObjectURL(current.url)
      }
      return null
    })
  }

  const generateAiPhoto = () => {
    if (aiImageGenerating || (!aiImagePrompt.trim() && !aiImageReference)) return
    setAiImageGenerating(true)
    window.setTimeout(() => {
      const generatedPhoto = getFrameAlbumGeneratedPhoto(aiImagePrompt, aiImageReference)
      setPhotos((current) => [generatedPhoto, ...current])
      setAlbumTab('latest')
      clearAlbumFilters()
      setActivePhoto(generatedPhoto)
      setAiImageGenerating(false)
      setAiImageDialogOpen(false)
      setAiImagePrompt('')
      removeAiReference()
    }, 1200)
  }

  const albumSearchControl = isAmaLetter ? (
    <section className="frame-study-album-search" aria-label="搜索照片">
      <form
        className="frame-study-album-search__form"
        onSubmit={(event) => {
          event.preventDefault()
          clearAlbumVoiceTimers()
          setAlbumVoiceState('idle')
          submitAlbumSearch(albumSearchQuery)
        }}
      >
        <div className={albumVoiceState === 'idle' ? 'frame-study-album-search__field' : 'frame-study-album-search__field is-voice-active'}>
          <MagnifyingGlass size={24} weight="bold" aria-hidden="true" />
          <div className="frame-study-album-search__input-wrap">
            <input
              value={albumSearchQuery}
              type="search"
              aria-label={albumVoiceState === 'listening' ? '请说话' : '输入人物、时间、地点或事情搜索照片'}
              placeholder={albumVoiceState === 'listening' || albumVoiceState === 'typing' ? '' : '搜索照片'}
              readOnly={albumVoiceState !== 'idle'}
              onChange={(event) => setAlbumSearchQuery(event.target.value)}
            />
            {albumVoiceState === 'listening' ? (
              <span className="frame-study-album-search__listening" aria-hidden="true">
                请说话
                <span className="frame-study-album-search__dots">
                  <i>.</i><i>.</i><i>.</i>
                </span>
              </span>
            ) : null}
          </div>
          <button
            className={albumVoiceState === 'idle' ? 'frame-study-album-search__voice' : 'frame-study-album-search__voice is-active'}
            type="button"
            onClick={handleAlbumVoiceButton}
          >
            {albumVoiceState === 'idle' ? <Microphone size={22} weight="fill" aria-hidden="true" /> : null}
            {albumVoiceState === 'idle' ? '说话' : '完成'}
          </button>
        </div>
        <button className="frame-study-album-search__submit" type="submit" disabled={albumVoiceState === 'listening' || albumVoiceState === 'typing'}>查找</button>
      </form>
    </section>
  ) : null

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-study-module-page frame-study-album-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={onBack} aria-label="返回个人书房">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>{module.title}</h1>
        {albumSearchControl}
      </header>
      <main className="frame-study-album-layout">
        <section className="frame-study-album-browser" aria-label="个人相册分类">
          <div className="frame-study-album-controls">
            <section className={isAmaLetter ? 'frame-study-album-filter-panel' : undefined} aria-label="照片筛选">
              <div className="frame-study-album-filter-level frame-study-album-filter-level--primary">
                {isAmaLetter ? <strong className="frame-study-album-filter-level__title">照片分类</strong> : null}
                <div className="frame-study-album-browser__top">
                  <div className="frame-study-album-tabs" role="tablist" aria-label="相册分类">
                    {FRAME_ALBUM_TABS.map((tab) => (
                      <button
                        className={albumTab === tab.id ? 'frame-study-album-tab is-active' : 'frame-study-album-tab'}
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={albumTab === tab.id}
                        onClick={() => setAlbumTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isAmaLetter && albumFilterOptions.length ? (
                <div className="frame-study-album-filter-level frame-study-album-filter-level--secondary">
                  <strong className="frame-study-album-subfilters__title">{FRAME_ALBUM_SECONDARY_LABELS[albumTab]}</strong>
                  <div className="frame-study-album-subfilters" role="group" aria-label={`${FRAME_ALBUM_TABS.find((tab) => tab.id === albumTab)?.label || ''}筛选标签`}>
                    {albumFilterOptions.map((filter) => {
                      const isSelected = albumFilters.some((item) => item.key === filter.key)
                      return (
                        <button
                          className={isSelected ? 'is-active' : ''}
                          key={filter.key}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleAlbumFilter(filter)}
                        >
                          {filter.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {isAmaLetter && hasAlbumFilters ? (
                <section className="frame-study-album-filter-summary" aria-label="当前照片筛选条件">
                  <strong className="frame-study-album-filter-level__title">已选条件</strong>
                  <div className="frame-study-album-filter-chips">
                    {albumFilters.map((filter) => (
                      <button key={filter.key} type="button" aria-label={`移除${filter.label}条件`} onClick={() => toggleAlbumFilter(filter)}>
                        {filter.label}
                        <X size={19} weight="bold" aria-hidden="true" />
                      </button>
                    ))}
                    {albumSearchText ? <span>“{albumSearchText}”</span> : null}
                  </div>
                  <div className="frame-study-album-filter-summary__result">
                    <button className="frame-study-album-filter-summary__clear" type="button" onClick={clearAlbumFilters}>清除全部</button>
                  </div>
                </section>
              ) : null}
            </section>
          </div>
          <div className="frame-study-album-groups">
            {visiblePhotos.length ? groups.map((group, groupIndex) => (
              <section className="frame-study-album-group" key={group.id} aria-label={group.title}>
                <div className="frame-study-album-group__heading">
                  <h2>{group.title}</h2>
                </div>
                <div className="frame-study-album-grid">
                  {group.photos.map((photo, photoIndex) => {
                    const pose = FRAME_ALBUM_PHOTO_POSES[(photoIndex + groupIndex * 2) % FRAME_ALBUM_PHOTO_POSES.length]

                    return (
                    <button
                      className={[
                        'frame-study-album-photo',
                        isManaging ? 'is-managing' : '',
                        selectedPhotoIds.includes(photo.id) ? 'is-selected' : '',
                      ].filter(Boolean).join(' ')}
                      key={`${group.id}-${photo.id}`}
                      style={{
                        ['--album-photo-tilt' as string]: `${pose.tilt}deg`,
                        ['--album-photo-lift' as string]: `${pose.lift}px`,
                      }}
                      type="button"
                      aria-pressed={isManaging ? selectedPhotoIds.includes(photo.id) : undefined}
                      onClick={() => {
                        if (isManaging) {
                          togglePhotoSelection(photo.id)
                          return
                        }
                        setActivePhoto(photo)
                      }}
                    >
                      <img src={photo.url} alt={photo.alt} />
                      <span>{photo.title}</span>
                      {isManaging ? <i className="frame-study-album-photo__check" aria-hidden="true" /> : null}
                    </button>
                    )
                  })}
                </div>
              </section>
            )) : (
              <div className="frame-study-album-empty">
                <MagnifyingGlass size={46} weight="duotone" aria-hidden="true" />
                <strong>暂时没有找到符合条件的照片</strong>
                <button type="button" onClick={clearAlbumFilters}>清除条件</button>
              </div>
            )}
          </div>
          <div className={isManaging ? 'frame-study-album-floating-actions is-managing' : 'frame-study-album-floating-actions'} aria-label={isManaging ? '照片编辑操作' : '照片快捷操作'}>
            {isManaging ? (
              <>
                <button className="frame-study-album-floating-actions__secondary" type="button" onClick={toggleManageMode}>
                  <X size={27} weight="bold" aria-hidden="true" />
                  取消
                </button>
                <button className="frame-study-album-floating-actions__danger" type="button" disabled={selectedCount === 0} onClick={deleteSelectedPhotos}>
                  <TrashSimple size={27} weight="bold" aria-hidden="true" />
                  删除{selectedCount ? ` ${selectedCount}` : ''}
                </button>
              </>
            ) : (
              <>
                <button type="button">
                  <Plus size={29} weight="bold" aria-hidden="true" />
                  添加
                </button>
                <button type="button" onClick={toggleManageMode}>
                  <PencilSimpleLine size={28} weight="bold" aria-hidden="true" />
                  编辑
                </button>
                <button type="button" onClick={openAiImageDialog}>
                  <Sparkle size={28} weight="bold" aria-hidden="true" />
                  AI生图
                </button>
              </>
            )}
          </div>
        </section>
      </main>
      {activePhoto && activeDetail ? (
        <div className="frame-study-album-detail-overlay" role="presentation" onClick={() => setActivePhoto(null)}>
          <section className="frame-study-album-detail" role="dialog" aria-modal="true" aria-label={`${activePhoto.title}详情`} onClick={(event) => event.stopPropagation()}>
            <button className="frame-study-album-detail__side-action frame-study-album-detail__side-action--prev" type="button" aria-label="上一张照片" onClick={() => showAdjacentPhoto(-1)}>
              <span>上一张</span>
            </button>
            <button className="frame-study-album-detail__side-action frame-study-album-detail__side-action--next" type="button" aria-label="下一张照片" onClick={() => showAdjacentPhoto(1)}>
              <span>下一张</span>
            </button>
            <button className="frame-study-album-detail__close" type="button" aria-label="关闭照片详情" onClick={() => setActivePhoto(null)}>
              <X size={30} weight="bold" aria-hidden="true" />
            </button>
            <figure className="frame-study-album-detail__photo">
              <img className="frame-study-album-detail__backdrop" src={activePhoto.url} alt="" aria-hidden="true" />
              <img className="frame-study-album-detail__image" src={activePhoto.url} alt={activePhoto.alt} />
            </figure>
            <aside className="frame-study-album-detail__info">
              <h2>{activePhoto.title}</h2>
              <button className="frame-study-album-detail__voice" type="button" aria-label={`播放照片备注语音 ${activeDetail.voiceLabel || '12秒'}`}>
                <span>
                  <Play size={20} weight="fill" aria-hidden="true" />
                </span>
                <strong>{activeDetail.voiceLabel || '语音备注 12秒'}</strong>
              </button>
              <p>{activeDetail.remark}</p>
            </aside>
          </section>
        </div>
      ) : null}

      {aiImageDialogOpen ? (
        <div className="frame-study-ai-image-overlay" role="presentation" onClick={closeAiImageDialog}>
          <section className="frame-study-ai-image-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-study-ai-image-title" onClick={(event) => event.stopPropagation()}>
            <header className="frame-study-ai-image-dialog__header">
              <h2 id="frame-study-ai-image-title">AI生图</h2>
              <button type="button" aria-label="关闭AI生图" onClick={closeAiImageDialog}>
                <X size={30} weight="bold" aria-hidden="true" />
              </button>
            </header>

            <section className="frame-study-ai-image-body" aria-label="AI生图描述">
              <div className="frame-study-ai-image-field">
                <textarea
                  value={aiImagePrompt}
                  rows={4}
                  aria-label="描述你想补进相册的画面"
                  placeholder="描述你想补进相册的画面，比如：老宅茶桌边，阿嫲和家人围坐喝工夫茶，窗外有午后的光。"
                  onChange={(event) => setAiImagePrompt(event.target.value)}
                />

                <div className="frame-study-ai-image-field__actions">
                  <button type="button" onClick={startAiPromptRecording} disabled={aiImageGenerating}>
                    <Microphone size={24} weight="bold" aria-hidden="true" />
                    点击说话
                  </button>
                </div>
              </div>

              {aiImageReference ? (
                <div className="frame-study-ai-reference is-ready">
                    <img src={aiImageReference.url} alt="" />
                    <div>
                      <strong>{aiImageReference.name}</strong>
                      <span>已作为参考图</span>
                    </div>
                    <button
                      type="button"
                      aria-label="移除参考图"
                      onClick={removeAiReference}
                    >
                      <X size={22} weight="bold" aria-hidden="true" />
                    </button>
                </div>
              ) : (
                <button
                  className="frame-study-ai-reference"
                  type="button"
                  onClick={() => aiReferenceInputRef.current?.click()}
                  disabled={aiImageGenerating}
                >
                    <span className="frame-study-ai-reference__plus" aria-hidden="true">
                      <Plus size={30} weight="bold" />
                    </span>
                    <div>
                      <strong>添加参考图</strong>
                      <span>可选，AI会照着图里的人、老物件或老宅样子来生成。</span>
                    </div>
                </button>
              )}
            </section>

            <input
              ref={aiReferenceInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => handleAiReferenceSelected(event.currentTarget)}
            />

            <footer className="frame-study-ai-image-dialog__actions">
              <button className="is-primary" type="button" disabled={aiImageGenerating || (!aiImagePrompt.trim() && !aiImageReference)} onClick={generateAiPhoto}>
                <Sparkle size={26} weight="duotone" aria-hidden="true" />
                {aiImageGenerating ? '生成中' : '生成'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {aiPromptRecording ? (
        <RecordingDialog
          recordingSeconds={aiPromptRecordingSeconds}
          onCancel={() => stopAiPromptRecording(false)}
          onConfirm={() => stopAiPromptRecording(true)}
        />
      ) : null}
    </FramePageShell>
  )
}

function FramePersonalRecorderPage({
  onBack,
  mode,
  module,
}: {
  onBack: () => void
  mode: ReturnType<typeof useFrameDisplayMode>['mode']
  module: StudyModule
}) {
  const isAmaLetter = getActiveScenarioId() === 'ama-letter'
  const recorderTabs = isAmaLetter ? FRAME_AMA_RECORDER_TABS : FRAME_RECORDER_TABS
  const [recorderTab, setRecorderTab] = useState<FrameRecorderTab>(() => isAmaLetter ? 'story' : 'latest')
  const [isManaging, setIsManaging] = useState(false)
  const [selectedTapeIds, setSelectedTapeIds] = useState<string[]>([])
  const [activeTape, setActiveTape] = useState<StudyItem | null>(null)
  const [playingTapeId, setPlayingTapeId] = useState<string | null>(null)
  const [tapes, setTapes] = useState(() => getFrameRecorderItems(module))
  const groups = getFrameRecorderGroups(tapes, recorderTab).filter((group) => group.tapes.length > 0)
  const selectedCount = selectedTapeIds.length
  const activeTapeDuration = activeTape?.durationSeconds ? `${activeTape.durationSeconds} 秒` : activeTape?.summary
  const activeTapeLocked = Boolean(activeTape?.sealed)

  const toggleManageMode = () => {
    setIsManaging((current) => {
      if (current) {
        setSelectedTapeIds([])
      } else {
        setActiveTape(null)
        setPlayingTapeId(null)
      }
      return !current
    })
  }

  const toggleTapeSelection = (tapeId: string) => {
    setSelectedTapeIds((current) => (
      current.includes(tapeId)
        ? current.filter((id) => id !== tapeId)
        : [...current, tapeId]
    ))
  }

  const deleteSelectedTapes = () => {
    if (!selectedCount) return
    setTapes((current) => current.filter((tape) => !selectedTapeIds.includes(tape.id)))
    setSelectedTapeIds([])
    if (activeTape && selectedTapeIds.includes(activeTape.id)) {
      setActiveTape(null)
      setPlayingTapeId(null)
    }
  }

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-study-module-page frame-study-album-page frame-study-recorder-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={onBack} aria-label="返回个人书房">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>{module.title}</h1>
        <div className="frame-study-album-top-actions" aria-hidden="true" />
      </header>
      <main className="frame-study-album-layout frame-study-recorder-layout">
        <section className="frame-study-album-browser frame-study-recorder-browser" aria-label="岁月留声机分类">
          <div className="frame-study-album-browser__top">
            <div className="frame-study-album-tabs frame-study-recorder-tabs" role="tablist" aria-label="录音分类">
              {recorderTabs.map((tab) => (
                <button
                  className={[
                    'frame-study-album-tab frame-study-recorder-tab',
                    tab.id === 'sealed' ? 'frame-study-recorder-tab--sealed' : '',
                    recorderTab === tab.id ? 'is-active' : '',
                  ].filter(Boolean).join(' ')}
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={recorderTab === tab.id}
                  onClick={() => setRecorderTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="frame-study-album-groups frame-study-recorder-groups">
            {groups.map((group, groupIndex) => (
              <section className="frame-study-album-group frame-study-recorder-group" key={group.id} aria-label={group.title}>
                <div className="frame-study-album-group__heading">
                  <h2>{group.title}</h2>
                </div>
                <div className="frame-study-recorder-grid">
                  {group.tapes.map((tape, tapeIndex) => {
                    const pose = FRAME_RECORDER_TAPE_POSES[(tapeIndex + groupIndex * 2) % FRAME_RECORDER_TAPE_POSES.length]
                    const color = FRAME_RECORDER_TAPE_COLORS[(tapeIndex + groupIndex) % FRAME_RECORDER_TAPE_COLORS.length]
                    const tapeColor = tape.sealed ? { body: '#DEDEDA', accent: '#8A8A84', label: '#F2F0EA' } : color
                    const duration = tape.sealed ? tape.unlockLabel || '待拆封' : tape.durationSeconds ? `${tape.durationSeconds}秒` : tape.summary

                    return (
                      <button
                        className={[
                          'frame-study-recorder-tape',
                          tape.sealed ? 'is-sealed' : '',
                          isManaging ? 'is-managing' : '',
                          selectedTapeIds.includes(tape.id) ? 'is-selected' : '',
                        ].filter(Boolean).join(' ')}
                        key={`${group.id}-${tape.id}`}
                        style={{
                          ['--tape-body' as string]: tapeColor.body,
                          ['--tape-accent' as string]: tapeColor.accent,
                          ['--tape-label' as string]: tapeColor.label,
                          ['--tape-tilt' as string]: `${pose.tilt}deg`,
                          ['--tape-lift' as string]: `${pose.lift}px`,
                        }}
                        type="button"
                        aria-pressed={isManaging ? selectedTapeIds.includes(tape.id) : undefined}
                        onClick={() => {
                          if (isManaging) {
                            toggleTapeSelection(tape.id)
                            return
                          }
                          setActiveTape(tape)
                          setPlayingTapeId(null)
                        }}
                      >
                        <span className="frame-study-recorder-tape__body" aria-hidden="true">
                          <span className="frame-study-recorder-tape__reels">
                            <i />
                            <em />
                            <i />
                          </span>
                          {tape.sealed ? (
                            <span className="frame-study-recorder-tape__sealed-mark">
                              <LockKey size={18} weight="bold" aria-hidden="true" />
                              待拆封
                            </span>
                          ) : null}
                        </span>
                        <span className="frame-study-recorder-tape__caption">
                          <strong>{tape.title}</strong>
                          <small>{duration}</small>
                        </span>
                        {isManaging ? <i className="frame-study-album-photo__check frame-study-recorder-tape__check" aria-hidden="true" /> : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className={isManaging ? 'frame-study-album-floating-actions frame-study-recorder-floating-actions is-managing' : 'frame-study-album-floating-actions frame-study-recorder-floating-actions'} aria-label={isManaging ? '录音编辑操作' : '录音快捷操作'}>
            {isManaging ? (
              <>
                <button className="frame-study-album-floating-actions__secondary" type="button" onClick={toggleManageMode}>
                  <X size={27} weight="bold" aria-hidden="true" />
                  取消
                </button>
                <button className="frame-study-album-floating-actions__danger" type="button" disabled={selectedCount === 0} onClick={deleteSelectedTapes}>
                  <TrashSimple size={27} weight="bold" aria-hidden="true" />
                  删除{selectedCount ? ` ${selectedCount}` : ''}
                </button>
              </>
            ) : (
              <>
                <button type="button">
                  <Plus size={29} weight="bold" aria-hidden="true" />
                  添加
                </button>
                <button type="button" onClick={toggleManageMode}>
                  <PencilSimpleLine size={28} weight="bold" aria-hidden="true" />
                  编辑
                </button>
              </>
            )}
          </div>
        </section>
      </main>
      {activeTape ? (
        <div className="frame-study-recorder-player-overlay" role="presentation" onClick={() => {
          setActiveTape(null)
          setPlayingTapeId(null)
        }}>
          <section className="frame-study-recorder-player" role="dialog" aria-modal="true" aria-label={`${activeTape.title}播放`} onClick={(event) => event.stopPropagation()}>
            <button className="frame-study-album-detail__close frame-study-recorder-player__close" type="button" aria-label="关闭录音播放" onClick={() => {
              setActiveTape(null)
              setPlayingTapeId(null)
            }}>
              <X size={30} weight="bold" aria-hidden="true" />
            </button>
            <div
              className={activeTapeLocked ? 'frame-study-recorder-player__tape is-sealed' : 'frame-study-recorder-player__tape'}
              style={{
                ['--tape-body' as string]: FRAME_RECORDER_TAPE_COLORS[tapes.findIndex((tape) => tape.id === activeTape.id) % FRAME_RECORDER_TAPE_COLORS.length]?.body || '#DDEADA',
                ['--tape-accent' as string]: FRAME_RECORDER_TAPE_COLORS[tapes.findIndex((tape) => tape.id === activeTape.id) % FRAME_RECORDER_TAPE_COLORS.length]?.accent || '#5F7B68',
                ['--tape-label' as string]: FRAME_RECORDER_TAPE_COLORS[tapes.findIndex((tape) => tape.id === activeTape.id) % FRAME_RECORDER_TAPE_COLORS.length]?.label || '#FFF8EC',
              }}
            >
              <div className="frame-study-recorder-player__reels">
                <i />
                {activeTapeLocked ? (
                  <span className="frame-study-recorder-player__lock" aria-label="待拆封">
                    <LockKey size={58} weight="bold" aria-hidden="true" />
                  </span>
                ) : (
                  <button
                    className={playingTapeId === activeTape.id ? 'frame-study-recorder-player__play is-playing' : 'frame-study-recorder-player__play'}
                    type="button"
                    aria-label={playingTapeId === activeTape.id ? '暂停录音' : '播放录音'}
                    onClick={() => setPlayingTapeId((current) => current === activeTape.id ? null : activeTape.id)}
                  >
                    {playingTapeId === activeTape.id ? <Pause size={54} weight="fill" aria-hidden="true" /> : <Play size={54} weight="fill" aria-hidden="true" />}
                  </button>
                )}
                <i />
              </div>
            </div>
            <div className="frame-study-recorder-player__content">
              <span>{activeTapeLocked ? activeTape.unlockLabel || activeTape.updatedAt : activeTape.updatedAt}<small>{activeTapeDuration}</small></span>
              <h2>{activeTape.title}</h2>
              {activeTapeLocked ? (
                <p>{activeTape.sealedHint || '这段声音还没到约定的时刻。到了那一天，拾光叙会提醒家人一起打开。'}</p>
              ) : activeTape.note ? <p>{activeTape.note}</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </FramePageShell>
  )
}

function getFrameWishlistFilterItems(items: FamilyExplorationItem[], filter: FrameWishlistFilter) {
  if (filter === FAMILY_FILTER_ALL) return items.filter((item) => item.ownerType === 'family')
  return items.filter((item) => item.ownerId === filter)
}

function getFrameWishlistVisibility(item: FamilyExplorationItem) {
  if (item.status === 'completed') return 'family'
  return item.visibility || (item.ownerType === 'elder' && item.status === 'wish' ? 'private' : 'family')
}

function getFrameWishlistOwnerLabel(filter: FrameWishlistFilter, members: FamilyMember[], elderMember?: FamilyMember) {
  if (filter === FAMILY_FILTER_ALL) return '全家'
  if (filter === elderMember?.id) return elderMember.relation.includes('阿') ? elderMember.relation : '我的'
  return members.find((member) => member.id === filter)?.relation || '家人'
}

function getFrameWishlistFilters(members: FamilyMember[], items: FamilyExplorationItem[]) {
  const elderMember = members.find((member) => member.role === 'elder') || members[0]
  const itemOwnerIds = new Set(items.map((item) => item.ownerId))
  const memberFilters = members
    .filter((member) => member.id !== elderMember?.id && itemOwnerIds.has(member.id))
    .map((member) => member.id)
  return {
    elderMember,
    filters: [elderMember?.id, FAMILY_FILTER_ALL, ...memberFilters].filter(Boolean) as FrameWishlistFilter[],
  }
}

function groupFrameWishlistItems(items: FamilyExplorationItem[]) {
  return [
    { id: 'todo', title: '待完成', items: items.filter((item) => item.status !== 'completed') },
    { id: 'completed', title: '已完成', items: items.filter((item) => item.status === 'completed') },
  ]
}

function FrameWishCard({
  item,
  showVisibility,
  onToggleComplete,
  onToggleVisibility,
}: {
  item: FamilyExplorationItem
  showVisibility: boolean
  onToggleComplete: () => void
  onToggleVisibility: () => void
}) {
  const isCompleted = item.status === 'completed'
  const visibility = getFrameWishlistVisibility(item)
  const { Icon, tone } = getWishlistPresentation(item)
  return (
    <article className={isCompleted ? 'frame-wishlist-card frame-wishlist-card--completed' : 'frame-wishlist-card'}>
      <span className={`frame-wishlist-card__icon frame-wishlist-card__icon--${tone}`} aria-hidden="true">
        <Icon size={34} weight="duotone" />
      </span>
      <div className="frame-wishlist-card__copy">
        <strong>{item.title}</strong>
        {!isCompleted && showVisibility ? (
          <button
            className={visibility === 'family' ? 'frame-wishlist-card__visibility is-family' : 'frame-wishlist-card__visibility'}
            type="button"
            onClick={onToggleVisibility}
            aria-label={`切换${item.title}的可见范围`}
          >
            {visibility === 'family' ? '家人可见' : '仅自己看'}
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <button
        className="frame-wishlist-card__check"
        type="button"
        aria-label={isCompleted ? `恢复${item.title}为待完成` : `标记${item.title}为已完成`}
        onClick={onToggleComplete}
      >
        {isCompleted ? <CheckCircle size={46} weight="fill" /> : <Circle size={46} weight="regular" />}
      </button>
    </article>
  )
}

function FrameAmaWishlistPosterPage({
  onBack,
  mode,
}: {
  onBack: () => void
  mode: ReturnType<typeof useFrameDisplayMode>['mode']
}) {
  const [activeView, setActiveView] = useState<FrameAmaWishlistView>('self')
  const activePoster = FRAME_AMA_WISHLIST_POSTERS[activeView]

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-wishlist-page frame-wishlist-page--poster frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav frame-wishlist-poster-topbar">
        <button className="frame-memory-back-button" type="button" onClick={onBack} aria-label="返回个人书房">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <nav className="frame-wishlist-poster-tabs" aria-label="切换愿望清单">
          {(Object.keys(FRAME_AMA_WISHLIST_POSTERS) as FrameAmaWishlistView[]).map((view) => (
            <button
              className={activeView === view ? 'is-active' : ''}
              key={view}
              type="button"
              aria-pressed={activeView === view}
              onClick={() => setActiveView(view)}
            >
              {FRAME_AMA_WISHLIST_POSTERS[view].label}
            </button>
          ))}
        </nav>
        <span className="frame-wishlist-poster-spacer" aria-hidden="true" />
      </header>

      <main className="frame-wishlist-poster-layout">
        <section className="frame-wishlist-poster-scroll" aria-label={`${activePoster.label}愿望清单`}>
          <img src={activePoster.src} alt={activePoster.alt} draggable={false} />
        </section>
      </main>
    </FramePageShell>
  )
}

function FrameWishlistPage({
  onBack,
  mode,
}: {
  onBack: () => void
  mode: ReturnType<typeof useFrameDisplayMode>['mode']
}) {
  const isAmaScenario = getActiveScenarioId() === 'ama-letter'
  return isAmaScenario ? <FrameAmaWishlistPosterPage onBack={onBack} mode={mode} /> : <FrameWishlistCardsPage onBack={onBack} mode={mode} />
}

function FrameWishlistCardsPage({
  onBack,
  mode,
}: {
  onBack: () => void
  mode: ReturnType<typeof useFrameDisplayMode>['mode']
}) {
  const [items, setItems] = useState<FamilyExplorationItem[]>(() => getMockFamilyExplorationItems())
  const [recording, setRecording] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recordingStartedAtRef = useRef(0)
  const members = getMockMembers()
  const { elderMember, filters: wishlistFilters } = getFrameWishlistFilters(members, items)
  const [activeFilter, setActiveFilter] = useState<FrameWishlistFilter>(elderMember?.id || FAMILY_FILTER_ALL)
  const visibleItems = getFrameWishlistFilterItems(items, activeFilter)
  const groupedItems = groupFrameWishlistItems(visibleItems)

  useEffect(() => {
    setItems(getMockFamilyExplorationItems())
    setActiveFilter(elderMember?.id || FAMILY_FILTER_ALL)
  }, [elderMember?.id])

  useEffect(() => {
    if (!recordingStartedAt) return undefined
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000))))
    }, 220)
    return () => window.clearInterval(timer)
  }, [recordingStartedAt])

  const toggleWishStatus = (itemId: string) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId
        ? {
          ...item,
          status: item.status === 'completed' ? 'wish' : 'completed',
          statusLabel: item.status === 'completed' ? '想做' : '已完成',
        }
        : item
    )))
  }

  const toggleWishVisibility = (itemId: string) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId
        ? {
          ...item,
          visibility: getFrameWishlistVisibility(item) === 'family' ? 'private' : 'family',
        }
        : item
    )))
  }

  const startVoiceRecording = () => {
    setRecording(true)
    setRecordingSeconds(0)
    recordingStartedAtRef.current = Date.now()
    setRecordingStartedAt(recordingStartedAtRef.current)
  }

  const stopVoiceRecording = (shouldKeep: boolean) => {
    const rawDurationSeconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
    const durationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
    setRecording(false)
    setRecordingStartedAt(null)
    if (!shouldKeep) return

    const activeMember = activeFilter === FAMILY_FILTER_ALL ? undefined : members.find((member) => member.id === activeFilter)
    const isElderFilter = activeFilter === elderMember?.id
    const ownerName = activeFilter === FAMILY_FILTER_ALL ? '全家' : activeMember?.name || elderMember?.name || '家人'
    setItems((currentItems) => [{
      id: `frame-wish-voice-${Date.now()}`,
      ownerId: activeFilter === FAMILY_FILTER_ALL ? 'family' : activeFilter,
      ownerName,
      ownerType: activeFilter === FAMILY_FILTER_ALL ? 'family' : isElderFilter ? 'elder' : 'member',
      title: `刚刚语音记录的愿望`,
      summary: `${durationSeconds}秒语音`,
      reason: '',
      category: '语音愿望',
      status: 'wish',
      statusLabel: '想做',
      visibility: isElderFilter ? 'private' : 'family',
      participantNames: [ownerName],
      nextStep: '',
      dateLabel: '刚刚',
      photoUrl: '',
    }, ...currentItems])
  }

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-wishlist-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={onBack} aria-label="返回个人书房">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>愿望清单</h1>
        <button className="frame-wishlist-add-button" type="button" onClick={startVoiceRecording} aria-label="语音新增愿望">
          <Plus size={24} weight="bold" aria-hidden="true" />
          <span>语音</span>
        </button>
      </header>

      <main className="frame-wishlist-layout">
        <nav className="frame-wishlist-people" aria-label="选择愿望清单对象">
          {wishlistFilters.map((filter) => {
            const member = filter === FAMILY_FILTER_ALL ? undefined : members.find((item) => item.id === filter)
            const avatarSrc = filter === FAMILY_FILTER_ALL ? getFamilyAvatarSrc() : getMemberAvatarSrc(filter)
            return (
              <button
                className={activeFilter === filter ? 'is-active' : ''}
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                <span className="frame-wishlist-people__avatar">
                  {avatarSrc ? <img src={avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member?.avatar}
                </span>
                <strong>{getFrameWishlistOwnerLabel(filter, members, elderMember)}</strong>
              </button>
            )
          })}
        </nav>

        <section className="frame-wishlist-groups" aria-label="愿望内容">
          {groupedItems.map((group) => (
            <section className="frame-wishlist-group" key={group.id} aria-label={group.title}>
              <header>
                <h2>{group.title}</h2>
              </header>
              <div className="frame-wishlist-list">
                {group.items.length > 0 ? group.items.map((item) => (
                  <FrameWishCard
                    key={item.id}
                    item={item}
                    showVisibility={activeFilter === elderMember?.id}
                    onToggleComplete={() => toggleWishStatus(item.id)}
                    onToggleVisibility={() => toggleWishVisibility(item.id)}
                  />
                )) : (
                  <p className="frame-wishlist-empty">暂时还没有</p>
                )}
              </div>
            </section>
          ))}
        </section>
      </main>

      {recording ? (
        <RecordingDialog
          recordingSeconds={recordingSeconds}
          onCancel={() => stopVoiceRecording(false)}
          onConfirm={() => stopVoiceRecording(true)}
        />
      ) : null}
    </FramePageShell>
  )
}

export function FrameStudyModulePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { mode } = useFrameDisplayMode()
  const module = getMockStudyModuleById(id || '') || getMockStudyModules()[0]
  const [selectedItemId, setSelectedItemId] = useState(module.items[0]?.id)
  const [vaultUnlocked] = useState(false)
  const [vaultDialogOpen, setVaultDialogOpen] = useState(false)
  const selectedItem = module.items.find((entry) => entry.id === selectedItemId) || module.items[0]

  useEffect(() => {
    setSelectedItemId(module.items[0]?.id)
    if (module.id === 'vault') {
      setVaultDialogOpen(true)
    }
  }, [module.id, module.items])

  if (module.id === 'album') {
    return <FramePersonalAlbumPage mode={mode} module={module} onBack={() => navigate(withScenario('/frame/study'))} />
  }

  if (module.id === 'recorder') {
    return <FramePersonalRecorderPage mode={mode} module={module} onBack={() => navigate(withScenario('/frame/study'))} />
  }

  if (module.id === 'wishlist') {
    return <FrameWishlistPage mode={mode} onBack={() => navigate(withScenario('/frame/study'))} />
  }

  const openSelectedItem = () => {
    if (!selectedItem) return
    if (module.id === 'vault' && !vaultUnlocked) {
      setVaultDialogOpen(true)
      return
    }
    navigate(withScenario(`/frame/study/module/${module.id}/item/${selectedItem.id}`))
  }

  return (
    <FramePageShell className={`frame-space-page frame-study-page frame-study-module-page frame-light-nav-page frame-study-module-page--${module.id}`} mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario('/frame/study'))} aria-label="返回个人书房">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>{module.title}</h1>
      </header>
      <main className="frame-study-module-workspace">
        <section className="frame-study-module-stage" aria-label={`${module.title}功能区`}>
          <div className="frame-study-module-stage__heading">
            <span>{module.description}</span>
            <h2>{module.title}</h2>
            <p>{moduleIntros[module.id] || module.intro || module.description}</p>
          </div>
          {selectedItem ? (
            <FrameStudyModuleVisual
              item={selectedItem}
              module={module}
              onContinueWrite={() => navigate(withScenario('/frame/study/write'))}
              onSelectItem={setSelectedItemId}
              isVaultUnlocked={vaultUnlocked}
              selectedItemId={selectedItem.id}
            />
          ) : null}
          <div className="frame-study-module-stage__tools">
            <button type="button" onClick={() => navigate(withScenario('/frame/study/write'))}>
              <Sparkle size={25} weight="duotone" />
              让小叙帮我整理
            </button>
            <button type="button" onClick={() => navigate(withScenario('/frame/study/module/album'))}>
              <Camera size={25} weight="duotone" />
              添加照片
            </button>
          </div>
        </section>
        <aside className="frame-study-module-browser" aria-label={`${module.title}内容浏览`}>
          {selectedItem ? (
            <section className="frame-study-item-preview" aria-label="当前选中">
              <span>当前选中</span>
              <strong>{selectedItem.title}</strong>
              <small>{selectedItem.meta || selectedItem.summary}</small>
              <p>{selectedItem.note || selectedItem.summary}</p>
              <div>
                <button type="button" onClick={openSelectedItem}>
                  {itemActionLabel[module.id] || '打开查看'}
                </button>
                <button type="button" onClick={() => navigate(withScenario('/frame/study/write'))}>
                  标记优先整理
                </button>
              </div>
            </section>
          ) : null}

          <section className="frame-study-item-list frame-study-item-list--workspace" aria-label="里面的内容">
            {module.items.map((item) => (
              <button
                className={item.id === selectedItem?.id ? 'is-active' : ''}
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
              >
                <span>{item.updatedAt}</span>
                <strong>{item.title}</strong>
                <p>{item.note || item.summary}</p>
                <small>点选后在上方预览</small>
              </button>
            ))}
          </section>
        </aside>
      </main>
      {vaultDialogOpen ? (
        <div className="frame-study-vault-overlay" role="presentation" onClick={() => setVaultDialogOpen(false)}>
          <section className="frame-study-vault-dialog" role="dialog" aria-modal="true" aria-label="私密保险箱解锁" onClick={(event) => event.stopPropagation()}>
            <ShieldCheck size={54} weight="fill" />
            <h2>私密保险箱</h2>
            <p>请面向相框进行人脸识别</p>
            <div className="frame-study-vault-face" aria-hidden="true">
              <UserFocus size={118} weight="duotone" />
            </div>
            <div className="frame-study-vault-actions">
              <button type="button" onClick={() => {
                setVaultDialogOpen(false)
                navigate(withScenario('/frame/study'))
              }}>返回</button>
            </div>
          </section>
        </div>
      ) : null}
    </FramePageShell>
  )
}

export function FrameStudyItemPage() {
  const navigate = useNavigate()
  const { id, itemId } = useParams()
  const { mode } = useFrameDisplayMode()
  const module = getMockStudyModuleById(id || '') || getMockStudyModules()[0]
  const item = module.items.find((entry) => entry.id === itemId) || module.items[0]

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-study-item-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withScenario(`/frame/study/module/${module.id}`))} aria-label="返回模块">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <h1>{item.title}</h1>
      </header>
      <main className="frame-study-item-detail-layout">
        <article className="frame-study-item-reading">
          <span>{module.title}</span>
          <h2>{item.title}</h2>
          <small>{item.meta || item.summary} · {item.updatedAt}</small>
          <img src={item.photoUrl || module.coverUrl} alt="" />
          {module.id === 'recorder' ? (
            <div className="frame-study-item-voice">
              <Microphone size={28} weight="fill" />
              <strong>{item.durationSeconds || 12} 秒原声</strong>
              <div className="frame-study-module-wave" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          ) : null}
          <p>{item.note || item.summary}</p>
          <p>
            {module.id === 'vault'
              ? '这份内容暂时只放在私密保险箱里。它未必适合马上分享，但先被安静地保存下来，也是一种认真对待回忆的方式。'
              : module.id === 'recorder'
                ? '声音比照片更能把人一下子带回去。这段录音可以反复回听，也能一键整理成文字稿。'
                : '这条内容已经收在个人书房里。以后如果想，它还可以继续整理成更完整的故事，再放进回忆录或分享给家人。'}
          </p>
        </article>
        <aside className="frame-space-panel frame-study-item-actions">
          <button type="button" onClick={() => navigate(withScenario('/frame/river'))}>放进回忆录继续整理</button>
          <button type="button" onClick={() => navigate(withScenario('/frame/family'))}>分享给家人看看</button>
          <button type="button" onClick={() => navigate(withScenario('/frame/ai'))}>叫小叙帮我整理</button>
        </aside>
      </main>
    </FramePageShell>
  )
}
