import type { PrototypeScenario } from '../scenarioTypes'
import type { GalleryPhoto, InteractionThread } from '../../types'

const photo = (name: string) => `/scenario/teacher-retirement/photos/${name}`

const galleryPhotos: GalleryPhoto[] = [
  {
    id: 'teacher-photo-01', url: photo('t-p01.jpg'), alt: '木桌上展开的试卷与铅笔',
    title: '先圈出会做的部分', uploadedAt: '2002-06-18T15:20:00+08:00',
    uploadedById: 'teacher-member-linyue', uploadedByName: '学生林悦', isCached: true,
    voiceNoteText: '那天下午，您没有先问分数，而是让我把会做的题先圈出来。',
    voiceNoteDurationSeconds: 16, aiTitle: '那张没有分数的试卷',
    aiCategories: ['荣休礼', '学生时代', '课堂记忆'], metadataSummary: '林悦留下的课堂片段，发生在2002年。',
  },
  {
    id: 'teacher-photo-02', url: photo('t-p03.jpg'), alt: '毕业生与老师在校园树下合影',
    title: '毕业那天，我们说好常回来', uploadedAt: '2004-06-30T16:30:00+08:00',
    uploadedById: 'teacher-member-luhang', uploadedByName: '学生陆航', isCached: true,
    voiceNoteText: '离校前最后一次去办公室，您只用十分钟，让我不再害怕去陌生的地方。',
    voiceNoteDurationSeconds: 19, aiTitle: '铃响之后的十分钟',
    aiCategories: ['荣休礼', '毕业', '师生合影'], metadataSummary: '陆航留下的毕业合影与道别。',
  },
  {
    id: 'teacher-photo-03', url: photo('t-p05.jpg'), alt: '两位教师在窗边讨论教材',
    title: '一起备课的普通下午', uploadedAt: '2008-09-12T16:05:00+08:00',
    uploadedById: 'teacher-member-zhouning', uploadedByName: '同事周宁', isCached: true,
    voiceNoteText: '您总在教案边上留一点空白，提醒自己同一个问题还可以换一种说法。',
    voiceNoteDurationSeconds: 21, aiTitle: '最后合上的备课本',
    aiCategories: ['荣休礼', '同事', '备课时光'], metadataSummary: '周宁留下的共事片段。',
  },
  {
    id: 'teacher-photo-04', url: photo('t-p07.jpg'), alt: '研究生在白板前讨论，老师坐在一旁倾听',
    title: '先把问题问清楚', uploadedAt: '2015-05-21T14:12:00+08:00',
    uploadedById: 'teacher-member-xuran', uploadedByName: '学生许然', isCached: true,
    voiceNoteText: '您说问题问清楚了，就已经走出一半。这句话陪我做完研究，也陪我面对生活。',
    voiceNoteDurationSeconds: 20, aiTitle: '被认真听见的问题',
    aiCategories: ['荣休礼', '研究生', '治学'], metadataSummary: '许然留下的研究生阶段记忆。',
  },
  {
    id: 'teacher-photo-05', url: photo('t-p09.jpg'), alt: '父亲与成年女儿在阳台移栽绿植',
    title: '终于不用等有空了', uploadedAt: '2019-04-14T10:30:00+08:00',
    uploadedById: 'teacher-member-xiaohe', uploadedByName: '女儿陈晓禾', isCached: true,
    voiceNoteText: '爸，家里的小花园等您很久了。我们从这个周末开始，一件一件慢慢来。',
    voiceNoteDurationSeconds: 17, aiTitle: '阳台上的小花园',
    aiCategories: ['荣休礼', '家人', '花草'], metadataSummary: '女儿留下的家庭片段。',
  },
  {
    id: 'teacher-photo-06', url: photo('t-p11.jpg'), alt: '两位老友在树荫下下棋',
    title: '总说，还能再下一盘', uploadedAt: '2022-10-03T15:46:00+08:00',
    uploadedById: 'teacher-member-weicheng', uploadedByName: '老友魏成', isCached: true,
    voiceNoteText: '棋盘已经摆好，就等您慢慢来。以后有书、有茶，也有聊不完的话。',
    voiceNoteDurationSeconds: 15, aiTitle: '把一盘棋慢慢下完',
    aiCategories: ['荣休礼', '朋友', '日常'], metadataSummary: '老友魏成留下的生活片段。',
  },
  {
    id: 'teacher-photo-07', url: photo('t-p13.jpg'), alt: '三位教师在会议后的桌边收拾教案',
    title: '工作之外，也聊聊生活', uploadedAt: '2024-09-10T18:10:00+08:00',
    uploadedById: 'teacher-member-zhaoheng', uploadedByName: '同事赵衡', isCached: true,
    aiTitle: '会后留下来的灯光', aiCategories: ['荣休礼', '同事', '校园'],
    metadataSummary: '同事们共同记得的普通工作日。',
  },
  {
    id: 'teacher-photo-08', url: photo('t-p15.jpg'), alt: '两位老友沿湖边步道慢走',
    title: '下一次出发，我们一起商量', uploadedAt: '2026-06-18T17:30:00+08:00',
    uploadedById: 'teacher-member-shaowen', uploadedByName: '老友邵文', isCached: true,
    aiTitle: '把新的路慢慢走', aiCategories: ['荣休礼', '朋友', '新生活'],
    metadataSummary: '荣休前夕，老友留下的祝福。',
  },
]

