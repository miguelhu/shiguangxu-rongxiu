import { CaretLeft, CheckCircle, Circle, Plus, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMockFamilyExplorationItems, getMockMembers } from '../mock'
import '../styles/home.css'
import type { FamilyExplorationItem, FamilyMember } from '../types'
import { FAMILY_FILTER_ALL, getFamilyAvatarSrc, getMemberAvatarSrc } from '../utils/familyAvatars'
import { getWishlistPresentation } from '../utils/wishlistPresentation'

type WishlistFilter = typeof FAMILY_FILTER_ALL | 'member-child-yu' | 'member-child-chen' | 'member-elder-lin'

const WISHLIST_MEMBER_ORDER: WishlistFilter[] = [
  FAMILY_FILTER_ALL,
  'member-child-yu',
  'member-child-chen',
  'member-elder-lin',
]

function getWishlistItems(items: FamilyExplorationItem[], filter: WishlistFilter) {
  if (filter === FAMILY_FILTER_ALL) return items.filter((item) => item.ownerType === 'family')
  if (filter === 'member-elder-lin') {
    return items.filter((item) => item.ownerId === filter && getWishlistVisibility(item) === 'family')
  }
  return items.filter((item) => item.ownerId === filter)
}

function groupWishlistItems(items: FamilyExplorationItem[]) {
  return [
    {
      id: 'todo',
      title: '待完成',
      items: items.filter((item) => item.status !== 'completed'),
    },
    {
      id: 'completed',
      title: '已完成',
      items: items.filter((item) => item.status === 'completed'),
    },
  ]
}

function getWishlistVisibility(item: FamilyExplorationItem) {
  if (item.status === 'completed') return 'family'
  return item.visibility || (item.ownerType === 'elder' && item.status === 'wish' ? 'private' : 'family')
}

function getMemberShortName(member: FamilyMember) {
  if (member.id === 'member-child-yu') return '知夏'
  if (member.id === 'member-child-chen') return '嘉禾'
  return member.name
}

function createWishlistItem(title: string, filter: WishlistFilter, members: FamilyMember[]): FamilyExplorationItem {
  const now = Date.now()
  const activeMember = filter === FAMILY_FILTER_ALL ? undefined : members.find((member) => member.id === filter)
  const ownerName = activeMember ? getMemberShortName(activeMember) : '全家'

  return {
    id: `explore-custom-${now}`,
    ownerId: filter === FAMILY_FILTER_ALL ? 'family' : filter,
    ownerName,
    ownerType: filter === FAMILY_FILTER_ALL ? 'family' : activeMember?.role === 'elder' ? 'elder' : 'member',
    title,
    summary: '',
    reason: '',
    category: '自定义愿望',
    status: 'wish',
    statusLabel: '想做',
    visibility: filter === 'member-elder-lin' ? 'private' : 'family',
    participantNames: filter === FAMILY_FILTER_ALL ? ['全家'] : [ownerName],
    nextStep: '',
    dateLabel: '刚刚',
    photoUrl: '',
  }
}

