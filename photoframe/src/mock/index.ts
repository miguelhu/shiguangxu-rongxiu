import type {
  AiSuggestion,
  ElderProfile,
  FamilyDynamic,
  FamilyMember,
  FamilyExplorationItem,
  FamilySpace,
  FamilyWeeklyRecap,
  FragmentContentItem,
  FrameConversationLine,
  FrameDeviceStatus,
  FrameQuickReply,
  FrameSticker,
  GalleryPhoto,
  InteractionThread,
  MemoryStory,
  MemoryTheme,
  RiverStage,
  SquareEvent,
  SquarePost,
  StudyModule,
  ExploreFeatureItem,
  UploadPhotoDraft,
} from '../types'
import { getActiveScenario } from '../content/scenarioStore'

export const MOCK_FAMILY_SPACE: FamilySpace = {
  id: 'family-lin-001',
  name: '林秀兰的家',
  bindingCode: '582913',
  elderName: '林秀兰',
}

export const MOCK_ELDER_PROFILE: ElderProfile = {
  id: 'elder-lin-profile',
  name: '林秀兰',
  gender: 'female',
  birthYear: 1948,
  relation: '外婆',
  voiceIntroText:
    '外婆现在住在苏州老房子里，年轻时在供销社工作，性格慢热但很爱讲家里的旧事。她喜欢种花、做糖醋排骨，也爱听孩子们最近发生的小事。',
  interests: ['种花', '做饭', '老照片', '听孩子近况'],
  avoidTopics: ['身体检查细节', '催她搬家'],
}

export const MOCK_MEMBERS: FamilyMember[] = [
  {
    id: 'member-elder-lin',
    name: '林秀兰',
    relation: '外婆',
    avatar: '秀',
    role: 'elder',
  },
  {
    id: 'member-child-yu',
    name: '外孙女知夏',
    relation: '外孙女',
    avatar: '夏',
    role: 'child',
    city: '上海',
    statusLabel: '刚发来小满的新照片',
    weatherLabel: '多云 27°C',
    conversationSummary: '知夏常把小满和弟弟的日常发给外婆，照片多、语音短，适合直接慢慢看。',
  },
  {
    id: 'member-child-chen',
    name: '儿子嘉禾',
    relation: '儿子',
    avatar: '禾',
    role: 'child',
    city: '苏州',
    statusLabel: '晚饭后在线',
    weatherLabel: '晴 26°C',
    conversationSummary: '嘉禾更多发家里近况、厨房和周末安排，也会提醒外婆添衣和休息。',
  },
]

export const MOCK_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'gallery-001',
    url: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    alt: '两个孩子在餐桌边把画好的画展示给家人看',
    title: '小满画给太婆',
    uploadedAt: '2026-05-27T18:36:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: true,
    voiceNoteDurationSeconds: 18,
    voiceNoteText: '小满今天画了太婆家的餐桌，还把你的茶杯画在最中间，说周末想拿给你看。',
    aiTitle: '小满画给太婆的餐桌',
    aiCategories: ['人物/小满', '事件/孩子作品', '物件/茶杯'],
    aiStoryHint: '适合整理成“孩子眼里的太婆家”，以后可接到祖孙故事里。',
    metadataSummary: '2026年5月27日傍晚上传，来自知夏，画面包含儿童画、餐桌、家人互动。',
  },
  {
    id: 'gallery-002',
    url: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    alt: '一家人在厨房里一起准备晚饭',
    title: '照着你的菜谱',
    uploadedAt: '2026-05-26T18:08:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: true,
    voiceNoteDurationSeconds: 14,
    voiceNoteText: '今天照着你以前教的糖醋排骨做了一桌，味道还差一点，想等你下次再指点。',
    aiTitle: '照着妈妈菜谱做晚饭',
    aiCategories: ['事件/餐桌记忆', '人物/嘉禾', '物件/菜谱'],
    aiStoryHint: '可作为“家里的味道”故事素材，和老人过去教做菜的回忆关联。',
    metadataSummary: '2026年5月26日晚上传，厨房环境，识别到多人协作做饭。',
  },
  {
    id: 'gallery-003',
    url: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    alt: '两个孩子在门口收拾小书包准备去看外婆',
    title: '周末去看太婆',
    uploadedAt: '2026-05-24T09:20:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: true,
    voiceNoteDurationSeconds: 11,
    voiceNoteText: '两个孩子已经收好小书包，说明天一早就去看太婆。',
    aiTitle: '周末去看太婆',
    aiCategories: ['事件/探望', '人物/孩子们', '时间/周末'],
    aiStoryHint: '适合形成“家人常来看她”的陪伴记录，后续可提醒老人这周有人来。',
    metadataSummary: '2026年5月24日上午上传，门口场景，识别到儿童与出行物品。',
  },
  {
    id: 'gallery-004',
    url: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    alt: '苏州老房子客厅里有茶杯、相框和窗边阳光',
    title: '客厅的午后光',
    uploadedAt: '2026-05-20T15:08:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: true,
  },
  {
    id: 'gallery-005',
    url: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    alt: '带有泛黄老照片质感的年轻夫妻合影',
    title: '年轻时的合影',
    uploadedAt: '2026-05-18T10:18:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: true,
  },
  {
    id: 'gallery-006',
    url: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    alt: '家人把一束花放在窗边的温暖照片',
    title: '窗边的新花',
    uploadedAt: '2026-05-15T10:28:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-007',
    url: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    alt: '祖孙在室内靠在一起微笑的照片',
    title: '等周末来看你',
    uploadedAt: '2026-05-11T11:12:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-008',
    url: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    alt: '一家人在阳光下散步聊天',
    title: '饭后慢慢走',
    uploadedAt: '2026-05-06T19:05:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-009',
    url: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    alt: '桌面上摊开的旧相册和泛黄照片',
    title: '旧相册第一页',
    uploadedAt: '2026-04-28T10:12:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-010',
    url: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    alt: '带有胶片质感的人像老照片',
    title: '年轻时的笑',
    uploadedAt: '2026-04-21T16:48:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-011',
    url: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    alt: '旧木桌上的茶杯和相片',
    title: '午后茶桌',
    uploadedAt: '2026-04-16T14:51:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-012',
    url: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    alt: '暖光里的老式客厅和家庭照片',
    title: '客厅的老灯',
    uploadedAt: '2026-04-08T19:12:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-013',
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=82',
    alt: '家人在户外野餐聊天',
    title: '草地野餐',
    uploadedAt: '2026-04-02T12:28:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-014',
    url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=82',
    alt: '家人一起做饭的手部特写',
    title: '一起包馄饨',
    uploadedAt: '2026-03-29T17:36:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-015',
    url: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&w=1200&q=82',
    alt: '温暖灯光下的客厅角落',
    title: '家里的灯光',
    uploadedAt: '2026-03-21T20:18:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-016',
    url: 'https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=1200&q=82',
    alt: '阳光下的花园和植物',
    title: '院子里的花',
    uploadedAt: '2026-03-16T09:22:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-017',
    url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=82',
    alt: '整洁明亮的家庭餐厅',
    title: '新换的桌布',
    uploadedAt: '2026-03-08T13:45:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-018',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=82&sat=-8',
    alt: '家人在树荫下合影',
    title: '树荫下合影',
    uploadedAt: '2026-02-26T16:12:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
  {
    id: 'gallery-019',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=82&sat=-16',
    alt: '夕阳下的公园小路',
    title: '夕阳小路',
    uploadedAt: '2026-02-19T18:05:00+08:00',
    uploadedById: 'member-child-chen',
    uploadedByName: '儿子嘉禾',
    isCached: false,
  },
  {
    id: 'gallery-020',
    url: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    alt: '两个孩子在餐桌边把画好的画展示给家人看',
    title: '孩子们的画',
    uploadedAt: '2026-02-12T15:31:00+08:00',
    uploadedById: 'member-child-yu',
    uploadedByName: '外孙女知夏',
    isCached: false,
  },
]

