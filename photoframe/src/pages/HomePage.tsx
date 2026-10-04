import {
  BookOpenText,
  Camera,
  CaretLeft,
  CaretRight,
  Check,
  Gift,
  HandHeart,
  Image,
  MagicWand,
  PencilSimpleLine,
  Play,
  Plus,
  Storefront,
  TrashSimple,
  Tree,
  UserCircle,
  X,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MemberBottomNav } from '../components/MemberBottomNav'
import {
  getMockGalleryPhotos,
  getMockInteractionThreads,
  getMockMembers,
  getMockMemoryThemes,
  getMockRiverStages,
} from '../mock'
import '../styles/home.css'
import type { FamilyMember, GalleryPhoto, InteractionThread, MemoryTheme, StoryTab } from '../types'
import { FAMILY_FILTER_ALL, getFamilyAvatarSrc, getMemberAvatarSrc } from '../utils/familyAvatars'

const SESSION_INTERACTIONS_KEY = 'shiguangxu:sent-interactions'
const MAX_GALLERY_PHOTO_COUNT = 20

type VoicePlaybackState = {
  id: string
  durationSeconds: number
  remainingSeconds: number
}

type TreasureAlbumTab = 'latest' | 'people' | 'place' | 'event' | 'group' | 'object' | 'old-photo'

const TREASURE_ALBUM_TABS: { id: TreasureAlbumTab; label: string }[] = [
  { id: 'latest', label: '最新' },
  { id: 'people', label: '人物' },
  { id: 'place', label: '地点' },
  { id: 'event', label: '事件' },
  { id: 'group', label: '合照' },
  { id: 'object', label: '物件' },
  { id: 'old-photo', label: '老照片' },
]

const TREASURE_ALBUM_PHOTO_POSES = [
  { drift: 0, lift: 1, tilt: -0.35 },
  { drift: -2, lift: 6, tilt: 1.55 },
  { drift: 2, lift: -3, tilt: -1.1 },
  { drift: 1, lift: 4, tilt: 0.65 },
  { drift: -1, lift: -5, tilt: 1.9 },
  { drift: 2, lift: 2, tilt: -1.65 },
  { drift: -2, lift: -1, tilt: 0.25 },
  { drift: 1, lift: 5, tilt: -0.85 },
  { drift: -1, lift: -4, tilt: 1.2 },
]

type MemoryTone =
  | 'coral'
  | 'apricot'
  | 'amber'
  | 'olive'
  | 'sage'
  | 'pine'
  | 'teal'
  | 'sky'
  | 'blue'
  | 'violet'
  | 'mauve'
  | 'rose'

function getMemoryStatusLabel(status: 'recommended' | 'completed' | 'unfinished' | 'locked'): string {
  if (status === 'completed') return '查看故事'
  if (status === 'locked') return '待聊'
  return '点击开聊'
}

const MEMBER_RIVER_YEAR_RANGE: Record<string, string> = {
  'theme-childhood': '1960-1970',
  'theme-family': '1978-1990',
  'theme-neighborhood': '1990-2005',
  'theme-work': '1975-2010',
  'theme-heart': '一生珍藏',
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date('2026-05-27T10:20:00+08:00')
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - startOfDate) / 86400000)

  if (diffDays === 0) return time
  if (diffDays === 1) return `昨天 ${time}`
  if (diffDays === 2) return `前天 ${time}`
  if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}

function uniqueImages(urls: Array<string | undefined>) {
  return Array.from(new Set(urls.filter(Boolean))) as string[]
}

function MemoryView({ onSelectMemory, themes }: { onSelectMemory: () => void; themes: MemoryTheme[] }) {
  const riverStages = getMockRiverStages()
  const imagePool = uniqueImages([
    ...getMockGalleryPhotos().map((photo) => photo.url),
    ...getMockInteractionThreads().map((thread) => thread.photoUrl),
    ...riverStages.flatMap((stage) => [stage.coverUrl, ...stage.stories.map((story) => story.photoUrl)]),
  ])
  let imageIndex = 0

  return (
    <section className="home-river-view" aria-label="拾光长河">
      {themes.map((theme) => {
        const themeImageStart = imageIndex
        imageIndex += theme.topics.length + 1

        return (
          <section className="home-river-theme" key={theme.id} aria-label={theme.title}>
            <div className="home-river-theme__heading">
              <div>
                <h2>{theme.title}</h2>
                <span>{MEMBER_RIVER_YEAR_RANGE[theme.id]}</span>
              </div>
              <em>{theme.completedCount}/{theme.totalCount} 已点亮</em>
            </div>
            <div className="home-river-grid">
              {theme.topics.map((topic, topicIndex) => (
                <button
                  className={`home-river-card home-river-card--${topic.status}`}
                  key={topic.id}
                  type="button"
                  onClick={onSelectMemory}
                >
                  <figure>
                    <img src={imagePool[(themeImageStart + topicIndex) % imagePool.length]} alt="" />
                  </figure>
                  <strong>{topic.title}</strong>
                  <span>{getMemoryStatusLabel(topic.status)}</span>
                </button>
              ))}
              <button
                className={`home-river-card home-river-card--reward home-river-card--${theme.rewardStatus}`}
                type="button"
                onClick={onSelectMemory}
              >
                <figure>
                  <img src={imagePool[(themeImageStart + theme.topics.length) % imagePool.length]} alt="" />
                  <i aria-hidden="true"><Gift size={22} weight={theme.rewardStatus === 'unlocked' ? 'fill' : 'duotone'} /></i>
                </figure>
                <strong>{theme.rewardTitle}</strong>
                <span>{theme.rewardStatus === 'unlocked' ? '查看一章故事' : '聊完本章生成'}</span>
              </button>
            </div>
          </section>
        )
      })}
    </section>
  )
}

function GalleryPanel({
  editing,
  photos,
  selectedPhotoIds,
  onOpenPhoto,
  onTogglePhoto,
}: {
  editing: boolean
  photos: GalleryPhoto[]
  selectedPhotoIds: string[]
  onOpenPhoto: (photoId: string) => void
  onTogglePhoto: (photoId: string) => void
}) {
  return (
    <section className="home-gallery-panel" aria-label="图库照片">
      {photos.map((photo) => {
        const selected = selectedPhotoIds.includes(photo.id)
        return (
          <button
            className={selected ? 'home-gallery-tile home-gallery-tile--selected' : 'home-gallery-tile'}
            key={photo.id}
            type="button"
            aria-label={editing ? `${selected ? '取消选择' : '选择'}${photo.title}` : photo.title}
            aria-pressed={editing ? selected : undefined}
            onClick={() => {
              if (editing) {
                onTogglePhoto(photo.id)
              } else {
                onOpenPhoto(photo.id)
              }
            }}
          >
            <img src={photo.url} alt={photo.alt} />
            {editing ? (
              <i className="home-gallery-tile__check" aria-hidden="true">
                {selected ? <Check size={13} weight="bold" /> : null}
              </i>
            ) : null}
          </button>
        )
      })}
    </section>
  )
}

