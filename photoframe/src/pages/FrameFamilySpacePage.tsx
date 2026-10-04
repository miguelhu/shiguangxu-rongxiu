import {
  CaretLeft,
  ChatCircleText,
  CornersOut,
  FilmStrip,
  Microphone,
  Phone,
  Question,
  Sparkle,
  VideoCamera,
  UserPlus,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveScenario, withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { MOCK_MEMBERS, getMockFamilyDynamics, getMockFamilyWeeklyRecap, getMockMembers } from '../mock'
import { getFamilyAvatarSrc, getMemberAvatarSrc, getMemberAvatarSrcByName } from '../utils/familyAvatars'

type FamilyFilterKey = 'all' | string
type FamilySpaceTab = 'history' | 'tree'

type FamilyTreeMember = {
  id: string
  name: string
  relation: string
  avatarSrc?: string
  birthDate?: string
  biography?: string
  deathDate?: string
  city?: string
  status: string
  roleNote: string
  guardian?: boolean
  careContact?: boolean
  details: string[]
}

type FamilyTreeDescendant = {
  memberId: FamilyTreeMember['id']
  children?: FamilyTreeDescendant[]
}

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
  centerX?: number
  edges: FamilyTreeEdge[]
  items: FamilyTreeLayoutItem[]
  peerEdges: FamilyTreePeerEdge[]
}

const FAMILY_SPACE_TABS: { id: FamilySpaceTab; label: string }[] = [
  { id: 'history', label: '互动历史' },
  { id: 'tree', label: '家谱树' },
]

const FAMILY_INSIGHTS: Record<string, string> = {
  all:
    '最近家里发来的内容有个很暖的规律：知夏常把孩子们的笑脸和周末安排放在前面，嘉禾常拍厨房、餐桌和窗边的花。看起来是各说各的，其实都在用你熟悉的生活细节，让你知道家里过得安稳，也一直惦记着你。',
  'member-child-yu':
    '知夏发来的照片里，孩子们常常已经把想给你看的东西准备好了：画好的画、剥好的橘子、放在门口的小书包。她不只是报个平安，更像是在替孩子们把“想给太婆看看”这件事，一点一点递到你面前。',
  'member-child-chen':
    '嘉禾最近常拍厨房和家里的小变化：照着你说的菜谱备菜，顺手拍窗台上的花，也会提一句天气和晚饭。那些话听着平常，其实是在告诉你：你留下的习惯还在家里，被大家好好接着。',
}

const AMA_FAMILY_HISTORY_MEMBER_ORDER = [
  'member-chuyuan',
  'member-nanzhi',
  'member-chulong',
  'member-chuqing',
  'member-lin-suqin',
  'member-xiaowei',
  'member-xie-zehua',
]

function sortFrameFamilyHistoryMembers<T extends { id: string }>(members: T[]) {
  const orderMap = new Map(AMA_FAMILY_HISTORY_MEMBER_ORDER.map((id, index) => [id, index]))
  if (!members.some((member) => orderMap.has(member.id))) return members

  return [...members].sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
    const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
}

