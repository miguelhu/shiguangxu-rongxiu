import { HouseLine, Plus, TreasureChest } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import type { StoryTab } from '../types'

export function MemberBottomNav({
  activeTab,
  onAdd,
}: {
  activeTab: StoryTab
  onAdd?: () => void
}) {
  const navigate = useNavigate()
  const isStatusSection = activeTab === 'status'
  const isTreasureSection = activeTab === 'treasure' || activeTab === 'gallery' || activeTab === 'memory'

  return (
    <nav className="home-bottom-nav" aria-label="子女端底部导航">
      <button
        className={isStatusSection ? 'home-bottom-nav__item home-bottom-nav__item--active' : 'home-bottom-nav__item'}
        type="button"
        onClick={() => navigate('/member/home')}
      >
        <HouseLine size={24} weight={isStatusSection ? 'fill' : 'regular'} aria-hidden="true" />
        <span>近况</span>
      </button>
      <button
        className="home-bottom-nav__add"
        type="button"
        aria-label="记录照片或录音"
        onClick={onAdd}
      >
        <span className="home-bottom-nav__add-icon" aria-hidden="true">
          <Plus size={29} weight="bold" />
        </span>
        <span className="home-bottom-nav__add-label">记录</span>
      </button>
      <button
        className={isTreasureSection ? 'home-bottom-nav__item home-bottom-nav__item--active' : 'home-bottom-nav__item'}
        type="button"
        onClick={() => navigate('/member/treasure')}
      >
        <TreasureChest size={24} weight={isTreasureSection ? 'fill' : 'regular'} aria-hidden="true" />
        <span>家庭空间</span>
      </button>
    </nav>
  )
}
