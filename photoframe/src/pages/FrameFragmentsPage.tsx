import {
  BookOpenText,
  CaretLeft,
  CheckSquare,
  FileText,
  Images,
  MagnifyingGlass,
  Microphone,
  Pause,
  PencilSimpleLine,
  Play,
  Plus,
  TrashSimple,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockFragmentContentItems, getMockGalleryPhotos } from '../mock'
import type { FragmentContentItem, FragmentContentKind, GalleryPhoto } from '../types'
import { withFrameVariant } from '../utils/frameVariant'

const CONTENT_TYPES: { id: 'all' | FragmentContentKind; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'photo', label: '照片' },
  { id: 'voice', label: '录音' },
  { id: 'file', label: '文件' },
  { id: 'work', label: '作品' },
]

type FragmentCategory = 'time' | 'people' | 'place' | 'event' | 'group' | 'object' | 'nostalgia'
type ActiveFragmentKind = 'all' | FragmentContentKind

interface SelectedFragmentFilter {
  kind: ActiveFragmentKind
  category: FragmentCategory
  value: string
}

const FRAGMENT_CATEGORIES: { id: FragmentCategory; label: string; detailLabel: string }[] = [
  { id: 'time', label: '时间', detailLabel: '时间' },
  { id: 'people', label: '人物', detailLabel: '人物' },
  { id: 'place', label: '地点', detailLabel: '地点' },
  { id: 'event', label: '事件', detailLabel: '事件' },
  { id: 'group', label: '合照', detailLabel: '合照' },
  { id: 'object', label: '物件', detailLabel: '物件' },
  { id: 'nostalgia', label: '怀旧', detailLabel: '主题' },
]

const CATEGORY_PREFIXES: Record<FragmentCategory, string[]> = {
  time: ['时间'],
  people: ['人物'],
  place: ['城市', '地点'],
  event: ['事件', '节日'],
  group: ['合照'],
  object: ['物件', '食物', '衣物'],
  nostalgia: ['怀旧'],
}

const KIND_LABELS: Record<FragmentContentKind, string> = {
  photo: '照片',
  voice: '录音',
  file: '文件',
  work: '作品',
}

const FRAGMENT_DISPLAY_YEAR = 2026

const FRAGMENT_CARD_POSES = [
  { lift: 0, tilt: 0 },
  { lift: 4, tilt: -1.1 },
  { lift: -2, tilt: 0.9 },
  { lift: 3, tilt: 0 },
  { lift: -3, tilt: -0.7 },
  { lift: 4, tilt: 1.15 },
]

const FRAGMENT_VOICE_PALETTES = [
  { body: '#dce9d9', accent: '#5f7b68', label: '#fff8ec' },
  { body: '#efd8cb', accent: '#91675d', label: '#fff9f0' },
  { body: '#d8e3ec', accent: '#5c7183', label: '#fff9ef' },
  { body: '#eee0bb', accent: '#877047', label: '#fff8e7' },
  { body: '#e4dced', accent: '#756883', label: '#fff9f2' },
]

const FRAGMENT_FILE_PALETTES = [
  { paper: '#f6f2e8', accent: '#64796b', edge: '#d9d5ca' },
  { paper: '#f3e8e1', accent: '#8d685e', edge: '#d9c9c1' },
  { paper: '#e9eef0', accent: '#63788a', edge: '#ccd5d9' },
  { paper: '#f1ead7', accent: '#86734f', edge: '#d9cfb4' },
]

const FRAGMENT_WORK_PALETTES = [
  { cover: '#66796c', accent: '#d8c99d' },
  { cover: '#8a685e', accent: '#e0c4a6' },
  { cover: '#64788a', accent: '#d8cfb7' },
]

function getFragmentPalette<T>(palettes: T[], itemId: string) {
  const paletteIndex = Array.from(itemId).reduce((total, character) => total + character.charCodeAt(0), 0)
  return palettes[paletteIndex % palettes.length]
}

