import {
  CaretLeft,
  Keyboard,
  Microphone,
  PaperPlaneTilt,
  Plus,
  ClipboardText,
  X,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { getActiveScenarioId, withScenario } from '../content/scenarioStore'
import { getMockElderProfile, getMockMemoryThemes } from '../mock'
import { type FrameAiChatMessage, type FrameAiMemoirContext, requestFrameCompanionReply, requestFrameCompanionTts } from '../services/frameAiClient'
import type { ElderProfile, MemoryTheme, MemoryTopic } from '../types'
import { getFrameVariant, withFrameVariant } from '../utils/frameVariant'

type AiRoleId = 'companion' | 'doctor' | 'tcm' | 'guide'

type AiRole = {
  id: AiRoleId
  name: string
  label: string
  avatar: string
  bubbleAvatar: string
  portrait: string
  intro: string
  promise: string
  safety: string
  suggestions: string[]
}

type FrameAiDisplayMessage = FrameAiChatMessage & {
  textAfterImage?: string
}

type DoctorDemoRecordTab = 'diet' | 'daily' | 'report'

type MemoirEntrySource = 'home' | 'overview' | 'stage' | 'topic'

type DoctorDemoScene = {
  suggestion: string
  userText: string
  imageUrl?: string
  imageAlt?: string
  reply: string
  archiveTab: DoctorDemoRecordTab
  archiveLabel: string
  storageType: string
  recordValue?: string
  recordNote?: string
}

const AI_ROLES: AiRole[] = [
  {
    id: 'companion',
    name: '小叙',
    label: 'AI小叙',
    avatar: '/perf/frame/elder-ai-role-avatar-companion-v1.png',
    bubbleAvatar: '/elder-ai-boy-blue-tshirt-head-avatar-v1.png',
    portrait: '/perf/frame/elder-ai-role-avatar-companion-v1.png',
    intro: '陪您聊家常、看照片、整理回忆。',
    promise: '生活、心情、照片',
    safety: '如果聊到身体不舒服，我会提醒您切换到 小叙医生 或联系家人。',
    suggestions: ['陪我聊聊天', '看看今天的照片', '帮我想一句回复', '聊聊以前的事'],
  },
  {
    id: 'doctor',
    name: '小叙医生',
    label: '小叙医生',
    avatar: '/perf/frame/elder-ai-role-avatar-doctor-v1.png',
    bubbleAvatar: '/elder-ai-boy-doctor-head-avatar-v1.png',
    portrait: '/perf/frame/elder-ai-role-avatar-doctor-v1.png',
    intro: '帮您梳理用药、报告和不舒服的地方。',
    promise: '用药、报告、血压',
    safety: '我不能替代线下医生。胸痛、呼吸困难、摔倒等情况请马上呼叫家人或急救。',
    suggestions: ['记录今天血压', '我拍了体检报告', '帮我看化验单', '拍下今天吃了什么'],
  },
  {
    id: 'tcm',
    name: '小叙中医',
    label: '小叙中医',
    avatar: '/perf/frame/elder-ai-role-avatar-tcm-v1.png',
    bubbleAvatar: '/elder-ai-boy-tcm-head-avatar-v1.png',
    portrait: '/perf/frame/elder-ai-role-avatar-tcm-v1.png',
    intro: '陪您聊体质调养、饮食起居和节气养生。',
    promise: '体质、食疗、节气',
    safety: '我会用温和的方式给您做日常调养建议，身体明显不适时仍要及时联系医生。',
    suggestions: ['最近睡不好', '我适合喝什么汤', '今天怎么养胃', '这个季节怎么调养'],
  },
  {
    id: 'guide',
    name: '小叙导游',
    label: '小叙导游',
    avatar: '/perf/frame/elder-ai-role-avatar-guide-v1.png',
    bubbleAvatar: '/elder-ai-boy-guide-head-avatar-v1.png',
    portrait: '/perf/frame/elder-ai-role-avatar-guide-v1.png',
    intro: '帮您查天气、排路线、把行程说清楚。',
    promise: '旅行、路线、天气',
    safety: '出行前我会提醒您看天气、带药，也可以让家人一起确认安排。',
    suggestions: ['下周去苏州玩三天', '帮我规划轻松路线', '老人出行要注意什么', '行程发给家人看看'],
  },
]

const AMA_AI_ROLES: AiRole[] = AI_ROLES
  .filter((role) => role.id === 'companion' || role.id === 'doctor')
  .map((role) => role.id === 'companion'
    ? {
        ...role,
        intro: '使用疑问、烟火日常、旅行爱好……啥事儿都能问，你的全能小孙子。',
        promise: '日常、旅行、回忆',
        suggestions: ['陪我聊聊天', '看看今天的照片', '帮我规划轻松旅行', '聊聊以前的事'],
      }
    : {
        ...role,
        intro: '西医问诊、中医调养、报告留存……你的健康小助手。',
        promise: '问诊、调养、报告',
        suggestions: ['最近睡不好', '今天怎么调养', '我适合喝什么汤', '饭后总是胃胀'],
      })

const AMA_CHULONG_TEA_INTERACTION_IMAGE = '/scenario/ama-letter/interactions/interaction-10.png'
const AMA_COMPANION_DEMO_MESSAGES: FrameAiDisplayMessage[] = [
  {
    id: 'ama-companion-demo-ai-1',
    speaker: 'ai',
    text: '阿嬷，早上好呀！昨晚楚远从深圳发来一张照片，说他想念咱家那口白粥和无米粿啦。我很好奇，您做的无米粿是不是有什么独家秘方呀？能让他这么念念不忘。',
    imageUrl: '/scenario/ama-letter/interactions/interaction-13.png',
    imageAlt: '楚远深夜加班时吃白粥和潮汕家常菜',
  },
  {
    id: 'ama-companion-demo-elder-1',
    speaker: 'elder',
    text: '哎呀，这傻孩子！外头卖的那些，哪有自家工夫做出来的香。其实哪有什么秘方哦，就是以前家里穷，连米都买不起，才去弄番薯粉来做皮……我刚嫁给他爷爷那会儿，一年到头，也就是逢年过节才能吃上这口热乎的。',
  },
  {
    id: 'ama-companion-demo-ai-2',
    speaker: 'ai',
    text: '哇，原来这“无米”两个字里，藏的是以前的辛苦岁月呀。但我想，生活再艰辛，也一定有让人怀念至今的暖光吧。您和爷爷刚结婚那会儿，他有没有做过什么让您记忆深刻的事儿？',
  },
  {
    id: 'ama-companion-demo-elder-2',
    speaker: 'elder',
    text: '他呀，笨嘴笨舌的，是个闷葫芦。那时候做海事辛苦，他跟着搭红头船往外跑，赚了点块洋全攥在手里，自己一口好烟都舍不得抽。我记得……新婚第二天一早，他背着人，从贴身口袋里掏出一个红纸包，里面是一把冰糖，还夹着一只发亮的镀银顶针。他说，瞧我做裁缝缝缝补补的，戴上这个，针头就不会戳了手。那只顶针，我到现在还收在老衣柜的抽屉底下呢。',
  },
  {
    id: 'ama-companion-demo-ai-3',
    speaker: 'ai',
    text: '真是一只沉甸甸的爱心顶针！爷爷虽然嘴上不说，但心里最疼的就是您了，把他在海上打拼的铁骨柔情全化在这个细节里啦。阿嬷，今天这段故事可太珍贵了，小叙为您准备了一张照片做礼物。',
    imageUrl: '/scenario/ama-letter/ai/companion-thimble-gift.png',
    imageAlt: '来自小叙的拾光礼物，冰糖、银顶针和旧照片放在老宅桌上',
    textAfterImage: '今天阳光很好，要不要出去走走？我在家等您，回来咱们再聊。',
  },
  {
    id: 'ama-companion-demo-elder-3',
    speaker: 'elder',
    text: '好，好，也发给孩子们看看，让他们也知道木生年轻时候也是个疼人的好汉……',
  },
]
const COMPANION_TTS_VOICE_ID = 'zh_female_peiqi_uranus_bigtts'
const DOCTOR_DEMO_STORAGE_KEY = 'frameDoctorDemoRecord'

const DOCTOR_DEMO_SCENES: Record<string, DoctorDemoScene> = {
  记录今天血压: {
    suggestion: '记录今天血压',
    userText: '我刚量了血压，高压 148，低压 86，心率 78。',
    reply: '已记录。今天 148/86，比昨天的 136/82 高一些，心率还平稳。先坐下休息 5 分钟再量一次，今天晚饭少盐、别喝浓茶。我不能替代医生诊断，连续偏高就让家人陪您问医生。',
    archiveTab: 'daily',
    archiveLabel: '已归档身体数据',
    storageType: 'bloodPressure',
    recordValue: '148/86',
    recordNote: '比昨天 136/82 高一些，先休息后复测。',
  },
  我拍了体检报告: {
    suggestion: '我拍了体检报告',
    userText: '我拍了这张体检报告，帮我看看血脂有没有问题。',
    imageUrl: '/health/demo/lipid-report.webp',
    imageAlt: '血脂体检报告',
    reply: '已存到健康报告。血脂还是偏高，但比上次年度体检略稳一点；低密度脂蛋白 3.82 还要继续盯。最近少油炸和甜点，饭后慢走，复查时间我也帮您记着。',
    archiveTab: 'report',
    archiveLabel: '已归档健康报告',
    storageType: 'report',
  },
  帮我看化验单: {
    suggestion: '帮我看化验单',
    userText: '这是刚拍的血脂化验单，帮我用简单的话讲讲。',
    imageUrl: '/health/demo/lipid-lab-sheet.webp',
    imageAlt: '血脂化验单',
    reply: '我用简单话说：这次化验单还是血脂偏高，甘油三酯比 5 月那次略高一点。不是急症，但要连续管理。我已归档，今晚先清淡点，明天把单子给家人看一下。',
    archiveTab: 'report',
    archiveLabel: '已归档健康报告',
    storageType: 'lab',
  },
  拍下今天吃了什么: {
    suggestion: '拍下今天吃了什么',
    userText: '我拍下了今天晚餐，帮我看看能不能放心吃。',
    imageUrl: '/perf/health-diet/home-meal.jpg',
    imageAlt: '今天的餐食',
    reply: '已记录晚餐。中午有蒸鱼和米饭，晚上这餐再补一点蔬菜和蛋白，今天营养基本够了。米饭别加太多，酱汁少蘸，血脂管理会更稳。',
    archiveTab: 'diet',
    archiveLabel: '已归档饮食记录',
    storageType: 'diet',
  },
}

const DOCTOR_UPLOAD_OPTIONS = [
  {
    id: 'report',
    sceneKey: '我拍了体检报告',
    name: '体检报告.jpg',
  },
  {
    id: 'lab',
    sceneKey: '帮我看化验单',
    name: '化验单.jpg',
  },
  {
    id: 'diet',
    sceneKey: '拍下今天吃了什么',
    name: '饭菜.jpg',
  },
]

const MEMOIR_QUICK_PROMPTS = [
  { label: '换个问法', text: '你换个问法问我吧。' },
  { label: '先记到这', text: '先讲到这里，你帮我记下来。' },
  { label: '跳过这个', text: '这个我先不聊了，换一个吧。' },
  { label: '念给我听', text: '你把刚刚记的内容念给我听。' },
]

function getRoleFromSearch(value: string | null, isAmaScenario = false): AiRoleId {
  if (isAmaScenario && value === 'tcm') return 'doctor'
  if (isAmaScenario && value === 'guide') return 'companion'
  if (value === 'doctor' || value === 'tcm' || value === 'guide' || value === 'companion') return value
  return 'companion'
}

function getMemoirEntrySource(value: string | null): MemoirEntrySource {
  if (value === 'overview' || value === 'stage' || value === 'topic') return value
  return 'home'
}

function getDefaultMemoirTopic(themes: MemoryTheme[]) {
  const theme = themes[0]
  const topic = theme?.topics[0]
  return theme && topic ? { theme, topic } : undefined
}

function getMemoirTopicById(themes: MemoryTheme[], topicId: string | null) {
  if (!topicId) return undefined
  for (const theme of themes) {
    const topic = theme.topics.find((item) => item.id === topicId)
    if (topic) return { theme, topic }
  }
  return getDefaultMemoirTopic(themes)
}

function getPreferredAddress(profile: ElderProfile) {
  if (profile.name === '叶淑柔') return '淑柔阿嫲'
  if (profile.relation) return `${profile.name}${profile.relation}`
  return profile.name
}

function getAgeText(profile: ElderProfile) {
  const currentYear = new Date().getFullYear()
  return profile.birthYear ? `${currentYear - profile.birthYear}岁左右` : '年龄未指定'
}

function getFamilySummary(profile: ElderProfile) {
  if (profile.name === '叶淑柔') {
    return '丈夫郑木生早年去了南洋；谢南枝是她在曼谷的妹妹；郑楚远、郑楚龙、郑楚卿是子女辈，林素琴是儿媳，郑晓伟是孙辈。'
  }
  return `${profile.relation || '家人'}是家里晚辈常用的称呼，聊天时要尊重、亲近，不要乱换称呼。`
}

function buildMemoirContext(
  profile: ElderProfile,
  theme: MemoryTheme,
  topic: MemoryTopic,
  entrySource: MemoirEntrySource = 'topic',
): FrameAiMemoirContext {
  return {
    elderName: profile.name,
    preferredAddress: getPreferredAddress(profile),
    ageText: getAgeText(profile),
    familySummary: getFamilySummary(profile),
    entrySource,
    stageTitle: theme.title,
    themeId: theme.id,
    themeTitle: theme.title,
    topicId: topic.id,
    topicTitle: topic.title,
    topicSummary: topic.summary,
    topicStatus: topic.status,
    shadowImageUrl: topic.photoUrl,
    shadowImageLabel: topic.photoLabel || topic.title,
    interviewStage: 'collecting',
  }
}

function buildHomeCompanionContext(profile: ElderProfile, themes: MemoryTheme[]): FrameAiMemoirContext | undefined {
  const fallback = getDefaultMemoirTopic(themes)
  if (!fallback) return undefined
  return {
    ...buildMemoirContext(profile, fallback.theme, fallback.topic, 'home'),
    shadowImageUrl: AMA_CHULONG_TEA_INTERACTION_IMAGE,
    shadowImageLabel: '楚龙带回来的凤凰单丛',
  }
}

function buildTopicInterviewGreeting(context: FrameAiMemoirContext) {
  const address = context.preferredAddress || context.elderName
  const topicTitle = context.topicTitle.replace(/^[^：:]{2,8}[：:]/, '')
  const themePrompt = context.themeTitle ? `这属于“${context.themeTitle}”这一章。` : ''

  if (/名字/.test(topicTitle)) {
    return `${address}，我们先从您的名字聊起。家里当年为什么给您取这个名字，您还记得是谁起的吗？`
  }
  if (/出生/.test(topicTitle)) {
    return `${address}，我们先聊您出生那会儿的事。您听长辈说过，那天家里是什么情形吗？`
  }
  if (/祖辈|家谱|家族/.test(topicTitle)) {
    return `${address}，我们从家里的老辈人说起。您最先想起哪位长辈，或者哪句家里的老话？`
  }
  if (/老家|老屋|老厝/.test(topicTitle)) {
    return `${address}，我们先回到老厝。您闭眼想一下，最先浮出来的是天井、茶桌，还是哪个声音？`
  }
  if (/父母|阿爹|阿妈/.test(topicTitle)) {
    return `${address}，这次我们聊父母的身影。您最先想到阿爹或阿妈的哪个动作？`
  }
  if (/兄弟姐妹/.test(topicTitle)) {
    return `${address}，我们聊聊兄弟姐妹。小时候家里最热闹的一幕，您还记得吗？`
  }
  if (/玩伴|同学|朋友|邻里/.test(topicTitle)) {
    return `${address}，我们从一个人开始。那时候最常陪您玩的，是谁？您们常去哪里？`
  }
  if (/第一张照片|年轻旧照|家族照片/.test(topicTitle)) {
    return `${address}，我们就从这张照片聊起。您看着它，最先想起照片外的哪件小事？`
  }
  if (/上学|老师|求学/.test(topicTitle)) {
    return `${address}，我们聊上学那段日子。您还记得学校路上、老师，或教室里的一个画面吗？`
  }
  if (/离家|远行|旅行/.test(topicTitle)) {
    return `${address}，我们聊第一次走远。那次出门前，您最舍不得家里的什么？`
  }
  if (/青春|心事|相识|恋爱|婚礼|伴侣|木生/.test(topicTitle)) {
    return `${address}，我们慢慢聊年轻时候。想到木生阿公，您最先想起他的哪句话，或哪一个动作？`
  }
  if (/工作|职业|岗位|本领|拿手|时代|荣誉|机会/.test(topicTitle)) {
    return `${address}，我们聊那段靠双手过日子的年月。您最先想到的是哪一份活，或哪一次撑过去的难处？`
  }
  if (/子女|孩子|孙辈/.test(topicTitle)) {
    return `${address}，我们聊孩子们。您最先想到哪个孩子小时候的一件事？`
  }
  if (/饭桌|菜|茶|粿|节庆|物件|戏|书|手艺|缝补/.test(topicTitle)) {
    return `${address}，我们从日常里的一个东西聊起。想到“${topicTitle}”，您最先闻到、看到的是什么？`
  }
  if (/身体|退休|重新学习|相框|愿望/.test(topicTitle)) {
    return `${address}，我们聊现在的新日子。说到“${topicTitle}”，最近哪一件小事让您印象最深？`
  }
  if (/家训|祝福|未来|口头禅|想问想答/.test(topicTitle)) {
    return `${address}，这次我们聊想留给晚辈的话。关于“${topicTitle}”，您最想先嘱咐哪一句？`
  }

  if (context.topicSummary) {
    return `${address}，${themePrompt}我们先聊“${topicTitle}”。您不用讲完整，先说一个最先想到的画面就好。`
  }

  const greetings: Record<string, string> = {
    'theme-childhood': `${address}，我们先不急着讲完整故事。您小时候的老厝里，最先浮出来的是哪一个声音或味道？`,
    'theme-family': `${address}，聊年轻时候，我们从一个小物件开始吧。那时有没有一件东西，您一直记到现在？`,
    'theme-work': `${address}，那几年日子不容易。您先想一个最常做的动作：挑担、缝衣，还是早起去市场？`,
    'theme-neighborhood': `${address}，我们先从一封信或一个等消息的下午说起。那时候您最怕听见、也最盼听见什么？`,
    'theme-daily': `${address}，日常里的味道最容易把人带回去。您先说说家里最常冒热气的是哪一口？`,
    'theme-new-life': `${address}，后来有了相框，家里热闹了一点。您第一次觉得它有用，是哪一个瞬间？`,
    'theme-heart': `${address}，这章我们慢慢聊想留给晚辈的话。您先想一句家里人常说、您也认的老话，好吗？`,
  }
  return greetings[context.themeId] || `${address}，我们先聊“${context.themeTitle}”。不用讲完整，您先说一个最先想到的画面就好。`
}

function buildMemoirGreeting(context: FrameAiMemoirContext, source: MemoirEntrySource) {
  const address = context.preferredAddress || context.elderName
  if (source === 'topic' || source === 'stage' || source === 'overview') return buildTopicInterviewGreeting(context)
  if (context.themeTitle.includes('童年') || context.topicTitle.includes('工夫茶')) {
    return `${address}，前几天家里给您带了好茶。我发现您特别喜欢喝茶，这是从小时候就有的吗？`
  }
  return `${address}，我在。今天先从一个小回忆开始聊，您脑子里最先浮出来的画面是什么？`
}

function buildRoleMessages(
  role: AiRole,
  memoirContext?: FrameAiMemoirContext,
  options?: { entrySource?: MemoirEntrySource; interviewMode?: boolean; fixedAmaCompanionDemo?: boolean },
) {
  if (role.id === 'companion' && options?.fixedAmaCompanionDemo) {
    return AMA_COMPANION_DEMO_MESSAGES.map((message) => ({ ...message }))
  }

  if (role.id === 'companion' && memoirContext) {
    const entrySource = options?.entrySource || 'home'
    const useShadowImage = options?.interviewMode || entrySource === 'home'
    return [
      {
        id: 'memory-ai-greeting',
        speaker: 'ai' as const,
        text: buildMemoirGreeting(memoirContext, entrySource),
        imageUrl: useShadowImage ? memoirContext.shadowImageUrl : undefined,
        imageAlt: useShadowImage ? memoirContext.shadowImageLabel || '回忆引导照片' : undefined,
      },
    ]
  }

  if (role.id === 'doctor') {
    return [
      { id: 'doctor-ai-1', speaker: 'ai' as const, text: '您好，我是小叙医生。您可以直接说哪里不舒服，也可以点加号上传报告、化验单或饭菜照片。' },
    ]
  }

  if (role.id === 'tcm') {
    return [
      { id: 'tcm-ai-1', speaker: 'ai' as const, text: '您好，我是小叙中医。您可以跟我说最近睡眠、胃口、怕冷怕热这些变化。' },
      { id: 'tcm-user-1', speaker: 'elder' as const, text: '我这两天晚上睡得浅，早上起来有点没精神。' },
      { id: 'tcm-ai-2', speaker: 'ai' as const, text: '我先帮您记下来。今晚可以少喝浓茶，睡前用温水泡脚十来分钟；如果持续明显不舒服，也请和家人说一声。' },
    ]
  }

  if (role.id === 'guide') {
    return [
      { id: 'guide-ai-1', speaker: 'ai' as const, text: '您好，我是小叙导游。您想去哪儿、玩几天，直接跟我说，我来帮您排一个轻松行程。' },
      { id: 'guide-user-1', speaker: 'elder' as const, text: '下周我想去苏州玩三天，请帮我规划一下行程。' },
      { id: 'guide-ai-2', speaker: 'ai' as const, text: buildGuideTripPlanReply() },
    ]
  }

  return [
    {
      id: 'companion-ai-greeting',
      speaker: 'ai' as const,
      text: '我在呢。今天我们先从一个小回忆开始聊，您不用讲得完整，就从脑子里最先冒出来的一个画面说起，我帮您慢慢整理成回忆录。',
    },
  ]
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function saveDoctorDemoRecord(scene: DoctorDemoScene) {
  window.sessionStorage.setItem(DOCTOR_DEMO_STORAGE_KEY, JSON.stringify({
    type: scene.storageType,
    tab: scene.archiveTab,
    savedAt: Date.now(),
    value: scene.recordValue,
    note: scene.recordNote,
  }))
}

function parseBloodPressureText(text: string) {
  if (!/血压|高压|低压|收缩压|舒张压|心率|\d{2,3}\s*\/\s*\d{2,3}/.test(text)) return null

  const slashMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/)
  const systolicMatch = text.match(/(?:高压|收缩压)[^\d]{0,8}(\d{2,3})/)
  const diastolicMatch = text.match(/(?:低压|舒张压)[^\d]{0,8}(\d{2,3})/)
  const heartRateMatch = text.match(/(?:心率|脉搏)[^\d]{0,8}(\d{2,3})/)
  const systolic = slashMatch ? Number(slashMatch[1]) : systolicMatch ? Number(systolicMatch[1]) : undefined
  const diastolic = slashMatch ? Number(slashMatch[2]) : diastolicMatch ? Number(diastolicMatch[1]) : undefined
  const heartRate = heartRateMatch ? Number(heartRateMatch[1]) : undefined

  if (!systolic || !diastolic) return { hasIntent: true as const }
  if (systolic < 60 || systolic > 240 || diastolic < 35 || diastolic > 150) return { hasIntent: true as const }
  return { hasIntent: true as const, systolic, diastolic, heartRate }
}

function buildBloodPressureScene(inputText: string): DoctorDemoScene {
  const parsed = parseBloodPressureText(inputText)
  if (!parsed?.systolic || !parsed.diastolic) {
    return {
      suggestion: '记录今天血压',
      userText: inputText,
      reply: '我先帮您记着。阿嫲，您把高压和低压分别说一下就好，比如“高压148，低压86”。如果有头晕、胸闷，也一起告诉我。',
      archiveTab: 'daily',
      archiveLabel: '已归档身体数据',
      storageType: 'bloodPressure',
    }
  }

  const { systolic, diastolic, heartRate } = parsed
  const value = `${systolic}/${diastolic}`
  let trend = '比昨天的 136/82 接近一些'
  let advice = '今天继续清淡、少盐，饭后慢走就好。'
  let note = '接近昨天记录，继续观察。'

  if (systolic >= 180 || diastolic >= 110) {
    trend = '明显高过昨天的 136/82'
    advice = '请先坐下休息，马上告诉家人；如果有胸闷、头晕、气短，要尽快联系医生或急救。'
    note = '明显偏高，请联系家人并尽快复测。'
  } else if (systolic >= 140 || diastolic >= 90) {
    trend = '比昨天的 136/82 高一些'
    advice = '先休息 5 分钟再量一次，今天少盐、别喝浓茶；连续偏高就让家人陪您问医生。'
    note = '比昨天 136/82 高一些，先休息后复测。'
  } else if (systolic >= 130 || diastolic >= 80) {
    trend = '和昨天的 136/82 差不多，还是略偏高'
    advice = '今天注意少盐，晚点再复测一次，连续几天记录下来更好判断。'
    note = '略偏高，建议晚些时候复测。'
  } else {
    trend = '比昨天的 136/82 更稳一点'
    advice = '先保持现在的节奏，继续按时吃药和记录。'
    note = '比昨天更稳，继续记录。'
  }

  const heartRateText = heartRate ? `，心率 ${heartRate} 也记录好了` : ''
  return {
    suggestion: '记录今天血压',
    userText: inputText,
    reply: `已记录。今天 ${value}${heartRateText}，${trend}。${advice}我不能替代医生诊断，身体不舒服要及时告诉家人。`,
    archiveTab: 'daily',
    archiveLabel: '已归档身体数据',
    storageType: 'bloodPressure',
    recordValue: value,
    recordNote: note,
  }
}

function buildGuideTripPlanReply(inputText = '下周我想去苏州玩三天，请帮我规划一下行程。') {
  const destination = /杭州/.test(inputText) ? '杭州' : /上海/.test(inputText) ? '上海' : /广州/.test(inputText) ? '广州' : '苏州'
  const dayText = inputText.match(/([一二三四五六七八九十两\d]+)\s*天/)?.[1] || '三'
  const normalizedDays = dayText === '3' ? '三' : dayText
  const weather = destination === '苏州'
    ? '下周苏州偏热，白天大约 30-34℃，多云到阵雨都有可能，建议上午逛园林，下午安排室内或回酒店休息。'
    : `下周${destination}我先按夏季出行来安排：白天偏热，可能有阵雨，路线尽量放慢、少暴晒。`

  return `可以，我先按“下周去${destination}玩${normalizedDays}天”给您排一个轻松版。

天气：${weather}

整体思路：少赶路、少爬楼，上午看重点景点，中午休息，傍晚再慢慢走。

第一天：到达后先去酒店放行李，下午逛平江路，走累了就找茶馆坐坐；晚上吃清淡一点的苏帮菜。

第二天：上午去拙政园或留园，二选一就好；中午回酒店午休；下午去苏州博物馆或附近老街，雨天也不怕。

第三天：上午去山塘街慢慢走，买点点心带回去；午饭后预留回程时间，不把行程排太满。

出门提醒：带常用药、雨伞、水杯和薄外套；每天步行控制在 6000 步以内更稳。

您还可以继续问我：酒店住哪里方便、每一天怎么坐车、带老人要避开什么景点。`
}

function getTypingDelay(text: string) {
  if (/[\n。！？]/.test(text)) return 28
  return 24
}

type FrameAiChatPageProps = {
  interviewMode?: boolean
}

function FrameAiChatPage({ interviewMode = false }: FrameAiChatPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const memoryTopicId = searchParams.get('topic')
  const stageId = searchParams.get('stage')
  const isNewVariant = getFrameVariant(searchParams) === 'new'
  const isAmaScenario = getActiveScenarioId() === 'ama-letter'
  const availableRoles = isAmaScenario ? AMA_AI_ROLES : AI_ROLES
  const entrySource = interviewMode ? getMemoirEntrySource(searchParams.get('entry')) : (memoryTopicId ? 'topic' : 'home')
  const initialRole = interviewMode ? 'companion' : getRoleFromSearch(searchParams.get('role'), isAmaScenario)
  const fixedAmaCompanionDemo = isAmaScenario && !interviewMode && !memoryTopicId
  const themes = useMemo(() => getMockMemoryThemes(), [])
  const elderProfile = useMemo(() => getMockElderProfile(), [])
  const selectedMemoirTopic = useMemo(
    () => getMemoirTopicById(themes, memoryTopicId),
    [memoryTopicId, themes],
  )
  const selectedTheme = selectedMemoirTopic?.theme
  const selectedTopic = selectedMemoirTopic?.topic
  const memoirContext = useMemo(
    () => {
      if (selectedTheme && selectedTopic) return buildMemoirContext(elderProfile, selectedTheme, selectedTopic, entrySource)
      return buildHomeCompanionContext(elderProfile, themes)
    },
    [
      elderProfile.birthYear,
      elderProfile.name,
      elderProfile.relation,
      entrySource,
      themes,
      selectedTheme?.id,
      selectedTheme?.title,
      selectedTopic?.id,
      selectedTopic?.photoLabel,
      selectedTopic?.photoUrl,
      selectedTopic?.status,
      selectedTopic?.summary,
      selectedTopic?.title,
    ],
  )
  const [activeRoleId, setActiveRoleId] = useState<AiRoleId>(initialRole)
  const [draft, setDraft] = useState('')
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('keyboard')
  const [isAiReplying, setIsAiReplying] = useState(false)
  const [isDoctorUploadOpen, setIsDoctorUploadOpen] = useState(false)
  const [selectedDoctorUploadKey, setSelectedDoctorUploadKey] = useState<string | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<HTMLDivElement>(null)
  const skipNextMessageScrollRef = useRef(false)
  const sessionIdRef = useRef(createMessageId('frame-ai-session'))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioPlaybackTokenRef = useRef(0)
  const typingTimerRef = useRef<number | null>(null)
  const replyRequestIdRef = useRef(0)
  const thinkingStartedAtRef = useRef(0)
  const activeRole = availableRoles.find((role) => role.id === activeRoleId) || availableRoles[0]
  const [messages, setMessages] = useState<FrameAiDisplayMessage[]>(() => buildRoleMessages(activeRole, memoirContext, { entrySource, interviewMode, fixedAmaCompanionDemo }))

  const stopCompanionAudio = () => {
    audioPlaybackTokenRef.current += 1
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop()
      } catch {
        // The source may already be stopped.
      }
      audioSourceRef.current = null
    }
    const currentAudio = audioRef.current
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.removeAttribute('src')
      currentAudio.load()
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    audioRef.current = null
  }

  const getCompanionAudioContext = () => {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') return audioContextRef.current
    audioContextRef.current = new AudioContextClass()
    return audioContextRef.current
  }

  const unlockCompanionAudio = () => {
    const audioContext = getCompanionAudioContext()
    if (!audioContext) return
    void audioContext.resume().catch(() => undefined)
    try {
      const source = audioContext.createBufferSource()
      source.buffer = audioContext.createBuffer(1, 1, 22050)
      source.connect(audioContext.destination)
      source.start(0)
    } catch {
      // Some browsers reject ultra-short buffers; the later resume call is still useful.
    }
  }

  const clearTypingTimer = () => {
    if (typingTimerRef.current === null) return
    window.clearTimeout(typingTimerRef.current)
    typingTimerRef.current = null
  }

  const playCompanionAudioBytes = async (bytes: Uint8Array, mimeType = 'audio/mpeg') => {
    const playbackToken = audioPlaybackTokenRef.current + 1
    stopCompanionAudio()
    audioPlaybackTokenRef.current = playbackToken
    const audioBytes = new Uint8Array(bytes.byteLength)
    audioBytes.set(bytes)
    const audioContext = getCompanionAudioContext()
    if (audioContext) {
      try {
        await audioContext.resume()
        if (audioPlaybackTokenRef.current !== playbackToken) return false
        const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer.slice(0))
        if (audioPlaybackTokenRef.current !== playbackToken) return false
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        source.onended = () => {
          if (audioSourceRef.current === source) audioSourceRef.current = null
        }
        if (audioPlaybackTokenRef.current !== playbackToken) return false
        audioSourceRef.current = source
        source.start(0)
        return true
      } catch (error) {
        console.warn('[frame-ai-tts] web audio playback failed', error)
      }
    }

    if (typeof window.Audio !== 'function') return false
    const audioUrl = URL.createObjectURL(new Blob([audioBytes], { type: mimeType }))
    audioUrlRef.current = audioUrl
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio
    audio.src = audioUrl
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null
    }
    audio.onerror = () => {
      console.warn('[frame-ai-tts] audio element error', audio.error?.code, audio.error?.message)
      if (audioRef.current === audio) audioRef.current = null
    }
    try {
      await audio.play()
      if (audioPlaybackTokenRef.current !== playbackToken) {
        audio.pause()
        return false
      }
      return true
    } catch (error) {
      console.warn('[frame-ai-tts] playback blocked or failed', error)
      return false
    }
  }

  const appendAiMessageWithTyping = (message: FrameAiDisplayMessage, options?: { loadingMs?: number }) => {
    clearTypingTimer()
    const fullText = message.text
    const messageId = message.id || createMessageId('ai')
    setIsAiReplying(true)
    if (!thinkingStartedAtRef.current) thinkingStartedAtRef.current = Date.now()
    const loadingMs = options?.loadingMs ?? 2000
    const elapsedMs = Date.now() - thinkingStartedAtRef.current
    const remainingLoadingMs = Math.max(0, loadingMs - elapsedMs)

    setMessages((current) => {
      const existing = current.some((item) => item.id === messageId)
      if (existing) return current.map((item) => (
        item.id === messageId ? {
          ...item,
          ...message,
          text: '小叙正在想一想...',
          isThinking: true,
          isTyping: false,
        } : item
      ))
      return [...current, {
        ...message,
        id: messageId,
        text: '小叙正在想一想...',
        isThinking: true,
        isTyping: false,
      }]
    })

    typingTimerRef.current = window.setTimeout(() => {
      let index = 0
      setMessages((current) => current.map((item) => (
        item.id === messageId ? {
          ...item,
          ...message,
          id: messageId,
          text: '',
          isThinking: false,
          isTyping: true,
        } : item
      )))

      const tick = () => {
        index += 1
        setMessages((current) => current.map((item) => (
          item.id === messageId ? { ...item, text: fullText.slice(0, index) } : item
        )))

        if (index < fullText.length) {
          const currentChar = fullText[index - 1] || ''
          const delay = '，。！？；、'.includes(currentChar) ? 90 : getTypingDelay(currentChar)
          typingTimerRef.current = window.setTimeout(tick, delay)
          return
        }

        typingTimerRef.current = null
        thinkingStartedAtRef.current = 0
        setMessages((current) => current.map((item) => (
          item.id === messageId ? { ...item, isTyping: false, isThinking: false } : item
        )))
        setIsAiReplying(false)
      }

      tick()
    }, remainingLoadingMs)
  }

  const playCompanionTts = async (text: string) => {
    const tts = await requestFrameCompanionTts({
      text,
      sessionId: sessionIdRef.current,
      voiceId: COMPANION_TTS_VOICE_ID,
    })
    if (tts.status !== 'ok' || !tts.audioBase64) return false

    const binary = window.atob(tts.audioBase64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return playCompanionAudioBytes(bytes, tts.mimeType || 'audio/mpeg')
  }

  useEffect(() => {
    if (inputMode === 'keyboard') {
      textInputRef.current?.focus()
    }
  }, [inputMode])

  useEffect(() => {
    setActiveRoleId(interviewMode ? 'companion' : getRoleFromSearch(searchParams.get('role'), isAmaScenario))
  }, [interviewMode, isAmaScenario, searchParams])

  useEffect(() => {
    skipNextMessageScrollRef.current = true
    setMessages(buildRoleMessages(activeRole, memoirContext, { entrySource, interviewMode, fixedAmaCompanionDemo }))
    setDraft('')
    setIsAiReplying(false)
    setIsDoctorUploadOpen(false)
    setSelectedDoctorUploadKey(null)
    clearTypingTimer()
    stopCompanionAudio()
    thinkingStartedAtRef.current = 0
  }, [activeRole.id, entrySource, fixedAmaCompanionDemo, interviewMode, memoirContext])

  useEffect(() => {
    const isInitialAmaDemo = fixedAmaCompanionDemo
      && messages.length === AMA_COMPANION_DEMO_MESSAGES.length
      && messages[0]?.id === AMA_COMPANION_DEMO_MESSAGES[0]?.id
    if (isInitialAmaDemo) {
      skipNextMessageScrollRef.current = false
      streamRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    if (skipNextMessageScrollRef.current) {
      skipNextMessageScrollRef.current = false
      streamRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [fixedAmaCompanionDemo, messages, isAiReplying])

  useEffect(() => () => {
    clearTypingTimer()
    stopCompanionAudio()
  }, [])

  const submitPrompt = async (text = draft) => {
    const nextText = text.trim()
    if (!nextText || isAiReplying) return
    stopCompanionAudio()
    unlockCompanionAudio()
    const elderMessage: FrameAiChatMessage = {
      id: createMessageId('elder'),
      speaker: 'elder',
      text: nextText,
    }
    const nextMessages = [...messages, elderMessage]
    setMessages(nextMessages)
    setDraft('')
    setIsDoctorUploadOpen(false)
    setSelectedDoctorUploadKey(null)

    if (activeRole.id !== 'companion') {
      const bloodPressure = activeRole.id === 'doctor' ? parseBloodPressureText(nextText) : null
      if (bloodPressure?.hasIntent) {
        const scene = buildBloodPressureScene(nextText)
        if (scene.recordValue) saveDoctorDemoRecord(scene)
        appendAiMessageWithTyping({
          id: createMessageId('doctor-blood-pressure-ai'),
          speaker: 'ai',
          text: scene.reply,
          archiveAction: scene.recordValue ? {
            label: scene.archiveLabel,
            tab: scene.archiveTab,
          } : undefined,
        }, { loadingMs: 1100 })
        return
      }
      const isWellnessQuestion = activeRole.id === 'doctor' && /睡|调养|汤|胃|食/.test(nextText)
      const roleReply = activeRole.id === 'doctor'
        ? isWellnessQuestion
          ? '我先帮您记下来。日常调养要结合睡眠、胃口和正在吃的药慢慢看，先从清淡饮食、规律作息做起；如果不舒服持续或加重，也要及时告诉家人并联系医生。'
          : '我先帮您把重点记下来，再用大字一步一步说明。情况紧急时，请直接点一键SOS。'
        : activeRole.id === 'tcm'
          ? '我先帮您记下来，再结合起居、饮食和季节给您一个温和的调养建议。'
          : buildGuideTripPlanReply(nextText)
      appendAiMessageWithTyping({
        id: createMessageId('ai'),
        speaker: 'ai',
        text: roleReply,
      })
      return
    }

    const requestId = replyRequestIdRef.current + 1
    replyRequestIdRef.current = requestId
    const aiMessageId = createMessageId('ai')
    setIsAiReplying(true)
    thinkingStartedAtRef.current = Date.now()
    setMessages((current) => [...current, {
      id: aiMessageId,
      speaker: 'ai',
      text: '小叙正在想一想...',
      isThinking: true,
    }])
    const aiReply = await requestFrameCompanionReply({
      latestUserMessage: nextText,
      messages: nextMessages,
      scenario: getActiveScenarioId(),
      sessionId: sessionIdRef.current,
      memoirContext,
    })
    if (replyRequestIdRef.current !== requestId) return
    appendAiMessageWithTyping({
      id: aiMessageId,
      speaker: 'ai',
      text: aiReply.reply,
    })
    void playCompanionTts(aiReply.reply)
  }

  const runDoctorDemoScene = (suggestion: string) => {
    const scene = DOCTOR_DEMO_SCENES[suggestion]
    if (!scene || isAiReplying) return false
    setIsDoctorUploadOpen(false)
    setSelectedDoctorUploadKey(null)

    const elderMessage: FrameAiChatMessage = {
      id: createMessageId('doctor-demo-elder'),
      speaker: 'elder',
      text: scene.imageUrl ? '' : scene.userText,
      imageUrl: scene.imageUrl,
      imageAlt: scene.imageAlt,
    }
    const aiMessage: FrameAiChatMessage = {
      id: createMessageId('doctor-demo-ai'),
      speaker: 'ai',
      text: scene.reply,
      archiveAction: {
        label: scene.archiveLabel,
        tab: scene.archiveTab,
      },
    }

    saveDoctorDemoRecord(scene)
    setMessages((current) => [...current, elderMessage])
    setDraft('')
    appendAiMessageWithTyping(aiMessage, { loadingMs: 900 })
    return true
  }

  const interviewBackPath = stageId ? `/frame/river/stage/${stageId}` : '/frame/river'
  const backPath = interviewMode ? interviewBackPath : memoryTopicId ? '/frame/river' : '/frame'
  const interviewTitle = selectedTheme?.title || memoirContext?.themeTitle || '回忆录'
  const interviewTopic = selectedTopic?.title || memoirContext?.topicTitle || '慢慢聊一段往事'
  const interviewHeading = `${interviewTitle} - ${interviewTopic}`
  const introTitle = interviewMode ? '小叙陪您聊回忆' : activeRole.label
  const introText = interviewMode ? '说完一段再发送，我会慢慢帮您记下来。' : activeRole.intro

  return (
    <FramePageShell className="frame-ai frame-ai-chat-page frame-light-nav-page" mode={mode}>
      <main className={`frame-ai-chat-layout${interviewMode ? ' frame-ai-chat-layout--interview' : ''}`} aria-label={interviewMode ? '回忆录访谈' : 'AI聊天详情页'}>
        {!interviewMode ? (
          <aside className="frame-ai-chat-sidebar" aria-label="AI角色和会话">
            <div className="frame-ai-sidebar-title">
              <button className="frame-ai-sidebar-back" type="button" onClick={() => navigate(isNewVariant ? withFrameVariant(backPath) : withScenario(backPath))} aria-label="返回相框">
                <CaretLeft size={38} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <section className="frame-ai-role-switch" aria-label="切换AI角色">
              <div className="frame-ai-role-scroll">
                {availableRoles.map((role) => (
                  <button
                    className={role.id === activeRoleId ? 'is-active' : ''}
                    key={role.id}
                    type="button"
                    onClick={() => {
                      stopCompanionAudio()
                      clearTypingTimer()
                      setIsDoctorUploadOpen(false)
                      setSelectedDoctorUploadKey(null)
                      setActiveRoleId(role.id)
                    }}
                  >
                    <span className={`frame-ai-role-switch__avatar frame-ai-role-avatar--${role.id}`}>
                      <img src={role.avatar} alt="" />
                    </span>
                    <span className="frame-ai-role-switch__name">{role.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        ) : null}

        <section className={`frame-ai-chat-main frame-ai-chat-main--${activeRole.id}`} aria-label={`${activeRole.label}对话区`}>
          {interviewMode ? (
            <header className="frame-ai-interview-topbar">
              <button className="frame-ai-sidebar-back" type="button" onClick={() => navigate(isNewVariant ? withFrameVariant(backPath) : withScenario(backPath))} aria-label="返回回忆录">
                <CaretLeft size={38} weight="bold" aria-hidden="true" />
              </button>
              <div>
                <h1>{interviewHeading}</h1>
              </div>
            </header>
          ) : null}
          <div className="frame-ai-message-stream" aria-label="聊天内容" ref={streamRef}>
            <div className="frame-ai-intro-card">
              <div className={`frame-ai-intro-card__portrait frame-ai-role-avatar--${activeRole.id}`}>
                <img src={activeRole.portrait} alt={`${activeRole.name}形象`} />
              </div>
              <div className="frame-ai-intro-card__copy">
                <h2>{introTitle}</h2>
                <p>{introText}</p>
              </div>
            </div>
            {messages.map((message) => (
              <article className={`frame-ai-message frame-ai-message--${message.speaker}${message.imageUrl ? ' frame-ai-message--with-image' : ''}${message.textAfterImage ? ' frame-ai-message--image-after-text' : ''}${message.isTyping ? ' is-typing' : ''}${message.isThinking ? ' is-thinking' : ''}`} key={message.id}>
                {message.imageUrl && !message.textAfterImage ? (
                  <img className="frame-ai-message__image" src={message.imageUrl} alt={message.imageAlt || '聊天图片'} />
                ) : null}
                {message.text ? <p>{message.text}</p> : null}
                {message.imageUrl && message.textAfterImage ? (
                  <img className="frame-ai-message__image" src={message.imageUrl} alt={message.imageAlt || '聊天图片'} />
                ) : null}
                {message.textAfterImage ? <p>{message.textAfterImage}</p> : null}
                {message.archiveAction ? (
                  <button
                    className="frame-ai-message__archive"
                    type="button"
                    onClick={() => navigate(withScenario(`/frame/health/records?tab=${message.archiveAction?.tab}`))}
                  >
                    <ClipboardText size={28} weight="duotone" aria-hidden="true" />
                    {message.archiveAction.label}
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          <div className="frame-ai-input-panel">
            {interviewMode ? (
              <div className="frame-ai-suggestion-row frame-ai-suggestion-row--memoir" aria-label="回忆录快捷表达">
                {MEMOIR_QUICK_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => {
                      void submitPrompt(suggestion.text)
                    }}
                    disabled={isAiReplying}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            ) : activeRole.id !== 'doctor' || isAmaScenario ? (
              <div className="frame-ai-suggestion-row" aria-label="快捷话题">
                {activeRole.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      void submitPrompt(suggestion)
                    }}
                    disabled={isAiReplying}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              className={`frame-ai-compose${isDoctorUploadOpen ? ' is-upload-open' : ''}`}
              onSubmit={(event) => {
                event.preventDefault()
                void submitPrompt()
              }}
            >
              <button type="button" aria-label={inputMode === 'voice' ? '切换键盘输入' : '切换语音输入'} onClick={() => setInputMode((current) => (current === 'voice' ? 'keyboard' : 'voice'))}>
                {inputMode === 'voice' ? <Keyboard size={34} weight="bold" aria-hidden="true" /> : <Microphone size={34} weight="bold" aria-hidden="true" />}
              </button>
              {inputMode === 'voice' ? (
                <button className="frame-ai-compose__hold" type="button" aria-label="按住说话">
                  按住说话
                </button>
              ) : (
                <input ref={textInputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="请输入对话内容" disabled={isAiReplying} />
              )}
              <button
                type={interviewMode ? 'submit' : 'button'}
                aria-label={interviewMode ? '发送' : activeRole.id === 'doctor' ? '上传文件' : '添加图片或附件'}
                onClick={() => {
                  if (interviewMode) return
                  if (activeRole.id === 'doctor') {
                    setIsDoctorUploadOpen(true)
                    setSelectedDoctorUploadKey(null)
                  }
                }}
                disabled={isAiReplying}
              >
                {interviewMode ? <PaperPlaneTilt size={34} weight="bold" aria-hidden="true" /> : <Plus size={34} weight="bold" aria-hidden="true" />}
              </button>
            </form>
          </div>

        </section>

        {activeRole.id === 'doctor' && isDoctorUploadOpen ? (
          <div className="frame-ai-upload-dialog-backdrop" role="presentation">
            <section className="frame-ai-upload-dialog" role="dialog" aria-modal="true" aria-label="上传文件">
              <header className="frame-ai-upload-dialog__header">
                <h3>上传文件</h3>
                <button
                  type="button"
                  aria-label="取消上传"
                  onClick={() => {
                    setIsDoctorUploadOpen(false)
                    setSelectedDoctorUploadKey(null)
                  }}
                >
                  <X size={30} weight="bold" aria-hidden="true" />
                </button>
              </header>

              <div className="frame-ai-upload-files" aria-label="可选择的图片文件">
                {DOCTOR_UPLOAD_OPTIONS.map((option) => {
                  const scene = DOCTOR_DEMO_SCENES[option.sceneKey]
                  const isSelected = selectedDoctorUploadKey === option.sceneKey
                  return (
                    <button
                      className={isSelected ? 'is-selected' : ''}
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedDoctorUploadKey(option.sceneKey)}
                    >
                      <img src={scene.imageUrl} alt="" />
                      <strong>{option.name}</strong>
                    </button>
                  )
                })}
              </div>

              <footer className="frame-ai-upload-dialog__actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsDoctorUploadOpen(false)
                    setSelectedDoctorUploadKey(null)
                  }}
                >
                  取消
                </button>
                <button
                  className="is-primary"
                  type="button"
                  disabled={!selectedDoctorUploadKey || isAiReplying}
                  onClick={() => {
                    if (selectedDoctorUploadKey) runDoctorDemoScene(selectedDoctorUploadKey)
                  }}
                >
                  上传
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </main>
    </FramePageShell>
  )
}

export function FrameAiPage() {
  return <FrameAiChatPage />
}

export function FrameMemoirInterviewPage() {
  return <FrameAiChatPage interviewMode />
}