export const MOCK_INTERACTION_THREADS: InteractionThread[] = [
  {
    id: 'thread-001',
    title: '小满画给太婆',
    photoUrl: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    photoAlt: '两个孩子在餐桌边把画好的画展示给家人看',
    photoLabel: '小满的画',
    photoMeta: '今天 18:36',
    photoTone: 'moss',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，小满今天画了你家的餐桌，还特意把你的茶杯画在最中间。她说周末要拿真的画给太婆看。',
    initialMethod: 'text',
    latestSnippet: '画得真好，我一眼就看到我的茶杯了',
    latestAt: '2026-05-27T19:08:00+08:00',
    unread: true,
    responses: [
      {
        id: 'response-001-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '外婆，小满今天画了你家的餐桌，还特意把你的茶杯画在最中间。她说周末要拿真的画给太婆看。',
        createdAt: '2026-05-27T18:36:00+08:00',
      },
      {
        id: 'response-001-b',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '弟弟在旁边一直问：太婆看到会不会笑？小满说一定会，因为太婆最喜欢我们认真画画。',
        createdAt: '2026-05-27T18:55:00+08:00',
      },
      {
        id: 'response-001-c',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'voice',
        content: '画得真好，我一眼就看到我的茶杯了。周末来，我把它贴到冰箱上。',
        createdAt: '2026-05-27T19:08:00+08:00',
        durationSeconds: 12,
        unread: true,
      },
    ],
  },
  {
    id: 'thread-002',
    title: '照着你的菜谱',
    photoUrl: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    photoAlt: '一家人在厨房里一起准备晚饭',
    photoLabel: '家常菜',
    photoMeta: '昨天 18:08',
    photoTone: 'peach',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，今天我们照你说的先热锅、再下姜片。小满负责洗青菜，弟弟站在旁边说厨房闻起来像太婆家。',
    initialMethod: 'text',
    latestSnippet: '闻到姜香再放肉，火别急，味道就稳',
    latestAt: '2026-05-26T18:42:00+08:00',
    unread: true,
    responses: [
      {
        id: 'response-002-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，今天我们照你说的先热锅、再下姜片。小满负责洗青菜，弟弟站在旁边说厨房闻起来像太婆家。',
        createdAt: '2026-05-26T18:08:00+08:00',
      },
      {
        id: 'response-002-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'sticker',
        content: '真好，闻到香味就像回家',
        stickerIds: ['parent-praise-great'],
        createdAt: '2026-05-26T18:22:00+08:00',
      },
      {
        id: 'response-002-c',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '你这句话我念给他们听了，小满说下次要跟你视频学番茄炒蛋。',
        createdAt: '2026-05-26T18:42:00+08:00',
      },
    ],
  },
  {
    id: 'thread-003',
    title: '周末去看太婆',
    photoUrl: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    photoAlt: '两个孩子在门口收拾小书包准备去看外婆',
    photoLabel: '周末约定',
    photoMeta: '5月24日',
    photoTone: 'gold',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，小满和弟弟已经把周末要带给你的东西收好了：一张画、一袋橘子，还有弟弟说要亲口告诉你的悄悄话。',
    initialMethod: 'voice',
    latestSnippet: '我把桂花糕也备好，等他们慢慢来',
    latestAt: '2026-05-24T10:08:00+08:00',
    unread: true,
    responses: [
      {
        id: 'response-003-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'voice',
        content: '外婆，小满和弟弟已经把周末要带给你的东西收好了：一张画、一袋橘子，还有弟弟说要亲口告诉你的悄悄话。',
        createdAt: '2026-05-24T09:20:00+08:00',
        durationSeconds: 18,
      },
      {
        id: 'response-003-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'voice',
        content: '我把桂花糕也备好，等他们慢慢来。路上别急，到了先喝水。',
        createdAt: '2026-05-24T10:08:00+08:00',
        durationSeconds: 15,
      },
    ],
  },
  {
    id: 'thread-004',
    title: '小满写给太婆',
    photoUrl: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    photoAlt: '孩子在桌边认真写字画画',
    photoLabel: '小满的信',
    photoMeta: '5月22日',
    photoTone: 'paper',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，小满今天写了“太婆我想你”。她写得慢，但每一笔都说要让你看清楚。',
    initialMethod: 'text',
    latestSnippet: '我看得清楚，字好，心更好',
    latestAt: '2026-05-22T20:26:00+08:00',
    unread: false,
    responses: [
      {
        id: 'response-004-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，小满今天写了“太婆我想你”。她写得慢，但每一笔都说要让你看清楚。',
        createdAt: '2026-05-22T19:36:00+08:00',
      },
      {
        id: 'response-004-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'voice',
        content: '我看得清楚，字好，心更好。',
        createdAt: '2026-05-22T20:26:00+08:00',
        durationSeconds: 9,
      },
    ],
  },
  {
    id: 'thread-005',
    title: '照着你的菜谱',
    photoUrl: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    photoAlt: '厨房里家人一起准备饭菜的生活照片',
    photoLabel: '家常菜',
    photoMeta: '5月18日',
    photoTone: 'moss',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，我今天照你说的先热锅再下姜片，厨房里一下就有小时候回家的味道。',
    initialMethod: 'text',
    latestSnippet: '闻到姜香再放肉，火别急，味道就稳',
    latestAt: '2026-05-18T18:42:00+08:00',
    unread: false,
    responses: [
      {
        id: 'response-005-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '外婆，我今天照你说的先热锅再下姜片，厨房里一下就有小时候回家的味道。',
        createdAt: '2026-05-18T18:08:00+08:00',
      },
      {
        id: 'response-005-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '外婆',
        method: 'text',
        content: '闻到姜香再放肉，火别急，味道就稳。',
        createdAt: '2026-05-18T18:42:00+08:00',
      },
    ],
  },
  {
    id: 'thread-006',
    title: '窗边的新花',
    photoUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    photoAlt: '家人把一束花放在窗边的温暖照片',
    photoLabel: '窗边花',
    photoMeta: '5月15日',
    photoTone: 'peach',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，今天路过花市，看到这束花颜色像你以前窗台那盆。我们放在餐桌旁，屋里一下亮了。',
    initialMethod: 'text',
    latestSnippet: '花放在窗边好，早上有光，它会开得久',
    latestAt: '2026-05-15T11:02:00+08:00',
    unread: false,
    responses: [
      {
        id: 'response-006-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，今天路过花市，看到这束花颜色像你以前窗台那盆。我们放在餐桌旁，屋里一下亮了。',
        createdAt: '2026-05-15T10:28:00+08:00',
      },
      {
        id: 'response-006-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'voice',
        content: '花放在窗边好，早上有光，它会开得久。',
        createdAt: '2026-05-15T11:02:00+08:00',
        durationSeconds: 16,
      },
    ],
  },
  {
    id: 'thread-007',
    title: '等周末来看你',
    photoUrl: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    photoAlt: '祖孙在室内靠在一起微笑的照片',
    photoLabel: '周末约定',
    photoMeta: '5月11日',
    photoTone: 'gold',
    senderId: 'member-child-yu',
    senderName: '外孙女知夏',
    initialContent: '外婆，小满今天翻日历，自己圈了周六。她说要早点睡，第二天精神一点去看太婆。',
    initialMethod: 'text',
    latestSnippet: '我也把周六圈上了，给她留一块桂花糕',
    latestAt: '2026-05-11T12:06:00+08:00',
    unread: false,
    responses: [
      {
        id: 'response-007-a',
        authorId: 'member-child-yu',
        authorName: '外孙女知夏',
        relation: '外孙女',
        method: 'text',
        content: '外婆，小满今天翻日历，自己圈了周六。她说要早点睡，第二天精神一点去看太婆。',
        createdAt: '2026-05-11T11:12:00+08:00',
      },
      {
        id: 'response-007-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰外婆',
        relation: '外婆',
        method: 'text',
        content: '我也把周六圈上了，给她留一块桂花糕。',
        createdAt: '2026-05-11T12:06:00+08:00',
      },
    ],
  },
  {
    id: 'thread-008',
    title: '饭后慢慢走',
    photoUrl: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    photoAlt: '一家人在阳光下散步聊天',
    photoLabel: '饭后散步',
    photoMeta: '5月6日',
    photoTone: 'paper',
    senderId: 'member-child-chen',
    senderName: '儿子嘉禾',
    initialContent: '妈，我们今天吃完饭去小区里慢慢走了一圈。路过桂花树，小满说闻起来像太婆家。',
    initialMethod: 'text',
    latestSnippet: '饭后走一走好，别走太快，慢慢说话就好',
    latestAt: '2026-05-06T19:42:00+08:00',
    unread: false,
    responses: [
      {
        id: 'response-008-a',
        authorId: 'member-child-chen',
        authorName: '儿子嘉禾',
        relation: '儿子',
        method: 'text',
        content: '妈，我们今天吃完饭去小区里慢慢走了一圈。路过桂花树，小满说闻起来像太婆家。',
        createdAt: '2026-05-06T19:05:00+08:00',
      },
      {
        id: 'response-008-b',
        authorId: 'member-elder-lin',
        authorName: '秀兰',
        relation: '妈妈',
        method: 'text',
        content: '饭后走一走好，别走太快，慢慢说话就好。',
        createdAt: '2026-05-06T19:42:00+08:00',
      },
    ],
  },
]