const AMA_TREE_PEOPLE: Record<string, FamilyTreeMember> = {
  ye: {
    id: 'member-elder-ye',
    name: '叶淑柔',
    relation: '阿嫲',
    avatarSrc: '/scenario/ama-letter/avatars/ye-shurou-avatar.jpg',
    birthDate: '1942年8月16日',
    biography: '叶淑柔生于汕头海边的老厝，自幼在潮汕茶香、海风与木棉花影中长大。青年时代，她与郑木生结为夫妻，后因木生远赴南洋谋生，长期以侨批维系家计与情感。她一生持家坚韧，独自抚育儿女成人，也把工夫茶、无米粿、潮汕老礼数留在家中。晚年，她在晓伟帮助下重新整理旧信与口述，把半个世纪的等待、思念和家风讲给后辈听。',
    city: '汕头',
    status: '相框主人',
    roleNote: '侨批、老厝、工夫茶和木棉花记忆都围绕她整理。',
    guardian: true,
    careContact: true,
    details: ['已绑定老人相框', '喜欢工夫茶和潮剧', '正在整理侨批故事'],
  },
  musheng: {
    id: 'member-musheng',
    name: '郑木生',
    relation: '丈夫',
    avatarSrc: '/scenario/ama-letter/avatars/zheng-musheng-avatar.jpg',
    birthDate: '1938年3月12日',
    deathDate: '1960年8月21日',
    biography: '郑木生生于潮汕乡里，青年时为改变家境远赴暹罗谋生。他性情沉静，不善言辞，却把对妻儿的牵挂写进一封封侨批与汇款之中。那些从南洋寄回的银信，支撑着老宅里的日常，也成为淑柔漫长等待的凭据。后因海难离世，消息多年未能传回家中。他短暂的一生，最终被旧信、怀表与家人的回忆重新拼合。',
    city: '南洋',
    status: '已记录',
    roleNote: '侨批与南洋主线人物，适合继续补充旧信和年轻照片。',
    details: ['已关联侨批', '可补充年轻时照片', '可继续整理南洋线索'],
  },
  nanzhi: {
    id: 'member-nanzhi',
    name: '谢南枝',
    relation: '妹妹',
    avatarSrc: '/scenario/ama-letter/avatars/xie-nanzhi-avatar.jpg',
    birthDate: '1946年5月9日',
    biography: '谢南枝生于潮汕，后随家人辗转至曼谷生活。她虽远居异乡，却始终保存着故土语言、饮食与亲族情分。她理解淑柔多年等待木生的艰难，也熟悉南洋侨批背后隐忍的情义。晚年，她常从曼谷寄来问候、膏药与木棉花的照片，与淑柔隔海相伴。她在家谱中被视作淑柔的亲妹妹，是这个家庭跨越地域仍未断裂的亲情象征。',
    city: '曼谷',
    status: '远方亲人',
    roleNote: '叶淑柔远在曼谷的妹妹，常寄来问候、膏药和木棉花。',
    guardian: true,
    details: ['已关联曼谷问候', '可继续补充侨批故事', '特邀亲友'],
  },
  chuyuan: {
    id: 'member-chuyuan',
    name: '郑楚远',
    relation: '儿子',
    avatarSrc: '/scenario/ama-letter/avatars/zheng-chuyuan-avatar.jpg',
    birthDate: '1965年11月3日',
    biography: '郑楚远为叶淑柔长子，自小见母亲操持家计，性格沉稳，责任心重。成年后离开汕头到深圳发展，把家庭责任延续到自己的小家之中。他工作忙碌，却始终惦记老宅里的母亲，常在深夜加班后想起白粥、无米粿和母亲的叮嘱。作为晓伟的父亲，他也是连接老宅与城市生活的一代人，既承受奔波压力，也努力让家人重新聚拢。',
    city: '深圳',
    status: '守望亲属',
    roleNote: '晓伟的父亲，在外地工作，忙起来最想念阿嫲做的白粥和无米粿。',
    guardian: true,
    careContact: true,
    details: ['常从外地问候', '计划带家人回老宅', '可发起全家通话'],
  },
  suqin: {
    id: 'member-lin-suqin',
    name: '林素琴',
    relation: '儿媳',
    avatarSrc: '/scenario/ama-letter/avatars/lin-suqin-avatar.jpg',
    birthDate: '1968年4月21日',
    biography: '林素琴为郑楚远之妻，性情细致温和，长期在深圳操持家庭。她嫁入郑家后，与婆婆叶淑柔保持着体贴而克制的亲情关系，常把老人的衣食冷暖放在心上。她不擅长表达热烈情感，却会记得为阿嫲挑选香云纱夏装、软底鞋和日常用品。她代表着这个家庭中安静的照护力量，把孝心放在细节里，也让远方的关心有了具体形状。',
    city: '深圳',
    status: '已记录',
    roleNote: '晓伟的妈妈，细心惦记阿嫲的穿着和起居。',
    details: ['刚给阿嫲寄香云纱', '可补充互动记录', '可关联家庭相册'],
  },
  chulong: {
    id: 'member-chulong',
    name: '郑楚龙',
    relation: '三儿子',
    avatarSrc: '/scenario/ama-letter/avatars/zheng-chulong-avatar.jpg',
    birthDate: '1971年9月18日',
    biography: '郑楚龙为叶淑柔三子，成年后留在汕头，是离老宅最近、也最常照应母亲的孩子。他性格爽直，嘴上常嫌麻烦，却总在母亲需要时最先赶到。清理院中青苔、买凤凰单丛、修理老宅小物，都是他日常照护的一部分。相比远方子女的牵挂，楚龙的孝顺更像潮湿石板上的脚印，平常、具体，却支撑着阿嫲晚年的安稳生活。',
    city: '汕头',
    status: '守望亲属',
    roleNote: '常回老宅看阿嫲，负责日常照看、茶叶和老宅小事。',
    guardian: true,
    careContact: true,
    details: ['常回老宅探望', '负责日常照看', '可邀请新的家人加入'],
  },
  chuqing: {
    id: 'member-chuqing',
    name: '郑楚卿',
    relation: '女儿',
    avatarSrc: '/scenario/ama-letter/avatars/zheng-chuqing-avatar.jpg',
    birthDate: '1974年2月27日',
    biography: '郑楚卿为叶淑柔之女，性格明快，最擅长把家中的沉重话题化成厨房里的笑声。她常回老宅陪母亲买菜、炖汤，也试着复刻阿嫲记忆中的无米粿。虽然手艺常被母亲挑剔，母女之间却因此保留着亲密的日常往来。楚卿身上有潮汕女儿的热闹与细腻，她用饭菜、玩笑和陪伴，承接母亲晚年的情绪与生活。',
    city: '汕头',
    status: '已记录',
    roleNote: '常发做饭、买菜和探望阿嫲的日常，也最容易被阿嫲一句话哄好。',
    details: ['常回老宅探望', '会发家庭动态', '可关联家庭相册'],
  },
  xiaowei: {
    id: 'member-xiaowei',
    name: '郑晓伟',
    relation: '孙子',
    avatarSrc: '/scenario/ama-letter/avatars/zheng-xiaowei-avatar.jpg',
    birthDate: '1996年7月6日',
    biography: '郑晓伟为郑楚远与林素琴之子，也是叶淑柔的孙子。成长于深圳，却从小在阿嫲的讲述中认识潮汕老厝、侨批与家族往事。成年后，他成为家中最熟悉数字工具的人，主动扫描旧信、修复照片，并帮助阿嫲把零散口述整理成回忆录。在他身上，年轻一代的技术能力不再只是工具，而成为重新理解长辈、保存家族记忆的桥梁。',
    city: '深圳',
    status: '守望亲属',
    roleNote: '负责数字化侨批、旧物和阿嫲口述，也是子女端主要操作者。',
    guardian: true,
    careContact: true,
    details: ['最近数字化 1 封侨批', '可发起全家通话', '有相框协助权限'],
  },
  zehua: {
    id: 'member-xie-zehua',
    name: '谢泽华',
    relation: '外甥',
    avatarSrc: '/scenario/ama-letter/avatars/xie-zehua-avatar.jpg',
    birthDate: '1988年12月14日',
    biography: '谢泽华为谢南枝之子，在曼谷长大，熟悉唐人街的药油铺、干货行与当地华人社群。他虽未长期生活在潮汕，却在母亲的叙述中认识淑柔一家，也逐渐理解上一辈人对故土的牵挂。日常里，他常陪南枝采购、跑腿，并协助把曼谷的近况传回汕头。泽华代表着侨居后代的延续：家不只在出生地，也在语言、记忆与一次次问候之中。',
    city: '曼谷',
    status: '远方亲人',
    roleNote: '谢南枝的儿子，陪母亲在曼谷唐人街挑药油和干货。',
    details: ['已关联曼谷唐人街动态', '可继续补充远方互动'],
  },
}

