import {
  CheckCircle,
  Microphone,
  MusicNotes,
  Pause,
  Play,
  Stop,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'
import { FRAME_V01_INTERVIEW_SCRIPT } from '../content/frameV01Interview'
import { frameV01MemoryThemes } from '../content/frameV01LifeStory'
import { getFrameVariant, withFrameVariant } from '../utils/frameVariant'
import { FrameMemoirInterviewPage } from './FrameAiPage'

const USE_LIFE_STORY_INTERVIEW = false

type InterviewPhase = 'speaking' | 'ready' | 'recording' | 'thinking'

const FIRST_RECORDING_SECONDS = 30
const BACKGROUND_MUSIC_URL = '/audio/story/warm-memory-piano.mp3?v=liborio-piano-cloud'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function NewFrameRiverInterviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mode } = useFrameDisplayMode()
  const stageId = searchParams.get('stage') || frameV01MemoryThemes[0].id
  const theme = frameV01MemoryThemes.find((item) => item.id === stageId) || frameV01MemoryThemes[0]

  const [phase, setPhase] = useState<InterviewPhase>('speaking')
  const [round, setRound] = useState(-1)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [musicOn, setMusicOn] = useState(true)
  const [hasSpoken, setHasSpoken] = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)
  const [toast, setToast] = useState('')
  const musicRef = useRef<HTMLAudioElement | null>(null)
  const voiceRef = useRef<HTMLAudioElement | null>(null)
  const displayText = round < 0
    ? FRAME_V01_INTERVIEW_SCRIPT.openingDisplay
    : FRAME_V01_INTERVIEW_SCRIPT.followups[round]?.text || FRAME_V01_INTERVIEW_SCRIPT.openingDisplay

  const backToStage = () => navigate(withFrameVariant(`/frame/river/stage/${theme.id}`), { replace: true })

  useEffect(() => {
    setPhase('speaking')
    setRound(-1)
    setElapsed(0)
    setPaused(false)
    setHasSpoken(false)
  }, [])

  useEffect(() => {
    if (phase !== 'recording' || paused) return undefined
    const timer = window.setInterval(() => setElapsed((current) => current + 5), 1000)
    return () => window.clearInterval(timer)
  }, [paused, phase])

  useEffect(() => {
    if (!musicOn) {
      musicRef.current?.pause()
      return undefined
    }
    const music = new Audio(BACKGROUND_MUSIC_URL)
    music.loop = true
    music.volume = 0.08
    musicRef.current = music
    void music.play().catch(() => undefined)
    return () => {
      music.pause()
      if (musicRef.current === music) musicRef.current = null
    }
  }, [musicOn])

  useEffect(() => {
    if (!musicRef.current || !musicOn) return
    if (phase === 'recording') {
      musicRef.current.pause()
    } else {
      void musicRef.current.play().catch(() => undefined)
    }
  }, [musicOn, phase])

  useEffect(() => {
    if (phase !== 'speaking') return undefined

    const audioConfig = round < 0
      ? FRAME_V01_INTERVIEW_SCRIPT.openingAudio
      : {
          url: FRAME_V01_INTERVIEW_SCRIPT.followups[round]?.audioUrl,
          durationMs: FRAME_V01_INTERVIEW_SCRIPT.followups[round]?.durationMs,
        }
    if (!audioConfig.url || !audioConfig.durationMs) return undefined

    const voice = new Audio(audioConfig.url)
    let fallbackTimer: number | null = null
    let tailTimer: number | null = null
    let finished = false
    const finishSpeaking = () => {
      if (finished) return
      finished = true
      setPhase((current) => current === 'speaking' ? 'ready' : current)
    }
    const finishAfterTail = () => {
      if (tailTimer !== null) window.clearTimeout(tailTimer)
      tailTimer = window.setTimeout(finishSpeaking, 650)
    }
    const useFallback = () => {
      if (fallbackTimer !== null) return
      fallbackTimer = window.setTimeout(finishAfterTail, audioConfig.durationMs + 800)
    }

    voiceRef.current?.pause()
    voiceRef.current = voice
    voice.preload = 'auto'
    voice.onended = finishAfterTail
    voice.onerror = useFallback
    void voice.play().catch(useFallback)

    return () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer)
      if (tailTimer !== null) window.clearTimeout(tailTimer)
      voice.pause()
      voice.onended = null
      voice.onerror = null
      if (voiceRef.current === voice) voiceRef.current = null
    }
  }, [phase, round])

  useEffect(() => {
    if (phase !== 'thinking') return undefined
    const timer = window.setTimeout(() => setPhase('speaking'), 2500)
    return () => window.clearTimeout(timer)
  }, [phase])

  const startRecording = () => {
    setElapsed(0)
    setPaused(false)
    setPhase('recording')
  }

  const stopRecording = () => {
    if (!hasSpoken && elapsed < FIRST_RECORDING_SECONDS) {
      setPhase('ready')
      setToast('再多讲一点，满 30 秒就能整理成故事了')
      window.setTimeout(() => setToast(''), 1800)
      return
    }
    setHasSpoken(true)
    setPaused(false)
    if (hasSpoken && round + 1 >= FRAME_V01_INTERVIEW_SCRIPT.followups.length) {
      setExitConfirm(true)
      return
    }
    setRound((current) => current + 1)
    setPhase('thinking')
  }

  const status = phase === 'speaking'
    ? { label: '说话中', className: 'is-speaking' }
    : phase === 'recording' && !paused
      ? { label: '倾听中', className: 'is-listening' }
      : phase === 'thinking'
        ? { label: '思考中', className: 'is-thinking' }
        : null
  const buttonDisabled = phase === 'speaking' || phase === 'thinking'

  return (
    <FramePageShell className={`frame-river-interview frame-river-interview--${phase}`} mode={mode}>
      <div className="frame-river-interview__ambient" aria-hidden="true">
        <span className="frame-river-interview__window-light" />
        <span className="frame-river-interview__halo" />
      </div>

      <header className="frame-river-interview__topbar">
        <button type="button" onClick={() => setExitConfirm(true)} aria-label="退出访谈">
          <X size={34} weight="bold" aria-hidden="true" />
        </button>
        <h1>{FRAME_V01_INTERVIEW_SCRIPT.question}</h1>
        <button
          className={musicOn ? 'is-active' : ''}
          type="button"
          onClick={() => setMusicOn((current) => !current)}
          aria-label={`背景音乐${musicOn ? '已打开' : '已关闭'}`}
        >
          <MusicNotes size={31} weight={musicOn ? 'fill' : 'bold'} aria-hidden="true" />
        </button>
      </header>

      <main className="frame-river-interview__stage">
        <section className="frame-river-interview__companion" aria-label="小叙访谈助手">
          <div className="frame-river-interview__avatar-wrap">
            <img src="/perf/frame/elder-ai-role-avatar-companion-v1.png" alt="小叙" />
            {status ? (
              <span className={`frame-river-interview__status ${status.className}`} role="status">
                <i aria-hidden="true"><b /><b /><b /><b /></i>
                {status.label}
              </span>
            ) : null}
          </div>
          <blockquote className="frame-river-interview__poem">
            <p>{FRAME_V01_INTERVIEW_SCRIPT.poem.verse}</p>
            <cite>— {FRAME_V01_INTERVIEW_SCRIPT.poem.attribution}</cite>
          </blockquote>
        </section>

        <section className="frame-river-interview__conversation" aria-label="访谈引导">
          <p aria-live="polite">{displayText}</p>
        </section>
      </main>

      <footer className={`frame-river-interview__controls${phase === 'recording' ? ' is-recording' : ''}`}>
        {phase === 'recording' ? <time>{formatTime(elapsed)}</time> : null}
        <div>
          {phase === 'recording' ? <i className="frame-river-interview__control-balance" aria-hidden="true" /> : null}
          <button
            className="frame-river-interview__main-control"
            type="button"
            disabled={buttonDisabled}
            onClick={phase === 'recording' ? stopRecording : startRecording}
            aria-label={phase === 'recording' ? '点击结束' : '点击说话'}
          >
            <span>{phase === 'recording' ? <Stop size={38} weight="fill" /> : <Microphone size={43} weight="fill" />}</span>
            <strong>{phase === 'recording' ? '点击结束' : '点击说话'}</strong>
          </button>
          {phase === 'recording' ? (
            <button className="frame-river-interview__secondary-control" type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? '继续录音' : '暂停录音'}>
              <span>{paused ? <Play size={29} weight="fill" /> : <Pause size={29} weight="fill" />}</span>
              <strong>{paused ? '继续' : '暂停'}</strong>
            </button>
          ) : null}
        </div>
      </footer>

      {exitConfirm ? (
        <div className="frame-river-interview__exit-backdrop" role="presentation">
          <section className="frame-river-interview__exit-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-river-interview-exit-title">
            <div className={hasSpoken ? 'is-saved' : 'is-unsaved'}>
              {hasSpoken ? <CheckCircle size={34} weight="fill" /> : <WarningCircle size={34} weight="fill" />}
              <h2 id="frame-river-interview-exit-title">{hasSpoken ? '今天先聊到这里？' : '现在退出吗？'}</h2>
              <p>{hasSpoken ? '刚才讲过的内容已经保存，结束后会整理成故事。' : '这次还没有形成故事，立即退出不会保存内容。'}</p>
            </div>
            <footer>
              <button type="button" onClick={() => setExitConfirm(false)}>{hasSpoken ? '继续聊' : '继续讲'}</button>
              <button className="is-primary" type="button" onClick={backToStage}>{hasSpoken ? '结束访谈' : '立即退出'}</button>
            </footer>
          </section>
        </div>
      ) : null}

      {toast ? <div className="frame-river-interview__toast" role="status">{toast}</div> : null}
    </FramePageShell>
  )
}

export function FrameRiverInterviewPage() {
  return USE_LIFE_STORY_INTERVIEW && getFrameVariant() === 'new'
    ? <NewFrameRiverInterviewPage />
    : <FrameMemoirInterviewPage />
}