function getWorkCoverTitle(title: string) {
  if (title.includes('北大荒')) return '北大荒'
  if (title.includes('缝纫机')) return '缝纫机'
  if (title.includes('冬衣')) return '做冬衣'
  return title.slice(0, 4)
}

function getCategoryLabel(category: string) {
  const separatorIndex = category.indexOf('/')
  return separatorIndex >= 0 ? category.slice(separatorIndex + 1) : category
}

function getTimeValueSortKey(value: string) {
  const matched = value.match(/((?:19|20)\d{2})年(?:(\d{1,2})月)?/)
  if (!matched) return 0
  return Number(matched[1]) * 100 + Number(matched[2] || 0)
}

function parseFragmentDateValues(dateText: string) {
  const yearMonth = dateText.match(/((?:19|20)\d{2})(?:-|年)(\d{1,2})(?:-|月)/)
  if (yearMonth) {
    return Number(yearMonth[1]) === FRAGMENT_DISPLAY_YEAR
      ? [`${FRAGMENT_DISPLAY_YEAR}年${Number(yearMonth[2])}月`]
      : []
  }

  const month = dateText.match(/(\d{1,2})月/)?.[1]
  if (month) return [`${FRAGMENT_DISPLAY_YEAR}年${Number(month)}月`]
  if (/今天|昨天|前天/.test(dateText)) {
    return [`${FRAGMENT_DISPLAY_YEAR}年${new Date().getMonth() + 1}月`]
  }
  return []
}

function getFragmentTimeValues(item: FragmentContentItem, galleryPhoto?: GalleryPhoto) {
  const dateSource = item.kind === 'photo' && galleryPhoto?.uploadedAt ? galleryPhoto.uploadedAt : item.updatedAt
  const parsedDateValues = parseFragmentDateValues(dateSource)
  return parsedDateValues.length
    ? parsedDateValues
    : [`${FRAGMENT_DISPLAY_YEAR}年${new Date().getMonth() + 1}月`]
}

function getSelectedFragmentFilters(
  searchParams: URLSearchParams,
  legacyKind: ActiveFragmentKind,
  legacyCategory: FragmentCategory,
): SelectedFragmentFilter[] {
  const filters = searchParams.getAll('filter').flatMap((filter) => {
    const parts = filter.split(':')
    if (parts.length < 2) return []
    const hasKindScope = CONTENT_TYPES.some((option) => option.id === parts[0]) && parts.length >= 3
    const kind = (hasKindScope ? parts[0] : legacyKind) as ActiveFragmentKind
    const category = (hasKindScope ? parts[1] : parts[0]) as FragmentCategory
    const value = parts.slice(hasKindScope ? 2 : 1).join(':')
    if (!FRAGMENT_CATEGORIES.some((option) => option.id === category) || !value) return []
    return [{ kind, category, value }]
  })

  searchParams.getAll('value').forEach((value) => {
    if (value) filters.push({ kind: legacyKind, category: legacyCategory, value })
  })

  return filters.filter((filter, index) => (
    (filter.category !== 'time' || new RegExp(`^${FRAGMENT_DISPLAY_YEAR}年\\d{1,2}月$`).test(filter.value))
    && filters.findIndex((item) => (
      item.kind === filter.kind && item.category === filter.category && item.value === filter.value
    )) === index
  ))
}

