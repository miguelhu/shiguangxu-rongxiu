import type { MemoryTheme, MemoryTopic, RiverStage } from '../types'

export const FRAME_V01_STORY_ID = 'story-lane'

export type FrameV01TopicStatus = 'untold' | 'generating' | 'waiting' | 'retry' | 'done'

const TOPIC_COVER_POOL = [
  '/scenario/ama-letter/memoir/memoir-01-gongfu-tea.webp',
  '/scenario/ama-letter/memoir/memoir-02-storm-temple.webp',
  '/scenario/ama-letter/memoir/memoir-03-white-qipao.webp',
  '/scenario/ama-letter/memoir/memoir-04-yingge-candy.webp',
  '/scenario/ama-letter/memoir/memoir-05-needlework.webp',
  '/scenario/ama-letter/memoir/memoir-06-seafood-market.webp',
  '/scenario/ama-letter/memoir/memoir-07-overseas-letter.webp',
  '/scenario/ama-letter/memoir/memoir-08-chinatown-scribe.webp',
  '/scenario/ama-letter/memoir/memoir-09-wumiguo.webp',
  '/scenario/ama-letter/photos/myself/myself-01.webp',
  '/scenario/ama-letter/photos/myself/myself-04.webp',
  '/scenario/ama-letter/photos/myself/myself-07.webp',
]

const STORY_IMAGES = {
  flagParade: '/story/first-departure/flag-parade.png',
  woodenBicycle: '/story/first-departure/wooden-bicycle.png',
  ancestralHall: '/story/first-departure/ancestral-hall.png',
}

function topicCover(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TOPIC_COVER_POOL[hash % TOPIC_COVER_POOL.length]
}

function makeTopic(id: string, question: string, sourceStatus: FrameV01TopicStatus): MemoryTopic {
  return {
    id,
    title: question,
    summary: question,
    status: sourceStatus === 'done' ? 'completed' : 'unfinished',
    updatedAt: '2026-07-21T12:00:00+08:00',
    photoLabel: question,
    photoUrl: topicCover(id),
  }
}