export function MemberExplorationPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<WishlistFilter>(FAMILY_FILTER_ALL)
  const [items, setItems] = useState<FamilyExplorationItem[]>(() => getMockFamilyExplorationItems())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newWishTitle, setNewWishTitle] = useState('')
  const members = useMemo(() => getMockMembers(), [])
  const visibleMembers = WISHLIST_MEMBER_ORDER
    .filter((memberId) => memberId !== FAMILY_FILTER_ALL)
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is FamilyMember => Boolean(member))
  const visibleItems = getWishlistItems(items, activeFilter)
  const groupedItems = groupWishlistItems(visibleItems)
  const canAddWish = newWishTitle.trim().length > 0

  const closeAddDialog = () => {
    setAddDialogOpen(false)
    setNewWishTitle('')
  }

  const submitWish = () => {
    const title = newWishTitle.trim()
    if (!title) return
    setItems((currentItems) => [createWishlistItem(title, activeFilter, members), ...currentItems])
    closeAddDialog()
  }

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

  return (
    <main className="member-explore-page member-wishlist-page" aria-label="愿望清单">
      <header className="member-explore-topbar">
        <button type="button" aria-label="返回家庭空间" onClick={() => navigate('/member/treasure')}>
          <CaretLeft size={22} weight="bold" aria-hidden="true" />
        </button>
        <h1>愿望清单</h1>
        <button className="member-explore-topbar__add" type="button" aria-label="新增愿望" onClick={() => setAddDialogOpen(true)}>
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </header>

      <nav className="member-wishlist-member-filter" aria-label="愿望清单成员筛选">
        <button className={activeFilter === FAMILY_FILTER_ALL ? 'member-wishlist-person is-active' : 'member-wishlist-person'} type="button" aria-pressed={activeFilter === FAMILY_FILTER_ALL} onClick={() => {
          setActiveFilter(FAMILY_FILTER_ALL)
        }}>
          <span className="member-wishlist-person__avatar member-wishlist-person__avatar--all"><img src={getFamilyAvatarSrc()} alt="" aria-hidden="true" draggable={false} /></span>
          <strong>全家</strong>
        </button>
        {visibleMembers.map((member) => {
          const avatarSrc = getMemberAvatarSrc(member.id)
          return (
            <button className={activeFilter === member.id ? 'member-wishlist-person is-active' : 'member-wishlist-person'} type="button" aria-pressed={activeFilter === member.id} key={member.id} onClick={() => {
              setActiveFilter(member.id as WishlistFilter)
            }}>
              <span className={avatarSrc ? 'member-wishlist-person__avatar member-wishlist-person__avatar--image' : 'member-wishlist-person__avatar'}>
                {avatarSrc ? <img src={avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.avatar}
              </span>
              <strong>{member.relation}</strong>
            </button>
          )
        })}
      </nav>

      <section className="member-explore-list member-wishlist-list" aria-label="愿望内容">
        {groupedItems.map((group) => (
          <section className="member-wishlist-group" key={group.id} aria-label={group.title}>
            <h2>{group.title}</h2>
            <div className="member-wishlist-group__list">
              {group.items.length > 0 ? group.items.map((item) => {
                const { Icon, tone } = getWishlistPresentation(item)
                return (
                  <article className={`member-wishlist-card member-wishlist-card--${item.status}`} key={item.id}>
                    <button className="member-wishlist-card__main" type="button" aria-label={item.status === 'completed' ? `恢复${item.title}为待完成` : `标记${item.title}为已完成`} onClick={() => toggleWishStatus(item.id)}>
                      <span className={`member-wishlist-card__icon member-wishlist-card__icon--${tone}`} aria-hidden="true">
                        <Icon size={21} weight="duotone" />
                      </span>
                      <span className="member-wishlist-card__copy">
                        <strong>{item.title}</strong>
                      </span>
                      <span className="member-wishlist-card__check" aria-hidden="true">
                        {item.status === 'completed' ? <CheckCircle size={25} weight="fill" /> : <Circle size={25} weight="regular" />}
                      </span>
                    </button>
                  </article>
                )
              }) : (
                <p className="member-wishlist-group__empty">暂时还没有</p>
              )}
            </div>
          </section>
        ))}
      </section>

      {addDialogOpen ? (
        <div className="member-wishlist-dialog-backdrop" role="presentation" onClick={closeAddDialog}>
          <section className="member-wishlist-dialog" role="dialog" aria-modal="true" aria-label="添加愿望清单" onClick={(event) => event.stopPropagation()}>
            <button className="member-wishlist-dialog__close" type="button" aria-label="关闭添加愿望清单" onClick={closeAddDialog}>
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
            <h2>添加愿望清单</h2>
            <input
              autoFocus
              value={newWishTitle}
              onChange={(event) => setNewWishTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitWish()
              }}
              placeholder="例如：周末一起去公园散步"
            />
            <div className="member-wishlist-dialog__actions">
              <button type="button" disabled={!canAddWish} onClick={submitWish}>添加</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
