export type CaseId = 'teacher' | 'leader' | 'nurse'
export type StepId =
  | 'invitation'
  | 'create'
  | 'preview'
  | 'prepare'
  | 'ceremony'
  | 'onsite'
  | 'people'
  | 'reminder'
  | 'greeting'
  | 'received'
export type ContentType = 'story' | 'wish' | 'photo' | 'voice'

export interface DemoCase {
  id: CaseId
  name: string
  address: string
  organization: string
  profession: string
  relation: string
  roleLabel: string
  image: string
  color: string
  curator: string | null
  title: string
  subtitle: string
  retirement: string
  collect: string
  event: string
  eventDate: string
  eventFullDate: string
  eventKind: string
  eventLine: string
  storyTitle: string
  story: string
  polished: string
  wish: string
  colleague: string
  timeline: { year: string; text: string }[]
  phrase: string
  letter: string
}

export const cases: DemoCase[] = [
  {
    id: 'teacher',
    name: '陈明远',
    address: '陈老师',
    organization: '清华大学',
    profession: '教师',
    relation: '2004届学生',
    roleLabel: '老师荣休',
    image: 'teacher.png',
    color: '#6d8063',
    curator: null,
    title: '把记得的那个瞬间，\n送给陈老师。',
    subtitle: '一段师生情，从教室里的那个下午，延续到多年后的每一次问候。',
    retirement: '2026.07.18',
    collect: '7月15日 18:00',
    event: '教师节',
    eventDate: '09.10',
    eventFullDate: '2026.09.10',
    eventKind: 'teachers_day',
    eventLine: '今天，给陈老师送句祝福吧。',
    storyTitle: '那张没有分数的试卷',
    story:
      '大学二年级有一次考试没考好，我把试卷折起来，不想拿给您看。您没有先问分数，而是让我把会做的题圈出来。您说，先看看自己已经走到了哪儿。后来遇到难事，我还会想起那个下午。谢谢您，陈老师。',
    polished:
      '那次考试后，我把试卷折起来，不愿拿给陈老师看。他没有先问分数，而是让我圈出自己会做的题。“先看看自己已经走到了哪儿。”多年以后，每当遇到难题，我仍会想起那个下午。',
    wish: '陈老师，教师节快乐！今天经过学校附近，想起您当年陪我们改作文的下午。祝您每天都有好心情，也有时间慢慢做喜欢的事。',
    colleague: '周宁',
    timeline: [
      { year: '1988', text: '开始从事教学工作（虚构）' },
      { year: '1996', text: '陪伴新一届学生（虚构）' },
      { year: '2012', text: '一起探索课堂内外（虚构）' },
      { year: '2026', text: '从此，开启另一段好时光' },
    ],
    phrase: '先看看自己，已经走到了哪儿。',
    letter: '愿接下来的日子，\n有时间慢慢做喜欢的事。',
  },
  {
    id: 'leader',
    name: '周启山',
    address: '周老师',
    organization: '远川装备',
    profession: '工程团队负责人',
    relation: '曾经的同事',
    roleLabel: '老领导荣休',
    image: 'leader.png',
    color: '#718184',
    curator: '许岚',
    title: '那些一起走过的路，\n都有人记得。',
    subtitle: '曾经带我们走过一段路的人，离开岗位以后，依然值得认真问候。',
    retirement: '2026.06.20',
    collect: '6月17日 18:00',
    event: '生日',
    eventDate: '11.12',
    eventFullDate: '2026.11.12',
    eventKind: 'birthday',
    eventLine: '今天是周老师的生日。',
    storyTitle: '第一次独立带项目',
    story:
      '我第一次独立带项目时，总想把每一件事都做得没有差错。周老师提醒我，先把大家最担心的问题放到桌面上，再一起想办法。那次讨论让我知道，负责不等于一个人扛住所有事。谢谢您当时愿意听，也愿意给我们尝试的机会。',
    polished:
      '第一次独立带项目时，我总想把每件事都做得没有差错。周老师提醒我：“先把大家最担心的问题放到桌面上，再一起想办法。”那次讨论让我知道，负责不等于一个人扛住所有事。谢谢他愿意听，也愿意给我们尝试的机会。',
    wish: '周老师，生日快乐！最近带新人时，又想起您说的“把最担心的问题先放到桌面上”。愿您身体舒展、日子自在，有空一起走走。',
    colleague: '许岚',
    timeline: [
      { year: '同行', text: '把难题，交给大家一起解' },
      { year: '2026', text: '谢谢您陪我们走过这一程' },
    ],
    phrase: '负责，不等于一个人扛住所有事。',
    letter: '愿日子从容，\n也愿我们，常常相见。',
  },
  {
    id: 'nurse',
    name: '沈知秋',
    address: '沈老师',
    organization: '晴川医院',
    profession: '护士长',
    relation: '曾经带教的护士',
    roleLabel: '护士长荣休',
    image: 'nurse.png',
    color: '#98a69a',
    curator: null,
    title: '您留下的那份温柔，\n我们一直带在身上。',
    subtitle: '一场荣休礼，记下共同值守的时光。下一次护士节，再把近况说给她听。',
    retirement: '2026.10.16',
    collect: '10月13日 18:00',
    event: '护士节',
    eventDate: '05.12',
    eventFullDate: '2027.05.12',
    eventKind: 'nurses_day',
    eventLine: '护士节，问候曾经带教的沈老师。',
    storyTitle: '第一次独立值夜班',
    story:
      '第一次独立值夜班前，我紧张得反复核对交班记录。沈老师陪我把准备事项又过了一遍。她说，认真是好事，遇到不确定的事就问。后来带新人时，我也会多留一会儿，陪她们把心放稳。谢谢您把这份耐心传给我们。',
    polished:
      '第一次独立值夜班前，我紧张得反复核对交班记录。沈老师陪我把准备事项又过了一遍。“认真是好事，遇到不确定的事就问。”后来带新人时，我也会多留一会儿。原来，她留给我们的耐心，也能继续传下去。',
    wish: '沈老师，护士节快乐！今天和新来的同事聊起第一次值夜班，又想起您的耐心。我们都很好，也祝您每天自在，有空一起喝杯茶。',
    colleague: '唐薇',
    timeline: [
      { year: '陪伴', text: '把耐心，留给每一位新同事' },
      { year: '2026', text: '把更多时间，留给自己' },
    ],
    phrase: '遇到不确定的事，就问。',
    letter: '愿那些照顾过别人的日子，\n也化作照顾自己的温柔。',
  },
]