const TOPICS = {
  'ch-lane': makeTopic('ch-lane', '小时候住的家里，您记得最清楚的是哪个角落？', 'done'),
  'ch-school': makeTopic('ch-school', '每天去上学要走哪条路？路上会遇见谁？', 'done'),
  'ch-play': makeTopic('ch-play', '小时候最爱和伙伴们玩什么？', 'untold'),
  'ch-snack': makeTopic('ch-snack', '小时候最喜欢吃的一样东西是什么？', 'untold'),
  'ch-elder': makeTopic('ch-elder', '小时候最疼爱您的长辈是谁？他做过什么让您一直记得？', 'untold'),
  'ch-festival': makeTopic('ch-festival', '小时候过年，家里最热闹的时候，大家都在忙些什么？', 'untold'),
  'ch-chores': makeTopic('ch-chores', '小时候在家里，您最常帮大人做什么活？', 'untold'),
  'ch-friend': makeTopic('ch-friend', '小时候有没有一个形影不离的朋友？你们常一起做什么？', 'untold'),
  'ch-weather': makeTopic('ch-weather', '小时候遇到台风、暴雨或大冷天，家里人是怎么一起度过的？', 'untold'),

  'fd-meet': makeTopic('fd-meet', '您和老伴第一次见面，是在什么地方？', 'done'),
  'fd-wedding': makeTopic('fd-wedding', '结婚那天，有哪个画面您到现在还记得？', 'untold'),
  'fd-firsthome': makeTopic('fd-firsthome', '刚成家时住的第一个家，是什么样的？', 'untold'),
  'fd-dinner': makeTopic('fd-dinner', '一家人坐在一起吃饭，您记得最清楚的一顿？', 'untold'),
  'fd-child': makeTopic('fd-child', '孩子小时候，最让您操心的一件事是什么？', 'waiting'),
  'fd-hardtime': makeTopic('fd-hardtime', '把家撑起来的那些年，最不容易的一段是什么？', 'generating'),
  'fd-celebration': makeTopic('fd-celebration', '家里哪次团聚或喜事，让您特别高兴？', 'untold'),
  'fd-familyrule': makeTopic('fd-familyrule', '这个家里有没有一条大家一直守着的规矩？', 'untold'),

  'nb-neighbor': makeTopic('nb-neighbor', '以前的老邻居里，您最常想起谁？', 'done'),
  'nb-street': makeTopic('nb-street', '以前最常走的那条街，沿路都有些什么？', 'untold'),
  'nb-market': makeTopic('nb-market', '当年去赶集或买菜，您最爱逛哪个摊子？', 'untold'),
  'nb-firsttrip': makeTopic('nb-firsttrip', '你的第一次长时间离家是什么时候？', 'untold'),
  'nb-change': makeTopic('nb-change', '老家这些年变化很大，您最想念以前的什么？', 'untold'),
  'nb-festival': makeTopic('nb-festival', '街坊邻里以前一起过节，最热闹的是哪一次？', 'untold'),
  'nb-help': makeTopic('nb-help', '有没有一位街坊，在您家有难处时帮过忙？', 'untold'),
  'nb-journey': makeTopic('nb-journey', '走过的这么多地方里，哪一处您最想再去看看？', 'untold'),

  'wk-firstjob': makeTopic('wk-firstjob', '您第一份工作是在哪里？第一天发生了什么？', 'done'),
  'ch-teacher': makeTopic('ch-teacher', '还记得您第一次站上讲台教书的那天吗？', 'done'),
  'wk-hardtime': makeTopic('wk-hardtime', '工作中最难熬的一段时间，您是怎么撑过来的？', 'retry'),
  'wk-proud': makeTopic('wk-proud', '工作这么多年，哪一件事让您最骄傲？', 'untold'),
  'wk-colleague': makeTopic('wk-colleague', '当年的同事里，有谁和您一起做过难忘的事？', 'untold'),
  'wk-skill': makeTopic('wk-skill', '工作教会您的本事里，哪一样一直用到今天？', 'untold'),
  'wk-turn': makeTopic('wk-turn', '有没有一次选择，让您后来走上了不一样的路？', 'untold'),
  'wk-student': makeTopic('wk-student', '有没有一位学生多年后回来找您？那天你们说了什么？', 'untold'),
  'wk-retire': makeTopic('wk-retire', '退休离开工作岗位的那天，您心里是什么滋味？', 'untold'),

  'ht-missed': makeTopic('ht-missed', '这些年里，您最常想起的一个人是谁？', 'done'),
  'ht-happiness': makeTopic('ht-happiness', '现在的日子里，哪件小事最容易让您高兴？', 'untold'),
  'ht-gratitude': makeTopic('ht-gratitude', '一生中最想说声谢谢的人是谁？您想谢他什么？', 'untold'),
  'ht-unspoken': makeTopic('ht-unspoken', '有没有一句话，放在心里很久却一直没说出口？', 'untold'),
  'ht-regret': makeTopic('ht-regret', '如果能回到过去的一天，您最想回到哪一天？', 'untold'),
  'ht-wish': makeTopic('ht-wish', '现在心里有一个小心愿吗？最希望它怎么实现？', 'untold'),
  'ht-value': makeTopic('ht-value', '您觉得这辈子最值得的一件事是什么？', 'untold'),
  'ht-message': makeTopic('ht-message', '如果给孩子和孙辈留一句话，您最想说什么？', 'untold'),
} satisfies Record<string, MemoryTopic>

export const FRAME_V01_TOPIC_STATES: Record<string, FrameV01TopicStatus> = {
  'ch-lane': 'done', 'ch-school': 'done', 'ch-play': 'untold', 'ch-snack': 'untold', 'ch-elder': 'untold',
  'ch-festival': 'untold', 'ch-chores': 'untold', 'ch-friend': 'untold', 'ch-weather': 'untold',
  'fd-meet': 'done', 'fd-wedding': 'untold', 'fd-firsthome': 'untold', 'fd-dinner': 'untold', 'fd-child': 'waiting',
  'fd-hardtime': 'generating', 'fd-celebration': 'untold', 'fd-familyrule': 'untold',
  'nb-neighbor': 'done', 'nb-street': 'untold', 'nb-market': 'untold', 'nb-firsttrip': 'untold', 'nb-change': 'untold',
  'nb-festival': 'untold', 'nb-help': 'untold', 'nb-journey': 'untold',
  'wk-firstjob': 'done', 'ch-teacher': 'done', 'wk-hardtime': 'retry', 'wk-proud': 'untold', 'wk-colleague': 'untold',
  'wk-skill': 'untold', 'wk-turn': 'untold', 'wk-student': 'untold', 'wk-retire': 'untold',
  'ht-missed': 'done', 'ht-happiness': 'untold', 'ht-gratitude': 'untold', 'ht-unspoken': 'untold',
  'ht-regret': 'untold', 'ht-wish': 'untold', 'ht-value': 'untold', 'ht-message': 'untold',
}

function orderedTopics(ids: Array<keyof typeof TOPICS>) {
  return ids.map((id) => TOPICS[id])
}