const AMA_TREE_MEMBERS = Object.values(AMA_TREE_PEOPLE)
const AMA_FRAME_TREE_VISIBLE_MEMBER_IDS = AMA_TREE_MEMBERS.map((member) => member.id)

const AMA_TREE_LAYOUT: FamilyTreeLayout = {
  canvasHeight: 900,
  canvasWidth: 1160,
  centerX: 610,
  peerEdges: [
    { fromId: AMA_TREE_PEOPLE.nanzhi.id, toId: AMA_TREE_PEOPLE.ye.id },
    { fromId: AMA_TREE_PEOPLE.ye.id, toId: AMA_TREE_PEOPLE.musheng.id },
    { fromId: AMA_TREE_PEOPLE.chuyuan.id, toId: AMA_TREE_PEOPLE.suqin.id },
  ],
  edges: [
    { parentIds: [AMA_TREE_PEOPLE.ye.id, AMA_TREE_PEOPLE.musheng.id], childIds: [AMA_TREE_PEOPLE.chuyuan.id, AMA_TREE_PEOPLE.chulong.id, AMA_TREE_PEOPLE.chuqing.id] },
    { parentIds: [AMA_TREE_PEOPLE.chuyuan.id, AMA_TREE_PEOPLE.suqin.id], childIds: [AMA_TREE_PEOPLE.xiaowei.id] },
    { parentIds: [AMA_TREE_PEOPLE.nanzhi.id], childIds: [AMA_TREE_PEOPLE.zehua.id] },
  ],
  items: [
    { member: AMA_TREE_PEOPLE.nanzhi, x: 230, y: 270 },
    { member: AMA_TREE_PEOPLE.ye, x: 520, y: 270 },
    { member: AMA_TREE_PEOPLE.musheng, x: 720, y: 270 },
    { member: AMA_TREE_PEOPLE.zehua, x: 230, y: 500 },
    { member: AMA_TREE_PEOPLE.chulong, x: 450, y: 500 },
    { member: AMA_TREE_PEOPLE.chuqing, x: 630, y: 500 },
    { member: AMA_TREE_PEOPLE.chuyuan, x: 810, y: 500 },
    { member: AMA_TREE_PEOPLE.suqin, x: 990, y: 500 },
    { member: AMA_TREE_PEOPLE.xiaowei, x: 900, y: 718 },
  ],
}


const TREE_PEOPLE: Record<string, FamilyTreeMember> = {
  mingshan: {
    id: 'relative-uncle',
    name: '陈明山',
    relation: '外公哥哥',
    avatarSrc: '/sheguang-avatars/avatar_grandpa.png',
    birthDate: '1935年6月8日',
    biography: '陈明山是外公这一支的长辈，老照片里常出现，是补全旁系关系的重要线索。',
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
    birthDate: '1941年10月19日',
    biography: '陈明月年轻时常来苏州走亲戚，许多节日合照里都有她温和的笑容。',
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
    birthDate: '1945年4月5日',
    biography: '林秀兰把一家人的饭桌、旧照片和孩子近况都放在心上，是这个家的记忆中心。',
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
    relation: '老公',
    avatarSrc: '/sheguang-avatars/avatar_grandpa.png',
    birthDate: '1942年1月23日',
    biography: '陈明远年轻时爱拍照也爱修东西，旧相册里留下许多和秀兰外婆的生活片段。',
    city: '苏州',
    status: '已记录',
    roleNote: '旧照片里经常出现，适合继续补充年轻时候的故事。',
    details: ['已收录 8 张老照片', '可补充出生年份', '可继续添加亲属关系'],
  },
  jiahe: {
    id: 'child-jiahe',
    name: '嘉禾',
    relation: '儿子',
    avatarSrc: '/sheguang-avatars/avatar_jiahe_centered_v5.jpg',
    birthDate: '1972年8月30日',
    biography: '嘉禾常照看家里事务，也会把厨房、花草和周末安排发给外婆，让她安心。',
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
    relation: '女儿',
    avatarSrc: '/sheguang-avatars/avatar_aunt.png',
    birthDate: '1976年3月11日',
    biography: '明岚住在杭州，细腻念旧，常帮家里补充旧相册里的人名和故事。',
    city: '杭州',
    status: '已记录',
    roleNote: '家里旧相册中常出现，也适合作为家庭故事的补充线索。',
    details: ['可补充互动记录', '可关联家庭相册'],
  },
  zhixia: {
    id: 'child-zhixia',
    name: '知夏',
    relation: '外孙女',
    avatarSrc: '/sheguang-avatars/avatar_xiaomei.png',
    birthDate: '1994年12月2日',
    biography: '知夏最常给外婆发孩子近况，把小满和乐乐的日常变成相框里的热闹。',
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
    birthDate: '2017年5月20日',
    biography: '小满爱画画和讲学校里的新鲜事，她的作品常被家人发给太婆看。',
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
    birthDate: '2020年9月7日',
    biography: '乐乐活泼爱问问题，常和姐姐小满一起出现在家庭照片和语音里。',
    city: '上海',
    status: '孩子近况',
    roleNote: '常和小满一起出现在照片里，很多语音里会提到他的小问题。',
    details: ['有 4 条相关互动', '常出现在合照', '适合补充生日信息'],
  },
  anan: {
    id: 'grandchild-anan',
    name: '安安',
    relation: '外孙',
    avatarSrc: '/sheguang-avatars/avatar_child.png',
    birthDate: '2008年6月15日',
    biography: '安安是明岚家的孩子，假期回苏州时常出现在团圆照和饭桌故事里。',
    city: '杭州',
    status: '已记录',
    roleNote: '明岚家的孩子，之后可以把同城聚会的照片归到这一支。',
    details: ['可补充生日', '可关联节日团圆照片'],
  },
  niannian: {
    id: 'grandchild-niannian',
    name: '念念',
    relation: '外孙女',
    avatarSrc: '/sheguang-avatars/family_xiaomei.png',
    birthDate: '2012年2月10日',
    biography: '念念喜欢手作和拍照，适合把她的成长照片继续补进家庭相册。',
    city: '杭州',
    status: '已记录',
    roleNote: '明岚家的孩子，适合补充成长照片和手工作品。',
    details: ['可补充照片', '可关联孩子作品'],
  },
}