export const steps: {
  id: StepId
  label: string
  english: string
  phase: string
  title: string
  description: string
  next: string
  note: string
}[] = [
  {
    id: 'invitation',
    label: '一份共创邀请',
    english: 'AN INVITATION',
    phase: '仪式之前',
    title: '',
    description: '从一份共创邀请开始，让同事、学生与朋友，把各自记得的瞬间，放进同一份礼物。',
    next: '下一步 · 留下回忆',
    note: 'E01 邀请页 → E02 关系确认。此处直接演示打开邀请，无需真实扫码。',
  },
  {
    id: 'create',
    label: '留下我的回忆',
    english: 'YOUR PIECE OF MEMORY',
    phase: '仪式之前',
    title: '不用写完一生，\n记得一件事就好。',
    description: '写一段回忆，放一张照片，或用声音说几句话。小叙帮忙整理，表达仍然属于你。',
    next: '下一步 · 预览心意',
    note: 'C01—C03 支持编辑、素材选择和本地草稿。语音转写与整理使用示例，原文始终保留。',
  },
  {
    id: 'preview',
    label: '确认这份心意',
    english: 'A GIFT IN YOUR WORDS',
    phase: '仪式之前',
    title: '每一份记忆，\n都保留自己的署名。',
    description: '预览整理后的内容，亲自选择使用范围。只想私下送给对方，也完全可以。',
    next: '下一步 · 一起准备',
    note: 'C04 用途独立确认。礼物、仪式、长期保存分开选择；公开宣传不包含在内。',
  },
  {
    id: 'prepare',
    label: '一起准备礼物',
    english: 'MEMORIES COME TOGETHER',
    phase: '仪式之前',
    title: '有人一起张罗，\n也可以放心交给系统。',
    description: '主创是可选的。系统按已确认的资料与内容用途整理，把有疑问的内容单独留下核实。',
    next: '下一步 · 走进仪式',
    note: 'M01—M04。陈老师默认无主创；周启山礼前由许岚精选，仪式后卸任。版本一经定稿，后续投稿不会改写。',
  },
  {
    id: 'ceremony',
    label: '走进荣休仪式',
    english: 'A MOMENT TO REMEMBER',
    phase: '仪式当天',
    title: '把这些年的谢谢，\n郑重说给您听。',
    description: '回忆、声音和照片，在仪式上汇成一份礼物。也留在相框里，往后可以慢慢重看。',
    next: '下一步 · 留住现场',
    note: '受礼者相框／仪式展示。冻结的是素材修订清单，后续现场与节日内容进入独立的新心意。',
  },
  {
    id: 'onsite',
    label: '把今天也留下',
    english: 'ADD TODAY TO THE STORY',
    phase: '仪式当天',
    title: '还是同一个入口，\n还可以继续补充。',
    description: '以前写过故事，今天也能再发一张照片。现场专用码可以有；不设置，也能完整共创。',
    next: '下一步 · 看看参与的人',
    note: 'E01 同主入口按阶段切换。子码可选、独立到期；主码与既有关系不受影响。',
  },
  {
    id: 'people',
    label: '我参与过的人',
    english: 'PEOPLE WE REMEMBER',
    phase: '仪式之后',
    title: '仪式会结束，\n关系会留下来。',
    description: '曾经参与共创的人，留在你的列表里。原来的故事能找到，新的心意也有地方送。',
    next: '下一步 · 重要日子',
    note: 'H01／P01 按人物去重。共创关系跨项目保留，但不代表有权查看对方全部私人内容。',
  },
  {
    id: 'reminder',
    label: '重要日子，再问候',
    english: 'A REASON TO SAY HELLO',
    phase: '再一次问候',
    title: '值得问候的日子，\n轻轻提醒一下。',
    description: '你选择记得的人，在你选择的日子，得到一份问候的提醒。点进去，就能送祝福或照片。',
    next: '下一步 · 再送份心意',
    note: 'N01／R01 共用同一事件。服务号只是外部入口示意，正式消息资格与模板仍需实际账号核验。',
  },
  {
    id: 'greeting',
    label: '再送一份心意',
    english: 'A LITTLE THOUGHT, AGAIN',
    phase: '再一次问候',
    title: '把今天的近况，\n说给熟悉的人听。',
    description: '一句祝福，一张路过时拍下的照片。无需再发起一份礼物，也不用找回原来的主创。',
    next: '下一步 · 看相框收到',
    note: '礼后内容关联人物和事件，无需创建新礼物项目。提交、处理中、送达分别记录。',
  },
  {
    id: 'received',
    label: '心意，在身边',
    english: 'THE STORY CONTINUES',
    phase: '再一次问候',
    title: '从一次共创，\n到下一次问候。',
    description: '新的心意来到相框里，原来的荣休礼也依然在。每一次想起，都可以成为新的故事。',
    next: '看看另一个故事',
    note: '已有受礼者产品的接收示意。只模拟接收回执，不声称真实送达或已读；旧仪式版本保持不变。',
  },
]

export function asset(file: string) {
  if (file.startsWith('data:')) return file
  const embedded = (window as Window & { __DEMO_IMAGES__?: Record<string, string> }).__DEMO_IMAGES__
  return embedded?.[file] || `${import.meta.env.BASE_URL}images/${file}`
}