export const frameV01MemoryThemes: MemoryTheme[] = [
  {
    id: 'childhood-home', title: '小时候的我', subtitle: '从小时候的家、上学路和那时最惦记的小事，慢慢走回最早的自己。',
    completedCount: 2, totalCount: 9, rewardTitle: '童年小传', rewardStatus: 'locked',
    topics: orderedTopics(['ch-play', 'ch-lane', 'ch-snack', 'ch-elder', 'ch-school', 'ch-festival', 'ch-chores', 'ch-friend', 'ch-weather']),
  },
  {
    id: 'family-days', title: '成家的日子', subtitle: '把成家、养育和饭桌边的普通日子，整理成一段能被家里人反复翻看的生活章。',
    completedCount: 1, totalCount: 8, rewardTitle: '成家小记', rewardStatus: 'locked',
    topics: orderedTopics(['fd-wedding', 'fd-firsthome', 'fd-meet', 'fd-dinner', 'fd-child', 'fd-hardtime', 'fd-celebration', 'fd-familyrule']),
  },
  {
    id: 'neighborhood-world', title: '街坊与远方', subtitle: '街坊、老路、赶集和远行，记录一个人怎么和世界慢慢熟起来。',
    completedCount: 1, totalCount: 8, rewardTitle: '走过的地方', rewardStatus: 'locked',
    topics: orderedTopics(['nb-street', 'nb-market', 'nb-firsttrip', 'nb-neighbor', 'nb-change', 'nb-festival', 'nb-help', 'nb-journey']),
  },
  {
    id: 'work-life', title: '认真生活过', subtitle: '工作、手艺、撑过难处的经验，都是认真生活留下来的光。',
    completedCount: 2, totalCount: 9, rewardTitle: '日子里的本事', rewardStatus: 'locked',
    topics: orderedTopics(['wk-hardtime', 'wk-firstjob', 'wk-proud', 'wk-colleague', 'wk-skill', 'ch-teacher', 'wk-turn', 'wk-student', 'wk-retire']),
  },
  {
    id: 'heart-soft', title: '心里最柔软', subtitle: '那些想念、感谢、没说出口的话，适合被轻轻收进最后一章。',
    completedCount: 1, totalCount: 8, rewardTitle: '心里的话', rewardStatus: 'locked',
    topics: orderedTopics(['ht-happiness', 'ht-gratitude', 'ht-missed', 'ht-unspoken', 'ht-regret', 'ht-wish', 'ht-value', 'ht-message']),
  },
]

const STAGE_YEARS: Record<string, string> = {
  'childhood-home': '1948—1966',
  'family-days': '1970—至今',
  'neighborhood-world': '1966—至今',
  'work-life': '1966—2008',
  'heart-soft': '1998—至今',
}

export const frameV01RiverStages: RiverStage[] = frameV01MemoryThemes.map((theme) => ({
  id: theme.id,
  title: theme.title,
  years: STAGE_YEARS[theme.id],
  summary: theme.subtitle || '',
  coverUrl: topicCover(`theme-${theme.id.replace(/-(home|days|world|life|soft)$/, '')}`),
  stories: [],
}))

