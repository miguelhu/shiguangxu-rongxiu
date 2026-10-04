import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  Camera,
  CaretLeft,
  CaretRight,
  CheckCircle,
  DownloadSimple,
  HandHeart,
  Heart,
  ImageSquare,
  MagicWand,
  Microphone,
  Minus,
  MusicNotes,
  Pause,
  PencilSimple,
  Play,
  Plus,
  QrCode,
  ShareFat,
  Slideshow,
  SpeakerHigh,
  Stop,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { amaGongfuTeaStory, getStoryPlaybackSegments, linXiulanStory } from '../content/frameStoryPlayback'
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getMockMemoryStoryById } from '../mock'
import { getFrameVariant, withFrameVariant } from '../utils/frameVariant'
import '../styles/frame-story-workbench.css'

const COMING_SOON_MESSAGE = '即将上线'
const SEGMENT_MS_PER_CHARACTER = 210
const SEGMENT_MIN_MS = 5200
const SEGMENT_MAX_MS = 11200

type StoryPlaybackMode = 'read' | 'demo' | null
type StoryWorkbenchPanel = 'share' | 'collaboration' | 'voice-edit' | 'discard' | null
type StorySection = 'body' | 'contributions' | 'comments'
type StoryCollaborationView = 'list' | 'detail' | 'invite'

interface EditableStoryScene {
  title: string
  imageUrl: string
  caption: string
  paragraphs: string[]
  paragraphMedia: Array<{ imageUrl: string; caption: string; source: 'upload' | 'ai' } | null>
}

interface StoryEditSnapshot {
  title: string
  scenes: EditableStoryScene[]
  activeParagraphIndex: number
}

const STORY_CONTRIBUTIONS = [
  {
    id: 'contribution-ayue',
    contributorName: '阿月',
    relation: '从小玩伴',
    createdAt: '今天 10:18',
    avatarUrl: '/sheguang-avatars/avatar_grandma.png',
    title: '共创附记一｜从小玩伴视角：我在夜色里，看着她赌上一切离家远行',
    summary: '我和淑柔，是踩着同一条田埂、喝着同一口井水长大的。所有人都以为她会安安分分守着大山，只有我知道，她心里藏着一股别人看不懂的倔。',
    paragraphs: [
      { text: '我和淑柔，是踩着同一条田埂、喝着同一口井水长大的。' },
      { text: '村里别的姑娘爱闹、爱疯、爱耍小性子，唯独淑柔不一样。她从小就软、就乖、就懂事得让人心疼。' },
      { text: '别人家孩子犯错敢哭敢闹，她受了委屈只会憋着；别人偷懒躲农活，她默默把家里的活全部扛完；她这辈子，好像生来就是为了迁就别人、成全家里、安安分分守着这座大山活一辈子。' },
      { text: '所有人都以为，她这辈子，注定嫁在本村、守着灶台、围着田地，平平淡淡过完一生。' },
      { text: '只有我知道，她心里藏着一股别人看不懂的倔。', emphasis: true },
      { text: '我是唯一一个，早早知道她和木生心意的人。那些年山里管得严，男女私情是大忌，两人不敢明目张胆见面，只能偷偷相望、默默惦记。她从不跟旁人倾诉，所有心动、忐忑、委屈、期盼，只说给我一个人听。' },
      { text: '她无数次夜里跟我说：这辈子不想随便嫁人，不想困在山里熬一辈子。那时候我只当她是小姑娘的心愿，直到后来我才明白——她是真的，敢用一生去兑现自己的选择。' },
      { text: '她出走的前一晚，是来找过我的。没有哭，没有闹，只是安安静静坐在我家石阶上。她手都是凉的，眼神却格外坚定。' },
      { text: '她说：我想跟着他走一趟，哪怕苦、哪怕难、哪怕被人骂，我也想为自己活一次。' },
      { text: '我当时又怕又舍不得。我怕她出去受苦，怕世道亏待她，怕村里的唾沫星子淹了她。可看着她眼里从未有过的光亮，我一句话都劝不出口。' },
      { text: '那天清晨天没亮，我远远看着她等在门口，两人就这么看了一眼，没有出声。雾气很大，山路又冷又荒。她背着小小的布包，回头看了一眼生她养她的家，没有哭，只轻轻对我说：等我好好的。' },
      { text: '村里人后来都议论她、非议她、说她狠心、说她叛逆。' },
      { text: '可只有我这个从小一起长大的玩伴最清楚：', emphasis: true },
      { text: '她从来不是狠心，她是太温顺、太隐忍、太委屈自己了。她乖乖活了十几年，事事听话、步步迁就，唯独这一次，她想顺从自己的心。' },
      { text: '别人看见的是一场“大胆私奔”。我看见的，是一个温顺姑娘用尽毕生勇气的一次挣脱。' },
      { text: '这么多年过去了。我看着她跟着木生吃苦、安家、过日子，风雨相伴、不离不弃。我才真正懂：当年那个清晨的出走，不是冲动，是她这辈子最正确、最勇敢的一次抉择。' },
      { text: '叶家少了一个认命的姑娘，世间多了一对相守的良人。我的淑柔，值得这世间所有安稳温柔。' },
    ],
  },
  {
    id: 'contribution-mingde',
    contributorName: '明德叔',
    relation: '乡里代笔人',
    createdAt: '昨天 20:06',
    avatarUrl: '/sheguang-avatars/avatar_grandpa.png',
    title: '共创附记二｜当年写信故人视角：半生执笔替她寄相思，她和木生没辜负那之后的岁岁年年',
    summary: '当年山里大半人不识字，有情不敢写、有念无处寄。我替她落笔、替她寄信，也从一封封书信里读懂了她的深情与笃定。',
    paragraphs: [
      { text: '当年山里大半人不识字，有情不敢写、有念无处寄。' },
      { text: '我读过几年书，村里儿女的心事、远人的惦念，大多是我执笔代书。' },
      { text: '淑柔和木生的那段缘分，我是从头到尾，执笔见证、书信传情、岁月目睹的局外人。没想到一写就那么多年。' },
      { text: '我替她落笔，替她寄信，替她把不敢宣之于口的爱意，送到远方木生手里。' },
      { text: '旁人只当她是安分沉默的山里姑娘，唯有我从一封封书信里读懂：', emphasis: true },
      { text: '她的深情专一、她的笃定执着、她宁负世俗不负本心的坚定。', emphasis: true },
      { text: '她后来不止一次，在田间地头，眉眼含笑的跟我提起那个夜晚。我知道她从心里感谢自己勇敢过那一次。' },
      { text: '往后数十年，我远远看着他们一路走过来：颠沛时相互扶持，清贫时彼此体恤，风雨里不离不弃，岁月中温柔相守。' },
      { text: '当年一纸薄信，载少女赤诚心意；如今半生烟火，圆年少岁岁情深。' },
      { text: '当年我执笔，替她写下相思；如今岁月，替她印证真心。' },
      { text: '世间最好的爱情大抵如此：', emphasis: true },
      { text: '年少奔赴，半生相守，不负初心，不负远方，不负当年不顾一切的离家出走。', emphasis: true },
      { text: '作为当年替她传信的人，我最有资格说一句：淑柔当年的勇敢，从未被辜负。她赌的那一场人间奔赴，赢了一辈子的安稳与情深。' },
    ],
  },
]