export const MOCK_MEMORY_THEMES: MemoryTheme[] = [
  {
    id: 'theme-childhood',
    title: '小时候的我',
    completedCount: 2,
    totalCount: 6,
    rewardTitle: '童年小传',
    rewardStatus: 'locked',
    topics: [
      {
        id: 'topic-childhood-home',
        title: '小时候的家',
        summary: '从住过的屋子、院子和最熟悉的角落聊起。',
        status: 'completed',
        updatedAt: '2026-05-12T15:12:00+08:00',
        photoLabel: '小时候的家',
      },
      {
        id: 'topic-childhood-play',
        title: '最爱玩的事',
        summary: '聊聊小时候最常玩、最开心的那些事。',
        status: 'recommended',
        updatedAt: '2026-05-24T09:30:00+08:00',
      },
      {
        id: 'topic-childhood-school',
        title: '上学路上',
        summary: '学校、同学、老师和每天走过的路。',
        status: 'completed',
        updatedAt: '2026-05-01T08:00:00+08:00',
      },
      {
        id: 'topic-childhood-treat',
        title: '那时的零嘴',
        summary: '从小时候最馋的一口味道聊起。',
        status: 'unfinished',
        updatedAt: '2026-04-22T08:00:00+08:00',
      },
      {
        id: 'topic-childhood-elder',
        title: '疼我的长辈',
        summary: '聊聊小时候最照顾自己的人。',
        status: 'unfinished',
        updatedAt: '2026-04-08T20:10:00+08:00',
      },
    ],
  },
  {
    id: 'theme-family',
    title: '成家的日子',
    completedCount: 0,
    totalCount: 5,
    rewardTitle: '成家小记',
    rewardStatus: 'locked',
    topics: [
      {
        id: 'topic-first-meet',
        title: '第一次心动',
        summary: '聊聊年轻时遇见重要的人是什么感觉。',
        status: 'unfinished',
        updatedAt: '2026-04-29T18:10:00+08:00',
        photoLabel: '年轻时的合影',
      },
      {
        id: 'topic-build-home',
        title: '把家撑起来',
        summary: '那些辛苦、踏实、慢慢变好的日子。',
        status: 'unfinished',
        updatedAt: '2026-04-18T11:20:00+08:00',
      },
      {
        id: 'topic-family-dinner',
        title: '饭桌上的家',
        summary: '聊聊家里最常出现的一道菜。',
        status: 'unfinished',
        updatedAt: '2026-05-18T19:32:00+08:00',
      },
      {
        id: 'topic-raising-children',
        title: '带孩子长大',
        summary: '从孩子小时候最难忘的一件事聊起。',
        status: 'unfinished',
        updatedAt: '2026-04-12T15:20:00+08:00',
      },
    ],
  },
  {
    id: 'theme-neighborhood',
    title: '街坊与远方',
    completedCount: 3,
    totalCount: 6,
    rewardTitle: '走过的地方',
    rewardStatus: 'locked',
    topics: [
      {
        id: 'topic-old-neighbor',
        title: '老邻居们',
        summary: '聊聊那些曾经常见面、常帮忙的人。',
        status: 'completed',
        updatedAt: '2026-05-09T08:12:00+08:00',
      },
      {
        id: 'topic-favorite-street',
        title: '最熟的街',
        summary: '聊聊以前经常走的路和常去的地方。',
        status: 'recommended',
        updatedAt: '2026-05-25T17:16:00+08:00',
      },
      {
        id: 'topic-first-trip',
        title: '第一次远行',
        summary: '第一次离开熟悉的地方，记得什么？',
        status: 'completed',
        updatedAt: '2026-05-06T14:10:00+08:00',
      },
      {
        id: 'topic-market-day',
        title: '赶集与买菜',
        summary: '聊聊以前怎么挑东西、怎么买菜。',
        status: 'unfinished',
        updatedAt: '2026-04-26T12:44:00+08:00',
      },
      {
        id: 'topic-journey-memory',
        title: '难忘的一程',
        summary: '聊聊一次还记得很清楚的出门经历。',
        status: 'completed',
        updatedAt: '2026-04-14T10:18:00+08:00',
      },
    ],
  },
  {
    id: 'theme-work',
    title: '认真生活过',
    completedCount: 1,
    totalCount: 5,
    rewardTitle: '日子里的本事',
    rewardStatus: 'locked',
    topics: [
      {
        id: 'topic-first-job',
        title: '第一份工作',
        summary: '聊聊刚开始工作时的心情和人。',
        status: 'completed',
        updatedAt: '2026-05-04T10:24:00+08:00',
      },
      {
        id: 'topic-hard-time',
        title: '最难的时候',
        summary: '那些咬咬牙撑过去的日子。',
        status: 'recommended',
        updatedAt: '2026-05-21T16:20:00+08:00',
      },
      {
        id: 'topic-proud-moment',
        title: '最骄傲的一次',
        summary: '聊聊觉得自己做得很好的一件事。',
        status: 'unfinished',
        updatedAt: '2026-04-28T09:15:00+08:00',
      },
      {
        id: 'topic-life-skill',
        title: '一身好本事',
        summary: '那些一直用到今天的手艺和经验。',
        status: 'unfinished',
        updatedAt: '2026-04-16T14:40:00+08:00',
      },
    ],
  },
  {
    id: 'theme-heart',
    title: '心里最柔软',
    completedCount: 5,
    totalCount: 5,
    rewardTitle: '心里的话',
    rewardStatus: 'unlocked',
    topics: [
      {
        id: 'topic-favorite-person',
        title: '最想念的人',
        summary: '聊聊常常想起、放在心里的人。',
        status: 'completed',
        updatedAt: '2026-05-17T20:10:00+08:00',
      },
      {
        id: 'topic-small-happiness',
        title: '小小的幸福',
        summary: '日子里最能让自己开心的小事。',
        status: 'completed',
        updatedAt: '2026-05-07T12:30:00+08:00',
      },
      {
        id: 'topic-unspoken-word',
        title: '没说出口的话',
        summary: '有没有一句一直想说的话？',
        status: 'completed',
        updatedAt: '2026-05-26T09:12:00+08:00',
      },
      {
        id: 'topic-wish-now',
        title: '现在的小心愿',
        summary: '聊聊最近最希望发生的小事。',
        status: 'completed',
        updatedAt: '2026-04-30T18:24:00+08:00',
      },
    ],
  },
]

export const MOCK_AI_SUGGESTIONS: AiSuggestion[] = [
  {
    id: 'suggestion-001',
    text: '外婆，小满看到你听到这个一定会很开心。',
    tone: 'warm',
  },
  {
    id: 'suggestion-002',
    text: '要不要顺手问问她，小时候运动会最记得哪一件事？',
    tone: 'curious',
  },
  {
    id: 'suggestion-003',
    text: '这句话已经很亲切了，适合直接发给相框。',
    tone: 'light',
  },
]

export const MOCK_FRAME_DEVICE_STATUS: FrameDeviceStatus = {
  id: 'frame-pad-lin-001',
  deviceName: '客厅相框',
  displayMode: 'elder',
  networkStatus: 'online',
  cacheStatus: 'ready',
  microphoneStatus: 'granted',
  slideshowIntervalSeconds: 30,
  lastSyncedAt: '2026-05-27T10:16:00+08:00',
  weatherLabel: '苏州 多云',
  temperatureCelsius: 26,
}

export const MOCK_FRAME_QUICK_REPLIES: FrameQuickReply[] = [
  {
    id: 'frame-reply-like',
    text: '真好，我喜欢',
    replyType: 'emoji',
  },
  {
    id: 'frame-reply-miss',
    text: '我也想你们',
    replyType: 'ai',
  },
  {
    id: 'frame-reply-voice',
    text: '我来说几句',
    replyType: 'voice',
  },
]

export const MOCK_FRAME_CONVERSATION: FrameConversationLine[] = [
  {
    id: 'frame-line-001',
    speaker: 'ai',
    text: '秀兰外婆，我在。今天想看看照片，还是想和我聊几句？',
    createdAt: '2026-05-27T10:12:00+08:00',
  },
  {
    id: 'frame-line-002',
    speaker: 'elder',
    text: '我想问问明天会不会下雨。',
    createdAt: '2026-05-27T10:13:00+08:00',
  },
  {
    id: 'frame-line-003',
    speaker: 'ai',
    text: '明天苏州有小雨，出门带伞。要是去买菜，早上会更合适一点。',
    createdAt: '2026-05-27T10:13:20+08:00',
  },
]

export const MOCK_UPLOAD_DRAFTS: UploadPhotoDraft[] = [
  {
    id: 'upload-001',
    fileName: '小满画给太婆.png',
    previewUrl: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    status: 'success',
    progress: 100,
  },
  {
    id: 'upload-002',
    fileName: '照着妈妈菜谱.png',
    previewUrl: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    status: 'uploading',
    progress: 68,
  },
  {
    id: 'upload-003',
    fileName: '周末去看太婆.png',
    previewUrl: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    status: 'failed',
    progress: 32,
  },
]

export const MOCK_MEMORY_STORIES: MemoryStory[] = [
  {
    id: 'story-childhood-home',
    type: 'topic',
    title: '小时候的家',
    themeTitle: '小时候的我',
    generatedAt: '2026-05-12T15:18:00+08:00',
    readDurationSeconds: 96,
    isNew: false,
    body: [
      '秀兰说，小时候的家不大，院子却像一整个世界。门口有一棵香椿树，春天刚冒芽时，家里人就知道又到了换季的时候。',
      '她最记得的是傍晚。大人收工回来，孩子们从巷口跑进跑出，厨房里先响起锅铲声，再慢慢飘出饭香。',
      '那时候东西不多，但每个角落都有用处。窗台晒豆子，屋檐下挂蒜辫，院墙边留着一小块地方种花。她说，那是她最早觉得“家会照顾人”的地方。',
    ],
  },
  {
    id: 'story-childhood-school',
    type: 'topic',
    title: '上学路上',
    themeTitle: '小时候的我',
    generatedAt: '2026-05-01T08:30:00+08:00',
    readDurationSeconds: 88,
    isNew: false,
    body: [
      '上学路并不近，秀兰每天要沿着河边走一段，再穿过两条巷子。下雨天泥水会溅到裤脚，但她仍记得那条路上的风。',
      '她说自己那时最怕迟到，也最喜欢放学。放学路上同伴多，大家边走边说今天老师讲了什么，谁带了新的铅笔盒。',
      '多年以后，她还记得教室窗外那棵树。树影落在课桌上，一晃一晃，像把那段日子轻轻留住。',
    ],
  },
  {
    id: 'story-heart-chapter',
    type: 'chapter',
    title: '心里的话',
    themeTitle: '心里最柔软',
    generatedAt: '2026-05-26T09:30:00+08:00',
    readDurationSeconds: 168,
    isNew: true,
    body: [
      '这一章里，秀兰反复提到的不是大事，而是一些很小的牵挂。她记得孩子第一次离家时拎着的包，也记得孙辈学会叫她时的声音。',
      '她说想念一个人，常常不是整天挂在嘴边，而是在做饭时多想起一道菜，在收衣服时想起某个天气，在看见花开时想问一句近来好不好。',
      '这些话被整理下来，不是为了把往事封存，而是让家里人知道：她心里一直有位置，放着很多细小、温热、没有说完的爱。',
    ],
  },
]

