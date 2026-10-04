export const FEATURE_STORY_ID = 'story-sewing-machine'
export const AMA_FEATURE_STORY_ID = 'story-ama-gongfu-tea'

export const linXiulanStory = {
  id: FEATURE_STORY_ID,
  title: '第一台缝纫机',
  subtitle: '林秀兰总说，那台缝纫机不是家里最值钱的东西，却最像一个家慢慢成形的声音。',
  meta: '林秀兰 · 约 6 分钟',
  avatarUrl: '/sheguang-avatars/avatar_grandma.png',
  pullQuote: '那时候没有什么好东西，可我总想着，孩子穿在身上的，要暖。',
  musicUrl: '/audio/story/warm-memory-piano.mp3?v=liborio-piano-cloud',
  audioBaseUrl: '/audio/story/lin-xiulan-xinlingjitang',
  audioVersion: 'xinlingjitang-v1',
  introSegments: [
    '第一台缝纫机。',
    '由林秀兰口述、拾光叙AI小叙整理。',
    '请跟着她的记忆，回到那段一针一线把日子缝暖的时光。',
  ],
  scenes: [
    {
      title: '一台旧机器进了家门',
      imageUrl: '/memory-stories/lin-xiulan-sewing-machine-story.jpg',
      caption: 'AI生图：旧缝纫机进家门。',
      paragraphs: [
        '林秀兰第一次把那台黑色缝纫机搬回家时，天已经快黑了。机器是亲戚家换下来的，漆面有几处磕碰，踏板踩起来也不算轻快。她却像迎回一件大事似的，用旧毛巾一遍遍擦干净，又把针线盒、碎布头和量衣尺整整齐齐摆在桌角。',
        '那时候，家里许多东西都要省着来。孩子的衣服大多是哥哥姐姐穿过再改，袖口磨薄了，就翻一截布补上；裤脚短了，就接一段相近颜色的布。林秀兰不觉得这些是难看，她总说，只要干净、合身、暖和，就是能把日子过下去的好东西。',
        '缝纫机第一次响起来，屋里人都停了一下。哒哒哒，哒哒哒，声音从木桌旁传出去，像有人在替这个家打节拍。林秀兰低着头试线，嘴角却忍不住往上扬。她后来回忆说，那一刻她忽然觉得，家里虽然不宽裕，但很多事终于可以靠自己的手慢慢补起来。',
      ],
    },
    {
      title: '夜里赶出来的蓝棉袄',
      imageUrl: '/memory-stories/lin-xiulan-night-sewing.jpg',
      caption: 'AI生图：夜里赶做蓝棉袄。',
      paragraphs: [
        '白天她要买菜、做饭、照顾老人，还要惦记孩子上学带没带齐东西。真正能坐下来缝衣服，常常已经是夜里。窗外的巷子安静下来，屋里只剩一盏暖黄的小灯。她把布料摊开，先用手掌抚平，再用粉笔轻轻画线。',
        '有一年冬天来得早，老大放学回来时手指冻得发红。林秀兰摸了摸孩子的袖口，心里一下就记住了。那天晚上，她拆了旧棉衣里还能用的棉花，又找出一块藏了很久的蓝布。针断过一次，线也绕乱过，她停下来重新穿好，继续踩。',
        '她不太会说辛苦。孩子半夜醒来，只听见踏板轻轻响，母亲的影子落在墙上，一会儿低头，一会儿抬手理线。很多年后，孩子才明白，那些夜里的声音不是吵醒人的声音，是有人在替一家人把寒冷挡在门外。',
      ],
    },
    {
      title: '清晨跑向巷口的背影',
      imageUrl: '/memory-stories/lin-xiulan-morning-coat.jpg',
      caption: 'AI生图：清晨送孩子出门。',
      paragraphs: [
        '第二天早上，孩子穿上新棉袄，袖口刚好盖住手腕，领口也贴得平整。林秀兰只说了一句“去吧，别迟到”，又伸手把孩子肩上的书包带理正。她没有夸自己缝得好，只站在门口，看着孩子一路跑到巷口。',
        '孩子后来记不清那件棉袄究竟是什么样子了，只记得冬天早晨身上很暖，袖口有淡淡的皂角味。那种暖不是一下子扑过来的，是贴着身子慢慢散开的，好像母亲的手还在身边，把风口一点点按住。',
        '后来家里条件一点点好了，商店里的衣服多了起来，那台缝纫机慢慢退到墙边。可林秀兰听见老式机器的声音，还是会想起那些夜晚：钱薄，日子紧，但手还能做事，心还能把家撑起来。她说，日子不是一下子变好的，是一针一线缝出来的。',
      ],
    },
  ],
} as const