function GalleryView({
  editing,
  photos,
  reachedLimit,
  selectedPhotoIds,
  onTogglePhoto,
  onUpload,
  onOpenPhoto,
}: {
  editing: boolean
  photos: GalleryPhoto[]
  reachedLimit: boolean
  selectedPhotoIds: string[]
  onTogglePhoto: (photoId: string) => void
  onUpload: () => void
  onOpenPhoto: (photoId: string) => void
}) {
  const countLabel = `${Math.min(photos.length, MAX_GALLERY_PHOTO_COUNT)}/${MAX_GALLERY_PHOTO_COUNT}`

  return (
    <section className="home-gallery-view" aria-label="图库">
      <section className="home-gallery-feature-card" aria-label="相框照片提示">
        <div>
          <h2>让照片替你常常陪伴</h2>
          <p>照片将在相框自动播放，让家充满爱</p>
        </div>
        <img
          className="home-gallery-feature-card__art"
          src="/past-memories-tab-film-transparent.png"
          alt=""
          aria-hidden="true"
        />
      </section>
      {photos.length > 0 ? (
        <>
          <div className="home-gallery-heading">
            <h2>{editing ? `已选 ${selectedPhotoIds.length} 张` : '当前照片'}</h2>
            <span>{countLabel}</span>
          </div>
          <GalleryPanel editing={editing} photos={photos} selectedPhotoIds={selectedPhotoIds} onOpenPhoto={onOpenPhoto} onTogglePhoto={onTogglePhoto} />
        </>
      ) : (
        <>
          <div className="home-gallery-heading">
            <h2>当前照片</h2>
            <span>0/20</span>
          </div>
          <HomeEmptyState
            actionIcon={Plus}
            actionLabel="上传照片"
            actionDisabled={reachedLimit}
            icon={Image}
            title="暂无照片，上传后即可在相框端展示"
            onAction={onUpload}
          />
        </>
      )}
    </section>
  )
}

function pickPhotos(photos: GalleryPhoto[], ids: string[]) {
  return ids.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is GalleryPhoto => Boolean(photo))
}

function getTreasureAlbumGroups(photos: GalleryPhoto[], tab: TreasureAlbumTab) {
  if (tab === 'latest') {
    return [
      { id: 'latest-week', title: '最近一周', meta: '新传来的照片', photos: photos.slice(0, 3) },
      { id: 'latest-month', title: '这个月', meta: '家里慢慢存下来的日常', photos: photos.slice(3, 9) },
      { id: 'latest-earlier', title: '更早', meta: '旧照片和早些时候的回忆', photos: photos.slice(9, 15) },
    ]
  }

  if (tab === 'people') {
    return [
      { id: 'person-zhixia', title: '知夏', meta: '外孙女常带来的小作品', photos: photos.filter((photo) => photo.uploadedById === 'member-child-yu').slice(0, 6) },
      { id: 'person-jiahe', title: '嘉禾', meta: '儿子发来的家里近况', photos: photos.filter((photo) => photo.uploadedById === 'member-child-chen').slice(0, 6) },
      { id: 'person-family', title: '全家合照', meta: '大家一起出现的时刻', photos: pickPhotos(photos, ['gallery-003', 'gallery-008', 'gallery-013', 'gallery-018']) },
    ]
  }

  if (tab === 'place') {
    return [
      { id: 'place-grandma-home', title: '奶奶家', meta: '客厅、窗边和茶桌', photos: pickPhotos(photos, ['gallery-004', 'gallery-006', 'gallery-011', 'gallery-012', 'gallery-015']) },
      { id: 'place-kitchen', title: '厨房餐桌', meta: '饭菜、画和一起动手', photos: pickPhotos(photos, ['gallery-001', 'gallery-002', 'gallery-014', 'gallery-017', 'gallery-020']) },
      { id: 'place-outdoor', title: '户外公园', meta: '散步、草地和树荫', photos: pickPhotos(photos, ['gallery-008', 'gallery-013', 'gallery-018', 'gallery-019']) },
      { id: 'place-old-album', title: '老屋旧相册', meta: '泛黄照片里的早年时光', photos: pickPhotos(photos, ['gallery-005', 'gallery-009', 'gallery-010', 'gallery-011']) },
    ]
  }

  if (tab === 'event') {
    return [
      { id: 'event-warm', title: '温馨时光', meta: 'AI识别出的陪伴和团聚', photos: pickPhotos(photos, ['gallery-001', 'gallery-003', 'gallery-007', 'gallery-008', 'gallery-018']) },
      { id: 'event-festival', title: '节日团圆', meta: '生日、节庆和团聚餐桌', photos: pickPhotos(photos, ['gallery-002', 'gallery-008', 'gallery-013', 'gallery-014']) },
      { id: 'event-table', title: '餐桌记忆', meta: '厨房、饭菜和一起动手', photos: pickPhotos(photos, ['gallery-001', 'gallery-002', 'gallery-014', 'gallery-017']) },
      { id: 'event-child-work', title: '孩子作品', meta: '画、手工和成长瞬间', photos: pickPhotos(photos, ['gallery-001', 'gallery-020', 'gallery-003']) },
    ]
  }

  if (tab === 'group') {
    return [
      { id: 'group-family', title: '全家合照', meta: '大家都在的照片', photos: pickPhotos(photos, ['gallery-003', 'gallery-008', 'gallery-013', 'gallery-018']) },
      { id: 'group-grandchild', title: '祖孙合照', meta: '长辈和孩子在一起', photos: pickPhotos(photos, ['gallery-001', 'gallery-003', 'gallery-007', 'gallery-020']) },
      { id: 'group-kids', title: '孩子们', meta: '孩子之间的日常', photos: pickPhotos(photos, ['gallery-001', 'gallery-003', 'gallery-020']) },
      { id: 'group-two', title: '两个人', meta: '适合慢慢讲的双人照', photos: pickPhotos(photos, ['gallery-005', 'gallery-010', 'gallery-018']) },
    ]
  }

  if (tab === 'object') {
    return [
      { id: 'object-food', title: '饭菜', meta: '饭桌、厨房和家常味道', photos: pickPhotos(photos, ['gallery-002', 'gallery-014', 'gallery-017']) },
      { id: 'object-flower', title: '花草', meta: '窗边和院子里的植物', photos: pickPhotos(photos, ['gallery-004', 'gallery-006', 'gallery-016']) },
      { id: 'object-handwriting', title: '手写字', meta: '纸张、画和可保留的笔迹', photos: pickPhotos(photos, ['gallery-001', 'gallery-020']) },
      { id: 'object-old-things', title: '老物件', meta: '茶杯、老灯和旧相册', photos: pickPhotos(photos, ['gallery-009', 'gallery-011', 'gallery-012', 'gallery-015']) },
    ]
  }

  return [
    { id: 'old-young', title: '年轻时候', meta: '早年的合影和人像', photos: pickPhotos(photos, ['gallery-005', 'gallery-010']) },
    { id: 'old-album', title: '泛黄相册', meta: '从旧相册里电子化的照片', photos: pickPhotos(photos, ['gallery-005', 'gallery-009', 'gallery-010']) },
    { id: 'old-home', title: '老屋旧影', meta: '老房子里的光和物件', photos: pickPhotos(photos, ['gallery-004', 'gallery-011', 'gallery-012', 'gallery-015']) },
    { id: 'old-story', title: '适合讲故事', meta: 'AI觉得值得整理成故事', photos: pickPhotos(photos, ['gallery-005', 'gallery-009', 'gallery-011', 'gallery-020']) },
  ]
}