const stickerSrc = (path: string) => `/stickers/${path}`

export const MOCK_FRAME_STICKERS: FrameSticker[] = [
  { id: 'sticker-wait-home', label: '等你回家', src: stickerSrc('00_风格确认版/01_等你回家.png'), category: '风格确认', audience: 'common', scene: 'common' },
  { id: 'sticker-home-meal', label: '回家吃饭', src: stickerSrc('00_风格确认版/02_回家吃饭.png'), category: '风格确认', audience: 'common', scene: 'family' },
  { id: 'sticker-like', label: '喜欢', src: stickerSrc('00_风格确认版/03_喜欢.png'), category: '风格确认', audience: 'common', scene: 'common' },
  { id: 'sticker-miss-you', label: '想你', src: stickerSrc('00_风格确认版/04_想你.png'), category: '风格确认', audience: 'common', scene: 'family' },
  { id: 'sticker-relieved', label: '放心了', src: stickerSrc('00_风格确认版/05_放心了.png'), category: '风格确认', audience: 'common', scene: 'family' },
  { id: 'sticker-so-good', label: '真好', src: stickerSrc('00_风格确认版/06_真好.png'), category: '风格确认', audience: 'common', scene: 'common' },
  { id: 'sticker-parent-ok', label: '好的', src: stickerSrc('02_家长版/01_回应夸奖类/01_好的.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-thanks', label: '谢谢', src: stickerSrc('02_家长版/01_回应夸奖类/02_谢谢.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-big-like', label: '大大的赞', src: stickerSrc('02_家长版/01_回应夸奖类/03_大大的赞.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-love-baby', label: '爱你宝贝', src: stickerSrc('02_家长版/01_回应夸奖类/04_爱你宝贝.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-proud', label: '为你骄傲', src: stickerSrc('02_家长版/01_回应夸奖类/05_为你骄傲.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-best', label: '我宝最棒了', src: stickerSrc('02_家长版/01_回应夸奖类/06_我宝最棒了.png'), category: '回应夸奖', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-happy', label: '开心每一天', src: stickerSrc('02_家长版/02_日常关怀类/01_开心每一天.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-miss-baby', label: '想宝贝了', src: stickerSrc('02_家长版/02_日常关怀类/02_想宝贝了.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-eat', label: '按时吃饭', src: stickerSrc('02_家长版/02_日常关怀类/03_按时吃饭.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-bloom', label: '幸福永绽放', src: stickerSrc('02_家长版/02_日常关怀类/04_幸福永绽放.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-sleep', label: '别熬夜哦', src: stickerSrc('02_家长版/02_日常关怀类/05_别熬夜哦.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-cheer', label: '加油鸭', src: stickerSrc('02_家长版/02_日常关怀类/06_加油鸭.png'), category: '日常关怀', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-rest', label: '累了就歇歇', src: stickerSrc('02_家长版/03_支持鼓励类/01_累了就歇歇.png'), category: '支持鼓励', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-support', label: '永远支持你', src: stickerSrc('02_家长版/03_支持鼓励类/02_永远支持你.png'), category: '支持鼓励', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-nice', label: '真不错', src: stickerSrc('02_家长版/03_支持鼓励类/03_真不错.png'), category: '支持鼓励', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-respect', label: '致敬', src: stickerSrc('02_家长版/03_支持鼓励类/04_致敬.png'), category: '支持鼓励', audience: 'parent', scene: 'family' },
  { id: 'sticker-parent-wow', label: '叹为观止', src: stickerSrc('02_家长版/03_支持鼓励类/05_叹为观止.png'), category: '支持鼓励', audience: 'parent', scene: 'family' },
  { id: 'sticker-child-best', label: '天下第一棒', src: stickerSrc('01_子女版/01_夸奖亲密类/01_天下第一棒.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-proud', label: '为你骄傲', src: stickerSrc('01_子女版/01_夸奖亲密类/02_为你骄傲.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-love', label: '爱你么么哒', src: stickerSrc('01_子女版/01_夸奖亲密类/03_爱你么么哒.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-hug', label: '抱抱你', src: stickerSrc('01_子女版/01_夸奖亲密类/04_抱抱你.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-love-too', label: '我也爱你呀', src: stickerSrc('01_子女版/01_夸奖亲密类/05_我也爱你呀.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-miss', label: '我想你了', src: stickerSrc('01_子女版/01_夸奖亲密类/06_我想你了.png'), category: '夸奖亲密', audience: 'child', scene: 'family' },
  { id: 'sticker-child-miss-too', label: '我也想你', src: stickerSrc('01_子女版/02_想念感谢祝福类/01_我也想你.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-thanks', label: '谢谢', src: stickerSrc('01_子女版/02_想念感谢祝福类/02_谢谢.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-happy', label: '开心每一天', src: stickerSrc('01_子女版/02_想念感谢祝福类/03_开心每一天.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-bloom', label: '幸福永绽放', src: stickerSrc('01_子女版/02_想念感谢祝福类/04_幸福永绽放.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-respect', label: '致敬', src: stickerSrc('01_子女版/02_想念感谢祝福类/05_致敬.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-wow', label: '叹为观止', src: stickerSrc('01_子女版/02_想念感谢祝福类/06_叹为观止.png'), category: '想念感谢', audience: 'child', scene: 'family' },
  { id: 'sticker-child-rest', label: '早点休息', src: stickerSrc('01_子女版/03_生活关怀类/01_早点休息.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-child-eat', label: '吃好喝好', src: stickerSrc('01_子女版/03_生活关怀类/02_吃好喝好.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-child-care', label: '注意身体', src: stickerSrc('01_子女版/03_生活关怀类/03_注意身体.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-child-hard', label: '辛苦啦', src: stickerSrc('01_子女版/03_生活关怀类/04_辛苦啦.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-child-cool', label: '爸妈最酷', src: stickerSrc('01_子女版/03_生活关怀类/05_爸妈最酷.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-child-heart', label: '给你比心', src: stickerSrc('01_子女版/03_生活关怀类/06_给你比心.png'), category: '生活关怀', audience: 'child', scene: 'family' },
  { id: 'sticker-square-morning', label: '早上好呀', src: stickerSrc('03_银发广场版/01_日常互动类/01_早上好呀.png'), category: '日常互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-night', label: '晚安好梦', src: stickerSrc('03_银发广场版/01_日常互动类/02_晚安好梦.png'), category: '日常互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-tea', label: '喝茶去', src: stickerSrc('03_银发广场版/01_日常互动类/03_喝茶去.png'), category: '日常互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-walk', label: '出门溜溜', src: stickerSrc('03_银发广场版/01_日常互动类/04_出门溜溜.png'), category: '日常互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-place', label: '老地方见', src: stickerSrc('03_银发广场版/01_日常互动类/05_老地方见.png'), category: '日常互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-talented', label: '太有才了', src: stickerSrc('03_银发广场版/02_才艺互动类/01_太有才了.png'), category: '才艺互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-spirit', label: '老伙计真精神', src: stickerSrc('03_银发广场版/02_才艺互动类/02_老伙计真精神.png'), category: '才艺互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-dance', label: '舞姿优美', src: stickerSrc('03_银发广场版/02_才艺互动类/03_舞姿优美.png'), category: '才艺互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-charming', label: '风采依旧', src: stickerSrc('03_银发广场版/02_才艺互动类/04_风采依旧.png'), category: '才艺互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-center', label: '绝对C位', src: stickerSrc('03_银发广场版/02_才艺互动类/05_绝对C位.png'), category: '才艺互动', audience: 'square', scene: 'square' },
  { id: 'sticker-square-health', label: '身体倍儿棒', src: stickerSrc('03_银发广场版/03_祝愿类/01_身体倍儿棒.png'), category: '祝愿', audience: 'square', scene: 'square' },
  { id: 'sticker-square-longevity', label: '福寿安康', src: stickerSrc('03_银发广场版/03_祝愿类/02_福寿安康.png'), category: '祝愿', audience: 'square', scene: 'square' },
  { id: 'sticker-square-friend', label: '友谊长存', src: stickerSrc('03_银发广场版/03_祝愿类/03_友谊长存.png'), category: '祝愿', audience: 'square', scene: 'square' },
  { id: 'sticker-square-live', label: '乐活当下', src: stickerSrc('03_银发广场版/03_祝愿类/04_乐活当下.png'), category: '祝愿', audience: 'square', scene: 'square' },
  { id: 'sticker-square-peace', label: '岁岁平安', src: stickerSrc('03_银发广场版/03_祝愿类/05_岁岁平安.png'), category: '祝愿', audience: 'square', scene: 'square' },
]

const FAMILY_DYNAMIC_EXTRAS: Record<string, {
  placeLabel: string
  voiceDurationSeconds?: number
  stickerLabels: string[]
  insightTags: string[]
  photoUrls?: string[]
}> = {
  'thread-001': {
    placeLabel: '上海家里',
    stickerLabels: ['大大的赞', '我也想你'],
    insightTags: ['孩子近况', '画画'],
    photoUrls: [
      '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
      '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    ],
  },
  'thread-002': {
    placeLabel: '嘉禾家厨房',
    stickerLabels: ['回家吃饭', '真不错'],
    insightTags: ['家常菜', '外婆菜谱'],
    photoUrls: [
      '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
      '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
      '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    ],
  },
  'thread-003': {
    placeLabel: '出门前',
    voiceDurationSeconds: 18,
    stickerLabels: ['想宝贝了'],
    insightTags: ['周末见面', '语音'],
  },
  'thread-004': {
    placeLabel: '孩子书桌',
    stickerLabels: ['爱你宝贝', '开心每一天'],
    insightTags: ['写字', '想念'],
  },
  'thread-005': {
    placeLabel: '知夏家厨房',
    stickerLabels: ['放心了'],
    insightTags: ['学做菜', '小时候味道'],
  },
  'thread-006': {
    placeLabel: '餐桌旁',
    voiceDurationSeconds: 16,
    stickerLabels: ['幸福永绽放'],
    insightTags: ['窗边花', '家里变亮'],
  },
}

export const MOCK_FAMILY_DYNAMICS: FamilyDynamic[] = MOCK_INTERACTION_THREADS.slice(0, 6).map((thread) => {
  const author = MOCK_MEMBERS.find((member) => member.id === thread.senderId)
  const latestFamilyReply = [...thread.responses].reverse().find((response) => response.authorId === 'member-elder-lin')
  const firstSenderVoice = thread.responses.find((response) => response.authorId === thread.senderId && response.method === 'voice')
  const extras = FAMILY_DYNAMIC_EXTRAS[thread.id] || {
    placeLabel: '家里',
    stickerLabels: [],
    insightTags: [],
  }

  return {
    id: `dynamic-${thread.id}`,
    authorId: thread.senderId,
    authorName: thread.senderName,
    relation: author?.relation || '家人',
    title: thread.title,
    summary: thread.initialContent,
    body: thread.responses.map((response) => response.content).join('\n'),
    photoUrl: thread.photoUrl,
    photoAlt: thread.photoAlt,
    photoUrls: extras.photoUrls || [thread.photoUrl],
    timeLabel: thread.photoMeta,
    placeLabel: extras.placeLabel,
    voiceDurationSeconds: extras.voiceDurationSeconds || firstSenderVoice?.durationSeconds,
    replyCount: Math.max(thread.responses.length - 1, 0),
    stickerLabels: latestFamilyReply?.method === 'sticker' ? [latestFamilyReply.content, ...extras.stickerLabels] : extras.stickerLabels,
    insightTags: extras.insightTags,
    threadId: thread.id,
  }
})

export const MOCK_FAMILY_WEEKLY_RECAP: FamilyWeeklyRecap = {
  id: 'recap-week-0527',
  title: '这一周，家里人都惦记着你',
  subtitle: '3 条照片来信、2 段语音回应、2 张老照片入框',
  coverUrl: MOCK_GALLERY_PHOTOS[2].url,
  scenes: [
    {
      id: 'recap-scene-1',
      title: '小满画给太婆',
      summary: '孩子把太婆家的茶杯画进了餐桌，等周末亲手拿给你看。',
      photoUrl: MOCK_INTERACTION_THREADS[0].photoUrl,
    },
    {
      id: 'recap-scene-2',
      title: '照着你的菜谱',
      summary: '家里人照着你的做法下锅，孩子说厨房闻起来像太婆家。',
      photoUrl: MOCK_INTERACTION_THREADS[1].photoUrl,
    },
    {
      id: 'recap-scene-3',
      title: '周末去看太婆',
      summary: '两个孩子已经收好小书包，画、橘子和悄悄话都准备好了。',
      photoUrl: MOCK_INTERACTION_THREADS[2].photoUrl,
    },
  ],
}

export const MOCK_STUDY_MODULES: StudyModule[] = [
  {
    id: 'album',
    title: '个人相册',
    description: '自动归档照片',
    intro: '这些照片先放在书房里，只有自己看。以后愿意时，再挑选进回忆录或分享给家人。',
    itemCount: 18,
    coverUrl: MOCK_GALLERY_PHOTOS[0].url,
    items: [
      { id: 'album-1', title: '1978年全家福', summary: '已归档到“奋斗年代”候选', note: '照相馆里第一次拍全家福，那天回家后她把照片压在枕头边看了好几遍。', meta: '家庭老照片', photoUrl: MOCK_GALLERY_PHOTOS[10].url, type: 'photo', updatedAt: '5月18日' },
      { id: 'album-2', title: '小旭周岁照片', summary: '外孙成长册', note: '一岁抓周时笑得最开心，大家都围着他拍照。', meta: '外孙成长册', photoUrl: MOCK_GALLERY_PHOTOS[0].url, type: 'photo', updatedAt: '今天 19:08' },
      { id: 'album-3', title: '老屋门口的合影', summary: '家庭老照片', note: '那时大家都还住在一块，门前台阶和树荫都还记得。', meta: '已识别 5 位家人', photoUrl: MOCK_GALLERY_PHOTOS[12].url, type: 'photo', updatedAt: '4月28日' },
    ],
  },
  {
    id: 'drafts',
    title: '创作草稿箱',
    description: '讲到一半也会自动保存',
    intro: '没讲完的故事、只写了一半的标题、突然想到的一句话，都先留在这里，等有空再继续。',
    itemCount: 6,
    coverUrl: MOCK_GALLERY_PHOTOS[3].url,
    items: [
      { id: 'draft-1', title: '那年我们在北大荒的麦田', summary: '已保存 3 次', note: '还差一段写到第一次回城，结尾想写给小旭看。', meta: '语音草稿 3 段', photoUrl: MOCK_GALLERY_PHOTOS[3].url, type: 'draft', updatedAt: '昨天 16:42' },
      { id: 'draft-2', title: '给小旭讲小时候过冬', summary: '语音草稿 2 段', note: '已经录下雪天排队买煤球那段，想再补一张旧棉袄的照片。', meta: '待补照片', photoUrl: MOCK_GALLERY_PHOTOS[5].url, type: 'draft', updatedAt: '5月18日' },
      { id: 'draft-3', title: '外婆的缝纫机', summary: '待润色', note: '准备整理成能分享给家人的短文，已经写到攒票那一节。', meta: 'AI 提醒可补结尾', photoUrl: MOCK_GALLERY_PHOTOS[11].url, type: 'draft', updatedAt: '5月12日' },
    ],
  },
  {
    id: 'recorder',
    title: '岁月留声机',
    description: '珍藏重要声音',
    intro: '这里收着最想留住的声音，有孩子们的问候，也有自己讲故事时的原声。',
    itemCount: 9,
    coverUrl: MOCK_GALLERY_PHOTOS[1].url,
    items: [
      { id: 'voice-1', title: '小旭祝姥姥生日快乐', summary: '12 秒', note: '孩子的声音一听就想笑，尾音还带着点喘。', meta: '家人问候', photoUrl: MOCK_GALLERY_PHOTOS[0].url, durationSeconds: 12, type: 'voice', updatedAt: '昨天 18:42' },
      { id: 'voice-2', title: '儿子在雪地里录的脚步声', summary: '18 秒', note: '说想让妈妈听听国外下雪的声音，鞋踩在雪地上很脆。', meta: '远方声音', photoUrl: MOCK_GALLERY_PHOTOS[6].url, durationSeconds: 18, type: 'voice', updatedAt: '5月1日' },
      { id: 'voice-3', title: '讲第一台缝纫机的故事', summary: '86 秒', note: '已经同步到回忆录候选，是她讲得最投入的一段。', meta: '故事原声', photoUrl: MOCK_GALLERY_PHOTOS[11].url, durationSeconds: 86, type: 'voice', updatedAt: '4月30日' },
    ],
  },
  {
    id: 'shelf',
    title: '作品书架',
    description: '整理好的作品',
    intro: '这里摆的是已经整理好的内容，像一本本小书，能翻、能听、也能分享。',
    itemCount: 4,
    coverUrl: MOCK_GALLERY_PHOTOS[11].url,
    items: [
      { id: 'article-1', title: '那年我们在北大荒的麦田', summary: '长篇回忆录', note: '已成文，可继续润色，也可以直接翻阅。', meta: '长篇回忆录', photoUrl: MOCK_GALLERY_PHOTOS[3].url, type: 'article', updatedAt: '5月12日' },
      { id: 'article-2', title: '第一台缝纫机', summary: '故事章节', note: '已加入回忆录，包含原声讲述与旧照片。', meta: '故事章节', photoUrl: MOCK_GALLERY_PHOTOS[11].url, type: 'article', updatedAt: '5月1日' },
      { id: 'article-3', title: '给孩子们做冬衣的那些年', summary: '图文册', note: '待邀请家人共创，准备再补一张全家冬天合影。', meta: '图文册', photoUrl: MOCK_GALLERY_PHOTOS[8].url, type: 'article', updatedAt: '4月26日' },
    ],
  },
  {
    id: 'wishlist',
    title: '愿望清单',
    description: '想做的事一件件完成',
    intro: '把想去的地方、想见的人、想完成的小心愿都放进许愿瓶里，等合适的时候慢慢实现。',
    itemCount: 5,
    coverUrl: MOCK_GALLERY_PHOTOS[13].url,
    items: [
      { id: 'wish-1', title: '和家人再去一次海边', summary: '想和小旭一起完成', note: '想听海浪，也想拍一张新的全家合影。', meta: '想和小旭一起完成', photoUrl: MOCK_GALLERY_PHOTOS[13].url, type: 'wish', updatedAt: '5月8日' },
      { id: 'wish-2', title: '把老照片做成一本小册子', summary: '整理中', note: '先挑出最重要的十张，再请家人一起补上故事。', meta: '整理中', photoUrl: MOCK_GALLERY_PHOTOS[14].url, type: 'wish', updatedAt: '4月30日' },
      { id: 'wish-3', title: '给孩子们录一段新年祝福', summary: '待录音', note: '想说的话先存在这里，过年前慢慢录好。', meta: '待录音', photoUrl: MOCK_GALLERY_PHOTOS[1].url, type: 'wish', updatedAt: '4月20日' },
    ],
  },
  {
    id: 'vault',
    title: '私密保险箱',
    description: '仅自己可见',
    intro: '有些照片和心事先不急着给别人看，可以只留给自己。这里默认上锁，安安静静地收着。',
    itemCount: 3,
    coverUrl: MOCK_GALLERY_PHOTOS[14].url,
    items: [
      { id: 'vault-1', title: '年轻时写给母亲的信', summary: '已上锁', note: '只自己可见，字迹已经有些淡了。', meta: '已上锁', photoUrl: MOCK_GALLERY_PHOTOS[14].url, type: 'private', updatedAt: '4月26日' },
      { id: 'vault-2', title: '旧相册里的单人照', summary: '人脸保护', note: '暂不加入公开回忆，想等以后慢慢整理。', meta: '人脸保护', photoUrl: MOCK_GALLERY_PHOTOS[10].url, type: 'private', updatedAt: '4月12日' },
      { id: 'vault-3', title: '没讲出口的话', summary: '语音备忘', note: '留给以后慢慢整理，不急着给任何人看。', meta: '语音备忘', photoUrl: MOCK_GALLERY_PHOTOS[1].url, durationSeconds: 34, type: 'private', updatedAt: '4月8日' },
    ],
  },
]

export const MOCK_FAMILY_EXPLORATION_ITEMS: FamilyExplorationItem[] = [
  {
    id: 'explore-family-photo-book',
    ownerId: 'family',
    ownerName: '全家',
    ownerType: 'family',
    title: '把老照片做成一本小册子',
    summary: '全家一起挑照片，补上每张照片背后的故事。',
    reason: '姥姥说很多照片只记得大概，想趁大家都还能讲清楚时整理好。',
    category: '家庭共创',
    status: 'scheduled',
    statusLabel: '周末一起整理',
    participantNames: ['林秀兰', '知夏', '嘉禾'],
    nextStep: '知夏周六先挑出十张老照片',
    dateLabel: '本周六',
    photoUrl: MOCK_GALLERY_PHOTOS[14].url,
  },
  {
    id: 'explore-elder-sea',
    ownerId: 'member-elder-lin',
    ownerName: '林秀兰',
    ownerType: 'elder',
    title: '和家人再去一次海边',
    summary: '想听海浪，也想和孩子们拍一张新的全家合影。',
    reason: '年轻时和外公去过一次海边，后来总说还想再看看。',
    category: '旧地重游',
    status: 'responded',
    statusLabel: '家人已回应',
    participantNames: ['林秀兰', '知夏', '小满'],
    nextStep: '嘉禾帮忙查合适的短途路线',
    dateLabel: '想在秋天',
    photoUrl: MOCK_GALLERY_PHOTOS[13].url,
  },
  {
    id: 'explore-elder-new-year-voice',
    ownerId: 'member-elder-lin',
    ownerName: '林秀兰',
    ownerType: 'elder',
    title: '给孩子们录一段新年祝福',
    summary: '把想说的话先录下来，过年前发给全家。',
    reason: '姥姥觉得有些话当面不好意思说，录下来能慢慢讲。',
    category: '声音祝福',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['林秀兰'],
    nextStep: '相框可以先帮她录一段草稿',
    dateLabel: '春节前',
    photoUrl: MOCK_GALLERY_PHOTOS[1].url,
  },
  {
    id: 'explore-elder-flower',
    ownerId: 'member-elder-lin',
    ownerName: '林秀兰',
    ownerType: 'elder',
    title: '把阳台的花重新种一遍',
    summary: '想让窗边重新有几盆开花的植物。',
    reason: '姥姥说以前春天最喜欢照看花盆，最近想把阳台重新收拾起来。',
    category: '生活小愿望',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['林秀兰', '嘉禾'],
    nextStep: '嘉禾下次带两盆好养的花',
    dateLabel: '这个月',
    photoUrl: MOCK_GALLERY_PHOTOS[6].url,
  },
  {
    id: 'explore-elder-completed-song',
    ownerId: 'member-elder-lin',
    ownerName: '林秀兰',
    ownerType: 'elder',
    title: '学会用相框听小满唱歌',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['林秀兰', '小满'],
    nextStep: '',
    dateLabel: '上周',
    photoUrl: MOCK_GALLERY_PHOTOS[0].url,
  },
  {
    id: 'explore-elder-completed-tea',
    ownerId: 'member-elder-lin',
    ownerName: '林秀兰',
    ownerType: 'elder',
    title: '把老茶杯的故事讲给知夏',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['林秀兰', '知夏'],
    nextStep: '',
    dateLabel: '上个月',
    photoUrl: MOCK_GALLERY_PHOTOS[4].url,
  },
  {
    id: 'explore-yu-photo-day',
    ownerId: 'member-child-yu',
    ownerName: '知夏',
    ownerType: 'member',
    title: '陪姥姥拍一组现在的照片',
    summary: '不只整理旧照片，也留住现在的她。',
    reason: '知夏想让孩子们以后也能看到姥姥现在的样子和生活。',
    category: '陪伴记录',
    status: 'scheduled',
    statusLabel: '已约时间',
    participantNames: ['知夏', '林秀兰', '小满'],
    nextStep: '周日下午在老屋客厅拍',
    dateLabel: '周日下午',
    photoUrl: MOCK_GALLERY_PHOTOS[4].url,
  },
  {
    id: 'explore-yu-story',
    ownerId: 'member-child-yu',
    ownerName: '知夏',
    ownerType: 'member',
    title: '整理姥姥讲过的老屋故事',
    summary: '先记下几个关键词，之后做成回忆录。',
    reason: '知夏担心平时听过就忘，想把姥姥讲过的老屋、邻居和巷口都记下来。',
    category: '回忆记录',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['知夏', '林秀兰'],
    nextStep: '下次视频时先问老屋门口那棵树',
    dateLabel: '慢慢来',
    photoUrl: MOCK_GALLERY_PHOTOS[11].url,
  },
  {
    id: 'explore-yu-video-call',
    ownerId: 'member-child-yu',
    ownerName: '知夏',
    ownerType: 'member',
    title: '每周给姥姥打一次视频',
    summary: '',
    reason: '',
    category: '陪伴',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['知夏', '林秀兰'],
    nextStep: '',
    dateLabel: '每周',
    photoUrl: MOCK_GALLERY_PHOTOS[3].url,
  },
  {
    id: 'explore-yu-completed-sticker',
    ownerId: 'member-child-yu',
    ownerName: '知夏',
    ownerType: 'member',
    title: '教小满给太婆发贴纸',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['知夏', '小满'],
    nextStep: '',
    dateLabel: '昨天',
    photoUrl: MOCK_GALLERY_PHOTOS[0].url,
  },
  {
    id: 'explore-yu-completed-album',
    ownerId: 'member-child-yu',
    ownerName: '知夏',
    ownerType: 'member',
    title: '上传小满最近的画',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['知夏'],
    nextStep: '',
    dateLabel: '前天',
    photoUrl: MOCK_GALLERY_PHOTOS[0].url,
  },
  {
    id: 'explore-chen-cook',
    ownerId: 'member-child-chen',
    ownerName: '嘉禾',
    ownerType: 'member',
    title: '学会妈妈的糖醋排骨',
    summary: '把做法录下来，也把味道留给下一代。',
    reason: '嘉禾说每次照着做都差一点，想请妈妈现场讲一遍。',
    category: '家常味道',
    status: 'responded',
    statusLabel: '等姥姥指导',
    participantNames: ['嘉禾', '林秀兰'],
    nextStep: '下次晚饭前用手机录步骤',
    dateLabel: '下次回家',
    photoUrl: MOCK_GALLERY_PHOTOS[2].url,
  },
  {
    id: 'explore-chen-medicine-box',
    ownerId: 'member-child-chen',
    ownerName: '嘉禾',
    ownerType: 'member',
    title: '给妈妈重新整理药盒',
    summary: '把早晚用药分清楚，顺手拍照留档。',
    reason: '嘉禾想把照护事项整理得更清楚，让家里人接手时也知道怎么做。',
    category: '照护安排',
    status: 'scheduled',
    statusLabel: '已安排',
    participantNames: ['嘉禾', '林秀兰'],
    nextStep: '周三晚饭后重新贴标签',
    dateLabel: '周三',
    photoUrl: MOCK_GALLERY_PHOTOS[4].url,
  },
  {
    id: 'explore-chen-frame-clean',
    ownerId: 'member-child-chen',
    ownerName: '嘉禾',
    ownerType: 'member',
    title: '帮妈妈检查相框网络',
    summary: '',
    reason: '',
    category: '设备照看',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['嘉禾'],
    nextStep: '',
    dateLabel: '这周',
    photoUrl: MOCK_GALLERY_PHOTOS[4].url,
  },
  {
    id: 'explore-chen-completed-reminder',
    ownerId: 'member-child-chen',
    ownerName: '嘉禾',
    ownerType: 'member',
    title: '设置晚间吃药提醒',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['嘉禾'],
    nextStep: '',
    dateLabel: '3天前',
    photoUrl: MOCK_GALLERY_PHOTOS[4].url,
  },
  {
    id: 'explore-chen-completed-kitchen',
    ownerId: 'member-child-chen',
    ownerName: '嘉禾',
    ownerType: 'member',
    title: '把厨房照片传到相框',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['嘉禾'],
    nextStep: '',
    dateLabel: '前天',
    photoUrl: MOCK_GALLERY_PHOTOS[2].url,
  },
  {
    id: 'explore-family-home',
    ownerId: 'family',
    ownerName: '全家',
    ownerType: 'family',
    title: '回老房子门口拍张合影',
    summary: '回到以前住过的巷口，听姥姥讲那几年。',
    reason: '这件事能把老照片、地点和家人记忆连起来。',
    category: '家庭旅行',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['林秀兰', '嘉禾', '知夏'],
    nextStep: '已生成一条家庭回忆',
    dateLabel: '上个月',
    photoUrl: MOCK_GALLERY_PHOTOS[12].url,
  },
  {
    id: 'explore-family-dinner',
    ownerId: 'family',
    ownerName: '全家',
    ownerType: 'family',
    title: '每月一起吃一次家常饭',
    summary: '不一定正式，能坐下来吃顿饭就好。',
    reason: '大家都忙，先把能一起吃饭这件小事固定下来。',
    category: '家庭约定',
    status: 'wish',
    statusLabel: '想做',
    participantNames: ['林秀兰', '知夏', '嘉禾'],
    nextStep: '先定这个月的第一个周末',
    dateLabel: '每月一次',
    photoUrl: MOCK_GALLERY_PHOTOS[2].url,
  },
  {
    id: 'explore-family-spring-photo',
    ownerId: 'family',
    ownerName: '全家',
    ownerType: 'family',
    title: '春节前拍一张新的全家福',
    summary: '',
    reason: '',
    category: '家庭共创',
    status: 'scheduled',
    statusLabel: '已安排',
    participantNames: ['林秀兰', '知夏', '嘉禾'],
    nextStep: '',
    dateLabel: '春节前',
    photoUrl: MOCK_GALLERY_PHOTOS[8].url,
  },
  {
    id: 'explore-family-completed-call',
    ownerId: 'family',
    ownerName: '全家',
    ownerType: 'family',
    title: '一起完成一次周日晚间视频',
    summary: '',
    reason: '',
    category: '已完成',
    status: 'completed',
    statusLabel: '已完成',
    participantNames: ['林秀兰', '知夏', '嘉禾'],
    nextStep: '',
    dateLabel: '上周日',
    photoUrl: MOCK_GALLERY_PHOTOS[3].url,
  },
]

export const MOCK_RIVER_STAGES: RiverStage[] = [
  {
    id: 'childhood',
    title: '小时候的我',
    years: '1948-1965',
    summary: '院子、上学路、老邻居和那些最早记住的声音。',
    coverUrl: MOCK_GALLERY_PHOTOS[10].url,
    stories: [
      {
        id: 'childhood-home',
        title: '小时候的家',
        summary: '门口的香椿树、屋檐下的蒜辫和傍晚的饭香。',
        photoUrl: MOCK_GALLERY_PHOTOS[11].url,
        body: MOCK_MEMORY_STORIES[0].body,
      },
      {
        id: 'school-road',
        title: '上学路上',
        summary: '沿着河边走过的路，还有教室窗外的树影。',
        photoUrl: MOCK_GALLERY_PHOTOS[12].url,
        body: MOCK_MEMORY_STORIES[1].body,
      },
    ],
  },
  {
    id: 'family-days',
    title: '成家的日子',
    years: '1966-1988',
    summary: '把家撑起来的日子，有辛苦，也有踏实的欢喜。',
    coverUrl: MOCK_GALLERY_PHOTOS[7].url,
    stories: [
      {
        id: 'first-home',
        title: '第一张饭桌',
        summary: '一张旧木桌，慢慢坐满了家里人。',
        photoUrl: MOCK_GALLERY_PHOTOS[2].url,
        body: ['那时候家里东西不多，但饭桌总是最热闹的地方。', '孩子们围着桌子写作业，大人一边择菜一边说白天的事。', '秀兰说，家不是一下子有的，是每天一点点过出来的。'],
      },
    ],
  },
  {
    id: 'today',
    title: '现在的牵挂',
    years: '1989-今天',
    summary: '孩子们长大了，照片和语音把家重新连在一起。',
    coverUrl: MOCK_GALLERY_PHOTOS[0].url,
    stories: [
      {
        id: 'medal',
        title: '想给太婆看的奖牌',
        summary: '小满跑完 200 米后，先想到把奖牌拿给你看。',
        photoUrl: MOCK_INTERACTION_THREADS[0].photoUrl,
        body: ['照片传到相框时，秀兰先笑了。', '她说孩子跑起来真精神，下次要把奖牌拍清楚一点。', '这样的时刻很小，却让家里人知道彼此都在场。'],
      },
    ],
  },
]

export const MOCK_SQUARE_POSTS: SquarePost[] = [
  {
    id: 'square-1',
    authorName: '周阿姨',
    authorTitle: '太极拳友',
    title: '今早在深圳湾打完太极，整个人都舒展了',
    summary: '练完以后和拳友坐在树荫下喝水，聊着聊着就觉得，退休后的日子也能过得很舒展。',
    photoUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    tag: '发现',
    topic: '养生心得',
    likes: 87,
    comments: 12,
    tags: ['晨练', '太极', '好心情'],
  },
  {
    id: 'square-2',
    authorName: '建国老李',
    authorTitle: '园艺邻居',
    title: '阳台小菜园丰收了，今天凉拌黄瓜',
    summary: '种花种菜这件事慢慢做，会让人很安定。收成不大，但看着它们长出来就高兴。',
    photoUrl: '/frame-gallery/optimized/02-family-cooking-recipe.jpg',
    tag: '发现',
    topic: '美食菜谱',
    likes: 128,
    comments: 18,
    tags: ['阳台菜园', '家常菜'],
  },
  {
    id: 'square-3',
    authorName: '陈叔',
    authorTitle: '退休工人',
    title: '散步路上拍到一张很喜欢的倒影',
    summary: '退休以后喜欢走走停停地拍，照片不一定多厉害，但每张都像当天的心情。',
    photoUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    tag: '发现',
    topic: '风景摄影',
    likes: 203,
    comments: 21,
    tags: ['摄影散步', '城市光影'],
  },
  {
    id: 'square-4',
    authorName: '爱分享的王老师',
    authorTitle: '退休语文教师',
    title: '给年轻家长讲“怎么把生活写成作文”',
    summary: '很多人都说，原来写作不是技巧，是先把日子过进心里。',
    photoUrl: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    tag: '关注',
    topic: '家庭时光',
    likes: 204,
    comments: 37,
    tags: ['生活写作', '社区分享'],
  },
  {
    id: 'square-5',
    authorName: '退役军人老张',
    authorTitle: '社区讲述人',
    title: '把年轻时的旧照片重新夹进相册',
    summary: '人老了以后，很多记忆不是忘了，而是看见一张照片就又回来了。',
    photoUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    tag: '关注',
    topic: '军旅岁月',
    likes: 173,
    comments: 21,
    tags: ['旧照片', '军旅回忆'],
  },
  {
    id: 'square-6',
    authorName: '周阿姨',
    authorTitle: '照顾外孙的普通奶奶',
    title: '今天给外孙炖了排骨汤，厨房里一直热热闹闹的',
    summary: '饭还没上桌，小家伙就在旁边问“外婆今天是不是又做我爱吃的”。这样的日子最踏实。',
    photoUrl: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    tag: '关注',
    topic: '家庭时光',
    likes: 95,
    comments: 15,
    tags: ['带外孙', '家常生活'],
  },
]

export const MOCK_SQUARE_EVENTS: SquareEvent[] = [
  {
    id: 'tea-party',
    title: '鹏园家庭相册整理分享会',
    dateLabel: '下周二 10:00',
    location: '深圳泰康之家鹏园·共享书房',
    summary: '带一两张老照片来，现场有老师教大家口述回忆、整理家书与旧照片。',
    photoUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg',
    category: '展览',
    organizer: '泰康之家鹏园',
    capacityLabel: '20人（已报12人）',
    description: '活动节奏轻松，现场会有工作人员协助签到、带位和拍照留念。报名后也会自动把活动信息同步给子女，让他们放心知道您的近况。',
  },
  {
    id: 'photo-walk',
    title: '蛇口社区银龄合唱团排练',
    dateLabel: '周三 19:00',
    location: '深圳南山区蛇口街道文体中心',
    summary: '以经典民歌和年代歌曲为主，排练轻松，第一次来也有人带着唱。',
    photoUrl: '/frame-gallery/optimized/03-weekend-visit-grandma.jpg',
    category: '合唱',
    organizer: '蛇口银龄社团',
    capacityLabel: '30人（已报18人）',
    description: '活动以经典民歌和年代歌曲为主，不要求基础。第一次来的长辈会安排老成员带着唱，也会留出茶歇时间让大家认识新朋友。',
  },
  {
    id: 'taichi',
    title: '泰康之家鹏园晨练太极课',
    dateLabel: '本周日 07:30',
    location: '深圳泰康之家鹏园·花园广场',
    summary: '适合长辈参加的舒缓太极课程，现场有志愿者协助热身和动作指导。',
    photoUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg',
    category: '养生健康',
    organizer: '泰康之家鹏园',
    capacityLabel: '24人（已报16人）',
    description: '课程会从热身开始，动作速度慢，适合想活动筋骨、认识邻里朋友的长辈。现场有志愿者照看节奏，也会提醒大家补水休息。',
  },
  {
    id: 'calligraphy',
    title: '泰康之家鹏园书法交流会',
    dateLabel: '本周六 14:00',
    location: '深圳泰康之家鹏园·书画活动室',
    summary: '书画老师会带大家临帖、落款，也欢迎把自己以前练过的作品带来交流。',
    photoUrl: '/frame-gallery/optimized/01-grandchildren-drawing-dinner.jpg',
    category: '书法',
    organizer: '泰康之家鹏园',
    capacityLabel: '18人（已报9人）',
    description: '现场准备纸笔和临摹材料，也欢迎带自己的作品来交流。老师会帮忙看落款和章法，结束后可拍照同步给家人。',
  },
]

export function getMockFamilySpace(): FamilySpace {
  return getActiveScenario().familySpace || MOCK_FAMILY_SPACE
}

export function getMockElderProfile(): ElderProfile {
  return getActiveScenario().elderProfile || MOCK_ELDER_PROFILE
}

export function getMockMembers(): FamilyMember[] {
  return getActiveScenario().members || MOCK_MEMBERS
}

export function getMockGalleryPhotos(): GalleryPhoto[] {
  return getActiveScenario().galleryPhotos || MOCK_GALLERY_PHOTOS
}

export function getMockInteractionThreads(): InteractionThread[] {
  return getActiveScenario().interactionThreads || MOCK_INTERACTION_THREADS
}

export function getMockInteractionThreadById(id: string): InteractionThread | undefined {
  return getMockInteractionThreads().find((thread) => thread.id === id)
}

export function getMockMemoryThemes(): MemoryTheme[] {
  return getActiveScenario().memoryThemes || MOCK_MEMORY_THEMES
}

export function getMockMemoryStoryById(id: string): MemoryStory | undefined {
  return (getActiveScenario().memoryStories || MOCK_MEMORY_STORIES).find((story) => story.id === id)
}

export function getMockAiSuggestions(): AiSuggestion[] {
  return getActiveScenario().aiSuggestions || MOCK_AI_SUGGESTIONS
}

export function getMockUploadDrafts(): UploadPhotoDraft[] {
  return getActiveScenario().uploadDrafts || MOCK_UPLOAD_DRAFTS
}

export function getMockFrameDeviceStatus(): FrameDeviceStatus {
  return getActiveScenario().frameDeviceStatus || MOCK_FRAME_DEVICE_STATUS
}

export function getMockFrameQuickReplies(): FrameQuickReply[] {
  return getActiveScenario().frameQuickReplies || MOCK_FRAME_QUICK_REPLIES
}

export function getMockFrameConversation(): FrameConversationLine[] {
  return getActiveScenario().frameConversation || MOCK_FRAME_CONVERSATION
}

export function getMockFrameStickers(scene?: 'common' | 'family' | 'square'): FrameSticker[] {
  const stickers = getActiveScenario().frameStickers || MOCK_FRAME_STICKERS
  if (!scene) return stickers
  return stickers.filter((sticker) => sticker.scene === scene || sticker.scene === 'common')
}

export function getMockFamilyDynamics(): FamilyDynamic[] {
  return getActiveScenario().familyDynamics || MOCK_FAMILY_DYNAMICS
}

export function getMockFamilyWeeklyRecap(): FamilyWeeklyRecap {
  return getActiveScenario().familyWeeklyRecap || MOCK_FAMILY_WEEKLY_RECAP
}

export function getMockStudyModules(): StudyModule[] {
  const scenarioModules = getActiveScenario().studyModules
  if (!scenarioModules?.length) return MOCK_STUDY_MODULES

  const scenarioModuleById = new Map(scenarioModules.map((module) => [module.id, module]))
  const mergedModules = MOCK_STUDY_MODULES.map((module) => scenarioModuleById.get(module.id) || module)
  const scenarioOnlyModules = scenarioModules.filter((module) => !MOCK_STUDY_MODULES.some((defaultModule) => defaultModule.id === module.id))

  return [...mergedModules, ...scenarioOnlyModules]
}

export function getMockStudyModuleById(id: string): StudyModule | undefined {
  return getMockStudyModules().find((module) => module.id === id)
}

export function getMockFragmentContentItems(): FragmentContentItem[] {
  const modules = getMockStudyModules()
  const album = modules.find((module) => module.id === 'album')?.items || []
  const recorder = modules.find((module) => module.id === 'recorder')?.items || []
  const shelf = modules.find((module) => module.id === 'shelf')?.items || []
  const galleryPhotoByUrl = new Map(getMockGalleryPhotos().map((photo) => [photo.url, photo]))

  return [
    ...album.map((item) => ({
      id: `fragment-${item.id}`,
      sourceId: item.id,
      kind: 'photo' as const,
      title: item.title,
      summary: item.note || item.summary,
      updatedAt: item.photoUrl ? galleryPhotoByUrl.get(item.photoUrl)?.uploadedAt || item.updatedAt : item.updatedAt,
      photoUrl: item.photoUrl,
      tags: ['家人', item.meta || '生活记录'],
    })),
    ...recorder.filter((item) => !item.sealed).map((item) => ({
      id: `fragment-${item.id}`,
      sourceId: item.id,
      kind: 'voice' as const,
      title: item.title,
      summary: item.note || item.summary,
      updatedAt: item.updatedAt,
      photoUrl: item.photoUrl,
      durationSeconds: item.durationSeconds,
      tags: ['故事原声', item.meta || '珍藏声音'],
    })),
    {
      id: 'fragment-file-family-recipe',
      sourceId: 'file-family-recipe',
      kind: 'file' as const,
      title: '林家家常菜手写本',
      summary: '知夏帮忙扫描的 18 页旧菜谱，保留了阿嫲的手写批注。',
      updatedAt: '5月20日',
      fileFormat: 'PDF · 18页',
      photoUrl: album[0]?.photoUrl,
      tags: ['家庭文件', '生活记录'],
    },
    {
      id: 'fragment-file-old-letter',
      sourceId: 'file-old-letter',
      kind: 'file' as const,
      title: '木生寄回的旧信扫描件',
      summary: '共 6 封，已按寄信时间整理，并完成基础文字识别。',
      updatedAt: '5月16日',
      fileFormat: 'PDF · 6封',
      photoUrl: album[1]?.photoUrl,
      tags: ['家庭文件', '老照片'],
    },
    ...shelf.map((item) => ({
      id: `fragment-${item.id}`,
      sourceId: item.id,
      kind: 'work' as const,
      title: item.title,
      summary: item.note || item.summary,
      updatedAt: item.updatedAt,
      photoUrl: item.photoUrl,
      tags: ['已成作品', item.meta || '回忆故事'],
    })),
  ]
}

const MOCK_EXPLORE_FEATURES: ExploreFeatureItem[] = [
  { id: 'local-services', section: 'life', title: '本地服务', description: '家政、助餐与适老服务', icon: 'map-pin', action: 'toast:已打开附近的适老服务' },
  { id: 'silver-market', section: 'life', title: '银发商城', description: '精选日用与健康好物', icon: 'storefront', action: 'toast:银发商城即将开放' },
  { id: 'ai-doctor', section: 'health', title: 'AI问诊', description: '先问小叙，再决定如何就医', icon: 'stethoscope', action: '/frame/ai?role=doctor' },
  { id: 'cognition-emotion', section: 'health', title: '认知情绪', description: '温和关注记忆与情绪变化', icon: 'head-circuit', action: 'toast:认知情绪专区即将上线' },
  { id: 'medical-links', section: 'health', title: '医疗链接', description: '挂号、报告解读与远程医疗', icon: 'link', action: 'toast:已为你整理附近的医疗服务' },
  { id: 'ai-diary', section: 'optional', title: 'AI日记', description: '回看每天整理好的生活记录', icon: 'notebook', action: '/frame/diary' },
  { id: 'sos', section: 'optional', title: 'SOS', description: '紧急时一键联系家人', icon: 'siren', action: 'sos' },
  { id: 'medicine-reminder', section: 'optional', title: '用药提醒', description: '查看今天的用药安排', icon: 'pill', action: '/frame/health/medicine' },
  { id: 'report-archive', section: 'optional', title: '报告存档', description: '保存检查报告与健康资料', icon: 'clipboard-text', action: '/frame/health/records?tab=report' },
  { id: 'private-vault', section: 'optional', title: '私密保险箱', description: '只留给自己的照片和心事', icon: 'lock-key', action: '/frame/study/module/vault' },
  { id: 'wishlist', section: 'optional', title: '愿望清单', description: '把想做的事慢慢实现', icon: 'sparkle', action: '/frame/study/module/wishlist' },
]

export function getMockExploreFeatures(): ExploreFeatureItem[] {
  return MOCK_EXPLORE_FEATURES
}

export function getMockFamilyExplorationItems(): FamilyExplorationItem[] {
  return getActiveScenario().familyExplorationItems || MOCK_FAMILY_EXPLORATION_ITEMS
}

export function getMockRiverStages(): RiverStage[] {
  return getActiveScenario().riverStages || MOCK_RIVER_STAGES
}

export function getMockRiverStageById(id: string): RiverStage | undefined {
  return getMockRiverStages().find((stage) => stage.id === id)
}

export function getMockRiverStoryById(stageId: string, storyId: string) {
  return getMockRiverStageById(stageId)?.stories.find((story) => story.id === storyId)
}

export function getMockSquarePosts(): SquarePost[] {
  return getActiveScenario().squarePosts || MOCK_SQUARE_POSTS
}

export function getMockSquareEvents(): SquareEvent[] {
  return getActiveScenario().squareEvents || MOCK_SQUARE_EVENTS
}

export function getMockSquareEventById(id: string): SquareEvent | undefined {
  return getMockSquareEvents().find((event) => event.id === id)
}