const messages = [
  '陈老师，那天下午您留下的耐心，比那次考试的分数留得更久。荣休快乐。',
  '以后有空回来走走，我们还想听您把难题讲成有意思的故事。',
  '一起备课时，您总是最后一个合上本子。现在请把这份认真留给喜欢的生活。',
  '您说“问题问清楚了，就已经走出一半”。这句话，我一直带着。',
  '爸，想做的事情不用再留到“等有空”。这个周末我们就去花市。',
]

const interactionThreads: InteractionThread[] = galleryPhotos.slice(0, 5).map((item, index) => ({
  id: `teacher-thread-${index + 1}`, title: item.title, photoUrl: item.url, photoAlt: item.alt,
  photoLabel: item.title, photoMeta: index === 0 ? '荣休礼当天' : `${index + 1}位共创者的心意`,
  photoTone: (['moss', 'paper', 'gold', 'moss', 'peach'] as const)[index],
  senderId: item.uploadedById, senderName: item.uploadedByName, initialContent: messages[index],
  initialMethod: 'text', latestSnippet: messages[index], latestAt: `2026-07-18T${10 + index}:20:00+08:00`,
  unread: index < 3, responses: [{
    id: `teacher-response-${index + 1}`, authorId: item.uploadedById,
    authorName: item.uploadedByName, relation: index === 2 ? '同事' : index === 4 ? '女儿' : '学生',
    method: 'text', content: messages[index], createdAt: `2026-07-18T${10 + index}:20:00+08:00`,
  }],
}))

export const TEACHER_RETIREMENT_SCENARIO: PrototypeScenario = {
  id: 'teacher-retirement', label: '陈老师荣休礼',
  familyAvatarSrc: '/scenario/teacher-retirement/teacher.png',
  familySpace: { id: 'teacher-gift-space', name: '陈老师的拾光叙', bindingCode: '071826', elderName: '陈明远' },
  elderProfile: {
    id: 'elder-chen-mingyuan', name: '陈明远', gender: 'male', birthYear: 1961, relation: '陈老师',
    voiceIntroText: '从教多年，喜欢把复杂的问题拆开讲，也愿意多留一点时间，听学生把话说完。荣休后想慢慢读书、养花，也去看看从前匆忙经过的地方。',
    interests: ['读书', '养花', '散步', '下棋'], avoidTopics: [],
  },
  members: [
    { id: 'teacher-member-chen', name: '陈明远', relation: '陈老师', avatar: '陈', role: 'elder' },
    { id: 'teacher-member-linyue', name: '学生林悦', relation: '学生', avatar: '悦', role: 'child', city: '北京', statusLabel: '留下了一段课堂回忆' },
    { id: 'teacher-member-zhouning', name: '同事周宁', relation: '同事', avatar: '宁', role: 'child', city: '北京', statusLabel: '共同整理了这份荣休礼' },
    { id: 'teacher-member-xiaohe', name: '女儿陈晓禾', relation: '女儿', avatar: '禾', role: 'child', city: '北京', statusLabel: '约好周末一起去花市' },
  ],
  galleryPhotos, interactionThreads,
  frameDeviceStatus: {
    id: 'frame-chen-001', deviceName: '陈老师的相框', displayMode: 'elder', networkStatus: 'online',
    cacheStatus: 'ready', microphoneStatus: 'granted', slideshowIntervalSeconds: 10,
    lastSyncedAt: '2026-07-18T10:16:00+08:00', weatherLabel: '北京 晴', temperatureCelsius: 25,
  },
  frameQuickReplies: [
    { id: 'teacher-reply-thanks', text: '谢谢大家，我都收到了', replyType: 'ai' },
    { id: 'teacher-reply-like', text: '这张我记得', replyType: 'emoji' },
    { id: 'teacher-reply-voice', text: '我来说几句', replyType: 'voice' },
  ],
  frameConversation: [
    { id: 'teacher-line-1', speaker: 'ai', text: '陈老师，您好呀。大家为您准备的荣休礼已经在相框里了。', createdAt: '2026-07-18T10:00:00+08:00' },
    { id: 'teacher-line-2', speaker: 'elder', text: '好，我们慢慢看。', createdAt: '2026-07-18T10:01:00+08:00' },
  ],
}