const STORY_COMMUNITY_REACTIONS = [
  {
    id: 'reaction-zhiming',
    userName: '志明',
    userAvatar: '/scenario/ama-letter/photos/myself/myself-07.webp',
    expression: '真好',
    stickerUrl: '/stickers/00_风格确认版/06_真好.png',
    createdAt: '今天 08:40',
  },
  {
    id: 'reaction-kexin',
    userName: '可欣',
    userAvatar: '/scenario/ama-letter/photos/myself/myself-01.webp',
    expression: '想你',
    stickerUrl: '/stickers/00_风格确认版/04_想你.png',
    createdAt: '昨天 21:03',
  },
  {
    id: 'reaction-xiaowen',
    userName: '晓雯',
    userAvatar: '/scenario/ama-letter/photos/myself/myself-04.webp',
    expression: '开心每一天',
    stickerUrl: '/stickers/01_子女版/02_想念感谢祝福类/03_开心每一天.png',
    createdAt: '昨天 18:32',
  },
]

const STORY_TONE_OPTIONS = [
  { id: 'oral-memory', name: '原话口述版', desc: '保留您平时说话的感觉', example: '第一次离家时，母亲什么也没说，只在车开前往我包里塞了几个还热着的煮鸡蛋。' },
  { id: 'warm-prose', name: '烟火散文版', desc: '生活细节更多，更有画面', example: '车要开了，母亲把几个还热着的煮鸡蛋塞进我包里，那份暖意陪我走上了第一次离家的路。' },
  { id: 'cinema-voice', name: '电影旁白版', desc: '节奏鲜明，像一幕幕往事', example: '车门将关，母亲无言地塞来几个热鸡蛋，我的第一次离家就这样开始了。' },
  { id: 'family-letter', name: '家书深情版', desc: '像说给家人听，感情更直接', example: '想把这件事说给家里人听：我第一次离家时，母亲的牵挂都藏在那几个热鸡蛋里。' },
  { id: 'legacy-story', name: '传家故事版', desc: '稳重完整，适合留给晚辈', example: '母亲用几个热鸡蛋教会我，家人的牵挂常常不说出口，却会陪人走很远。' },
]

const STORY_TONE_EXAMPLE_SOURCE = '第一次离家时，母亲什么也没说，只在车开前往我包里塞了几个还热着的煮鸡蛋。'

const MAX_EDIT_HISTORY = 10

const STORY_SECTION_ITEMS: Array<{ id: StorySection; label: string }> = [
  { id: 'body', label: '正文' },
  { id: 'contributions', label: '共创' },
  { id: 'comments', label: '评论' },
]

const STORY_SECTION_IDS: Record<StorySection, string> = {
  body: 'frame-story-body',
  contributions: 'frame-story-contributions',
  comments: 'frame-story-comments',
}

const cleanStoryCaption = (caption: string) => caption.replace(/^AI\s*生图[：:]\s*/, '')

const cloneScenes = (scenes: EditableStoryScene[]) => scenes.map((scene) => ({
  ...scene,
  paragraphs: [...scene.paragraphs],
  paragraphMedia: scene.paragraphMedia.map((media) => media ? { ...media } : null),
}))

const createEditableScenes = (scenes: ReadonlyArray<{
  title: string
  imageUrl: string
  caption: string
  paragraphs: readonly string[]
  paragraphMedia?: readonly ({ imageUrl: string; caption: string; source?: 'upload' | 'ai' } | null)[]
}>) => scenes.map((scene) => ({
  ...scene,
  caption: cleanStoryCaption(scene.caption),
  paragraphs: [...scene.paragraphs],
  paragraphMedia: scene.paragraphMedia
    ? scene.paragraphMedia.map((media) => media ? {
        imageUrl: media.imageUrl,
        caption: cleanStoryCaption(media.caption),
        source: media.source || 'ai',
      } : null)
    : scene.paragraphs.map((_, index) => index === 0
      ? { imageUrl: scene.imageUrl, caption: cleanStoryCaption(scene.caption), source: 'ai' as const }
      : null),
}))

const getParagraphLocations = (scenes: EditableStoryScene[]) => scenes.flatMap((scene, sceneIndex) => (
  scene.paragraphs.map((text, paragraphIndex) => ({ scene, sceneIndex, paragraphIndex, text }))
))

const estimateSegmentDuration = (text: string) => {
  return Math.min(SEGMENT_MAX_MS, Math.max(SEGMENT_MIN_MS, text.length * SEGMENT_MS_PER_CHARACTER))
}