const TREE_MEMBERS = Object.values(TREE_PEOPLE)
const TREE_MEMBERS_BY_ID = TREE_MEMBERS.reduce<Record<string, FamilyTreeMember>>((map, member) => {
  map[member.id] = member
  return map
}, {})

const GRANDPARENT_AXIS = [
  TREE_PEOPLE.xiulan.id,
  TREE_PEOPLE.mingyuan.id,
]

const DESCENDANT_TREE: FamilyTreeDescendant[] = [
  { memberId: TREE_PEOPLE.jiahe.id },
  {
    memberId: TREE_PEOPLE.minglan.id,
    children: [
      {
        memberId: TREE_PEOPLE.zhixia.id,
        children: [
          { memberId: TREE_PEOPLE.xiaoman.id },
          { memberId: TREE_PEOPLE.lele.id },
        ],
      },
      { memberId: TREE_PEOPLE.niannian.id },
    ],
  },
]

const FRAME_TREE_VISIBLE_MEMBER_IDS = [
  TREE_PEOPLE.xiulan.id,
  TREE_PEOPLE.mingyuan.id,
  TREE_PEOPLE.jiahe.id,
  TREE_PEOPLE.minglan.id,
  TREE_PEOPLE.zhixia.id,
  TREE_PEOPLE.xiaoman.id,
  TREE_PEOPLE.lele.id,
  TREE_PEOPLE.niannian.id,
]

const TREE_LAYOUT = {
  avatarCenterY: 42,
  generationPeerGap: 220,
  levelGap: 180,
  nameAnchorY: 136,
  nodeHeight: 156,
  paddingX: 118,
  paddingY: 255,
  personWidth: 156,
  siblingGap: 88,
  subtreeDisplayCap: 300,
}

const TREE_PAPER_SIZE = {
  height: 1200,
  width: 1800,
}

const TREE_PAPER_PADDING = {
  bottom: 30,
  top: 0,
  x: 320,
}

const getMemberGivenName = (name: string, relation: string) => name.replace(relation, '') || name