function getFragmentCategoryValues(
  item: FragmentContentItem,
  category: FragmentCategory,
  galleryPhoto?: GalleryPhoto,
) {
  if (category === 'time') return getFragmentTimeValues(item, galleryPhoto)

  const photoValues = (galleryPhoto?.aiCategories || [])
    .filter((value) => CATEGORY_PREFIXES[category].some((prefix) => value.startsWith(`${prefix}/`)))
    .map(getCategoryLabel)

  if (photoValues.length) return [...new Set(photoValues)]

  const searchableText = `${item.title}${item.summary}${item.tags.join('')}`
  if (category === 'people') {
    const names = [
      { label: '叶淑柔', aliases: ['叶淑柔', '淑柔', '阿嫲', '姥姥'] },
      { label: '郑木生', aliases: ['郑木生', '木生'] },
      { label: '谢南枝', aliases: ['谢南枝', '南枝'] },
      { label: '郑晓伟', aliases: ['郑晓伟', '晓伟', '小伟'] },
      { label: '孩子们', aliases: ['孩子', '小辈', '新生命'] },
      { label: '全家', aliases: ['全家', '家人', '家族'] },
    ].filter((person) => person.aliases.some((alias) => searchableText.includes(alias))).map((person) => person.label)
    return names.length ? names : item.kind === 'photo' || item.kind === 'voice' ? ['家人'] : []
  }
  if (category === 'place') {
    return ['汕头', '曼谷', '深圳', '苏州', '北大荒', '海边', '老厝', '老街', '雪地'].filter((place) => searchableText.includes(place))
  }
  if (category === 'event') {
    const events = [
      { label: '生日祝福', pattern: /生日|祝福/ },
      { label: '婚姻与新生', pattern: /婚礼|成家|婚姻|新生命/ },
      { label: '侨批与旧信', pattern: /侨批|旧信|家书/ },
      { label: '团圆与家族', pattern: /团圆|家谱|家族/ },
      { label: '远行与南洋', pattern: /远行|南洋|泰国|曼谷/ },
      { label: '生活手艺', pattern: /工夫茶|菜谱|缝纫机|冬衣/ },
    ].filter((event) => event.pattern.test(searchableText)).map((event) => event.label)
    return events.length ? events : item.tags.filter((tag) => !['家人', '老照片', '家庭文件', '已成作品', '故事原声'].includes(tag)).slice(0, 2)
  }
  if (category === 'group') {
    if (/夫妻|姐妹|两人/.test(searchableText)) return ['两人合照']
    return /全家福|合影|团圆|家人|全家/.test(searchableText) ? ['家庭合照'] : []
  }
  if (category === 'object') {
    return ['工夫茶', '侨批信件', '旧怀表', '旗袍', '缝纫机', '菜谱', '家谱'].filter((object) => {
      const aliases = object === '侨批信件' ? /侨批|旧信|家书/ : object === '旧怀表' ? /怀表/ : new RegExp(object)
      return aliases.test(searchableText)
    })
  }
  if (category === 'nostalgia') {
    const themes = [
      { label: '旧信往事', pattern: /旧信|侨批|家书/ },
      { label: '老街旧影', pattern: /老街|黄包车|骑楼/ },
      { label: '南洋往事', pattern: /南洋|泰国|曼谷|暹罗/ },
      { label: '老照片', pattern: /老照片|全家福|1978|老屋|老厝/ },
      { label: '人生故事', pattern: /人生|年轻时|那些年|回忆/ },
    ].filter((theme) => theme.pattern.test(searchableText)).map((theme) => theme.label)
    if (themes.length) return themes
    if (item.kind === 'voice' || item.kind === 'work') return ['人生故事']
  }
  return []
}