export function FrameMemoryStoryPage() {
  const { id, storyId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const frameVariant = getFrameVariant(searchParams)
  const isNewVariant = frameVariant === 'new'
  const isAmaScenario = getActiveScenarioId() === 'ama-letter'
  const fallbackStory = getMockMemoryStoryById(storyId || id || '') ?? getMockMemoryStoryById('story-childhood-home')
  const playbackStory = isAmaScenario ? amaGongfuTeaStory : linXiulanStory
  const story = playbackStory
  const articleTitle = isAmaScenario && fallbackStory ? fallbackStory.title : story.title
  const articleSubtitle = isAmaScenario && fallbackStory
    ? `${fallbackStory.themeTitle} · 由叶淑柔口述、拾光叙AI小叙整理`
    : story.subtitle
  const articleMetaName = isAmaScenario ? '叶淑柔' : '林秀兰'
  const articleDuration = isAmaScenario && fallbackStory
    ? `约 ${Math.max(2, Math.round(fallbackStory.readDurationSeconds / 60))} 分钟`
    : '约 6 分钟'
  const articleScenes = isAmaScenario && fallbackStory
    ? [
        {
          title: fallbackStory.themeTitle,
          imageUrl: fallbackStory.photoUrl || story.scenes[0].imageUrl,
          caption: fallbackStory.photoCaption || '阿嫲回忆里的潮汕旧时光。',
          paragraphs: fallbackStory.body,
        },
      ]
    : story.scenes
  const fresh = searchParams.get('fresh') === '1'
  const [toastMessage, setToastMessage] = useState('')
  const [toneDialogOpen, setToneDialogOpen] = useState(false)
  const [selectedToneId, setSelectedToneId] = useState(STORY_TONE_OPTIONS[0].id)
  const [wholeEditView, setWholeEditView] = useState<'settings' | 'examples'>('settings')
  const [exampleToneId, setExampleToneId] = useState(STORY_TONE_OPTIONS[0].id)
  const [wholePerson, setWholePerson] = useState('第一人称')
  const [wholeLength, setWholeLength] = useState('不变')
  const [playbackMode, setPlaybackMode] = useState<StoryPlaybackMode>(null)
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0)
  const [isPlaybackRunning, setIsPlaybackRunning] = useState(false)
  const [isMusicOn, setIsMusicOn] = useState(true)
  const [audioFallbackIds, setAudioFallbackIds] = useState<Set<string>>(() => new Set())
  const [savedTitle, setSavedTitle] = useState(articleTitle)
  const [savedScenes, setSavedScenes] = useState<EditableStoryScene[]>(() => createEditableScenes(articleScenes))
  const [draftTitle, setDraftTitle] = useState(articleTitle)
  const [draftScenes, setDraftScenes] = useState<EditableStoryScene[]>(() => createEditableScenes(articleScenes))
  const [editing, setEditing] = useState(false)
  const [editDirty, setEditDirty] = useState(false)
  const [, setDraftTone] = useState(STORY_TONE_OPTIONS[0].name)
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<StoryEditSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<StoryEditSnapshot[]>([])
  const [workbenchPanel, setWorkbenchPanel] = useState<StoryWorkbenchPanel>(null)
  const [collaborationView, setCollaborationView] = useState<StoryCollaborationView>('list')
  const [acceptingContributions, setAcceptingContributions] = useState(true)
  const [selectedContributionId, setSelectedContributionId] = useState(STORY_CONTRIBUTIONS[0].id)
  const [voiceEditStage, setVoiceEditStage] = useState<'ready' | 'recording' | 'review'>('ready')
  const [activeStorySection, setActiveStorySection] = useState<StorySection>('body')
  const manualEditSnapshotRef = useRef<StoryEditSnapshot | null>(null)
  const storyPaperRef = useRef<HTMLElement | null>(null)

  const displayedTitle = isNewVariant ? savedTitle : articleTitle
  const displayedScenes = isNewVariant ? savedScenes : articleScenes
  const newVariantBackPath = storyId && id ? `/frame/river/stage/${id}` : '/frame/river'
  const selectedContribution = STORY_CONTRIBUTIONS.find((item) => item.id === selectedContributionId) || STORY_CONTRIBUTIONS[0]
  const draftParagraphs = getParagraphLocations(draftScenes)
  const safeActiveParagraphIndex = Math.min(activeParagraphIndex, Math.max(0, draftParagraphs.length - 1))
  const activeParagraph = draftParagraphs[safeActiveParagraphIndex]
  const activeParagraphMedia = activeParagraph
    ? activeParagraph.scene.paragraphMedia[activeParagraph.paragraphIndex]
    : null

  const storySegments = useMemo(() => {
    return getStoryPlaybackSegments(playbackStory).map((segment) => ({
      ...segment,
      durationMs: estimateSegmentDuration(segment.text),
    }))
  }, [playbackStory])

  const activeSegment = storySegments[activeSegmentIndex] ?? storySegments[0]

  const showToast = (message = COMING_SOON_MESSAGE) => {
    setToastMessage(message)
  }

  const scrollToStorySection = (section: StorySection) => {
    const container = storyPaperRef.current
    const target = document.getElementById(STORY_SECTION_IDS[section])
    if (!container || !target) return

    const top = section === 'body'
      ? 0
      : target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 24
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const distance = Math.abs(container.scrollTop - top)
    setActiveStorySection(section)
    container.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion || distance > container.clientHeight * 1.25 ? 'auto' : 'smooth',
    })
  }

  useEffect(() => {
    const container = storyPaperRef.current
    if (!isNewVariant || editing || !container) return undefined

    const updateActiveStorySection = () => {
      const activationLine = container.getBoundingClientRect().top + 40
      const contributions = document.getElementById(STORY_SECTION_IDS.contributions)
      const comments = document.getElementById(STORY_SECTION_IDS.comments)
      const reachedBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 24

      if (comments && (reachedBottom || comments.getBoundingClientRect().top <= activationLine)) {
        setActiveStorySection('comments')
      } else if (contributions && contributions.getBoundingClientRect().top <= activationLine) {
        setActiveStorySection('contributions')
      } else {
        setActiveStorySection('body')
      }
    }

    container.addEventListener('scroll', updateActiveStorySection, { passive: true })
    updateActiveStorySection()
    return () => container.removeEventListener('scroll', updateActiveStorySection)
  }, [editing, isNewVariant])

  const currentEditSnapshot = (): StoryEditSnapshot => ({
    title: draftTitle,
    scenes: cloneScenes(draftScenes),
    activeParagraphIndex: safeActiveParagraphIndex,
  })

  const restoreEditSnapshot = (snapshot: StoryEditSnapshot) => {
    setDraftTitle(snapshot.title)
    setDraftScenes(cloneScenes(snapshot.scenes))
    setActiveParagraphIndex(snapshot.activeParagraphIndex)
  }

  const pushUndoSnapshot = (snapshot: StoryEditSnapshot) => {
    setUndoStack((current) => [...current.slice(-(MAX_EDIT_HISTORY - 1)), snapshot])
    setRedoStack([])
  }

  const applyDraftChange = (updater: (scenes: EditableStoryScene[]) => EditableStoryScene[]) => {
    pushUndoSnapshot(currentEditSnapshot())
    setDraftScenes((current) => updater(cloneScenes(current)))
    setEditDirty(true)
  }

  const beginManualEdit = () => {
    if (!manualEditSnapshotRef.current) manualEditSnapshotRef.current = currentEditSnapshot()
  }

  const commitManualEdit = () => {
    if (!manualEditSnapshotRef.current) return
    if (JSON.stringify(manualEditSnapshotRef.current.scenes) !== JSON.stringify(draftScenes)) {
      pushUndoSnapshot(manualEditSnapshotRef.current)
    }
    manualEditSnapshotRef.current = null
  }

  const startEditing = () => {
    closePlayback()
    window.scrollTo({ top: 0, behavior: 'auto' })
    setDraftTitle(savedTitle)
    setDraftScenes(cloneScenes(savedScenes))
    setDraftTone(STORY_TONE_OPTIONS.find((tone) => tone.id === selectedToneId)?.name || STORY_TONE_OPTIONS[0].name)
    setWholePerson('第一人称')
    setWholeLength('不变')
    setWholeEditView('settings')
    setActiveParagraphIndex(0)
    setUndoStack([])
    setRedoStack([])
    manualEditSnapshotRef.current = null
    setEditDirty(false)
    setEditing(true)
  }

  const requestCancelEditing = () => {
    if (editDirty) {
      setWorkbenchPanel('discard')
      return
    }
    setEditing(false)
  }

  const discardEditing = () => {
    setDraftTitle(savedTitle)
    setDraftScenes(cloneScenes(savedScenes))
    setEditing(false)
    setEditDirty(false)
    setUndoStack([])
    setRedoStack([])
    setWorkbenchPanel(null)
  }

  const saveEditing = () => {
    setSavedTitle(draftTitle.trim() || savedTitle)
    commitManualEdit()
    setSavedScenes(cloneScenes(draftScenes))
    setEditing(false)
    setEditDirty(false)
    setUndoStack([])
    setRedoStack([])
    showToast('修改已保存，家人将看到最新版本')
  }

  const updateDraftParagraph = (sceneIndex: number, paragraphIndex: number, value: string) => {
    setDraftScenes((current) => current.map((scene, currentSceneIndex) => {
      if (currentSceneIndex !== sceneIndex) return scene
      return {
        ...scene,
        paragraphs: scene.paragraphs.map((paragraph, currentParagraphIndex) => (
          currentParagraphIndex === paragraphIndex ? value : paragraph
        )),
      }
    }))
    setEditDirty(true)
  }

  const updateActiveMedia = (patch: Partial<NonNullable<typeof activeParagraphMedia>>) => {
    if (!activeParagraph) return
    applyDraftChange((scenes) => scenes.map((scene, sceneIndex) => {
      if (sceneIndex !== activeParagraph.sceneIndex) return scene
      const paragraphMedia = [...scene.paragraphMedia]
      paragraphMedia[activeParagraph.paragraphIndex] = {
        imageUrl: activeParagraphMedia?.imageUrl || displayedScenes[0]?.imageUrl || '',
        caption: activeParagraphMedia?.caption || '',
        source: activeParagraphMedia?.source || 'upload',
        ...patch,
      }
      return { ...scene, paragraphMedia }
    }))
  }

  const removeActiveImage = () => {
    if (!activeParagraph || !activeParagraphMedia) return
    applyDraftChange((scenes) => scenes.map((scene, sceneIndex) => {
      if (sceneIndex !== activeParagraph.sceneIndex) return scene
      const paragraphMedia = [...scene.paragraphMedia]
      paragraphMedia[activeParagraph.paragraphIndex] = null
      return { ...scene, paragraphMedia }
    }))
    showToast('图片已从修改稿中移除')
  }

  const transformActiveParagraph = (transform: (text: string) => string, message: string) => {
    if (!activeParagraph) return
    applyDraftChange((scenes) => scenes.map((scene, sceneIndex) => sceneIndex === activeParagraph.sceneIndex
      ? {
          ...scene,
          paragraphs: scene.paragraphs.map((paragraph, paragraphIndex) => (
            paragraphIndex === activeParagraph.paragraphIndex ? transform(paragraph) : paragraph
          )),
        }
      : scene))
    showToast(message)
  }

  const moveActiveImage = (direction: -1 | 1) => {
    if (!activeParagraphMedia) return
    const destinationIndex = safeActiveParagraphIndex + direction
    const destination = draftParagraphs[destinationIndex]
    if (!destination || destination.scene.paragraphMedia[destination.paragraphIndex]) return
    applyDraftChange((scenes) => {
      const locations = getParagraphLocations(scenes)
      const source = locations[safeActiveParagraphIndex]
      const target = locations[destinationIndex]
      const media = source.scene.paragraphMedia[source.paragraphIndex]
      source.scene.paragraphMedia[source.paragraphIndex] = null
      target.scene.paragraphMedia[target.paragraphIndex] = media ? { ...media } : null
      return scenes
    })
    setActiveParagraphIndex(destinationIndex)
    showToast(direction < 0 ? '图片已移到上一段' : '图片已移到下一段')
  }

  const deleteActiveParagraph = () => {
    if (!activeParagraph || draftParagraphs.length <= 1) return
    applyDraftChange((scenes) => scenes.map((scene, sceneIndex) => {
      if (sceneIndex !== activeParagraph.sceneIndex) return scene
      return {
        ...scene,
        paragraphs: scene.paragraphs.filter((_, index) => index !== activeParagraph.paragraphIndex),
        paragraphMedia: scene.paragraphMedia.filter((_, index) => index !== activeParagraph.paragraphIndex),
      }
    }).filter((scene) => scene.paragraphs.length > 0))
    setActiveParagraphIndex(Math.min(safeActiveParagraphIndex, draftParagraphs.length - 2))
    showToast('这一段已从修改稿中删除')
  }

  const undoLastChange = () => {
    commitManualEdit()
    const snapshot = undoStack[undoStack.length - 1]
    if (!snapshot) return
    setRedoStack((current) => [...current.slice(-(MAX_EDIT_HISTORY - 1)), currentEditSnapshot()])
    setUndoStack((current) => current.slice(0, -1))
    restoreEditSnapshot(snapshot)
    setEditDirty(true)
    showToast('已撤销上一次修改')
  }

  const redoLastChange = () => {
    const snapshot = redoStack[redoStack.length - 1]
    if (!snapshot) return
    setUndoStack((current) => [...current.slice(-(MAX_EDIT_HISTORY - 1)), currentEditSnapshot()])
    setRedoStack((current) => current.slice(0, -1))
    restoreEditSnapshot(snapshot)
    setEditDirty(true)
    showToast('已恢复上一次修改')
  }

  const applyVoiceEdit = () => {
    transformActiveParagraph(
      (paragraph) => paragraph.startsWith('我一直记得，') ? paragraph : `我一直记得，${paragraph}`,
      'AI 已按你的话生成修改预览',
    )
    setVoiceEditStage('ready')
    setWorkbenchPanel(null)
  }

  const closePlayback = () => {
    setPlaybackMode(null)
    setIsPlaybackRunning(false)
  }

  const startPlayback = (modeToStart: Exclude<StoryPlaybackMode, null>) => {
    setAudioFallbackIds(new Set())
    setPlaybackMode(modeToStart)
    setActiveSegmentIndex(0)
    setIsPlaybackRunning(true)
  }

  const toggleReadPlayback = () => {
    if (playbackMode === 'read') {
      setIsPlaybackRunning((value) => !value)
      return
    }
    startPlayback('read')
  }

  const goToNextSegment = () => {
    setActiveSegmentIndex((current) => {
      if (current >= storySegments.length - 1) {
        setIsPlaybackRunning(false)
        return current
      }
      return current + 1
    })
  }

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (playbackMode !== 'demo' || !isMusicOn) return undefined

    const music = new Audio(story.musicUrl)
    music.loop = true
    music.volume = 0.11
    music.onerror = () => {
      showToast('背景音乐文件还没有放入')
    }
    void music.play().catch(() => undefined)

    return () => {
      music.pause()
      music.onerror = null
    }
  }, [isMusicOn, playbackMode, story.musicUrl])

  useEffect(() => {
    if (!playbackMode || !isPlaybackRunning || !activeSegment) return undefined

    let fallbackTimer = 0
    const shouldUseGeneratedAudio = Boolean(activeSegment.audioUrl && !audioFallbackIds.has(activeSegment.id))

    if (shouldUseGeneratedAudio) {
      const audio = new Audio(activeSegment.audioUrl)
      audio.volume = 1
      audio.onended = goToNextSegment
      audio.onerror = () => {
        setAudioFallbackIds((current) => new Set(current).add(activeSegment.id))
        fallbackTimer = window.setTimeout(goToNextSegment, activeSegment.durationMs)
      }
      void audio.play().catch(() => {
        setAudioFallbackIds((current) => new Set(current).add(activeSegment.id))
        fallbackTimer = window.setTimeout(goToNextSegment, activeSegment.durationMs)
      })

      return () => {
        window.clearTimeout(fallbackTimer)
        audio.pause()
        audio.onended = null
        audio.onerror = null
      }
    }

    showToast('这一段音频暂时无法播放')
    fallbackTimer = globalThis.setTimeout(goToNextSegment, activeSegment.durationMs)

    return () => {
      window.clearTimeout(fallbackTimer)
    }
  }, [activeSegment, audioFallbackIds, isPlaybackRunning, playbackMode])

  useEffect(() => {
    if (!playbackMode || !isPlaybackRunning) return undefined

    const preloadAudios = storySegments
      .slice(activeSegmentIndex + 1, activeSegmentIndex + 3)
      .map((segment) => {
        if (!segment.audioUrl || audioFallbackIds.has(segment.id)) return null
        const audio = new Audio(segment.audioUrl)
        audio.preload = 'auto'
        audio.load()
        return audio
      })
      .filter(Boolean) as HTMLAudioElement[]

    return () => {
      preloadAudios.forEach((audio) => {
        audio.src = ''
        audio.load()
      })
    }
  }, [activeSegmentIndex, audioFallbackIds, isPlaybackRunning, playbackMode, storySegments])

  if (!story && !fallbackStory) {
    return (
      <FramePageShell className="frame-story-page" mode={mode}>
        <header className="frame-memory-topbar frame-family-space__topbar frame-story-topbar frame-light-nav">
          <button className="frame-memory-back-button" type="button" aria-label="返回往事" onClick={() => navigate(withScenario('/frame/memories'))}>
            <CaretLeft size={40} weight="bold" aria-hidden="true" />
          </button>
          <span className="frame-story-topbar-spacer" aria-hidden="true" />
        </header>
        <section className="frame-story-paper">
          <h1>故事还在整理中</h1>
          <p>稍后再回来看看。</p>
        </section>
      </FramePageShell>
    )
  }

  return (
    <FramePageShell className={`frame-story-page${isNewVariant ? ' frame-story-page--workbench' : ''}${editing ? ' is-editing' : ''}`} mode={mode}>
      <header className={`frame-memory-topbar frame-family-space__topbar frame-story-topbar frame-light-nav${isNewVariant && !editing ? ' frame-story-topbar--section-nav' : ''}`}>
        <button
          className="frame-memory-back-button"
          type="button"
          aria-label={editing ? '退出编辑' : (isNewVariant ? '返回时光长河' : '返回往事')}
          onClick={() => editing ? requestCancelEditing() : navigate(isNewVariant ? withFrameVariant(newVariantBackPath, frameVariant) : withScenario('/frame/memories'))}
        >
          {editing ? <X size={34} weight="bold" aria-hidden="true" /> : <CaretLeft size={40} weight="bold" aria-hidden="true" />}
        </button>
        {isNewVariant && !editing ? (
          <nav className="frame-story-section-nav" aria-label="故事页内导航">
            {STORY_SECTION_ITEMS.map((item) => (
              <button
                className={activeStorySection === item.id ? 'is-active' : ''}
                type="button"
                key={item.id}
                aria-current={activeStorySection === item.id ? 'location' : undefined}
                onClick={() => scrollToStorySection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : isNewVariant && editing ? <strong className="frame-story-edit-topbar__title">{draftTitle}</strong> : <span className="frame-story-topbar-spacer" aria-hidden="true" />}
        {isNewVariant && !editing ? <span className="frame-story-section-nav__balance" aria-hidden="true" /> : isNewVariant && editing && activeParagraph ? (
          <nav className="frame-story-edit-topbar__paragraph-nav" aria-label="切换编辑段落">
            <button type="button" aria-label="上一段" disabled={safeActiveParagraphIndex === 0} onClick={() => { commitManualEdit(); setActiveParagraphIndex((current) => Math.max(0, current - 1)) }}>
              <CaretLeft size={23} weight="bold" />
            </button>
            <strong>第 {safeActiveParagraphIndex + 1} / {draftParagraphs.length} 段</strong>
            <button type="button" aria-label="下一段" disabled={safeActiveParagraphIndex === draftParagraphs.length - 1} onClick={() => { commitManualEdit(); setActiveParagraphIndex((current) => Math.min(draftParagraphs.length - 1, current + 1)) }}>
              <CaretRight size={23} weight="bold" />
            </button>
          </nav>
        ) : null}
      </header>

      <article className="frame-story-paper" ref={storyPaperRef}>
        {editing && activeParagraph ? (
          <div className="frame-story-paragraph-editor">
            <div className="frame-story-paragraph-editor__body">
              <section className="frame-story-paragraph-copy" aria-label={`编辑第${safeActiveParagraphIndex + 1}段`}>
                <textarea
                  value={activeParagraph.text}
                  aria-label="直接修改这段文字"
                  onFocus={beginManualEdit}
                  onBlur={commitManualEdit}
                  onChange={(event) => updateDraftParagraph(activeParagraph.sceneIndex, activeParagraph.paragraphIndex, event.target.value)}
                />
                <div className="frame-story-paragraph-tools" aria-label="文字操作">
                  <button type="button" onClick={() => { setVoiceEditStage('ready'); setWorkbenchPanel('voice-edit') }}><Microphone size={21} weight="fill" />说话修改</button>
                  <button type="button" onClick={() => transformActiveParagraph((text) => `${text} 那些当时没有留意的小细节，如今想来，也格外珍贵。`, '这段文字已经写得更详细了')}><Plus size={21} weight="bold" />加长</button>
                  <button type="button" onClick={() => transformActiveParagraph((text) => text.length > 54 ? `${text.slice(0, Math.max(42, Math.floor(text.length * 0.65))).replace(/[，、；：]?$/, '')}。` : text, '这段文字已经精简了')}><Minus size={21} weight="bold" />缩短</button>
                  <button type="button" onClick={() => transformActiveParagraph((text) => `说起这段往事，我最先想起的还是当时的情景。${text.replace(/^我一直记得，?/, '')}`, '这段文字已经重新整理了')}><ArrowClockwise size={21} weight="bold" />重生成</button>
                </div>
              </section>

              <section className="frame-story-paragraph-media" aria-label="本段图片编辑">
                {activeParagraphMedia ? (
                  <>
                    <figure>
                      <img src={activeParagraphMedia.imageUrl} alt="" />
                      <button type="button" aria-label="删除图片" title="删除图片" onClick={removeActiveImage}><Trash size={23} weight="bold" /></button>
                    </figure>
                    <label>
                      <textarea
                        value={activeParagraphMedia.caption}
                        rows={1}
                        maxLength={80}
                        placeholder="添加图片注释"
                        aria-label="修改图片注释"
                        onFocus={beginManualEdit}
                        onBlur={commitManualEdit}
                        onChange={(event) => {
                          const value = event.target.value
                          setDraftScenes((current) => current.map((scene, sceneIndex) => {
                            if (sceneIndex !== activeParagraph.sceneIndex) return scene
                            const paragraphMedia = scene.paragraphMedia.map((media, paragraphIndex) => paragraphIndex === activeParagraph.paragraphIndex && media ? { ...media, caption: value } : media)
                            return { ...scene, paragraphMedia }
                          }))
                          setEditDirty(true)
                        }}
                      />
                    </label>
                    <div className="frame-story-paragraph-tools frame-story-paragraph-tools--image" aria-label="图片操作">
                      <button type="button" onClick={() => updateActiveMedia({ imageUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg', source: 'upload', caption: '家里珍藏的一张老照片。' })}><Camera size={21} weight="bold" />换照片</button>
                      <button type="button" onClick={() => updateActiveMedia({ imageUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg', source: 'ai', caption: '记忆里的旧时光。' })}><MagicWand size={21} weight="fill" />AI 生图</button>
                      <button type="button" disabled={safeActiveParagraphIndex === 0 || Boolean(draftParagraphs[safeActiveParagraphIndex - 1]?.scene.paragraphMedia[draftParagraphs[safeActiveParagraphIndex - 1]?.paragraphIndex])} onClick={() => moveActiveImage(-1)}><ArrowUp size={21} weight="bold" />移到上段</button>
                      <button type="button" disabled={safeActiveParagraphIndex === draftParagraphs.length - 1 || Boolean(draftParagraphs[safeActiveParagraphIndex + 1]?.scene.paragraphMedia[draftParagraphs[safeActiveParagraphIndex + 1]?.paragraphIndex])} onClick={() => moveActiveImage(1)}><ArrowDown size={21} weight="bold" />移到下段</button>
                    </div>
                  </>
                ) : (
                  <div className="frame-story-paragraph-media__empty">
                    <ImageSquare size={30} weight="bold" />
                    <strong>这一段还没有图片</strong>
                    <div className="frame-story-paragraph-empty-actions">
                      <button type="button" onClick={() => updateActiveMedia({ imageUrl: '/frame-gallery/optimized/05-vintage-young-couple-photo.jpg', source: 'upload', caption: '家里珍藏的一张老照片。' })}><Camera size={21} weight="bold" />上传照片</button>
                      <button type="button" onClick={() => updateActiveMedia({ imageUrl: '/frame-gallery/optimized/04-suzhou-living-room-memory.jpg', source: 'ai', caption: '记忆里的旧时光。' })}><MagicWand size={21} weight="fill" />AI 生图</button>
                    </div>
                  </div>
                )}
              </section>
            </div>
            <button className="frame-story-paragraph-delete" type="button" disabled={draftParagraphs.length <= 1} onClick={deleteActiveParagraph}><Trash size={20} weight="bold" />删除本段</button>
          </div>
        ) : (
          <>
            {fresh ? (
              <div className="frame-story-tip">
                <CheckCircle size={30} weight="fill" aria-hidden="true" />
                这段往事已经整理好了
              </div>
            ) : null}
            <div className="frame-story-header" id={isNewVariant ? STORY_SECTION_IDS.body : undefined}>
              <div className="frame-story-title-row">
                <div>
                  <h1>{displayedTitle}</h1>
                  <div className="frame-story-meta-row" aria-label="故事信息">
                    <img src={story.avatarUrl} alt="" />
                    <span>{articleMetaName}</span>
                    <em>{articleDuration}</em>
                  </div>
                </div>
                <button className="frame-story-read-button" type="button" onClick={toggleReadPlayback}>
                  {playbackMode === 'read' && isPlaybackRunning ? <Pause size={24} weight="fill" aria-hidden="true" /> : <SpeakerHigh size={24} weight="fill" aria-hidden="true" />}
                  {playbackMode === 'read' ? (isPlaybackRunning ? '暂停朗读' : '继续朗读') : '读给我听'}
                </button>
              </div>
              <p className="frame-story-intro">{articleSubtitle}</p>
            </div>
            <div className="frame-story-scenes">
              {isNewVariant ? savedScenes.map((scene, sceneIndex) => (
                <section className="frame-story-scene frame-story-scene--v01" key={`v01-${sceneIndex}`} aria-label="故事正文">
                  <div className="frame-story-scene-copy">
                    {scene.paragraphs.map((paragraph, paragraphIndex) => {
                      const paragraphMedia = scene.paragraphMedia[paragraphIndex]
                      return (
                        <div className="frame-story-reading-paragraph" key={`${sceneIndex}-${paragraphIndex}`}>
                          <p className={paragraphIndex === 0 && sceneIndex === 0 ? 'frame-story-lead' : undefined}>{paragraph}</p>
                          {paragraphMedia ? (
                            <figure className="frame-story-scene-figure frame-story-paragraph-figure">
                              <img src={paragraphMedia.imageUrl} alt="" loading="lazy" />
                              <figcaption>{paragraphMedia.caption}</figcaption>
                            </figure>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )) : displayedScenes.map((scene, sceneIndex) => (
                <section className="frame-story-scene" key={scene.title} aria-label={`第${sceneIndex + 1}幕：${scene.title}`}>
                  <figure className={sceneIndex === 0 ? 'frame-story-hero' : 'frame-story-scene-figure'}>
                    <img src={scene.imageUrl} alt="" />
                    <button className="frame-story-image-action" type="button" onClick={() => showToast('AI 正在重新生成这张配图')}>重新生成</button>
                    <figcaption>{scene.caption}</figcaption>
                  </figure>
                  <div className="frame-story-scene-copy">
                    <h2>{scene.title}</h2>
                    {scene.paragraphs.map((paragraph, paragraphIndex) => paragraphIndex === 0 && sceneIndex === 0
                      ? <p className="frame-story-lead" key={`${sceneIndex}-${paragraphIndex}`}>{paragraph}</p>
                      : <p key={`${sceneIndex}-${paragraphIndex}`}>{paragraph}</p>)}
                    <button className="frame-story-inline-image-button" type="button" onClick={() => showToast('AI 会判断这一段适合补哪一张图')}>
                      <span className="frame-story-inline-image-button__text">适合补一张糖葱薄饼的氛围图，</span>
                      <span className="frame-story-inline-image-button__action">AI生图<CaretRight size={28} weight="bold" aria-hidden="true" /></span>
                    </button>
                  </div>
                </section>
              ))}
            </div>
            {isNewVariant ? (
              <section className="frame-story-community" aria-label="亲友共创与亲友互动">
                <section className="frame-story-community__contributions" id={STORY_SECTION_IDS.contributions} aria-labelledby="frame-story-community-contributions-title">
                  <header className="frame-story-community__section-head">
                    <h2 id="frame-story-community-contributions-title">亲友共创</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setCollaborationView('list')
                        setWorkbenchPanel('collaboration')
                      }}
                    >
                      查看全部 <CaretRight size={21} weight="bold" aria-hidden="true" />
                    </button>
                  </header>
                  <div className="frame-story-community__rail" aria-label="亲友共创预览">
                    {STORY_CONTRIBUTIONS.map((item) => (
                      <button
                        className="frame-story-community__contribution-card"
                        type="button"
                        key={item.id}
                        aria-label={`查看${item.contributorName}的共创`}
                        onClick={() => {
                          setSelectedContributionId(item.id)
                          setCollaborationView('detail')
                          setWorkbenchPanel('collaboration')
                        }}
                      >
                        <span className="frame-story-community__person">
                          <img src={item.avatarUrl} alt="" />
                          <span><strong>{item.contributorName} · {item.relation}</strong><small>{item.createdAt}</small></span>
                        </span>
                        <p>{item.summary}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="frame-story-community__reactions" id={STORY_SECTION_IDS.comments} aria-labelledby="frame-story-community-reactions-title">
                  <header className="frame-story-community__section-head">
                    <h2 id="frame-story-community-reactions-title">亲友互动</h2>
                  </header>
                  <button className="frame-story-community__likes" type="button" onClick={() => showToast('4 位亲友喜欢这篇故事')}>
                    <span className="frame-story-community__like-avatars" aria-hidden="true">
                      {STORY_COMMUNITY_REACTIONS.map((item) => <img key={item.id} src={item.userAvatar} alt="" />)}
                      <img src={story.avatarUrl} alt="" />
                    </span>
                    <span><i><Heart size={19} weight="fill" aria-hidden="true" /></i>4 人喜欢<CaretRight size={19} weight="bold" aria-hidden="true" /></span>
                  </button>
                  <div className="frame-story-community__reaction-list" aria-label="亲友评论">
                    {STORY_COMMUNITY_REACTIONS.map((item) => (
                      <article className="frame-story-community__reaction" key={item.id}>
                        <img src={item.userAvatar} alt="" />
                        <div>
                          <strong>{item.userName}</strong>
                          <img className="frame-story-community__sticker" src={item.stickerUrl} alt={item.expression} />
                        </div>
                        <time>{item.createdAt}</time>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
            ) : null}
          </>
        )}
      </article>
      <div className="frame-study-album-floating-actions frame-story-floating-actions" aria-label="故事快捷操作">
        {isNewVariant ? (
          editing ? (
            <>
              <button type="button" disabled={undoStack.length === 0 && !manualEditSnapshotRef.current} onClick={undoLastChange}>
                <ArrowCounterClockwise size={27} weight="bold" aria-hidden="true" />
                撤销修改
              </button>
              <button type="button" disabled={redoStack.length === 0} onClick={redoLastChange}>
                <ArrowClockwise size={27} weight="bold" aria-hidden="true" />
                恢复修改
              </button>
              <button type="button" onClick={() => { setWholeEditView('settings'); setToneDialogOpen(true) }}>
                <MagicWand size={29} weight="fill" aria-hidden="true" />
                修改全文
              </button>
              <button type="button" disabled={!editDirty} onClick={saveEditing}>
                <CheckCircle size={29} weight="fill" aria-hidden="true" />
                保存修改
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => startPlayback('demo')}>
                <Slideshow size={29} weight="bold" aria-hidden="true" />
                播放
              </button>
              <button className="frame-story-share-trigger" type="button" onClick={() => setWorkbenchPanel('share')}>
                <ShareFat size={29} weight="bold" aria-hidden="true" />
                分享 / 共创
              </button>
              <button type="button" onClick={startEditing}>
                <PencilSimple size={29} weight="fill" aria-hidden="true" />
                编辑
              </button>
            </>
          )
        ) : (
          <>
            <button type="button" onClick={() => startPlayback('demo')}>
              <Slideshow size={29} weight="bold" aria-hidden="true" />
              播放
            </button>
            <button type="button" onClick={() => showToast('已准备分享给家人')}>
              <ShareFat size={29} weight="bold" aria-hidden="true" />
              分享
            </button>
            <button type="button" onClick={() => setToneDialogOpen(true)}>
              <ArrowsClockwise size={29} weight="bold" aria-hidden="true" />
              换文风
            </button>
          </>
        )}
      </div>
      {toneDialogOpen ? (
        <div className={`frame-story-dialog-backdrop${isNewVariant && editing ? ' frame-story-dialog-backdrop--bottom-sheet' : ''}`} role="presentation" onClick={() => { setToneDialogOpen(false); setWholeEditView('settings') }}>
          <section className={`frame-story-dialog frame-story-tone-dialog${isNewVariant && editing ? ' frame-story-tone-dialog--whole' : ''}`} role="dialog" aria-modal="true" aria-labelledby="frame-story-tone-title" onClick={(event) => event.stopPropagation()}>
            <header className="frame-story-dialog__heading">
              {isNewVariant && editing && wholeEditView === 'examples' ? (
                <button className="frame-story-dialog__back" type="button" aria-label="返回修改全文" onClick={() => setWholeEditView('settings')}>
                  <CaretLeft size={28} weight="bold" aria-hidden="true" />
                </button>
              ) : null}
              <h2 id="frame-story-tone-title">{isNewVariant && editing ? (wholeEditView === 'examples' ? '文风示例' : '修改全文') : '选择文风'}</h2>
              <button type="button" aria-label="关闭文风选择" onClick={() => { setToneDialogOpen(false); setWholeEditView('settings') }}>
                <X size={28} weight="bold" aria-hidden="true" />
              </button>
            </header>
            {isNewVariant && editing && wholeEditView === 'settings' ? (
              <div className="frame-story-whole-edit">
                <fieldset>
                  <legend>人称</legend>
                  <div className="frame-story-whole-edit__segments">
                    {['第一人称', '第三人称'].map((item) => <button className={wholePerson === item ? 'is-active' : ''} type="button" key={item} onClick={() => setWholePerson(item)}>{item}</button>)}
                  </div>
                </fieldset>
                <fieldset>
                  <div className="frame-story-whole-edit__legend-row">
                    <span>文风</span>
                    <button className="frame-story-tone-example-link" type="button" onClick={() => { setExampleToneId(selectedToneId); setWholeEditView('examples') }}>
                      查看示例 <CaretRight size={18} weight="bold" />
                    </button>
                  </div>
                  <div className="frame-story-tone-list" role="radiogroup" aria-label="文风版本">
                    {STORY_TONE_OPTIONS.map((tone) => (
                      <button className={tone.id === selectedToneId ? 'is-active' : ''} key={tone.id} type="button" role="radio" aria-checked={tone.id === selectedToneId} onClick={() => setSelectedToneId(tone.id)}>
                        <strong>{tone.name}</strong><small>{tone.desc}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>文章总长度</legend>
                  <div className="frame-story-whole-edit__segments">
                    {['不变', '更短', '更长'].map((item) => <button className={wholeLength === item ? 'is-active' : ''} type="button" key={item} onClick={() => setWholeLength(item)}>{item}</button>)}
                  </div>
                </fieldset>
              </div>
            ) : isNewVariant && editing ? (
              <div className="frame-story-style-examples">
                <div className="frame-story-style-examples__tabs" role="tablist" aria-label="文风示例">
                  {STORY_TONE_OPTIONS.map((tone) => (
                    <button className={tone.id === exampleToneId ? 'is-active' : ''} key={tone.id} type="button" role="tab" aria-selected={tone.id === exampleToneId} onClick={() => setExampleToneId(tone.id)}>
                      {tone.name.replace(/版$/, '')}
                    </button>
                  ))}
                </div>
                <div className="frame-story-style-examples__compare">
                  <section><span>原话</span><p>{STORY_TONE_EXAMPLE_SOURCE}</p></section>
                  <section key={exampleToneId}><span>改写后</span><p>{STORY_TONE_OPTIONS.find((tone) => tone.id === exampleToneId)?.example}</p></section>
                </div>
              </div>
            ) : (
              <div className="frame-story-tone-list" role="radiogroup" aria-label="文风版本">
                {STORY_TONE_OPTIONS.map((tone) => (
                  <button className={tone.id === selectedToneId ? 'is-active' : ''} key={tone.id} type="button" role="radio" aria-checked={tone.id === selectedToneId} onClick={() => setSelectedToneId(tone.id)}>
                    <strong>{tone.name}</strong><small>{tone.desc}</small>
                  </button>
                ))}
              </div>
            )}
            {!(isNewVariant && editing && wholeEditView === 'examples') ? <button
              className="frame-story-tone-submit"
              type="button"
              onClick={() => {
                setToneDialogOpen(false)
                const selectedTone = STORY_TONE_OPTIONS.find((tone) => tone.id === selectedToneId)
                if (isNewVariant && editing) {
                  setDraftTone(selectedTone?.name || STORY_TONE_OPTIONS[0].name)
                  applyDraftChange((scenes) => scenes.map((scene) => ({
                    ...scene,
                    paragraphs: scene.paragraphs.map((paragraph) => {
                      let text = paragraph
                      if (wholePerson === '第三人称') text = text.replace(/^我/, articleMetaName)
                      if (selectedToneId === 'warm-prose') text = `${text} 那些寻常日子里的声音和气味，现在想起依然亲切。`
                      if (selectedToneId === 'cinema-voice') text = `那一天的画面，我一直记得。${text}`
                      if (selectedToneId === 'family-letter') text = `说给孩子们听，${text}`
                      if (selectedToneId === 'legacy-story') text = `说起这段往事，${text}`
                      if (wholeLength === '更短' && text.length > 54) text = `${text.slice(0, Math.max(44, Math.floor(text.length * 0.72))).replace(/[，、；：]?$/, '')}。`
                      if (wholeLength === '更长') text = `${text} 那些当时没有留意的小细节，如今想来，也格外珍贵。`
                      return text
                    }),
                  })))
                  showToast('全文已重新生成，保存修改后生效')
                  return
                }
                showToast(`AI 正在按${selectedTone?.name || '新文风'}重新生成`)
              }}
            >
              重新生成
            </button> : null}
          </section>
        </div>
      ) : null}
      {isNewVariant && workbenchPanel === 'share' ? (
        <div className="frame-story-postcard-preview" role="dialog" aria-modal="true" aria-label="分享故事明信片">
          <div className="frame-story-postcard-preview__stage">
            <figure className="frame-story-postcard">
              <img src="/story/first-departure/postcard.png" alt="十五岁第一次离家的故事明信片" />
              <button type="button" className="frame-story-postcard__close" aria-label="关闭分享图片" onClick={() => setWorkbenchPanel(null)}><X size={27} weight="bold" /></button>
            </figure>
          </div>
          <footer className="frame-story-postcard-preview__footer">
            <p>保存后，可发给微信好友或发到朋友圈</p>
            <button type="button" onClick={() => { setWorkbenchPanel(null); showToast('故事图片已保存到相册') }}><DownloadSimple size={24} weight="bold" />保存到相册</button>
          </footer>
        </div>
      ) : null}
      {isNewVariant && workbenchPanel === 'collaboration' ? (
        <div className="frame-story-workbench-backdrop" role="presentation" onClick={() => setWorkbenchPanel(null)}>
          <aside
            className={`frame-story-workbench-drawer frame-story-collaboration-drawer${collaborationView === 'detail' ? ' is-detail' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={collaborationView === 'detail' ? `${selectedContribution.contributorName}的共创附记` : '亲友共创'}
            onClick={(event) => event.stopPropagation()}
          >
            <header className={collaborationView === 'detail' ? 'frame-story-collaboration-header--detail' : undefined}>
              {collaborationView === 'detail' ? (
                <div className="frame-story-contribution-detail__person">
                  <img src={selectedContribution.avatarUrl} alt="" />
                  <span><strong>{selectedContribution.contributorName} · {selectedContribution.relation}</strong><small>{selectedContribution.createdAt}</small></span>
                </div>
              ) : (
                <div>
                  <span>{collaborationView === 'invite' ? '邀请亲友共创' : '亲友共创'}</span>
                  <h2 id="frame-story-collaboration-title">
                    {collaborationView === 'list' ? displayedTitle : '请家人讲讲他记得的另一面'}
                  </h2>
                </div>
              )}
              {collaborationView === 'detail' ? (
                <button type="button" aria-label="关闭共创详情" onClick={() => setWorkbenchPanel(null)}>
                  <X size={28} weight="bold" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" aria-label="关闭共创" onClick={() => setWorkbenchPanel(null)}><X size={28} weight="bold" /></button>
              )}
            </header>
            {collaborationView === 'list' ? (
              <section className="frame-story-contribution-layout" aria-label="全部亲友共创">
                <div className="frame-story-contribution-summary">共 {STORY_CONTRIBUTIONS.length} 段亲友共创</div>
                <div className="frame-story-contribution-list">
                  {STORY_CONTRIBUTIONS.map((item) => (
                    <button type="button" key={item.id} aria-label={`查看${item.contributorName}的共创详情`} onClick={() => { setSelectedContributionId(item.id); setCollaborationView('detail') }}>
                      <span className="frame-story-contribution-list__meta">
                        <img src={item.avatarUrl} alt="" />
                        <span><strong>{item.contributorName} · {item.relation}</strong><small>{item.createdAt}</small></span>
                        <CaretRight size={22} weight="bold" aria-hidden="true" />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : collaborationView === 'detail' ? (
              <div className="frame-story-contribution-layout frame-story-contribution-layout--detail">
                <article className="frame-story-contribution-detail">
                  <h3>{selectedContribution.title}</h3>
                  <div className="frame-story-contribution-detail__body">
                    {selectedContribution.paragraphs.map((paragraph, index) => (
                      <p className={paragraph.emphasis ? 'is-emphasis' : undefined} key={`${selectedContribution.id}-${index}`}>
                        {paragraph.emphasis ? <strong>{paragraph.text}</strong> : paragraph.text}
                      </p>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <div className="frame-story-collaboration-invite-view">
                <label className="frame-story-collaboration-switch">
                  <span><strong>允许亲友参与共创</strong><small>共创内容由你确认后再采纳</small></span>
                  <input type="checkbox" checked={acceptingContributions} onChange={(event) => setAcceptingContributions(event.target.checked)} />
                  <i aria-hidden="true" />
                </label>
                <section className="frame-story-share-qr frame-story-collaboration-invite" aria-label="共创邀请二维码">
                  <QrCode size={136} weight="duotone" aria-hidden="true" />
                  <div><strong>扫码补充这段故事</strong><p>亲友可以语音或文字留下他记得的细节</p></div>
                </section>
              </div>
            )}
            {collaborationView !== 'detail' ? (
              <footer>
                <button type="button" onClick={() => setCollaborationView((current) => current === 'invite' ? 'list' : 'invite')}>
                  {collaborationView === 'invite' ? <HandHeart size={24} weight="fill" /> : <QrCode size={24} weight="bold" />}
                  {collaborationView === 'invite' ? '查看全部共创' : '邀请亲友共创'}
                </button>
                <button className="is-primary" type="button" onClick={() => { setWorkbenchPanel(null); showToast('共创设置已保存') }}>完成</button>
              </footer>
            ) : null}
          </aside>
        </div>
      ) : null}
      {isNewVariant && workbenchPanel === 'voice-edit' ? (
        <div className="frame-story-workbench-backdrop" role="presentation" onClick={() => setWorkbenchPanel(null)}>
          <section className="frame-story-voice-edit" role="dialog" aria-modal="true" aria-labelledby="frame-story-voice-title" onClick={(event) => event.stopPropagation()}>
            <button className="frame-story-voice-edit__close" type="button" aria-label="关闭语音修改" onClick={() => setWorkbenchPanel(null)}><X size={28} weight="bold" /></button>
            <span>语音修改</span>
            <h2 id="frame-story-voice-title">{voiceEditStage === 'recording' ? '正在听你说……' : voiceEditStage === 'review' ? '这样修改可以吗？' : '想怎么改，直接说'}</h2>
            {voiceEditStage === 'review' ? (
              <blockquote>“把开头写得更像我亲口讲，再补一句当时的心情。”</blockquote>
            ) : <p>{voiceEditStage === 'recording' ? '说完后点一下停止' : '可以说“这段简短一点”或“语气更像我”'}</p>}
            <button
              className={`frame-story-voice-record${voiceEditStage === 'recording' ? ' is-recording' : ''}`}
              type="button"
              aria-label={voiceEditStage === 'recording' ? '停止语音修改录音' : '开始语音修改录音'}
              onClick={() => setVoiceEditStage((current) => current === 'ready' ? 'recording' : current === 'recording' ? 'review' : 'recording')}
            >
              {voiceEditStage === 'recording' ? <Stop size={38} weight="fill" /> : <Microphone size={40} weight="fill" />}
            </button>
            {voiceEditStage === 'review' ? (
              <div className="frame-story-voice-edit__actions">
                <button type="button" onClick={() => setVoiceEditStage('recording')}>重新说</button>
                <button className="is-primary" type="button" onClick={applyVoiceEdit}>应用修改</button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
      {isNewVariant && workbenchPanel === 'discard' ? (
        <div className="frame-story-workbench-backdrop" role="presentation" onClick={() => setWorkbenchPanel(null)}>
          <section className="frame-story-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-story-discard-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="frame-story-discard-title">放弃这次修改？</h2>
            <p>还没有保存的文字和图片修改都会丢失。</p>
            <div><button type="button" onClick={() => setWorkbenchPanel(null)}>继续编辑</button><button className="is-danger" type="button" onClick={discardEditing}>放弃修改</button></div>
          </section>
        </div>
      ) : null}
      {playbackMode === 'demo' ? (
        <div className={`frame-story-player frame-story-player--${playbackMode}`} role="dialog" aria-modal="true" aria-label={playbackMode === 'demo' ? '故事播放模式' : '读给我听'}>
          <div className="frame-story-player__stage">
            <img src={activeSegment.imageUrl} alt="" />
            <div className="frame-story-player__scrim" />
            <div className="frame-story-player__top">
              <span>{activeSegment.sceneTitle}</span>
              <div className="frame-story-player__top-actions">
                <button
                  type="button"
                  className={isMusicOn ? 'is-active' : ''}
                  aria-label={isMusicOn ? '关闭音乐' : '打开音乐'}
                  onClick={() => setIsMusicOn((value) => !value)}
                >
                  <MusicNotes size={28} weight={isMusicOn ? 'fill' : 'bold'} aria-hidden="true" />
                </button>
                <button type="button" aria-label={isPlaybackRunning ? '暂停演示' : '继续演示'} onClick={() => setIsPlaybackRunning((value) => !value)}>
                  {isPlaybackRunning ? <Pause size={28} weight="fill" aria-hidden="true" /> : <Play size={28} weight="fill" aria-hidden="true" />}
                </button>
                <button type="button" aria-label="关闭演示" onClick={closePlayback}>
                  <X size={30} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="frame-story-player__copy">
              <p>{activeSegment.text}</p>
            </div>
          </div>
        </div>
      ) : null}
      {toastMessage ? <div className="frame-settings-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </FramePageShell>
  )
}