function TreasureAlbumGroups({
  editing,
  groups,
  onTogglePhoto,
  selectedPhotoIds,
  onOpenPhoto,
}: {
  editing: boolean
  groups: ReturnType<typeof getTreasureAlbumGroups>
  onOpenPhoto: (photoId: string) => void
  onTogglePhoto: (photoId: string) => void
  selectedPhotoIds: string[]
}) {
  return (
    <div className="home-treasure-album-groups">
      {groups.map((group, groupIndex) => (
        <section className="home-treasure-album-group" key={group.id} aria-label={group.title}>
          <div className="home-treasure-album-group__heading">
            <h3>{group.title}</h3>
          </div>
          <div className="home-treasure-film-grid">
            {group.photos.map((photo, photoIndex) => {
              const selected = selectedPhotoIds.includes(photo.id)
              const pose = TREASURE_ALBUM_PHOTO_POSES[(photoIndex + groupIndex * 2) % TREASURE_ALBUM_PHOTO_POSES.length]

              return (
                <button
                  className={[
                    'home-treasure-film-photo',
                    editing ? 'is-editing' : '',
                    selected ? 'is-selected' : '',
                  ].filter(Boolean).join(' ')}
                  key={`${group.id}-${photo.id}`}
                  style={{
                    ['--album-photo-tilt' as string]: `${pose.tilt}deg`,
                    ['--album-photo-lift' as string]: `${pose.lift}px`,
                    ['--album-photo-drift' as string]: `${pose.drift}px`,
                  }}
                  type="button"
                  aria-label={editing ? `${selected ? '取消选择' : '选择'}${photo.title}` : photo.title}
                  aria-pressed={editing ? selected : undefined}
                  onClick={() => {
                    if (editing) {
                      onTogglePhoto(photo.id)
                    } else {
                      onOpenPhoto(photo.id)
                    }
                  }}
                >
                  <img src={photo.url} alt={photo.alt} />
                  <span>{photo.title}</span>
                  {editing ? (
                    <i className="home-treasure-film-photo__check" aria-hidden="true">
                      {selected ? <Check size={12} weight="bold" /> : null}
                    </i>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

const HOME_EXTRA_THREADS: InteractionThread[] = [
  {
    id: 'home-thread-elder-001',
    title: '姥姥记录窗边的花',
    photoUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    photoAlt: '窗边一束花和温暖的客厅光线',
    photoLabel: '窗边花',
    photoMeta: '今天 09:12',
    photoTone: 'peach',
    senderId: 'member-elder-lin',
    senderName: '林秀兰',
    initialContent: '早上阳光照到窗台，花开得正好。我想着拍下来给你们看看，像以前老屋窗边那盆。',
    initialMethod: 'text',
    latestSnippet: '妈，这张照片真好看，我们周末给你再带一束新的。',
    latestAt: '2026-05-27T09:42:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-elder-001-a',
        authorId: 'member-elder-lin',
        authorName: '林秀兰',
        relation: '外婆',
        method: 'text',
        content: '早上阳光照到窗台，花开得正好。我想着拍下来给你们看看，像以前老屋窗边那盆。',
        createdAt: '2026-05-27T09:12:00+08:00',
      },
      {
        id: 'home-response-elder-001-b',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，这张照片真好看，我们周末给你再带一束新的。',
        createdAt: '2026-05-27T09:42:00+08:00',
      },
    ],
  },
  {
    id: 'home-thread-009',
    title: '晚饭后的散步',
    photoUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
    photoAlt: '傍晚一家人在公园小路散步',
    photoLabel: '公园散步',
    photoMeta: '4月28日',
    photoTone: 'moss',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，我们晚饭后出来散步，路边的花开得很好。',
    initialMethod: 'text',
    latestSnippet: '天暖了，多出来走走是好事',
    latestAt: '2026-04-28T19:42:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-009-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '外婆，我们晚饭后出来散步，路边的花开得很好。',
        createdAt: '2026-04-28T19:12:00+08:00',
      },
      {
        id: 'home-response-009-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'voice',
        content: '天暖了，多出来走走是好事。',
        createdAt: '2026-04-28T19:42:00+08:00',
        durationSeconds: 11,
      },
    ],
  },
  {
    id: 'home-thread-010',
    title: '阳光下晒被子',
    photoUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=82',
    photoAlt: '家人在阳光下整理家务',
    photoLabel: '晒被子',
    photoMeta: '4月21日',
    photoTone: 'peach',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，今天太阳特别好，我们把被子都拿出来晒了。',
    initialMethod: 'ai_generated',
    latestSnippet: '晒过太阳的被子睡着最舒服',
    latestAt: '2026-04-21T16:20:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-010-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'ai_generated',
        content: '妈，今天太阳特别好，我们把被子都拿出来晒了。',
        createdAt: '2026-04-21T15:48:00+08:00',
      },
      {
        id: 'home-response-010-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'text',
        content: '晒过太阳的被子睡着最舒服。',
        createdAt: '2026-04-21T16:20:00+08:00',
      },
    ],
  },
  {
    id: 'home-thread-011',
    title: '小满学会骑车',
    photoUrl: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=900&q=82',
    photoAlt: '孩子在户外骑自行车',
    photoLabel: '学骑车',
    photoMeta: '4月13日',
    photoTone: 'gold',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '小满今天终于不用辅助轮了，想第一个告诉太婆。',
    initialMethod: 'text',
    latestSnippet: '真棒，摔了也别怕，慢慢来',
    latestAt: '2026-04-13T18:36:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-011-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '小满今天终于不用辅助轮了，想第一个告诉太婆。',
        createdAt: '2026-04-13T18:08:00+08:00',
      },
      {
        id: 'home-response-011-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'voice',
        content: '真棒，摔了也别怕，慢慢来。',
        createdAt: '2026-04-13T18:36:00+08:00',
        durationSeconds: 14,
      },
    ],
  },
  {
    id: 'home-thread-012',
    title: '周末烤了蛋糕',
    photoUrl: 'https://images.unsplash.com/photo-1514986888952-8cd320577b68?auto=format&fit=crop&w=900&q=82',
    photoAlt: '桌上一块刚做好的蛋糕',
    photoLabel: '周末蛋糕',
    photoMeta: '4月6日',
    photoTone: 'paper',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，我们照你以前的方子烤了蛋糕，闻起来像小时候。',
    initialMethod: 'text',
    latestSnippet: '下次少放点糖，会更香',
    latestAt: '2026-04-06T15:18:00+08:00',
    unread: false,
    responses: [
      {
        id: 'home-response-012-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，我们照你以前的方子烤了蛋糕，闻起来像小时候。',
        createdAt: '2026-04-06T14:51:00+08:00',
      },
      {
        id: 'home-response-012-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'text',
        content: '下次少放点糖，会更香。',
        createdAt: '2026-04-06T15:18:00+08:00',
      },
    ],
  },
]

function getSessionInteractionThreads(): InteractionThread[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_INTERACTIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as InteractionThread[]
  } catch {
    return []
  }
}

function HomeEmptyState({
  actionLabel,
  actionIcon: ActionIcon,
  actionDisabled = false,
  description,
  icon: Icon,
  onAction,
  title,
}: {
  actionLabel?: string
  actionIcon?: PhosphorIcon
  actionDisabled?: boolean
  description?: string
  icon: PhosphorIcon
  onAction?: () => void
  title: string
}) {
  return (
    <section className="home-empty-state" aria-label={title}>
      <span className="home-empty-state__icon" aria-hidden="true">
        <Icon size={25} weight="duotone" />
      </span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" disabled={actionDisabled} onClick={onAction}>
          {ActionIcon ? <ActionIcon size={17} weight="bold" aria-hidden="true" /> : null}
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

const FAMILY_FILTER_MEMBER_ORDER = ['member-child-yu', 'member-child-chen', 'member-elder-lin']
const FAMILY_FILTER_LABELS: Record<string, string> = {
  'member-child-yu': '外孙女',
  'member-child-chen': '儿子',
  'member-elder-lin': '姥姥',
}

const FAMILY_STATUS_INSIGHTS: Record<string, { records: { name: string; time: string; text: string }[]; insight: string }> = {
  [FAMILY_FILTER_ALL]: {
    records: [
      { name: '姥姥', time: '09:42', text: '已完成喝水提醒。' },
      { name: '知夏', time: '昨天', text: '发来小满的新画和一段语音。' },
      { name: '嘉禾', time: '前天', text: '更新了相框图库里的厨房照片。' },
    ],
    insight: '最近家里的记录一半是照顾，一半是分享日常，大家都在用很轻的方式让姥姥知道：家里有人惦记着她。',
  },
  'member-child-yu': {
    records: [
      { name: '知夏', time: '昨天', text: '发来小满的新画和一段语音。' },
      { name: '知夏', time: '4月28日', text: '上传 2 张周末照片到家庭相册。' },
      { name: '知夏', time: '4月26日', text: '代小满给姥姥发了一个贴纸回应。' },
    ],
    insight: '知夏最近发来的内容常常带着孩子，她在帮下一代和姥姥保持连接。可以提醒她多发孩子的声音和小作品。',
  },
  'member-child-chen': {
    records: [
      { name: '嘉禾', time: '前天', text: '更新了相框图库里的厨房照片。' },
      { name: '嘉禾', time: '3天前', text: '为姥姥设置了晚间吃药提醒。' },
      { name: '嘉禾', time: '本周', text: '上传一张老屋照片到拾光长河。' },
    ],
    insight: '嘉禾做的多是照顾和整理类的事，他不一定说很多，但一直在把姥姥的生活安排往前推。',
  },
  'member-elder-lin': {
    records: [
      { name: '姥姥', time: '09:42', text: '已完成喝水提醒。' },
      { name: '姥姥', time: '10:18', text: '相框停在孩子合照上 3 分钟。' },
      { name: '姥姥', time: '昨天', text: '回复了知夏发来的贴纸。' },
    ],
    insight: '姥姥最近更常停在孩子和老照片上，适合让家人多发一些有人物的照片，比单纯风景更能接住她。',
  },
}

const FAMILY_TREASURE_ENTRIES: {
  id: string
  title: string
  description: string
  icon: PhosphorIcon
  path: string
  tone: MemoryTone
}[] = [
  { id: 'river', title: '回忆录', description: '把老人讲过的故事整理成人生阶段和成稿。', icon: BookOpenText, path: '/member/memories', tone: 'sky' },
  { id: 'tree', title: '家谱树', description: '查看家人关系、成员分布和可邀请的亲属。', icon: Tree, path: '/member/family-tree', tone: 'pine' },
  { id: 'explore', title: '愿望清单', description: '一起记录家人想完成的事和共同计划。', icon: Storefront, path: '/member/exploration', tone: 'olive' },
]

const COMING_SOON_MESSAGE = '即将上线'

function FamilyMemberFilter({
  members,
  onAddMember,
  selectedMemberId,
  onSelect,
}: {
  members: FamilyMember[]
  onAddMember: () => void
  selectedMemberId: string
  onSelect: (memberId: string) => void
}) {
  const visibleMembers = FAMILY_FILTER_MEMBER_ORDER
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is FamilyMember => Boolean(member))

  return (
    <section className="home-family-people" aria-label="按家庭成员筛选">
      <div className="home-family-filter">
        <button className={selectedMemberId === FAMILY_FILTER_ALL ? 'home-family-person home-family-person--active' : 'home-family-person'} type="button" aria-pressed={selectedMemberId === FAMILY_FILTER_ALL} onClick={() => onSelect(FAMILY_FILTER_ALL)}>
          <span className="home-family-person__avatar home-family-person__avatar--all"><img src={getFamilyAvatarSrc()} alt="" aria-hidden="true" draggable={false} /></span>
          <strong>全家</strong>
        </button>
        {visibleMembers.map((member, index) => {
          const avatarSrc = getMemberAvatarSrc(member.id)
          return (
            <button className={selectedMemberId === member.id ? 'home-family-person home-family-person--active' : 'home-family-person'} type="button" aria-pressed={selectedMemberId === member.id} key={member.id} onClick={() => onSelect(member.id)}>
              <span className={avatarSrc ? 'home-family-person__avatar home-family-person__avatar--image' : 'home-family-person__avatar'}>
                {avatarSrc ? <img src={avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.avatar}
                {index === 0 ? <i>新</i> : null}
              </span>
              <strong>{FAMILY_FILTER_LABELS[member.id] || member.relation}</strong>
            </button>
          )
        })}
        <button className="home-family-person home-family-person--add" type="button" onClick={onAddMember}>
          <span className="home-family-person__avatar home-family-person__avatar--add" aria-hidden="true">
            <Plus size={25} weight="bold" />
          </span>
          <strong>添加成员</strong>
        </button>
      </div>
    </section>
  )
}

function FamilyInsightCard({ selectedMemberId }: { selectedMemberId: string }) {
  const insight = FAMILY_STATUS_INSIGHTS[selectedMemberId] || FAMILY_STATUS_INSIGHTS[FAMILY_FILTER_ALL]

  return (
    <section className="home-family-insight" aria-label="最新洞察">
      <h2>最新近况</h2>
      <article className="home-family-insight-card">
        <div className="home-family-insight-list">
          {insight.records.map((record) => (
            <div className="home-family-insight-item" key={`${record.name}-${record.time}-${record.text}`}>
              <span aria-hidden="true" />
              <div className="home-family-insight-item__row">
                <strong>{record.name}</strong>
                <p>{record.text}</p>
                <time>{record.time}</time>
              </div>
            </div>
          ))}
        </div>
        <p className="home-family-insight-ai"><strong>AI洞察：</strong>{insight.insight}</p>
      </article>
    </section>
  )
}

function MobileFamilyPostCard({
  members,
  onOpen,
  onToggleVoice,
  playingVoice,
  thread,
}: {
  members: FamilyMember[]
  onOpen: (threadId: string) => void
  onToggleVoice: (voiceId: string, durationSeconds?: number) => void
  playingVoice: VoicePlaybackState | null
  thread: InteractionThread
}) {
  const senderMember = members.find((member) => member.id === thread.senderId)
  const senderName = senderMember?.name || thread.senderName
  const senderAvatarSrc = getMemberAvatarSrc(senderMember?.id || thread.senderId)
  const senderMeta = senderMember?.city || '家里'
  const senderTime = formatRelativeTime(thread.latestAt)
  const senderVoice = thread.responses.find((response) => response.authorId === thread.senderId && response.method === 'voice' && response.durationSeconds)
  const isPlaying = senderVoice ? playingVoice?.id === senderVoice.id : false

  return (
    <article className="home-family-post-card">
      <button
        type="button"
        onClick={() => onOpen(thread.id)}
        aria-label={`查看${senderName}发来的互动`}
      >
        <div className="home-family-post-card__meta">
          <div className="home-family-post-card__sender">
            <span className={senderAvatarSrc ? 'home-family-post-card__avatar home-family-post-card__avatar--image' : 'home-family-post-card__avatar'} aria-hidden="true">
              {senderAvatarSrc ? <img src={senderAvatarSrc} alt="" draggable={false} /> : senderName.slice(-1)}
            </span>
            <div>
              <strong>{senderName}</strong>
              <small>{senderMeta}</small>
            </div>
          </div>
          <time>{senderTime}</time>
        </div>

        <img className="home-family-post-card__photo" src={thread.photoUrl} alt={thread.photoAlt} />
        <p className="home-family-post-card__copy">{thread.initialContent || thread.latestSnippet}</p>
        {senderVoice ? (
          <span
            className={isPlaying ? 'home-voice-pill home-voice-pill--playing home-family-post-card__voice' : 'home-voice-pill home-family-post-card__voice'}
            role="button"
            tabIndex={0}
            aria-label={isPlaying ? `暂停${senderName}的语音 ${senderVoice.durationSeconds} 秒` : `播放${senderName}的语音 ${senderVoice.durationSeconds} 秒`}
            aria-pressed={isPlaying}
            onClick={(event) => {
              event.stopPropagation()
              onToggleVoice(senderVoice.id, senderVoice.durationSeconds)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              onToggleVoice(senderVoice.id, senderVoice.durationSeconds)
            }}
          >
            <span className="home-voice-pill__icon" aria-hidden="true">
              {isPlaying ? (
                <i className="home-voice-wave">
                  <b />
                  <b />
                  <b />
                </i>
              ) : (
                <Play size={11} weight="fill" aria-hidden="true" />
              )}
            </span>
            <span className="home-voice-pill__time">{isPlaying ? `${String(playingVoice?.remainingSeconds || senderVoice.durationSeconds || 0).padStart(2, '0')}”` : `${senderVoice.durationSeconds}”`}</span>
          </span>
        ) : null}
        <span className="home-family-post-card__rule" aria-hidden="true" />
      </button>
    </article>
  )
}

function FamilyPostList({
  filteredThreads,
  members,
  onOpenThread,
  onToggleVoice,
  playingVoice,
}: {
  filteredThreads: InteractionThread[]
  members: FamilyMember[]
  onOpenThread: (threadId: string) => void
  onToggleVoice: (voiceId: string, durationSeconds?: number) => void
  playingVoice: VoicePlaybackState | null
}) {
  return (
    <section className="home-family-post-section" aria-label="近况动态">
      <h2>成员动态</h2>
      {filteredThreads.length > 0 ? (
        <div className="home-family-post-list" role="list">
          {filteredThreads.map((thread) => (
            <MobileFamilyPostCard
              key={thread.id}
              members={members}
              onOpen={onOpenThread}
              onToggleVoice={onToggleVoice}
              playingVoice={playingVoice}
              thread={thread}
            />
          ))}
        </div>
      ) : (
        <HomeEmptyState icon={HandHeart} title="还没有这位家人的互动" description="之后发来的照片、语音和老人回复都会出现在这里。" />
      )}
    </section>
  )
}

function FamilyStatusSection({
  filteredThreads,
  members,
  onAddMember,
  onOpenThread,
  onSelectMember,
  onToggleVoice,
  playingVoice,
  selectedMemberId,
}: {
  filteredThreads: InteractionThread[]
  members: FamilyMember[]
  onAddMember: () => void
  onOpenThread: (threadId: string) => void
  onSelectMember: (memberId: string) => void
  onToggleVoice: (voiceId: string, durationSeconds?: number) => void
  playingVoice: VoicePlaybackState | null
  selectedMemberId: string
}) {
  return (
    <section className="home-family-status-block" aria-label="家庭空间近况">
      <FamilyMemberFilter members={members} onAddMember={onAddMember} selectedMemberId={selectedMemberId} onSelect={onSelectMember} />
      <FamilyInsightCard selectedMemberId={selectedMemberId} />
      <FamilyPostList
        filteredThreads={filteredThreads}
        members={members}
        onOpenThread={onOpenThread}
        onToggleVoice={onToggleVoice}
        playingVoice={playingVoice}
      />
    </section>
  )
}

function StatusView({
  interactionThreads,
  members,
  onAddMember,
  onOpenThread,
  onSelectMember,
  onToggleVoice,
  playingVoice,
  selectedMemberId,
}: {
  interactionThreads: InteractionThread[]
  members: FamilyMember[]
  onAddMember: () => void
  onOpenThread: (threadId: string) => void
  onSelectMember: (memberId: string) => void
  onToggleVoice: (voiceId: string, durationSeconds?: number) => void
  playingVoice: VoicePlaybackState | null
  selectedMemberId: string
}) {
  const filteredThreads = selectedMemberId === FAMILY_FILTER_ALL
    ? interactionThreads
    : interactionThreads.filter((thread) => thread.senderId === selectedMemberId)

  return (
    <FamilyStatusSection
      filteredThreads={filteredThreads}
      members={members}
      onAddMember={onAddMember}
      onOpenThread={onOpenThread}
      onSelectMember={onSelectMember}
      onToggleVoice={onToggleVoice}
      playingVoice={playingVoice}
      selectedMemberId={selectedMemberId}
    />
  )
}

function TreasureView({
  onCancelEdit,
  onDeleteSelected,
  editing,
  photos,
  onOpenEntry,
  onToggleEdit,
  onTogglePhoto,
  onUpload,
  onOpenPhoto,
  selectedPhotoIds,
}: {
  editing: boolean
  photos: GalleryPhoto[]
  onCancelEdit: () => void
  onDeleteSelected: () => void
  onOpenEntry: (path: string) => void
  onToggleEdit: () => void
  onTogglePhoto: (photoId: string) => void
  onUpload: () => void
  onOpenPhoto: (photoId: string) => void
  selectedPhotoIds: string[]
}) {
  const [albumTab, setAlbumTab] = useState<TreasureAlbumTab>('latest')
  const albumGroups = getTreasureAlbumGroups(photos, albumTab)

  return (
    <section className="home-treasure-view" aria-label="家庭空间">
      <section className="home-live-frame-section" aria-label="实时相框">
        <div className="home-live-frame-section__heading">
          <h2>实时相框</h2>
          <button type="button" onClick={() => onOpenEntry('/member/treasure?toast=live-frame')}>
            <span>相框协助</span>
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <figure className="home-live-frame-preview" aria-label="相框端实时画面">
          <div className="home-live-frame-preview__screen">
            <span>林秀兰在线</span>
            <img src="/member-live-frame-preview.png" alt="相框端当前播放画面" draggable={false} />
          </div>
        </figure>
      </section>
      <section className="home-treasure-shortcuts" aria-label="我们的家">
        <h2>我们的家</h2>
        <div className="home-treasure-grid">
          {FAMILY_TREASURE_ENTRIES.map((entry) => {
            const Icon = entry.icon
            return (
              <button className={`home-treasure-card home-topic-card--tone-${entry.tone}`} key={entry.id} type="button" onClick={() => onOpenEntry(entry.path)}>
                <span className="home-treasure-card__icon" aria-hidden="true"><Icon size={29} weight="duotone" /></span>
                <span className="home-treasure-card__copy"><strong>{entry.title}</strong><em>{entry.description}</em></span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="home-treasure-album" aria-label="家庭相册">
        <div className="home-treasure-album__heading">
          <div>
            <h2>{editing ? `已选 ${selectedPhotoIds.length} 张` : '家庭相册'}</h2>
          </div>
          <div className="home-treasure-album__actions">
            {editing ? (
              <>
                <button type="button" aria-label="取消编辑" onClick={onCancelEdit}>
                  <X size={18} weight="bold" aria-hidden="true" />
                </button>
                <button className="home-treasure-album__danger-action" type="button" aria-label={`删除已选 ${selectedPhotoIds.length} 张照片`} disabled={selectedPhotoIds.length === 0} onClick={onDeleteSelected}>
                  <TrashSimple size={18} weight="bold" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button type="button" aria-label="添加照片" onClick={onUpload}>
                  <Plus size={18} weight="bold" aria-hidden="true" />
                </button>
                <button type="button" aria-label="编辑照片" onClick={onToggleEdit}>
                  <PencilSimpleLine size={17} weight="bold" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
        {photos.length > 0 ? (
          <>
            <div className="home-treasure-album-tabs" role="tablist" aria-label="家庭相册分类">
              {TREASURE_ALBUM_TABS.map((tab) => (
                <button
                  className={albumTab === tab.id ? 'home-treasure-album-tab home-treasure-album-tab--active' : 'home-treasure-album-tab'}
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
            <TreasureAlbumGroups
              editing={editing}
              groups={albumGroups}
              selectedPhotoIds={selectedPhotoIds}
              onOpenPhoto={onOpenPhoto}
              onTogglePhoto={onTogglePhoto}
            />
          </>
        ) : (
          <HomeEmptyState
            actionIcon={Plus}
            actionLabel="上传照片"
            icon={Image}
            title="还没有家庭相册"
            description="上传后，照片会出现在这里，也能继续选择哪些进入相框播放。"
            onAction={onUpload}
          />
        )}
      </section>
    </section>
  )
}

export function HomePage({ activeTab }: { activeTab: StoryTab }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [playingVoice, setPlayingVoice] = useState<VoicePlaybackState | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [galleryEditing, setGalleryEditing] = useState(false)
  const [galleryPhotoItems, setGalleryPhotoItems] = useState<GalleryPhoto[]>(() => getMockGalleryPhotos())
  const [selectedGalleryPhotoIds, setSelectedGalleryPhotoIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [topbarPinned, setTopbarPinned] = useState(false)
  const pageInnerRef = useRef<HTMLDivElement>(null)

  const members = getMockMembers()
  const [sessionInteractionThreads, setSessionInteractionThreads] = useState<InteractionThread[]>(() => getSessionInteractionThreads())
  // Prototype-only: `?empty=interaction|gallery|all` lets reviewers inspect empty states without changing mock data.
  const emptyPreview = searchParams.get('empty')
  const creationJustCompleted = searchParams.get('created') === '1'
  const interactionThreads = emptyPreview === 'interaction' || emptyPreview === 'all'
    ? []
    : [...sessionInteractionThreads, ...HOME_EXTRA_THREADS, ...getMockInteractionThreads()]
  const galleryPhotos = emptyPreview === 'gallery' || emptyPreview === 'all' ? [] : galleryPhotoItems.slice(0, MAX_GALLERY_PHOTO_COUNT)
  const galleryReachedLimit = galleryPhotos.length >= MAX_GALLERY_PHOTO_COUNT
  const memoryThemes = getMockMemoryThemes()
  const memberFilterParam = searchParams.get('member')
  const selectedMemberId = memberFilterParam && (memberFilterParam === FAMILY_FILTER_ALL || members.some((member) => member.id === memberFilterParam))
    ? memberFilterParam
    : FAMILY_FILTER_ALL
  const showTopbar = activeTab !== 'treasure'
  const hasTopbarActions = showTopbar
  const showBottomNav = activeTab !== 'gallery' && activeTab !== 'memory'
  const topbarTitle = activeTab === 'gallery'
    ? '家庭相册'
    : activeTab === 'memory'
      ? '拾光长河'
        : activeTab === 'treasure'
          ? ''
          : '近况'

  const openInteractionPicker = () => {
    setSheetOpen(true)
  }

  const selectMemberFilter = (memberId: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (memberId === FAMILY_FILTER_ALL) {
        next.delete('member')
      } else {
        next.set('member', memberId)
      }
      return next
    })
  }

  const showToast = (message: string) => {
    setToastMessage(message)
  }

  const openGalleryUploadPicker = () => {
    if (galleryReachedLimit && activeTab !== 'treasure') {
      showToast(`当前图库已达上限，最多上传 ${MAX_GALLERY_PHOTO_COUNT} 张`)
      return
    }
    if (activeTab === 'treasure') {
      navigate('/member/capture/snapshot?target=album&source=camera')
      return
    }
    setUploadSheetOpen(true)
  }

  const toggleVoicePlayback = (voiceId: string, durationSeconds?: number) => {
    const normalizedDuration = Math.max(1, durationSeconds || 1)
    setPlayingVoice((current) =>
      current?.id === voiceId
        ? null
        : {
            id: voiceId,
            durationSeconds: normalizedDuration,
            remainingSeconds: normalizedDuration,
          },
    )
  }

  const toggleGalleryPhoto = (photoId: string) => {
    setSelectedGalleryPhotoIds((current) =>
      current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId],
    )
  }

  const cancelGalleryEdit = () => {
    setGalleryEditing(false)
    setSelectedGalleryPhotoIds([])
    setDeleteDialogOpen(false)
  }

  const openGalleryPhotoNote = (photoId: string) => {
    navigate(`/member/gallery/photo/${photoId}`)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (activeTab === 'status' && creationJustCompleted) {
      showToast('家庭创建成功')
    }
  }, [activeTab, creationJustCompleted])

  useEffect(() => {
    const pageClassName = 'is-member-river-page'
    document.documentElement.classList.toggle(pageClassName, activeTab === 'memory')
    document.body.classList.toggle(pageClassName, activeTab === 'memory')

    return () => {
      document.documentElement.classList.remove(pageClassName)
      document.body.classList.remove(pageClassName)
    }
  }, [activeTab])

  useEffect(() => {
    if (!playingVoice) return undefined
    const timer = window.setInterval(() => {
      setPlayingVoice((current) => {
        if (!current) return null
        const nextRemaining = current.remainingSeconds - 1
        return nextRemaining > 0 ? { ...current, remainingSeconds: nextRemaining } : null
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [playingVoice?.id])

  useEffect(() => {
    const refreshSessionThreads = () => setSessionInteractionThreads(getSessionInteractionThreads())
    window.addEventListener('focus', refreshSessionThreads)
    window.addEventListener('shiguangxu:interaction-sent', refreshSessionThreads)
    return () => {
      window.removeEventListener('focus', refreshSessionThreads)
      window.removeEventListener('shiguangxu:interaction-sent', refreshSessionThreads)
    }
  }, [])

  useEffect(() => {
    if (loading) {
      setTopbarPinned(false)
      return undefined
    }

    const scrollContainer = pageInnerRef.current
    if (!scrollContainer) return undefined

    const updateTopbarState = () => {
      setTopbarPinned(hasTopbarActions && scrollContainer.scrollTop > 8)
    }

    updateTopbarState()
    scrollContainer.addEventListener('scroll', updateTopbarState, { passive: true })
    window.addEventListener('resize', updateTopbarState)

    return () => {
      scrollContainer.removeEventListener('scroll', updateTopbarState)
      window.removeEventListener('resize', updateTopbarState)
    }
  }, [activeTab, hasTopbarActions, loading])

  return (
    <div className="home-app-shell">
      <main
        className={[
          'home-page',
          activeTab === 'memory' ? 'home-page--member-river' : '',
          activeTab === 'treasure' ? 'home-page--treasure' : '',
        ].filter(Boolean).join(' ')}
        aria-label="子女端互动首页"
      >
        <div
          className={[
            'home-page__inner',
            hasTopbarActions ? '' : 'home-page__inner--static-topbar',
            showTopbar ? '' : 'home-page__inner--hidden-topbar',
            showBottomNav ? '' : 'home-page__inner--no-bottom-nav',
          ]
            .filter(Boolean)
            .join(' ')}
          ref={pageInnerRef}
        >
          {showTopbar ? (
            <header
              className={[
                'home-topbar',
                hasTopbarActions ? 'home-topbar--fixed' : 'home-topbar--static',
                topbarPinned ? 'home-topbar--pinned' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {activeTab === 'gallery' || activeTab === 'memory' ? (
                <button
                  className="home-icon-button home-icon-button--left"
                  type="button"
                  aria-label="返回家庭空间"
                  onClick={() => navigate('/member/treasure')}
                >
                  <CaretLeft size={21} weight="bold" aria-hidden="true" />
                </button>
              ) : activeTab === 'status' ? (
                <button className="home-icon-button home-icon-button--profile" type="button" aria-label="我的" onClick={() => navigate('/member/profile')}>
                  <UserCircle size={29} weight="fill" aria-hidden="true" />
                </button>
              ) : (
                <span className="home-topbar__spacer" aria-hidden="true" />
              )}
              <h1 className="home-topbar__title">{topbarTitle}</h1>
              {activeTab === 'gallery' ? (
                <div className="home-topbar__actions">
                  <button
                    className="home-icon-button"
                    type="button"
                    aria-label={galleryEditing ? '退出编辑图库' : '编辑图库'}
                    onClick={galleryEditing ? cancelGalleryEdit : () => {
                      setGalleryEditing(true)
                      setSelectedGalleryPhotoIds([])
                    }}
                  >
                    {galleryEditing ? <X size={20} weight="bold" aria-hidden="true" /> : <PencilSimpleLine size={19} weight="bold" aria-hidden="true" />}
                  </button>
                  <button
                    className={galleryEditing ? 'home-icon-button home-icon-button--danger' : 'home-icon-button'}
                    type="button"
                    aria-label={galleryEditing ? `删除已选 ${selectedGalleryPhotoIds.length} 张照片` : '上传照片'}
                    disabled={galleryEditing && selectedGalleryPhotoIds.length === 0}
                    onClick={() => {
                      if (galleryEditing) {
                        setDeleteDialogOpen(true)
                      } else {
                        openGalleryUploadPicker()
                      }
                    }}
                  >
                    {galleryEditing ? <TrashSimple size={19} weight="bold" aria-hidden="true" /> : <Plus size={21} weight="bold" aria-hidden="true" />}
                  </button>
                </div>
              ) : (
                <span className="home-topbar__spacer" aria-hidden="true" />
              )}
            </header>
          ) : null}

          {loading ? (
            <section className="home-content-stack home-skeleton-stack" aria-label="正在加载家庭互动">
              <div className="home-skeleton-hero" />
              <div className="home-skeleton-card" />
            </section>
          ) : (
            <section className="home-content-stack" aria-label="家庭互动内容">
              {activeTab === 'status' ? (
                <StatusView
                  interactionThreads={interactionThreads}
                  members={members}
                  playingVoice={playingVoice}
                  selectedMemberId={selectedMemberId}
                  onAddMember={() => showToast(COMING_SOON_MESSAGE)}
                  onOpenThread={(threadId) => navigate(`/member/interactions/${threadId}`)}
                  onSelectMember={selectMemberFilter}
                  onToggleVoice={toggleVoicePlayback}
                />
              ) : activeTab === 'treasure' ? (
                <TreasureView
                  editing={galleryEditing}
                  photos={galleryPhotos}
                  selectedPhotoIds={selectedGalleryPhotoIds}
                  onCancelEdit={cancelGalleryEdit}
                  onDeleteSelected={() => setDeleteDialogOpen(true)}
                  onOpenEntry={(path) => {
                    if (path.includes('toast=')) {
                      showToast(COMING_SOON_MESSAGE)
                      return
                    }
                    navigate(path)
                  }}
                  onToggleEdit={galleryEditing ? cancelGalleryEdit : () => {
                    setGalleryEditing(true)
                    setSelectedGalleryPhotoIds([])
                  }}
                  onTogglePhoto={toggleGalleryPhoto}
                  onUpload={openGalleryUploadPicker}
                  onOpenPhoto={openGalleryPhotoNote}
                />
              ) : activeTab === 'gallery' ? (
                <GalleryView
                  editing={galleryEditing}
                  photos={galleryPhotos}
                  reachedLimit={galleryReachedLimit}
                  selectedPhotoIds={selectedGalleryPhotoIds}
                  onTogglePhoto={toggleGalleryPhoto}
                  onUpload={openGalleryUploadPicker}
                  onOpenPhoto={openGalleryPhotoNote}
                />
              ) : (
                <MemoryView themes={memoryThemes} onSelectMemory={() => showToast(COMING_SOON_MESSAGE)} />
              )}
            </section>
          )}
        </div>

        {showBottomNav ? <MemberBottomNav activeTab={activeTab} onAdd={openInteractionPicker} /> : null}
      </main>

      {sheetOpen ? (
        <div className="home-drawer-overlay" role="presentation" onClick={() => setSheetOpen(false)}>
          <section
            className="home-action-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-action-drawer__header">
              <div>
                <h2 id="compose-drawer-title">记录</h2>
              </div>
              <button className="home-action-drawer__close" type="button" aria-label="关闭添加面板" onClick={() => setSheetOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="home-action-drawer__body">
              <button className="home-action-option" type="button" onClick={() => {
                setSheetOpen(false)
                navigate('/member/capture/snapshot')
              }}>
                <span className="home-action-option__icon" aria-hidden="true">
                  <Camera size={22} weight="regular" />
                </span>
                <span>
                  <strong>随手拍</strong>
                  <span className="home-action-option__desc">记录当下，并直接分享到家庭相框</span>
                </span>
              </button>
              <button className="home-action-option" type="button" onClick={() => {
                setSheetOpen(false)
                navigate('/member/capture/digitize')
              }}>
                <span className="home-action-option__icon" aria-hidden="true">
                  <Image size={22} weight="regular" />
                </span>
                <span>
                  <strong>照片电子化</strong>
                  <span className="home-action-option__desc">智能裁剪照片，减少纸面反光</span>
                </span>
              </button>
              <button className="home-action-option" type="button" onClick={() => {
                setSheetOpen(false)
                showToast(COMING_SOON_MESSAGE)
              }}>
                <span className="home-action-option__icon" aria-hidden="true">
                  <MagicWand size={22} weight="regular" />
                </span>
                <span>
                  <strong>老照片修复</strong>
                  <span className="home-action-option__desc">黑白照片上色，模糊照片高清</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {uploadSheetOpen && (!galleryReachedLimit || activeTab === 'treasure') ? (
        <div className="home-drawer-overlay" role="presentation" onClick={() => setUploadSheetOpen(false)}>
          <section
            className="home-action-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-action-drawer__header">
              <div>
                <h2 id="upload-drawer-title">上传照片</h2>
              </div>
              <button className="home-action-drawer__close" type="button" aria-label="关闭上传照片" onClick={() => setUploadSheetOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="home-action-drawer__body">
              <button className="home-action-option" type="button" onClick={() => {
                setUploadSheetOpen(false)
                navigate('/member/capture/snapshot?target=album&source=camera')
              }}>
                <span className="home-action-option__icon" aria-hidden="true">
                  <Camera size={22} weight="regular" />
                </span>
                <span>
                  <strong>拍摄</strong>
                  <span className="home-action-option__desc">拍完后录入照片备注</span>
                </span>
              </button>
              <button className="home-action-option" type="button" onClick={() => {
                setUploadSheetOpen(false)
                navigate('/member/capture/snapshot?target=album&source=album')
              }}>
                <span className="home-action-option__icon" aria-hidden="true">
                  <Image size={22} weight="regular" />
                </span>
                <span>
                  <strong>从相册选择</strong>
                  <span className="home-action-option__desc">选择后继续录语音备注</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {deleteDialogOpen ? (
        <div className="home-dialog-backdrop" role="presentation" onClick={() => setDeleteDialogOpen(false)}>
          <section className="home-delete-dialog" role="dialog" aria-modal="true" aria-label="确认删除照片" onClick={(event) => event.stopPropagation()}>
            <h2>删除选中的照片？</h2>
            <p>这 {selectedGalleryPhotoIds.length} 张照片会从图库移除，老人相框也不会继续轮播。</p>
            <div className="home-delete-dialog__actions">
              <button type="button" onClick={() => setDeleteDialogOpen(false)}>再想想</button>
              <button
                type="button"
                onClick={() => {
                  setGalleryPhotoItems((current) => current.filter((photo) => !selectedGalleryPhotoIds.includes(photo.id)))
                  cancelGalleryEdit()
                }}
              >
                确认删除
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toastMessage ? <div className="home-toast" role="status">{toastMessage}</div> : null}
    </div>
  )
}
