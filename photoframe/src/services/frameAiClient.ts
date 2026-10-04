import type { ScenarioId } from '../content/scenarioTypes'

export type FrameAiSpeaker = 'ai' | 'elder'

export type FrameAiChatMessage = {
  id: string
  speaker: FrameAiSpeaker
  text: string
  imageUrl?: string
  imageAlt?: string
  isThinking?: boolean
  isTyping?: boolean
  archiveAction?: {
    label: string
    tab: 'diet' | 'daily' | 'report'
  }
}

export type FrameAiChatResponse = {
  reply: string
  safetyLevel: 'normal' | 'careful' | 'urgent'
  suggestedFollowups: string[]
}

export type FrameAiTtsResponse = {
  status: 'ok' | 'timeout' | 'unavailable' | 'error'
  audioBase64: string
  mimeType: string
}

export type FrameAiMemoirContext = {
  elderName: string
  preferredAddress: string
  ageText: string
  familySummary: string
  entrySource?: 'home' | 'overview' | 'stage' | 'topic'
  stageTitle?: string
  themeId: string
  themeTitle: string
  topicId: string
  topicTitle: string
  topicSummary: string
  topicStatus: string
  shadowImageUrl?: string
  shadowImageLabel?: string
  interviewStage: 'collecting'
}

const AI_SERVICE_URL = (import.meta.env.VITE_AI_SERVICE_URL as string | undefined)
  || (import.meta.env.PROD ? 'https://shiguangxu-d7gh7wl4ebbed4d6f-1318382287.ap-shanghai.app.tcloudbase.com' : undefined)

export function isFrameAiServiceConfigured() {
  return Boolean(AI_SERVICE_URL?.trim())
}

function getFallbackReply(text: string) {
  if (/换个问法|换一种问|不会说|不知道怎么说|想不起来|提醒我/.test(text)) {
    return '好，那我换个更容易答的。您先别想整件事，就想一个画面：那时旁边是谁，您手里在做什么？'
  }
  if (/先记到这|先讲到这|先这样|下次再讲|累了|帮我记下来/.test(text)) {
    return '好，我先帮您记到这里。刚刚这段里，人物、地方和那个最清楚的画面，我都会先收好。'
  }
  if (/跳过|不聊这个|换一个|这个不聊|不想讲/.test(text)) {
    return '好，这个我们先放一放。那换个轻一点的说法：小时候家里最常出现的声音，您先想到哪一个？'
  }
  if (/念给我听|读给我听|刚刚记了什么|复述/.test(text)) {
    return '我先简单念给您听：这段回忆里，有人、有地方，也有一个您很在意的小细节。您听听，还要不要改？'
  }
  if (/不对|说错|改一下|不是这个|不是他|不是她/.test(text)) {
    return '好，我们改一下。您直接告诉我：是哪一个名字、时间，还是地方不对？我按您说的重新记。'
  }
  if (/私密|别给|不要给|不想让.*看|先别发/.test(text)) {
    return '好，这段我先只帮您记着，不放进给家人看的内容里。您愿意的话，我们可以换个轻一点的细节继续。'
  }
  if (/胸痛|胸口痛|呼吸困难|喘不过气|摔倒|晕倒|不想活|轻生/.test(text)) {
    return '这件事要马上重视。请您先联系家人，必要时直接呼叫急救，也可以点相框上的一键SOS。'
  }
  if (/想家|孤单|孤独|没人|难过/.test(text)) {
    return '听起来您今天心里有点空落落的。我在这儿陪您慢慢聊，您愿意跟我说说刚刚最想起谁了吗？'
  }
  if (/照片|相册|以前|过去|小时候|年轻/.test(text)) {
    return '这段回忆挺珍贵的。您慢慢说，我先帮您把素材记清楚。这里面最先冒出来的一个画面是什么？'
  }
  return '我听到了。您慢慢说，我先帮您把这段素材采下来。刚刚这件事，您最想先从哪里说起？'
}

export async function requestFrameCompanionReply(params: {
  latestUserMessage: string
  messages: FrameAiChatMessage[]
  scenario: ScenarioId
  sessionId: string
  memoirContext?: FrameAiMemoirContext
}): Promise<FrameAiChatResponse> {
  if (!AI_SERVICE_URL?.trim()) {
    return {
      reply: getFallbackReply(params.latestUserMessage),
      safetyLevel: 'normal',
      suggestedFollowups: [],
    }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 28000)

  try {
    const response = await fetch(`${AI_SERVICE_URL.replace(/\/$/, '')}/frame-ai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        role: 'companion',
        latestUserMessage: params.latestUserMessage,
        messages: params.messages.map(({ speaker, text }) => ({ speaker, text })),
        scenario: params.scenario,
        sessionId: params.sessionId,
        memoirContext: params.memoirContext,
      }),
    })

    if (!response.ok) throw new Error(`AI service failed: ${response.status}`)

    const data = await response.json() as Partial<FrameAiChatResponse>
    const reply = typeof data.reply === 'string' && data.reply.trim()
      ? data.reply.trim()
      : getFallbackReply(params.latestUserMessage)

    return {
      reply,
      safetyLevel: data.safetyLevel === 'urgent' || data.safetyLevel === 'careful' ? data.safetyLevel : 'normal',
      suggestedFollowups: Array.isArray(data.suggestedFollowups) ? data.suggestedFollowups.filter((item): item is string => typeof item === 'string') : [],
    }
  } catch {
    return {
      reply: getFallbackReply(params.latestUserMessage),
      safetyLevel: 'normal',
      suggestedFollowups: [],
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function requestFrameCompanionTts(params: {
  text: string
  sessionId: string
  voiceId?: string
}): Promise<FrameAiTtsResponse> {
  if (!AI_SERVICE_URL?.trim()) {
    return { status: 'unavailable', audioBase64: '', mimeType: 'audio/mpeg' }
  }

  const text = params.text.trim()
  if (!text) {
    return { status: 'error', audioBase64: '', mimeType: 'audio/mpeg' }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 6500)

  try {
    const response = await fetch(`${AI_SERVICE_URL.replace(/\/$/, '')}/frame-ai-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text,
        sessionId: params.sessionId,
        voiceId: params.voiceId,
      }),
    })

    if (!response.ok) throw new Error(`TTS service failed: ${response.status}`)

    const data = await response.json() as Partial<FrameAiTtsResponse>
    const status = data.status === 'ok' || data.status === 'timeout' || data.status === 'unavailable' || data.status === 'error'
      ? data.status
      : 'error'

    return {
      status,
      audioBase64: typeof data.audioBase64 === 'string' ? data.audioBase64 : '',
      mimeType: typeof data.mimeType === 'string' && data.mimeType ? data.mimeType : 'audio/mpeg',
    }
  } catch (error) {
    return {
      status: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'error',
      audioBase64: '',
      mimeType: 'audio/mpeg',
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function warmupFrameAiTts(params?: {
  sessionId?: string
  voiceId?: string
}) {
  if (!AI_SERVICE_URL?.trim()) return false

  const serviceUrl = AI_SERVICE_URL.replace(/\/$/, '')

  try {
    await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
  } catch {
    // Health warmup is best-effort. Continue to the TTS warmup because it is the
    // request that matters most for the first AI chat playback.
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(`${serviceUrl}/frame-ai-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        text: '嗯',
        sessionId: params?.sessionId || 'frame-ai-warmup',
        voiceId: params?.voiceId,
      }),
    })

    return response.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timeoutId)
  }
}