export const frameV01FirstDepartureStory = {
  id: FRAME_V01_STORY_ID,
  title: '十五岁那年，我第一次离家',
  subtitle: '一辆亲手做的木头自行车，载着十五岁的淑柔，奔向她认定的一生。',
  meta: '叶淑柔 · 约 6 分钟',
  avatarUrl: '/scenario/ama-letter/avatars/ye-shurou-avatar.jpg',
  pullQuote: '那时候年轻，胆子大，认定了人，就什么苦都不怕。',
  musicUrl: '/audio/story/warm-memory-piano.mp3?v=liborio-piano-cloud',
  audioBaseUrl: '/audio/story/first-departure-xinlingjitang',
  audioVersion: 'v01',
  audioLayout: 'paragraph',
  splitThreshold: 58,
  introSegments: ['十五岁那年，我第一次离家。由叶淑柔口述，拾光叙AI小叙整理。'],
  scenes: [
    {
      title: '',
      imageUrl: STORY_IMAGES.flagParade,
      caption: '1945 年扛标旗时，我在人群里第一次见到了木生。',
      paragraphs: [
        '我是个潮汕女人，一辈子没离开潮汕，也一辈子都被家里牢牢系着。但回头看这辈子，十五岁那年的记忆还在眼前。那是我长这么大，第一次不顾家人阻拦，第一次凭着自己的心意做决定，也是我这辈子第一次和唯一一次离开家，莽撞又真诚。',
        '我们潮汕乡里，年年过节都会办扛标旗的活动，热热闹闹的，全村人都会出来看热闹。1945那年，我出落的好看，被村里选出来出标旗，人多嘈杂，锣鼓声、说话声混在一起。就在那热闹的人群里，我认识了木生。他是村里出了名的巧手，性格老实本分，不爱张扬，做事踏实靠谱。那时候年纪小，心思纯粹，一眼就觉得这个后生值得托付，心里悄悄记挂住了。',
        '我心里认定了他，就想跟他好好过日子。可那时候的长辈思想保守，爸妈觉得我年纪太小，不懂世事，怕我一时冲动做错选择，耽误自己一辈子，说什么都不同意我们来往。越是被阻拦，我心里越是执拗，不肯轻易放弃。后来我就和木生悄悄商量，打算一起离开村子，出去安家过日子。我那时候不讲究什么彩礼嫁妆，心里很简单，只要他真心待我，有一辆自行车能载我同行，我就心满意足了。',
        '木生是个实心眼的人，从不敷衍我随口说的话。他没有买现成的车子，而是凭着自己的手艺，一点点打磨木料，亲手给我做了一辆木头自行车。做工不算精致，比不上市面上的成品车，每一处纹路都是手工打磨的痕迹，笨笨的、质朴的，可在我心里，那是这辈子最珍贵的礼物，藏着他最真诚的心意。',
        '决定走的那天夜里，天色很黑，村里家家户户都熄了灯，安安静静的，只有晚风轻轻吹着。我趁着父母熟睡，悄悄走出生活了十几年的老屋。抬脚离开的那一刻，心里五味杂陈，又害怕，又不舍。舍不得养育我的爹娘，舍不得住惯的家乡。可一想到往后能和真心相待的人安稳度日，心里又多了不少底气和盼头。那时候年轻，胆子大，认定了人，就什么苦都不怕。',
        '我们终究还是太年轻，行事莽撞，没多久就被家里人发现了。爸妈发现我连夜出走，急得寝食难安，连着几天四处打听、到处寻找，跑遍了周边的村子和小路，一心只想把我找回家。等我再回到家里，看着眼前的父母，心里一下子就酸了。父亲原本乌黑的头发，一夜之间白了大半，整个人苍老憔悴了很多。母亲日日以泪洗面，双眼红肿疲惫，满脸都是忧心和难过。我心里又愧疚又难受，知道自己狠狠伤了两位老人的心。',
        '我知道自己忤逆了长辈，做错了事，心甘情愿去祠堂罚跪。冰冷的石地砖贴着膝盖，又凉又疼，我不吃不喝，整整跪了三天三夜。身体熬得疲惫不堪，心里却依旧倔强，我不后悔自己的选择，只是满心愧疚，心疼操劳的父母。那时候心里很矛盾，一边是生养自己的家人，一边是自己认定的余生，左右为难。',
        '好在木生是个有担当、重情义的人，从来没有因为家人的反对、我的罚跪而退缩。我跪在里面，他就跪在门口，诚心诚意跟我父母求情。我们潮汕人敬重月娘，他就对着月亮诚心发誓，这辈子一定会好好照顾我、疼爱我，一辈子不离不弃，踏实过日子，不让我受半点委屈。日复一日的真诚和坚持，慢慢打动了我的父母。他们终究是心疼我，也看清了木生的真心，最后松了口，成全了我们。',
        '如今一晃几十年过去，我已经八十八岁了。走过大半辈子风雨，再回头看十五岁那年第一次离家的莽撞，早已没有年少时的执拗，只剩下满心的感慨和庆幸。庆幸自己当年没有轻易妥协，庆幸木生始终初心不改，更庆幸父母最终的包容和成全。那段青涩又勇敢的年少过往，没有轰轰烈烈的情节，却藏着最质朴的真心、最纯粹的情意。多年岁月沉淀下来，依旧是我心里最温暖、最珍贵的回忆，陪着我安安稳稳走过这一生。',
      ],
      paragraphMedia: [
        null,
        { imageUrl: STORY_IMAGES.flagParade, caption: '1945 年扛标旗时，我在人群里第一次见到了木生。', source: 'ai' },
        null,
        { imageUrl: STORY_IMAGES.woodenBicycle, caption: '木生亲手做的木头自行车，藏着他最真诚的心意。', source: 'ai' },
        null,
        null,
        { imageUrl: STORY_IMAGES.ancestralHall, caption: '祠堂的石地砖又凉又疼，我整整跪了三天三夜。', source: 'ai' },
        null,
        null,
      ],
    },
  ],
} as const