export const amaGongfuTeaStory = {
  id: AMA_FEATURE_STORY_ID,
  title: '老厝里的工夫茶与海风',
  subtitle: '叶淑柔阿嫲说，潮汕老厝里的第一杯茶，后来成了她守住一生的根。',
  meta: '叶淑柔 · 约 5 分钟',
  avatarUrl: '/scenario/ama-letter/avatars/ye-shurou-avatar.jpg',
  pullQuote: '水要沸，心要静；先涩后甜，就是人一辈子的味道。',
  musicUrl: '/audio/story/warm-memory-piano.mp3?v=liborio-piano-cloud',
  audioBaseUrl: '/audio/story/ama-gongfu-tea-xinlingjitang',
  audioVersion: 'xinlingjitang-v2',
  introSegments: [
    '老厝里的工夫茶与海风。',
    '由叶淑柔口述、拾光叙AI小叙整理。',
    '请跟着阿嫲的记忆，回到汕头海边那座带天井的老厝。',
  ],
  scenes: [
    {
      title: '天井里的第一杯茶',
      imageUrl: '/scenario/ama-letter/memoir/memoir-01-gongfu-tea.webp',
      caption: 'AI生图：潮汕老厝里的工夫茶。',
      paragraphs: [
        '我是生在汕头海边的一个普通囡仔。记忆里的老家，是一座带着天井的老厝，院子里的青石板缝里总长着倔强的青苔，一到雨天就滑得很。',
        '我阿爹是个极重规矩的潮汕男人。他教我的第一件事不是认字，而是冲工夫茶。关公巡城、韩信点兵，他总说，水要沸，心要静，这茶里的苦涩和回甘，就是人一辈子的味道。',
      ],
    },
    {
      title: '红头船汽笛吹来的远方',
      imageUrl: '/scenario/ama-letter/memoir/memoir-01-gongfu-tea.webp',
      caption: 'AI生图：潮汕老厝里的海风与童年。',
      paragraphs: [
        '那时候我总和邻居家的女娃们在长堤边跑，听着红头船靠岸的汽笛声，总觉得外面的世界很大。',
        '我从没想过，童年时闻惯的海风，还有这杯永远温热的工夫茶，后来竟成了我大半辈子用来解乡愁、守空房的慰藉。',
      ],
    },
    {
      title: '一杯茶把家留住',
      imageUrl: '/scenario/ama-letter/memoir/memoir-01-gongfu-tea.webp',
      caption: 'AI生图：八仙桌上的工夫茶与家族记忆。',
      paragraphs: [
        '如今对着拾光叙说起这些，机器竟帮我画出了当年老厝的模样。',
        '看着那张八仙桌，我仿佛又听到了阿爹咳嗽的声音。',
      ],
    },
  ],
} as const

export interface FramePlaybackMedia {
  imageUrl: string
  caption: string
  source?: 'upload' | 'ai'
}

export interface FramePlaybackScene {
  title: string
  imageUrl: string
  caption: string
  paragraphs: readonly string[]
  paragraphMedia?: readonly (FramePlaybackMedia | null)[]
}

export interface FramePlaybackStory {
  id: string
  title: string
  subtitle: string
  meta: string
  avatarUrl: string
  pullQuote: string
  musicUrl: string
  audioBaseUrl: string
  audioVersion: string
  audioLayout?: 'scene' | 'paragraph'
  splitThreshold?: number
  introSegments: readonly string[]
  scenes: readonly FramePlaybackScene[]
}

export const splitPlaybackText = (text: string, threshold = 46) => {
  const sentences = text.match(/[^。！？]+[。！？]?/g) ?? [text]
  const chunks: string[] = []
  let current = ''

  sentences.forEach((sentence) => {
    const next = `${current}${sentence}`
    if (current && next.length > threshold) {
      chunks.push(current)
      current = sentence
    } else {
      current = next
    }
  })

  if (current) chunks.push(current)
  return chunks
}

export const getStoryPlaybackSegments = (story: FramePlaybackStory) => {
  const introSegments = story.introSegments.map((text, introIndex) => ({
    id: `intro-${introIndex}`,
    sceneIndex: -1,
    paragraphIndex: introIndex,
    lineIndex: 0,
    sceneStep: introIndex + 1,
    sceneTitle: story.title,
    imageUrl: story.scenes[0].imageUrl,
    caption: story.scenes[0].caption,
    text,
    audioUrl: story.audioLayout === 'paragraph'
      ? `${story.audioBaseUrl}/intro.mp3?v=${story.audioVersion}`
      : `${story.audioBaseUrl}/0-1-${introIndex + 1}.mp3?v=${story.audioVersion}`,
  }))

  let globalParagraphIndex = 0
  let currentImageUrl = story.scenes[0].imageUrl
  let currentCaption = story.scenes[0].caption
  const storySegments = story.scenes.flatMap((scene, sceneIndex) => {
    let sceneStep = 0
    return scene.paragraphs.flatMap((paragraph, paragraphIndex) => {
      const paragraphMedia = scene.paragraphMedia?.[paragraphIndex]
      if (paragraphMedia) {
        currentImageUrl = paragraphMedia.imageUrl
        currentCaption = paragraphMedia.caption
      }
      const paragraphNumber = globalParagraphIndex + 1
      globalParagraphIndex += 1

      return splitPlaybackText(paragraph, story.splitThreshold).map((text, lineIndex) => {
      sceneStep += 1
      return {
        id: `${sceneIndex}-${paragraphIndex}-${lineIndex}`,
        sceneIndex,
        paragraphIndex,
        lineIndex,
        sceneStep,
        sceneTitle: scene.title || story.title,
        imageUrl: currentImageUrl,
        caption: currentCaption,
        text,
        audioUrl: story.audioLayout === 'paragraph'
          ? `${story.audioBaseUrl}/p${paragraphNumber}-${lineIndex + 1}.mp3?v=${story.audioVersion}`
          : `${story.audioBaseUrl}/${sceneIndex + 1}-${paragraphIndex + 1}-${lineIndex + 1}.mp3?v=${story.audioVersion}`,
      }
      })
    })
  })

  return [...introSegments, ...storySegments]
}

export const getLinXiulanPlaybackSegments = () => getStoryPlaybackSegments(linXiulanStory)