export function FrameFragmentsPage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeItem, setActiveItem] = useState<FragmentContentItem | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [items, setItems] = useState(() => getMockFragmentContentItems())
  const [isManaging, setIsManaging] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [voiceState, setVoiceState] = useState<'idle' | 'listening'>('idle')
  const voiceTimerRef = useRef<number | null>(null)
  const galleryPhotos = useMemo(() => getMockGalleryPhotos(), [])
  const galleryPhotoByUrl = useMemo(() => new Map(galleryPhotos.map((photo) => [photo.url, photo])), [galleryPhotos])
  const kind = (searchParams.get('kind') || 'all') as ActiveFragmentKind
  const category = (searchParams.get('category') || 'time') as FragmentCategory
  const selectedFilters = getSelectedFragmentFilters(searchParams, kind, category)
  const query = searchParams.get('q') || ''

  useEffect(() => () => {
    if (voiceTimerRef.current) window.clearTimeout(voiceTimerRef.current)
  }, [])

  const updateFilter = (key: string, value: string, defaultValue?: string) => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value === defaultValue) next.delete(key)
      else next.set(key, value)
      return next
    })
  }

  const updateKind = (nextKind: ActiveFragmentKind) => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextKind === 'all') next.delete('kind')
      else next.set('kind', nextKind)
      return next
    })
  }

  const updateCategory = (nextCategory: FragmentCategory) => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextCategory === 'time') next.delete('category')
      else next.set('category', nextCategory)
      return next
    })
  }

  const toggleCategoryValue = (filterKind: ActiveFragmentKind, filterCategory: FragmentCategory, value: string) => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      const currentFilters = getSelectedFragmentFilters(next, kind, category)
      const isSelected = currentFilters.some((filter) => (
        filter.kind === filterKind && filter.category === filterCategory && filter.value === value
      ))
      const nextFilters = isSelected
        ? currentFilters.filter((filter) => (
            filter.kind !== filterKind || filter.category !== filterCategory || filter.value !== value
          ))
        : [...currentFilters, { kind: filterKind, category: filterCategory, value }]

      next.delete('filter')
      next.delete('value')
      nextFilters.forEach((filter) => next.append('filter', `${filter.kind}:${filter.category}:${filter.value}`))
      return next
    })
  }

  const categoryOptions = useMemo(() => {
    const kindItems = kind === 'all' ? items : items.filter((item) => item.kind === kind)
    return FRAGMENT_CATEGORIES.filter((option) => kindItems.some((item) => (
      getFragmentCategoryValues(item, option.id, item.photoUrl ? galleryPhotoByUrl.get(item.photoUrl) : undefined).length > 0
    )))
  }, [galleryPhotoByUrl, items, kind])

  const activeCategory = categoryOptions.some((option) => option.id === category) ? category : categoryOptions[0]?.id || 'time'
  const categoryValueOptions = useMemo(() => {
    const kindItems = kind === 'all' ? items : items.filter((item) => item.kind === kind)
    const values = kindItems.flatMap((item) => (
      getFragmentCategoryValues(item, activeCategory, item.photoUrl ? galleryPhotoByUrl.get(item.photoUrl) : undefined)
    ))
    const uniqueValues = [...new Set(values)]
    const visibleValues = activeCategory === 'time'
      ? uniqueValues.filter((value) => new RegExp(`^${FRAGMENT_DISPLAY_YEAR}年\\d{1,2}月$`).test(value))
      : uniqueValues

    return visibleValues.sort((left, right) => {
      if (activeCategory === 'time') return getTimeValueSortKey(right) - getTimeValueSortKey(left)
      return left.localeCompare(right, 'zh-CN')
    })
  }, [activeCategory, galleryPhotoByUrl, items, kind])

  const filteredItems = items.filter((item) => {
    const galleryPhoto = item.photoUrl ? galleryPhotoByUrl.get(item.photoUrl) : undefined
    const itemMatchesFilter = (filter: SelectedFragmentFilter) => (
      getFragmentCategoryValues(item, filter.category, galleryPhoto).includes(filter.value)
    )
    const globalFilters = selectedFilters.filter((filter) => filter.kind === 'all')
    const scopedFilters = selectedFilters.filter((filter) => filter.kind !== 'all')
    const applicableScopedFilters = scopedFilters.filter((filter) => filter.kind === item.kind)

    if (!globalFilters.every(itemMatchesFilter)) return false
    if (scopedFilters.length && (!applicableScopedFilters.length || !applicableScopedFilters.every(itemMatchesFilter))) return false
    if (!selectedFilters.length && kind !== 'all' && item.kind !== kind) return false
    if (query && !`${item.title}${item.summary}${item.tags.join('')}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const itemGroups = selectedFilters.length || query
    ? [{ id: 'results', title: '筛选结果', items: filteredItems }]
    : [...filteredItems.reduce((groups, item) => {
        const galleryPhoto = item.photoUrl ? galleryPhotoByUrl.get(item.photoUrl) : undefined
        const title = getFragmentTimeValues(item, galleryPhoto)[0]
        const groupItems = groups.get(title) || []
        groupItems.push(item)
        groups.set(title, groupItems)
        return groups
      }, new Map<string, FragmentContentItem[]>())]
      .sort(([left], [right]) => getTimeValueSortKey(right) - getTimeValueSortKey(left))
      .map(([title, groupItems]) => ({ id: `time-${title}`, title, items: groupItems }))

  const startVoiceFilter = () => {
    if (voiceTimerRef.current) window.clearTimeout(voiceTimerRef.current)
    setVoiceState('listening')
    voiceTimerRef.current = window.setTimeout(() => {
      setVoiceState('idle')
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.set('q', '家人')
        next.delete('kind')
        next.delete('category')
        next.delete('filter')
        next.delete('value')
        return next
      })
    }, 900)
  }

  const clearFragmentFilters = () => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      const filterKeys = ['kind', 'category', 'filter', 'value', 'q', 'organize', 'tag']
      filterKeys.forEach((key) => next.delete(key))
      return next
    })
  }

  const clearSelectedFragmentFilters = () => {
    setSelectedItemIds([])
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('filter')
      next.delete('value')
      next.delete('q')
      return next
    })
  }

  const toggleManageMode = () => {
    setIsManaging((current) => !current)
    setSelectedItemIds([])
    setActiveItem(null)
    setPlayingVoiceId(null)
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((current) => (
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    ))
  }

  const toggleSelectAll = () => {
    const visibleIds = filteredItems.map((item) => item.id)
    const hasSelectedAll = visibleIds.length > 0 && visibleIds.every((id) => selectedItemIds.includes(id))
    setSelectedItemIds((current) => (
      hasSelectedAll
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    ))
  }

  const deleteSelectedItems = () => {
    if (!selectedItemIds.length) return
    setItems((current) => current.filter((item) => !selectedItemIds.includes(item.id)))
    setSelectedItemIds([])
  }

  const openOriginalContent = (item: FragmentContentItem) => {
    if (item.kind === 'photo') navigate(withFrameVariant('/frame/study/module/album'))
    else if (item.kind === 'voice') navigate(withFrameVariant('/frame/study/module/recorder'))
    else if (item.kind === 'work') navigate(withFrameVariant(`/frame/study/module/shelf/item/${item.sourceId}`))
    else setActiveItem(null)
  }

  return (
    <FramePageShell className="frame-space-page frame-study-page frame-study-album-page frame-fragments-page frame-light-nav-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-study-space__topbar frame-light-nav" aria-label="时光碎片导航">
        <button className="frame-memory-back-button" type="button" onClick={() => navigate(withFrameVariant('/frame'))} aria-label="返回相框">
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <section className="frame-study-album-search" aria-label="搜索时光碎片">
          <form className="frame-study-album-search__form" onSubmit={(event) => event.preventDefault()}>
            <div className={voiceState === 'listening' ? 'frame-study-album-search__field is-voice-active' : 'frame-study-album-search__field'}>
              <MagnifyingGlass size={23} weight="bold" aria-hidden="true" />
              <div className="frame-study-album-search__input-wrap">
                <input
                  type="search"
                  value={voiceState === 'listening' ? '' : query}
                  placeholder={voiceState === 'listening' ? '' : '搜索照片、声音或作品'}
                  aria-label="搜索时光碎片"
                  readOnly={voiceState === 'listening'}
                  onChange={(event) => updateFilter('q', event.target.value, '')}
                />
                {voiceState === 'listening' ? <span className="frame-study-album-search__listening">请说话<span className="frame-study-album-search__dots"><i>.</i><i>.</i><i>.</i></span></span> : null}
              </div>
              <button className={voiceState === 'listening' ? 'frame-study-album-search__voice is-active' : 'frame-study-album-search__voice'} type="button" onClick={startVoiceFilter}>
                {voiceState === 'listening' ? null : <Microphone size={22} weight="fill" aria-hidden="true" />}
                {voiceState === 'listening' ? '完成' : '说话'}
              </button>
            </div>
            <button className="frame-study-album-search__submit" type="submit">查找</button>
          </form>
        </section>
      </header>

      <main className="frame-study-album-layout frame-fragments-album-layout">
        <section className="frame-study-album-browser" aria-label="时光碎片分类">
          <div className="frame-study-album-controls">
            <section className="frame-study-album-filter-panel frame-fragments-album-filters" aria-label="时光碎片筛选">
              <div className="frame-study-album-filter-level frame-study-album-filter-level--primary">
                <strong className="frame-study-album-filter-level__title">内容</strong>
                <div className="frame-fragment-filter-options" role="tablist" aria-label="内容">
                    {CONTENT_TYPES.map((type) => (
                      <button key={type.id} type="button" role="tab" aria-selected={kind === type.id} className={kind === type.id ? 'is-active' : ''} onClick={() => updateKind(type.id)}>
                        {type.label}
                      </button>
                    ))}
                </div>
              </div>
              <div className="frame-study-album-filter-level frame-study-album-filter-level--secondary frame-fragment-filter-details">
                <strong className="frame-study-album-filter-level__title">分类</strong>
                <div className="frame-fragment-filter-options" role="tablist" aria-label="分类">
                  {categoryOptions.map((option) => (
                    <button key={option.id} type="button" role="tab" aria-selected={activeCategory === option.id} className={activeCategory === option.id ? 'is-active' : ''} onClick={() => updateCategory(option.id)}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={activeCategory === 'time' ? 'frame-study-album-filter-level frame-study-album-filter-level--secondary frame-fragment-filter-details is-time' : 'frame-study-album-filter-level frame-study-album-filter-level--secondary frame-fragment-filter-details'}>
                <strong className="frame-study-album-filter-level__title">{FRAGMENT_CATEGORIES.find((option) => option.id === activeCategory)?.detailLabel || '具体'}</strong>
                <div className="frame-fragment-filter-options" role="group" aria-label="具体筛选条件">
                  {categoryValueOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selectedFilters.some((filter) => filter.kind === kind && filter.category === activeCategory && filter.value === option)}
                      className={selectedFilters.some((filter) => filter.kind === kind && filter.category === activeCategory && filter.value === option) ? 'is-active' : ''}
                      onClick={() => toggleCategoryValue(kind, activeCategory, option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {selectedFilters.length || query ? (
                <section className="frame-study-album-filter-summary" aria-label="当前时光碎片筛选条件">
                  <strong className="frame-study-album-filter-level__title">已选条件</strong>
                  <div className="frame-study-album-filter-chips">
                    {selectedFilters.map((filter) => (
                      <button
                        key={`${filter.kind}:${filter.category}:${filter.value}`}
                        type="button"
                        aria-label={`移除${filter.kind === 'all' ? '全部内容' : KIND_LABELS[filter.kind]}${filter.value}条件`}
                        onClick={() => toggleCategoryValue(filter.kind, filter.category, filter.value)}
                      >
                        {filter.kind === 'all' ? '全部' : KIND_LABELS[filter.kind]} · {filter.value}
                        <X size={19} weight="bold" aria-hidden="true" />
                      </button>
                    ))}
                    {query ? <span>“{query}”</span> : null}
                  </div>
                  <div className="frame-study-album-filter-summary__result">
                    <button className="frame-study-album-filter-summary__clear" type="button" onClick={clearSelectedFragmentFilters}>清除全部</button>
                  </div>
                </section>
              ) : null}
            </section>
          </div>

          {filteredItems.length ? (
            <div className="frame-study-album-groups frame-fragments-album-groups">
              {itemGroups.map((group, groupIndex) => (
                <section className="frame-study-album-group" key={group.id} aria-label={group.title}>
                  <div className="frame-study-album-group__heading"><h2>{group.title}</h2></div>
                  <div className="frame-study-album-grid">
                    {group.items.map((item, itemIndex) => {
                      const pose = FRAGMENT_CARD_POSES[(itemIndex + groupIndex * 2) % FRAGMENT_CARD_POSES.length]
                      const voicePalette = getFragmentPalette(FRAGMENT_VOICE_PALETTES, item.id)
                      const filePalette = getFragmentPalette(FRAGMENT_FILE_PALETTES, item.id)
                      const workPalette = getFragmentPalette(FRAGMENT_WORK_PALETTES, item.id)
                      return (
                        <button
                          className={[
                            'frame-study-album-photo',
                            'frame-fragment-album-card',
                            `frame-fragment-album-card--${item.kind}`,
                            isManaging ? 'is-managing' : '',
                            selectedItemIds.includes(item.id) ? 'is-selected' : '',
                          ].filter(Boolean).join(' ')}
                          key={item.id}
                          style={{
                            ['--album-photo-tilt' as string]: `${pose.tilt}deg`,
                            ['--album-photo-lift' as string]: `${pose.lift}px`,
                            ['--fragment-voice-body' as string]: voicePalette.body,
                            ['--fragment-voice-accent' as string]: voicePalette.accent,
                            ['--fragment-file-paper' as string]: filePalette.paper,
                            ['--fragment-file-accent' as string]: filePalette.accent,
                            ['--fragment-file-edge' as string]: filePalette.edge,
                            ['--fragment-work-cover' as string]: workPalette.cover,
                            ['--fragment-work-accent' as string]: workPalette.accent,
                          }}
                          type="button"
                          aria-pressed={isManaging ? selectedItemIds.includes(item.id) : undefined}
                          onClick={() => {
                            if (isManaging) {
                              toggleItemSelection(item.id)
                              return
                            }
                            setActiveItem(item)
                            setPlayingVoiceId(null)
                          }}
                        >
                          <div className="frame-fragment-album-card__media">
                            {item.kind === 'voice' ? (
                              <div className="frame-fragment-album-card__type-art frame-fragment-album-card__type-art--voice" aria-hidden="true">
                                <span className="frame-fragment-cassette">
                                  <span className="frame-fragment-cassette__label">
                                    <i />
                                    <em />
                                    <i />
                                  </span>
                                  <span className="frame-fragment-cassette__base"><i /><i /></span>
                                </span>
                              </div>
                            ) : item.kind === 'file' ? (
                              <div className="frame-fragment-album-card__type-art frame-fragment-album-card__type-art--file" aria-hidden="true">
                                <span className="frame-fragment-file-object">
                                  <FileText size={66} weight="duotone" />
                                  <span className="frame-fragment-file-object__lines"><i /><i /><i /></span>
                                </span>
                              </div>
                            ) : item.kind === 'work' ? (
                              <div className="frame-fragment-album-card__type-art frame-fragment-album-card__type-art--work" aria-hidden="true">
                                <span className="frame-fragment-book-object">
                                  <span className="frame-fragment-book-object__ornament"><BookOpenText size={28} weight="duotone" /></span>
                                  <span className="frame-fragment-book-object__title">{getWorkCoverTitle(item.title)}</span>
                                  <i className="frame-fragment-book-object__spine" />
                                  <i className="frame-fragment-book-object__pages" />
                                </span>
                              </div>
                            ) : item.photoUrl ? (
                              <img src={item.photoUrl} alt="" loading="lazy" />
                            ) : (
                              <Images size={62} weight="duotone" aria-hidden="true" />
                            )}
                            {item.kind === 'voice' ? <b className="frame-fragment-album-card__play"><Play size={16} weight="fill" aria-hidden="true" /></b> : null}
                          </div>
                          <strong>{item.title}</strong>
                          {isManaging ? <i className="frame-study-album-photo__check" aria-hidden="true" /> : null}
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="frame-study-album-empty">
              <MagnifyingGlass size={44} weight="duotone" aria-hidden="true" />
              <strong>暂时没有找到这些碎片</strong>
              <button type="button" onClick={clearFragmentFilters}>查看全部内容</button>
            </div>
          )}

          <div className={isManaging ? 'frame-study-album-floating-actions frame-fragments-floating-actions is-managing' : 'frame-study-album-floating-actions frame-fragments-floating-actions'} aria-label={isManaging ? '内容编辑操作' : '内容快捷操作'}>
            {isManaging ? (
              <>
                <button className="frame-study-album-floating-actions__secondary" type="button" onClick={toggleManageMode}>
                  <X size={27} weight="bold" aria-hidden="true" />
                  取消
                </button>
                <button className="frame-study-album-floating-actions__secondary" type="button" disabled={!filteredItems.length} onClick={toggleSelectAll}>
                  <CheckSquare size={27} weight="bold" aria-hidden="true" />
                  {filteredItems.length > 0 && filteredItems.every((item) => selectedItemIds.includes(item.id)) ? '取消全选' : '全选'}
                </button>
                <button className="frame-study-album-floating-actions__danger" type="button" disabled={!selectedItemIds.length} onClick={deleteSelectedItems}>
                  <TrashSimple size={27} weight="bold" aria-hidden="true" />
                  删除{selectedItemIds.length ? ` ${selectedItemIds.length}` : ''}
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

      {activeItem?.kind === 'voice' ? (
        <div className="frame-study-recorder-player-overlay" role="presentation" onClick={() => {
          setActiveItem(null)
          setPlayingVoiceId(null)
        }}>
          <section className="frame-study-recorder-player" role="dialog" aria-modal="true" aria-label={`${activeItem.title}播放`} onClick={(event) => event.stopPropagation()}>
            <button className="frame-study-album-detail__close frame-study-recorder-player__close" type="button" aria-label="关闭录音播放" onClick={() => {
              setActiveItem(null)
              setPlayingVoiceId(null)
            }}>
              <X size={30} weight="bold" aria-hidden="true" />
            </button>
            <div
              className="frame-study-recorder-player__tape"
              style={{
                ['--tape-body' as string]: getFragmentPalette(FRAGMENT_VOICE_PALETTES, activeItem.id).body,
                ['--tape-accent' as string]: getFragmentPalette(FRAGMENT_VOICE_PALETTES, activeItem.id).accent,
                ['--tape-label' as string]: getFragmentPalette(FRAGMENT_VOICE_PALETTES, activeItem.id).label,
              }}
            >
              <div className="frame-study-recorder-player__reels">
                <i />
                <button
                  className={playingVoiceId === activeItem.id ? 'frame-study-recorder-player__play is-playing' : 'frame-study-recorder-player__play'}
                  type="button"
                  aria-label={playingVoiceId === activeItem.id ? '暂停录音' : '播放录音'}
                  onClick={() => setPlayingVoiceId((current) => current === activeItem.id ? null : activeItem.id)}
                >
                  {playingVoiceId === activeItem.id ? <Pause size={54} weight="fill" aria-hidden="true" /> : <Play size={54} weight="fill" aria-hidden="true" />}
                </button>
                <i />
              </div>
            </div>
            <div className="frame-study-recorder-player__content">
              <span>{activeItem.updatedAt}<small>{activeItem.durationSeconds ? `${activeItem.durationSeconds} 秒` : activeItem.summary}</small></span>
              <h2>{activeItem.title}</h2>
              <p>{activeItem.summary}</p>
            </div>
          </section>
        </div>
      ) : activeItem ? (
        <div className="frame-fragment-detail-overlay" role="presentation" onClick={() => setActiveItem(null)}>
          <section className="frame-fragment-detail" role="dialog" aria-modal="true" aria-labelledby="fragment-detail-title" onClick={(event) => event.stopPropagation()}>
            <button className="frame-fragment-detail__close" type="button" aria-label="关闭内容详情" onClick={() => setActiveItem(null)}><X size={26} weight="bold" /></button>
            {activeItem.photoUrl ? <img src={activeItem.photoUrl} alt="" /> : null}
            <span>{KIND_LABELS[activeItem.kind]} · {activeItem.updatedAt}</span>
            <h2 id="fragment-detail-title">{activeItem.title}</h2>
            <p>{activeItem.summary}</p>
            <div>{activeItem.tags.map((itemTag) => <i key={itemTag}>{itemTag}</i>)}</div>
            <button className="frame-fragment-detail__primary" type="button" onClick={() => openOriginalContent(activeItem)}>
              {activeItem.kind === 'photo' ? '查看完整相册' : activeItem.kind === 'work' ? '打开作品' : '完成'}
            </button>
          </section>
        </div>
      ) : null}
    </FramePageShell>
  )
}
