import {
  CaretLeft,
  CaretRight,
  CornersOut,
  Heart,
  Phone,
  Tree,
  UserPlus,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/home.css'

type FamilyTreeMember = {
  id: string
  name: string
  relation: string
  avatarSrc?: string
  city?: string
  status: string
  roleNote: string
  guardian?: boolean
  careContact?: boolean
  details: string[]
}

const TREE_PEOPLE: Record<string, FamilyTreeMember> = {
  mingshan: {
    id: 'relative-uncle',
    name: '陈明山',
    relation: '外公哥哥',
    avatarSrc: '/sheguang-avatars/avatar_grandpa.png',
    city: '无锡',
    status: '旁系亲属',
    roleNote: '外公这一支的哥哥，适合补充老照片里出现的亲戚关系。',
    details: ['可补充出生年份', '可关联老照片人物'],
  },
  mingyue: {
    id: 'relative-aunt',
    name: '陈明月',
    relation: '外公妹妹',
    avatarSrc: '/sheguang-avatars/avatar_grandma.png',
    city: '常州',
    status: '旁系亲属',
    roleNote: '外公这一支的妹妹，后续可从老照片里补全家庭故事。',
    details: ['已关联 2 张老照片', '可继续邀请家人确认'],
  },
  xiulan: {
    id: 'elder-lin',
    name: '林秀兰',
    relation: '外婆',
    avatarSrc: '/sheguang-avatars/family_grandma.png',
    city: '苏州',
    status: '相框主人',
    roleNote: '家庭相册、互动回复和时光长河都围绕她整理。',
    guardian: true,
    careContact: true,
    details: ['已绑定老人相框', '常看孩子近况', '喜欢老照片和家常菜故事'],
  },
  mingyuan: {
    id: 'elder-spouse',
    name: '陈明远',
    relation: '外公',
    avatarSrc: '/sheguang-avatars/avatar_grandpa.png',
    city: '苏州',
    status: '已记录',
    roleNote: '旧照片里经常出现，适合继续补充年轻时候的故事。',
    details: ['已收录 8 张老照片', '可补充出生年份', '可继续添加亲属关系'],
  },
  jiahe: {
    id: 'child-jiahe',
    name: '嘉禾',
    relation: '舅舅',
    avatarSrc: '/sheguang-avatars/avatar_jiahe_centered_v5.jpg',
    city: '苏州',
    status: '守望亲属',
    roleNote: '常发厨房、家里和周末安排，也负责帮外婆检查相框状态。',
    guardian: true,
    careContact: true,
    details: ['可发起全家通话', '最近上传 9 张照片', '有相框协助权限'],
  },
  minglan: {
    id: 'child-minglan',
    name: '明岚',
    relation: '妈妈',
    avatarSrc: '/sheguang-avatars/avatar_aunt.png',
    city: '杭州',
    status: '已记录',
    roleNote: '家里旧相册中常出现，也适合作为家庭故事的补充线索。',
    details: ['可补充互动记录', '可关联家庭相册'],
  },
  zhixia: {
    id: 'child-zhixia',
    name: '知夏',
    relation: '我',
    avatarSrc: '/sheguang-avatars/avatar_xiaomei.png',
    city: '上海',
    status: '守望亲属',
    roleNote: '常把小满和弟弟的日常发给外婆，是家庭互动里最活跃的人。',
    guardian: true,
    details: ['最近上传 12 张照片', '常发送语音互动', '可邀请新的家人加入'],
  },
  xiaoman: {
    id: 'grandchild-xiaoman',
    name: '小满',
    relation: '曾外孙女',
    avatarSrc: '/sheguang-avatars/avatar_child.png',
    city: '上海',
    status: '孩子近况',
    roleNote: '画画、写字和周末小事经常被家人发到相框。',
    details: ['有 6 条相关互动', '常出现在家庭相册', '适合整理成长片段'],
  },
  lele: {
    id: 'grandchild-lele',
    name: '乐乐',
    relation: '曾外孙',
    avatarSrc: '/sheguang-avatars/avatar_child.png',
    city: '上海',
    status: '孩子近况',
    roleNote: '常和小满一起出现在照片里，很多语音里会提到他的小问题。',
    details: ['有 4 条相关互动', '常出现在合照', '适合补充生日信息'],
  },
  anan: {
    id: 'grandchild-anan',
    name: '安安',
    relation: '弟弟',
    avatarSrc: '/sheguang-avatars/avatar_child.png',
    city: '杭州',
    status: '已记录',
    roleNote: '明岚家的孩子，之后可以把同城聚会的照片归到这一支。',
    details: ['可补充生日', '可关联节日团圆照片'],
  },
  niannian: {
    id: 'grandchild-niannian',
    name: '念念',
    relation: '妹妹',
    avatarSrc: '/sheguang-avatars/family_xiaomei.png',
    city: '杭州',
    status: '已记录',
    roleNote: '明岚家的孩子，适合补充成长照片和手工作品。',
    details: ['可补充照片', '可关联孩子作品'],
  },
}

const TREE_MEMBERS = [
  TREE_PEOPLE.xiulan,
  TREE_PEOPLE.mingyuan,
  TREE_PEOPLE.jiahe,
  TREE_PEOPLE.minglan,
  TREE_PEOPLE.zhixia,
]
const TREE_MEMBERS_BY_ID = TREE_MEMBERS.reduce<Record<string, FamilyTreeMember>>((map, member) => {
  map[member.id] = member
  return map
}, {})

type FamilyTreeDescendant = {
  memberId: FamilyTreeMember['id']
  children?: FamilyTreeDescendant[]
}

const GRANDPARENT_AXIS = [
  TREE_PEOPLE.xiulan.id,
  TREE_PEOPLE.mingyuan.id,
]

const DESCENDANT_TREE: FamilyTreeDescendant[] = [
  { memberId: TREE_PEOPLE.jiahe.id },
  {
    memberId: TREE_PEOPLE.minglan.id,
    children: [
      { memberId: TREE_PEOPLE.zhixia.id },
    ],
  },
]

const MEMBER_TREE_VISIBLE_MEMBER_IDS = [
  TREE_PEOPLE.xiulan.id,
  TREE_PEOPLE.mingyuan.id,
  TREE_PEOPLE.jiahe.id,
  TREE_PEOPLE.minglan.id,
  TREE_PEOPLE.zhixia.id,
]

const TREE_LAYOUT = {
  levelGap: 156,
  nameAnchorY: 104,
  personWidth: 124,
  siblingGap: 28,
  generationPeerGap: 168,
  nodeHeight: 128,
  paddingX: 100,
  paddingY: 230,
}

const TREE_PAPER_SIZE = {
  height: 900,
  width: 1350,
}

const TREE_ZOOM = 0.56
const TREE_FULLSCREEN_ZOOM = 1.04
const COMING_SOON_MESSAGE = '即将上线'

type FamilyTreeLayoutItem = {
  member: FamilyTreeMember
  x: number
  y: number
}

type FamilyTreeEdge = {
  childIds: string[]
  parentIds: string[]
}

type FamilyTreePeerEdge = {
  fromId: string
  toId: string
}

type FamilyTreeLayout = {
  canvasHeight: number
  canvasWidth: number
  centerX: number
  edges: FamilyTreeEdge[]
  items: FamilyTreeLayoutItem[]
  peerEdges: FamilyTreePeerEdge[]
}

function getDescendantSubtreeWidth(node: FamilyTreeDescendant): number {
  const children = node.children || []
  if (!children.length) return TREE_LAYOUT.personWidth
  const childrenWidth = children.reduce((sum, child) => sum + getDescendantSubtreeWidth(child), 0) + (children.length - 1) * TREE_LAYOUT.siblingGap
  return Math.max(TREE_LAYOUT.personWidth, childrenWidth)
}

function getDescendantTreeWidth(nodes: FamilyTreeDescendant[]) {
  if (!nodes.length) return 0
  return nodes.reduce((sum, node) => sum + getDescendantSubtreeWidth(node), 0) + (nodes.length - 1) * TREE_LAYOUT.siblingGap
}

function getDescendantTreeDepth(nodes: FamilyTreeDescendant[], depth = 1): number {
  return nodes.reduce((maxDepth, node) => {
    const childDepth = node.children?.length ? getDescendantTreeDepth(node.children, depth + 1) : depth
    return Math.max(maxDepth, childDepth)
  }, depth)
}

function buildFamilyTreeLayout() {
  const items: FamilyTreeLayoutItem[] = []
  const edges: FamilyTreeEdge[] = []
  const peerEdges: FamilyTreePeerEdge[] = []
  let contentLeft = Number.POSITIVE_INFINITY
  let contentRight = Number.NEGATIVE_INFINITY
  const trackBounds = (x: number) => {
    contentLeft = Math.min(contentLeft, x - TREE_LAYOUT.personWidth / 2)
    contentRight = Math.max(contentRight, x + TREE_LAYOUT.personWidth / 2)
  }

  const layoutDescendantNode = (node: FamilyTreeDescendant, left: number, depth: number): { centerX: number; width: number } => {
    const member = TREE_MEMBERS_BY_ID[node.memberId]
    if (!member) return { centerX: left + TREE_LAYOUT.personWidth / 2, width: TREE_LAYOUT.personWidth }
    const subtreeWidth = getDescendantSubtreeWidth(node)
    let x = left + subtreeWidth / 2
    const y = TREE_LAYOUT.paddingY + depth * TREE_LAYOUT.levelGap

    if (node.children?.length) {
      const childrenWidth = getDescendantTreeWidth(node.children)
      let childLeft = x - childrenWidth / 2
      edges.push({ parentIds: [node.memberId], childIds: node.children.map((child) => child.memberId) })
      const childCenters: number[] = []
      node.children.forEach((child) => {
        const childLayout = layoutDescendantNode(child, childLeft, depth + 1)
        childCenters.push(childLayout.centerX)
        childLeft += getDescendantSubtreeWidth(child) + TREE_LAYOUT.siblingGap
      })
      if (childCenters.length) {
        x = (childCenters[0] + childCenters[childCenters.length - 1]) / 2
      }
    }

    items.push({ member, x, y })
    trackBounds(x)
    return { centerX: x, width: subtreeWidth }
  }

  let descendantLeft = 0
  edges.push({ parentIds: [TREE_PEOPLE.xiulan.id, TREE_PEOPLE.mingyuan.id], childIds: DESCENDANT_TREE.map((node) => node.memberId) })
  const firstGenerationCenters: number[] = []
  DESCENDANT_TREE.forEach((node) => {
    const layout = layoutDescendantNode(node, descendantLeft, 1)
    firstGenerationCenters.push(layout.centerX)
    descendantLeft += getDescendantSubtreeWidth(node) + TREE_LAYOUT.siblingGap
  })

  const coupleCenterX = firstGenerationCenters.length
    ? (firstGenerationCenters[0] + firstGenerationCenters[firstGenerationCenters.length - 1]) / 2
    : 0
  const grandparentY = TREE_LAYOUT.paddingY
  const ancestorPositions: Record<string, number> = {
    [TREE_PEOPLE.xiulan.id]: coupleCenterX - TREE_LAYOUT.generationPeerGap / 2,
    [TREE_PEOPLE.mingyuan.id]: coupleCenterX + TREE_LAYOUT.generationPeerGap / 2,
  }

  GRANDPARENT_AXIS.forEach((memberId) => {
    const member = TREE_MEMBERS_BY_ID[memberId]
    if (!member) return
    const x = ancestorPositions[memberId]
    items.push({ member, x, y: grandparentY })
    trackBounds(x)
  })
  peerEdges.push({ fromId: TREE_PEOPLE.xiulan.id, toId: TREE_PEOPLE.mingyuan.id })

  const maxDepth = getDescendantTreeDepth(DESCENDANT_TREE)
  const shiftX = TREE_LAYOUT.paddingX - contentLeft
  items.forEach((item) => {
    item.x += shiftX
  })
  contentRight += shiftX
  contentLeft += shiftX

  return {
    canvasHeight: TREE_LAYOUT.paddingY * 2 + (maxDepth + 1) * TREE_LAYOUT.nodeHeight + maxDepth * (TREE_LAYOUT.levelGap - TREE_LAYOUT.nodeHeight),
    canvasWidth: TREE_LAYOUT.paddingX * 2 + contentRight - contentLeft,
    centerX: coupleCenterX + shiftX,
    edges,
    items,
    peerEdges,
  }
}

function TreePersonCard({
  member,
  selected,
  onSelect,
}: {
  member: FamilyTreeMember
  selected: boolean
  onSelect: (memberId: string) => void
}) {
  const isSelf = member.id === TREE_PEOPLE.zhixia.id
  const className = [
    'member-tree-person',
    selected ? 'member-tree-person--active' : '',
    isSelf ? 'member-tree-person--self' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={className}
      type="button"
      aria-pressed={selected}
      data-member-id={member.id}
      onClick={() => onSelect(member.id)}
    >
      <span className="member-tree-person__avatar">
        {member.avatarSrc ? <img src={member.avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.name.slice(-1)}
      </span>
      <strong>{isSelf ? member.name : `${member.relation}${member.name}`}</strong>
      {isSelf ? <small className="member-tree-person__self-badge">本人</small> : null}
    </button>
  )
}

function MemberInfoRow({
  member,
  selected,
  onSelect,
}: {
  member: FamilyTreeMember
  selected: boolean
  onSelect: (memberId: string) => void
}) {
  return (
    <button
      className={selected ? 'member-tree-info-row member-tree-info-row--active' : 'member-tree-info-row'}
      type="button"
      onClick={() => onSelect(member.id)}
    >
      <span className="member-tree-info-row__avatar">
        {member.avatarSrc ? <img src={member.avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.name.slice(-1)}
      </span>
      <span className="member-tree-info-row__copy">
        <strong>{member.name}</strong>
        <em>{member.city || '地区待补充'}</em>
      </span>
      <CaretRight className="member-tree-info-row__arrow" size={16} weight="bold" aria-hidden="true" />
    </button>
  )
}

export function MemberFamilyTreePage() {
  const navigate = useNavigate()
  const pageInnerRef = useRef<HTMLDivElement>(null)
  const treeBoardRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ active: false, moved: false, pointerId: 0, scrollLeft: 0, scrollTop: 0, x: 0, y: 0 })
  const hasMountedSelectionRef = useRef(false)
  const [selectedMemberId, setSelectedMemberId] = useState('child-zhixia')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isTreeFullscreen, setIsTreeFullscreen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [topbarPinned, setTopbarPinned] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const selectedMember = TREE_MEMBERS.find((member) => member.id === selectedMemberId) || TREE_MEMBERS[0]
  const visibleTreeMembers = TREE_MEMBERS.filter((member) => MEMBER_TREE_VISIBLE_MEMBER_IDS.includes(member.id))
  const treeLayout: FamilyTreeLayout = useMemo(() => buildFamilyTreeLayout(), [])
  const treeZoom = isTreeFullscreen ? TREE_FULLSCREEN_ZOOM : TREE_ZOOM
  const treeSurfaceHeight = TREE_PAPER_SIZE.height * treeZoom
  const treeSurfaceWidth = TREE_PAPER_SIZE.width * treeZoom
  const treeCanvasLeft = (TREE_PAPER_SIZE.width / 2 - treeLayout.centerX) * treeZoom

  const showComingSoon = () => {
    setToastMessage(COMING_SOON_MESSAGE)
  }

  const handleTreePointerDown = (event: PointerEvent<HTMLElement>) => {
    const board = treeBoardRef.current
    if (!board) return
    dragStartRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: board.scrollLeft,
      scrollTop: board.scrollTop,
      x: event.clientX,
      y: event.clientY,
    }
    setIsPanning(true)
    board.setPointerCapture(event.pointerId)
  }

  const handleTreePointerMove = (event: PointerEvent<HTMLElement>) => {
    const board = treeBoardRef.current
    const dragStart = dragStartRef.current
    if (!board || !dragStart.active || dragStart.pointerId !== event.pointerId) return
    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragStart.moved = true
      event.preventDefault()
    }
    board.scrollLeft = dragStart.scrollLeft - deltaX
    board.scrollTop = dragStart.scrollTop - deltaY
  }

  const stopTreePan = (event: PointerEvent<HTMLElement>) => {
    if (dragStartRef.current.pointerId === event.pointerId) {
      dragStartRef.current.active = false
      setIsPanning(false)
      if (treeBoardRef.current?.hasPointerCapture(event.pointerId)) {
        treeBoardRef.current.releasePointerCapture(event.pointerId)
      }
    }
  }

  const handleTreeClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!dragStartRef.current.moved) return
    event.preventDefault()
    event.stopPropagation()
    dragStartRef.current.moved = false
  }

  useEffect(() => {
    const board = treeBoardRef.current
    if (!board) return
    const centerTree = () => {
      board.scrollLeft = Math.max(0, (board.scrollWidth - board.clientWidth) / 2)
      board.scrollTop = 0
    }
    const frameId = window.requestAnimationFrame(centerTree)
    const timeoutId = window.setTimeout(centerTree, 120)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [isTreeFullscreen, treeSurfaceWidth])

  useEffect(() => {
    if (!hasMountedSelectionRef.current) {
      hasMountedSelectionRef.current = true
      return
    }
    const board = treeBoardRef.current
    if (!board) return
    const target = board.querySelector<HTMLElement>(`[data-member-id="${selectedMemberId}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [selectedMemberId])

  useEffect(() => {
    const scrollContainer = pageInnerRef.current
    if (!scrollContainer) return
    const updateTopbarState = () => setTopbarPinned(scrollContainer.scrollTop > 8)
    updateTopbarState()
    scrollContainer.addEventListener('scroll', updateTopbarState, { passive: true })

    return () => scrollContainer.removeEventListener('scroll', updateTopbarState)
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const treeCard = (
    <section className={isTreeFullscreen ? 'member-tree-card member-tree-card--fullscreen' : 'member-tree-card'} aria-label="三代家谱关系图">
      {isTreeFullscreen ? null : (
        <button className="member-tree-fullscreen-trigger" type="button" aria-label="放大家谱树" onClick={() => setIsTreeFullscreen(true)}>
          <CornersOut size={21} weight="bold" aria-hidden="true" />
        </button>
      )}
      <div
        className={isPanning ? 'member-tree-viewport member-tree-viewport--panning' : 'member-tree-viewport'}
        ref={treeBoardRef}
        onPointerDown={handleTreePointerDown}
        onPointerMove={handleTreePointerMove}
        onPointerUp={stopTreePan}
        onPointerCancel={stopTreePan}
        onLostPointerCapture={stopTreePan}
        onClickCapture={handleTreeClickCapture}
      >
        <div
          className="member-family-tree-surface"
          style={{
            height: treeSurfaceHeight,
            width: treeSurfaceWidth,
          }}
        >
          <div
            className="member-family-tree-canvas"
            style={{
              height: treeLayout.canvasHeight,
              left: treeCanvasLeft,
              transform: `scale(${treeZoom})`,
              width: treeLayout.canvasWidth,
            }}
          >
            <svg className="member-family-tree-lines" viewBox={`0 0 ${treeLayout.canvasWidth} ${treeLayout.canvasHeight}`} aria-hidden="true">
              {treeLayout.peerEdges.map((edge) => {
                const from = treeLayout.items.find((item) => item.member.id === edge.fromId)
                const to = treeLayout.items.find((item) => item.member.id === edge.toId)
                if (!from || !to) return null
                const y = from.y + TREE_LAYOUT.nameAnchorY
                return <path key={`${edge.fromId}-${edge.toId}`} d={`M ${from.x} ${y} H ${to.x}`} />
              })}
              {treeLayout.edges.map((edge) => {
                const parents = edge.parentIds
                  .map((parentId) => treeLayout.items.find((item) => item.member.id === parentId))
                  .filter((item): item is FamilyTreeLayoutItem => Boolean(item))
                const children = edge.childIds
                  .map((childId) => treeLayout.items.find((item) => item.member.id === childId))
                  .filter((item): item is FamilyTreeLayoutItem => Boolean(item))
                if (!parents.length || !children.length) return null
                const startX = parents.reduce((sum, parent) => sum + parent.x, 0) / parents.length
                const startY = parents[0].y + TREE_LAYOUT.nameAnchorY
                const childTopY = children[0].y + TREE_LAYOUT.nameAnchorY
                const middleY = startY + Math.max(28, (childTopY - startY) / 2)
                const minChildX = Math.min(...children.map((child) => child.x))
                const maxChildX = Math.max(...children.map((child) => child.x))
                return (
                  <g key={`${edge.parentIds.join('-')}-${edge.childIds.join('-')}`}>
                    <path d={`M ${startX} ${startY} V ${middleY}`} />
                    <path d={`M ${minChildX} ${middleY} H ${maxChildX}`} />
                    <circle cx={startX} cy={middleY} r="3.5" />
                    {children.map((child) => (
                      <g key={child.member.id}>
                        <path d={`M ${child.x} ${middleY} V ${childTopY}`} />
                        <circle cx={child.x} cy={middleY} r="2.8" />
                      </g>
                    ))}
                  </g>
                )
              })}
            </svg>
            {treeLayout.items.map((item) => (
              <div
                className="member-tree-family-node"
                key={item.member.id}
                style={{
                  left: item.x - TREE_LAYOUT.personWidth / 2,
                  top: item.y,
                  width: TREE_LAYOUT.personWidth,
                }}
              >
                <TreePersonCard member={item.member} selected={selectedMember.id === item.member.id} onSelect={setSelectedMemberId} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div className="home-app-shell">
      <main className="home-page member-tree-page" aria-label="家谱树">
        <div className="home-page__inner home-page__inner--no-bottom-nav" ref={pageInnerRef}>
          <header className={topbarPinned ? 'home-topbar home-topbar--fixed home-topbar--pinned' : 'home-topbar home-topbar--fixed'}>
            <button
              className="home-icon-button home-icon-button--left"
              type="button"
              aria-label="返回家庭空间"
              onClick={() => navigate('/member/treasure')}
            >
              <CaretLeft size={21} weight="bold" aria-hidden="true" />
            </button>
            <h1 className="home-topbar__title">家谱树</h1>
            <button className="home-icon-button home-icon-button--right member-tree-invite-button" type="button" aria-label="邀请成员" onClick={() => setInviteOpen(true)}>
              <UserPlus size={22} weight="bold" aria-hidden="true" />
              <span>邀请</span>
            </button>
          </header>

          {isTreeFullscreen ? null : treeCard}

          <section className="member-tree-info-panel" aria-label="成员信息">
            <div className="member-tree-info-panel__head">
              <h2>成员信息({visibleTreeMembers.length})</h2>
            </div>
            <div className="member-tree-info-list">
              {visibleTreeMembers.map((member) => (
                <MemberInfoRow key={member.id} member={member} selected={selectedMember.id === member.id} onSelect={setSelectedMemberId} />
              ))}
            </div>
          </section>
        </div>

        {inviteOpen ? (
          <div className="home-drawer-overlay" role="presentation" onClick={() => setInviteOpen(false)}>
            <section
              className="home-action-drawer member-tree-invite-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="member-tree-invite-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="home-action-drawer__header">
                <div>
                  <h2 id="member-tree-invite-title">邀请家人加入</h2>
                </div>
                <button className="home-action-drawer__close" type="button" aria-label="关闭邀请成员" onClick={() => setInviteOpen(false)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="member-tree-invite-options">
                {[
                  { icon: Heart, title: '邀请守望亲属', desc: '适合子女、孙辈，能上传互动和协助相框。' },
                  { icon: Phone, title: '添加照护联系人', desc: '适合护工、邻居或紧急联系人，只展示必要信息。' },
                  { icon: Tree, title: '补充已故亲人', desc: '用于完善家谱和老照片人物，不发送邀请。' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button key={item.title} className="home-action-option" type="button" onClick={() => {
                      setInviteOpen(false)
                      showComingSoon()
                    }}>
                      <span className="home-action-option__icon" aria-hidden="true">
                        <Icon size={22} weight="regular" />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <span className="home-action-option__desc">{item.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        ) : null}
        {isTreeFullscreen ? (
          <div className="member-tree-fullscreen-layer" role="dialog" aria-modal="true" aria-label="放大家谱树">
            {treeCard}
            <button className="member-tree-fullscreen-close" type="button" aria-label="关闭家谱树放大查看" onClick={() => setIsTreeFullscreen(false)}>
              <X size={25} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {toastMessage ? <div className="home-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
      </main>
    </div>
  )
}