function getDescendantSubtreeWidth(node: FamilyTreeDescendant): number {
  const children = node.children || []
  if (!children.length) return TREE_LAYOUT.personWidth
  const childrenWidth = children.reduce((sum, child) => sum + getDescendantSubtreeWidth(child), 0) + (children.length - 1) * TREE_LAYOUT.siblingGap
  return Math.max(TREE_LAYOUT.personWidth, Math.min(childrenWidth, TREE_LAYOUT.subtreeDisplayCap))
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
  const xiulanX = coupleCenterX - TREE_LAYOUT.generationPeerGap / 2
  const mingyuanX = coupleCenterX + TREE_LAYOUT.generationPeerGap / 2
  const ancestorPositions: Record<string, number> = {
    [TREE_PEOPLE.xiulan.id]: xiulanX,
    [TREE_PEOPLE.mingyuan.id]: mingyuanX,
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

function renderFamilyAvatar({
  alt,
  className,
  fallback,
  src,
}: {
  alt: string
  className?: string
  fallback: string
  src?: string
}) {
  return (
    <span className={src ? `${className || ''} is-image`.trim() : className} aria-label={alt}>
      {src ? <img src={src} alt="" aria-hidden="true" draggable={false} /> : fallback}
    </span>
  )
}

function FrameFamilyTreePerson({
  member,
  selected,
  onSelect,
  onOpenDetail,
}: {
  member: FamilyTreeMember
  selected: boolean
  onSelect: (memberId: string) => void
  onOpenDetail: (member: FamilyTreeMember) => void
}) {
  const isSelf = member.id === AMA_TREE_PEOPLE.ye.id || member.id === TREE_PEOPLE.xiulan.id
  const className = [
    'frame-tree-person',
    selected ? 'frame-tree-person--active' : '',
    isSelf ? 'frame-tree-person--self' : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={className}
      type="button"
      aria-pressed={selected}
      data-member-id={member.id}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => {
        onSelect(member.id)
        onOpenDetail(member)
      }}
    >
      <span className="frame-tree-person__avatar">
        {member.avatarSrc ? <img src={member.avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.name.slice(-1)}
      </span>
      <span className="frame-tree-person__copy">
        <strong>{isSelf ? member.name : `${member.relation}${member.name}`}</strong>
      </span>
      {isSelf ? <small className="frame-tree-person__self-badge">我</small> : null}
    </button>
  )
}

function FrameFamilyTreeInfoRow({
  member,
  selected,
  onSelect,
  onOpenDetail,
}: {
  member: FamilyTreeMember
  selected: boolean
  onSelect: (memberId: string) => void
  onOpenDetail: (member: FamilyTreeMember) => void
}) {
  const relationLabel = member.id === AMA_TREE_PEOPLE.ye.id || member.id === TREE_PEOPLE.xiulan.id ? '我' : member.relation

  return (
    <button
      className={selected ? 'frame-tree-info-row frame-tree-info-row--active' : 'frame-tree-info-row'}
      type="button"
      onClick={() => {
        onSelect(member.id)
        onOpenDetail(member)
      }}
    >
      <span className="frame-tree-info-row__avatar">
        {member.avatarSrc ? <img src={member.avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.name.slice(-1)}
      </span>
      <span className="frame-tree-info-row__copy">
        <span className="frame-tree-info-row__name-line">
          <strong>{member.name}</strong>
          <span className="frame-tree-info-row__status">{relationLabel}</span>
        </span>
        <em>{member.city || '地区待补充'}</em>
      </span>
    </button>
  )
}

function FrameFamilyTreeMemberDialog({
  member,
  onClose,
}: {
  member: FamilyTreeMember
  onClose: () => void
}) {
  const lifeSpan = `${member.birthDate || '出生日期待补充'} - ${member.deathDate || '至今'}`
  const biographyParagraphs = (member.biography || member.roleNote)
    .split('。')
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .reduce<string[]>((paragraphs, sentence, index) => {
      const paragraphIndex = Math.floor(index / 2)
      paragraphs[paragraphIndex] = paragraphs[paragraphIndex] ? `${paragraphs[paragraphIndex]}。${sentence}` : sentence
      return paragraphs
    }, [])
    .map((paragraph) => `${paragraph}。`)

  return (
    <div className="frame-tree-member-dialog-backdrop" role="presentation" onClick={onClose}>
      <section className="frame-tree-member-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-tree-member-dialog-title" onClick={(event) => event.stopPropagation()}>
        <button className="frame-tree-member-dialog__close" type="button" aria-label="关闭人物详情" onClick={onClose}>
          <X size={34} weight="bold" aria-hidden="true" />
        </button>

        <div className="frame-tree-member-dialog__hero">
          <span className="frame-tree-member-dialog__eyebrow">人物生平</span>
          <span className="frame-tree-member-dialog__avatar">
            {member.avatarSrc ? <img src={member.avatarSrc} alt="" aria-hidden="true" draggable={false} /> : member.name.slice(-1)}
          </span>
          <h2 id="frame-tree-member-dialog-title">{member.name}</h2>
          <p>{lifeSpan}</p>
        </div>

        <section className="frame-tree-member-dialog__bio-panel" aria-label={`${member.name}人物生平`}>
          <div className="frame-tree-member-dialog__body">
            {biographyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function FrameFamilyTreePanel({ onToast }: { onToast: (message: string) => void }) {
  const familyMembers = getMockMembers()
  const isAmaScenario = familyMembers.some((member) => member.id === 'member-elder-ye')
  const treeMembers = isAmaScenario ? AMA_TREE_MEMBERS : TREE_MEMBERS
  const visibleMemberIds = isAmaScenario ? AMA_FRAME_TREE_VISIBLE_MEMBER_IDS : FRAME_TREE_VISIBLE_MEMBER_IDS
  const treeBoardRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ active: false, moved: false, pointerId: 0, scrollLeft: 0, scrollTop: 0, x: 0, y: 0 })
  const hasCenteredTreeRef = useRef(false)
  const [selectedMemberId, setSelectedMemberId] = useState(() => (isAmaScenario ? 'member-elder-ye' : 'elder-lin'))
  const [detailMember, setDetailMember] = useState<FamilyTreeMember | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [isTreeFullscreen, setIsTreeFullscreen] = useState(false)
  const selectedMember = treeMembers.find((member) => member.id === selectedMemberId) || treeMembers[0]
  const visibleTreeMembers = treeMembers.filter((member) => visibleMemberIds.includes(member.id))
  const treeLayout = useMemo(() => (isAmaScenario ? AMA_TREE_LAYOUT : buildFamilyTreeLayout()), [isAmaScenario])
  const treeZoom = isTreeFullscreen ? 0.8 : 0.72
  const treePaperPadding = TREE_PAPER_PADDING
  const treePaperBaseHeight = Math.max(TREE_PAPER_SIZE.height, treeLayout.canvasHeight + treePaperPadding.top + treePaperPadding.bottom)
  const treePaperBaseWidth = Math.max(TREE_PAPER_SIZE.width, treeLayout.canvasWidth + treePaperPadding.x * 2)
  const treeSurfaceHeight = treePaperBaseHeight * treeZoom
  const treeSurfaceWidth = treePaperBaseWidth * treeZoom
  const treeCanvasLeft = (treePaperBaseWidth / 2 - (treeLayout.centerX ?? treeLayout.canvasWidth / 2)) * treeZoom
  const treeCanvasTop = treePaperPadding.top * treeZoom

  const getTreePersonFromPoint = (clientX: number, clientY: number) => {
    return document
      .elementsFromPoint(clientX, clientY)
      .map((element) => element.closest<HTMLElement>('.frame-tree-person'))
      .find((element): element is HTMLElement => Boolean(element))
  }

  const openTreeMemberDetail = (memberId: string) => {
    const member = treeMembers.find((candidate) => candidate.id === memberId)
    if (!member) return false
    setSelectedMemberId(member.id)
    setDetailMember(member)
    return true
  }

  const openTreeMemberDetailFromPoint = (clientX: number, clientY: number) => {
    const node = getTreePersonFromPoint(clientX, clientY)
    const memberId = node?.dataset.memberId
    return memberId ? openTreeMemberDetail(memberId) : false
  }

  const handleTreePointerDown = (event: PointerEvent<HTMLElement>) => {
    const board = treeBoardRef.current
    if (!board) return
    if ((event.target as HTMLElement).closest('.frame-tree-person') || getTreePersonFromPoint(event.clientX, event.clientY)) return
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
    if ((event.target as HTMLElement).closest('.frame-tree-person')) {
      dragStartRef.current.moved = false
      return
    }
    if (!dragStartRef.current.moved && openTreeMemberDetailFromPoint(event.clientX, event.clientY)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (!dragStartRef.current.moved) return
    event.preventDefault()
    event.stopPropagation()
    dragStartRef.current.moved = false
  }

  useEffect(() => {
    hasCenteredTreeRef.current = false
  }, [isTreeFullscreen])

  useEffect(() => {
    const board = treeBoardRef.current
    if (!board || hasCenteredTreeRef.current) return
    hasCenteredTreeRef.current = true
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
  }, [isTreeFullscreen, treeLayout.canvasHeight, treeLayout.canvasWidth, treeSurfaceWidth, treeZoom])

  useEffect(() => {
    const board = treeBoardRef.current
    if (!board) return
    const target = board.querySelector<HTMLElement>(`[data-member-id="${selectedMemberId}"]`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [selectedMemberId])

  useEffect(() => {
    if (treeMembers.some((member) => member.id === selectedMemberId)) return
    setSelectedMemberId(treeMembers[0]?.id || '')
  }, [selectedMemberId, treeMembers])

  const treeCard = (
    <section className={isTreeFullscreen ? 'frame-tree-card frame-tree-card--fullscreen' : 'frame-tree-card'} aria-label="三代家谱关系图">
      {isTreeFullscreen ? null : (
        <button className="frame-tree-fullscreen-trigger" type="button" aria-label="全屏查看家谱树" onClick={() => setIsTreeFullscreen(true)}>
          <CornersOut size={26} weight="bold" aria-hidden="true" />
        </button>
      )}
      <div
        className={isPanning ? 'frame-tree-viewport frame-tree-viewport--panning' : 'frame-tree-viewport'}
        ref={treeBoardRef}
        onPointerDown={handleTreePointerDown}
        onPointerMove={handleTreePointerMove}
        onPointerUp={stopTreePan}
        onPointerCancel={stopTreePan}
        onLostPointerCapture={stopTreePan}
        onClickCapture={handleTreeClickCapture}
      >
        <div
          className="frame-tree-surface"
          style={{
            height: treeSurfaceHeight,
            width: treeSurfaceWidth,
          }}
        >
          <div
            className="frame-tree-canvas"
            style={{
              height: treeLayout.canvasHeight,
              left: treeCanvasLeft,
              top: treeCanvasTop,
              transform: `scale(${treeZoom})`,
              width: treeLayout.canvasWidth,
            }}
          >
            <svg className="frame-tree-lines" viewBox={`0 0 ${treeLayout.canvasWidth} ${treeLayout.canvasHeight}`} aria-hidden="true">
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
                const middleY = startY + Math.max(34, (childTopY - startY) / 2)
                const minChildX = Math.min(...children.map((child) => child.x))
                const maxChildX = Math.max(...children.map((child) => child.x))
                return (
                  <g key={`${edge.parentIds.join('-')}-${edge.childIds.join('-')}`}>
                    <path d={`M ${startX} ${startY} V ${middleY}`} />
                    <path d={`M ${minChildX} ${middleY} H ${maxChildX}`} />
                    <circle cx={startX} cy={middleY} r="4.5" />
                    {children.map((child) => (
                      <g key={child.member.id}>
                        <path d={`M ${child.x} ${middleY} V ${childTopY}`} />
                        <circle cx={child.x} cy={middleY} r="3.5" />
                      </g>
                    ))}
                  </g>
                )
              })}
            </svg>
            {treeLayout.items.map((item) => (
              <div
                className="frame-tree-family-node"
                key={item.member.id}
                style={{
                  left: item.x - TREE_LAYOUT.personWidth / 2,
                  top: item.y,
                  width: TREE_LAYOUT.personWidth,
                }}
              >
                <FrameFamilyTreePerson member={item.member} selected={selectedMember.id === item.member.id} onSelect={setSelectedMemberId} onOpenDetail={setDetailMember} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <main className="frame-family-tree-layout" aria-label="家谱树">
      {isTreeFullscreen ? null : treeCard}

      <aside className="frame-tree-side" aria-label="成员信息">
        <section className="frame-tree-info-panel">
          <div className="frame-tree-info-panel__head">
            <h2>成员信息({visibleTreeMembers.length})</h2>
            <button type="button" onClick={() => onToast('即将上线')}>
              <UserPlus size={22} weight="bold" aria-hidden="true" />
              邀请
            </button>
          </div>
          <div className="frame-tree-info-list">
            {visibleTreeMembers.map((member) => (
              <FrameFamilyTreeInfoRow key={member.id} member={member} selected={selectedMember.id === member.id} onSelect={setSelectedMemberId} onOpenDetail={setDetailMember} />
            ))}
          </div>
        </section>
      </aside>
      {isTreeFullscreen ? (
        <div className="frame-tree-fullscreen-layer" role="dialog" aria-modal="true" aria-label="全屏家谱树">
          {treeCard}
          <button className="frame-tree-fullscreen-close" type="button" aria-label="关闭全屏家谱树" onClick={() => setIsTreeFullscreen(false)}>
            <X size={32} weight="bold" aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {detailMember ? <FrameFamilyTreeMemberDialog member={detailMember} onClose={() => setDetailMember(null)} /> : null}
    </main>
  )
}

export function FrameFamilySpacePage() {
  const navigate = useNavigate()
  const { mode } = useFrameDisplayMode()
  const rawScenarioMembers = getMockMembers()
  const scenarioMembers = rawScenarioMembers.filter((member) => member.role !== 'elder')
  const members = sortFrameFamilyHistoryMembers(
    scenarioMembers.length
      ? scenarioMembers
      : MOCK_MEMBERS.filter((member) => member.role !== 'elder'),
  )
  const dynamics = getMockFamilyDynamics()
  const familyInsightSummary = getActiveScenario().familyInsightSummary
  const familySentDynamics = useMemo(
    () => dynamics.filter((dynamic) => dynamic.authorId !== 'member-elder-ye'),
    [dynamics],
  )
  const recap = getMockFamilyWeeklyRecap()
  const [activeTab, setActiveTab] = useState<FamilySpaceTab>('history')
  const [selectedMemberId, setSelectedMemberId] = useState<FamilyFilterKey>('all')
  const [contactToast, setContactToast] = useState('')

  const selectedMember = members.find((member) => member.id === selectedMemberId)
  const selectedMemberDisplayName = selectedMember ? getMemberGivenName(selectedMember.name, selectedMember.relation) : ''
  const visibleDynamics = useMemo(
    () => {
      if (selectedMemberId === 'all') return familySentDynamics
      return familySentDynamics.filter((dynamic) => {
        if (dynamic.authorId === selectedMemberId) return true
        if (selectedMember?.role !== 'elder') return false
        return dynamic.body.includes(selectedMember.name) || dynamic.relation === selectedMember.relation
      })
    },
    [familySentDynamics, selectedMember, selectedMemberId],
  )

  const insightSummary = selectedMember
    ? selectedMember.conversationSummary || FAMILY_INSIGHTS[selectedMember.id] || `${selectedMember.name}最近发来的内容，都围绕着你熟悉的日常：照片、语音和几句简短问候。它们看起来平常，其实是在告诉你，家里人一直惦记着你。`
    : familySentDynamics.length
      ? familyInsightSummary || `最近家里发来的内容主要围绕${Array.from(new Set(familySentDynamics.map((dynamic) => dynamic.authorName))).slice(0, 3).join('、')}。这些照片和话语把日常、远方和老物件连在一起，让你慢慢看见家里每个人的近况。`
      : FAMILY_INSIGHTS.all
  const topicSuggestions = selectedMember
    ? selectedMember.interactionSuggestions?.length
      ? selectedMember.interactionSuggestions
      : [
        `问问${selectedMember.name}最近家里晚饭吃得怎么样`,
        `聊聊${selectedMember.name}发来的照片里最热闹的一幕`,
        `提醒${selectedMember.name}周末见面前别太赶`,
      ]
    : []

  const showToast = (message: string) => {
    setContactToast(message)
    window.setTimeout(() => setContactToast(''), 1800)
  }

  const openContact = (type: 'phone' | 'video') => {
    const contactName = selectedMember?.name || '全家'
    showToast(type === 'phone' ? `正在发起${contactName}通话` : `正在邀请${contactName}视频连线`)
  }

  return (
    <FramePageShell className="frame-space-page frame-family-space frame-light-nav-page frame-family-light-page" mode={mode}>
      <header className="frame-memory-topbar frame-family-space__topbar frame-family-space__topbar--tabs frame-light-nav">
        <button className="frame-memory-back-button" type="button" aria-label="返回相框" onClick={() => navigate(withScenario('/frame'))}>
          <CaretLeft size={40} weight="bold" aria-hidden="true" />
        </button>
        <nav className="frame-square-tabs frame-family-space-tabs" aria-label="家庭空间频道">
          {FAMILY_SPACE_TABS.map((tab) => (
            <button
              className={activeTab === tab.id ? 'is-active' : ''}
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <strong>{tab.label}</strong>
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'history' ? (
        <>
          <section className="frame-family-context-panel" aria-label="家庭动态范围">
            <div className="frame-family-member-rail" aria-label="家人筛选">
              <button
                className={selectedMemberId === 'all' ? 'is-active' : ''}
                type="button"
                onClick={() => setSelectedMemberId('all')}
              >
                {renderFamilyAvatar({
                  alt: '全家头像',
                  fallback: '全',
                  src: getFamilyAvatarSrc(),
                })}
                <div>
                  <strong>全家</strong>
                  <small>全部动态</small>
                </div>
              </button>
              {members.map((member) => (
                <button
                  key={member.id}
                  className={selectedMemberId === member.id ? 'is-active' : ''}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  {renderFamilyAvatar({
                    alt: `${member.name}的头像`,
                    fallback: member.avatar,
                    src: getMemberAvatarSrc(member.id),
                  })}
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.city} · {member.weatherLabel}</small>
                  </div>
                </button>
              ))}
            </div>

            <div className="frame-family-contact-actions-top" aria-label={selectedMember ? `联系${selectedMember.name}` : '联系家人'}>
              <button type="button" onClick={() => openContact('phone')}>
                <Phone size={25} weight="fill" />
                通话
              </button>
              <button type="button" onClick={() => openContact('video')}>
                <VideoCamera size={25} weight="fill" />
                视频
              </button>
            </div>
          </section>

          <main className="frame-family-dashboard">
            <section className="frame-family-feed-panel" aria-label="家庭动态">
              <div className="frame-family-dynamic-list">
                {visibleDynamics.map((dynamic, index) => {
                  const photoUrls = dynamic.photoUrls?.length ? dynamic.photoUrls : [dynamic.photoUrl]

                  return (
                    <article key={dynamic.id} className="frame-family-dynamic-card">
                      <button type="button" onClick={() => navigate(withScenario(`/frame/interactions/${dynamic.threadId || dynamic.id}`))}>
                        <div className="frame-family-dynamic-card__meta">
                          {renderFamilyAvatar({
                            alt: `${dynamic.authorName}的头像`,
                            className: 'frame-family-avatar',
                            fallback: dynamic.authorName.slice(-1),
                            src: getMemberAvatarSrcByName(dynamic.authorName),
                          })}
                          <div>
                            <strong>{dynamic.authorName}</strong>
                            <small>{dynamic.timeLabel} · {dynamic.placeLabel}</small>
                          </div>
                          {index === 0 ? <em>最新</em> : null}
                        </div>

                        <div className={`frame-family-photo-grid frame-family-photo-grid--${Math.min(photoUrls.length, 3)}`}>
                          {photoUrls.slice(0, 3).map((photoUrl, photoIndex) => (
                            <img
                              key={`${dynamic.id}-${photoUrl}-${photoIndex}`}
                              src={photoUrl}
                              alt={photoIndex === 0 ? dynamic.photoAlt : `${dynamic.title}补充照片 ${photoIndex + 1}`}
                            />
                          ))}
                        </div>

                        <div className="frame-family-dynamic-card__copy">
                          <div>
                            <p>{dynamic.summary}</p>
                          </div>
                          <div className="frame-family-dynamic-card__footer">
                            <div className="frame-family-tags">
                              {dynamic.voiceDurationSeconds ? (
                                <span>
                                  <Microphone size={18} weight="fill" />
                                  语音 {dynamic.voiceDurationSeconds} 秒
                                </span>
                              ) : null}
                            </div>
                            <div className="frame-family-dynamic-actions">
                              <span>
                                <ChatCircleText size={22} weight="bold" />
                                详情
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>

            <aside className="frame-family-side-panel" aria-label="家庭洞察">
              <section className="frame-family-insight-card" aria-label={selectedMember ? `与${selectedMemberDisplayName}的近况洞察` : '家庭近况洞察'}>
                <div className="frame-family-insight-section">
                  <div className="frame-family-card-heading">
                    <Sparkle size={30} weight="duotone" />
                    <span>{selectedMember ? `与${selectedMemberDisplayName}的近况洞察` : '家庭近况洞察'}</span>
                  </div>
                  <p>{insightSummary}</p>
                </div>

                {!selectedMember ? (
                  <button className="frame-family-recap-inline" type="button" onClick={() => navigate(withScenario('/frame/family/recap'))}>
                    <span>
                      <FilmStrip size={30} weight="duotone" />
                      家庭周报
                    </span>
                    <strong>{recap.title}</strong>
                    <img src={recap.coverUrl} alt={recap.title} />
                    <p>{recap.subtitle}</p>
                  </button>
                ) : null}

                {selectedMember ? (
                  <div className="frame-family-topic-inline" aria-label={`与${selectedMemberDisplayName}可以做的事`}>
                    <div className="frame-family-card-heading">
                      <Question size={30} weight="duotone" />
                      <span>你可以做的事</span>
                    </div>
                    <div>
                      {topicSuggestions.map((item) => <button key={item} type="button" onClick={() => navigate(withScenario('/frame/ai'))}>{item}</button>)}
                    </div>
                  </div>
                ) : null}
              </section>

            </aside>
          </main>
        </>
      ) : (
        <FrameFamilyTreePanel onToast={showToast} />
      )}

      {contactToast ? (
        <div className="frame-settings-toast" role="status" aria-live="polite">
          {contactToast}
        </div>
      ) : null}
    </FramePageShell>
  )
}
