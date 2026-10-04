import { CaretRight, MagicWand, Microphone, PaperPlaneTilt, Play, TrashSimple, X } from '@phosphor-icons/react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { getMockFrameStickers } from '../mock'
import type { FrameStickerScene } from '../types'
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS, RecordingDialog } from './RecordingDialog'

const ELDER_AI_REPLIES = [
  '真好，看到你们这样，我心里很高兴。',
  '画得真好，太婆看了心里暖暖的。',
  '你们惦记着我，我都记在心里了。',
]
const COMING_SOON_MESSAGE = '即将上线'
const INITIAL_STICKER_IMAGE_COUNT = 6

function createPrototypeVoiceUrl(durationSeconds: number) {
  const sampleRate = 8000
  const seconds = Math.max(1, durationSeconds)
  const sampleCount = sampleRate * seconds
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, sampleCount * 2, true)

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

interface FrameElderReplyPanelProps {
  className?: string
  scene?: FrameStickerScene
  onScroll?: () => void
  onTouchMove?: () => void
  onWheel?: () => void
}

export const FrameElderReplyPanel = forwardRef<HTMLElement, FrameElderReplyPanelProps>(function FrameElderReplyPanel(
  { className, scene = 'family', onScroll, onTouchMove, onWheel },
  ref,
) {
  const stickers = useMemo(() => getMockFrameStickers(scene).slice(0, 12), [scene])
  const [selectedStickerId, setSelectedStickerId] = useState('')
  const [visibleStickerImageCount, setVisibleStickerImageCount] = useState(Math.min(INITIAL_STICKER_IMAGE_COUNT, stickers.length))
  const [replyInput, setReplyInput] = useState('')
  const [voiceDraft, setVoiceDraft] = useState<{ durationSeconds: number; url: string } | null>(null)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const recordingStartedAtRef = useRef(0)
  const selectedSticker = stickers.find((sticker) => sticker.id === selectedStickerId)

  useEffect(() => {
    setVisibleStickerImageCount(Math.min(INITIAL_STICKER_IMAGE_COUNT, stickers.length))

    if (stickers.length <= INITIAL_STICKER_IMAGE_COUNT) return undefined

    const timer = window.setTimeout(() => {
      setVisibleStickerImageCount(stickers.length)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [stickers.length, scene])

  useEffect(() => {
    if (!recordingStartedAt) return undefined
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.floor((Date.now() - recordingStartedAt) / 1000))))
    }, 220)
    return () => window.clearInterval(timer)
  }, [recordingStartedAt])

  const startVoiceRecording = () => {
    setRecording(true)
    setRecordingSeconds(0)
    recordingStartedAtRef.current = Date.now()
    setRecordingStartedAt(recordingStartedAtRef.current)
  }

  const stopVoiceRecording = (shouldKeep: boolean) => {
    const rawDurationSeconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
    const durationSeconds = Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, rawDurationSeconds))
    setRecording(false)
    setRecordingStartedAt(null)
    if (shouldKeep) {
      setReplyInput('')
      setSelectedStickerId('')
      setVoiceDraft({ durationSeconds, url: createPrototypeVoiceUrl(durationSeconds) })
    }
  }

  const pickStickerReply = (stickerId: string) => {
    setSelectedStickerId(stickerId)
    setVoiceDraft(null)
    setReplyInput('')
  }

  const pickAiReply = (reply: string) => {
    setVoiceDraft(null)
    setSelectedStickerId('')
    setReplyInput(reply)
    setAiDialogOpen(false)
  }

  const handleReplyInputChange = (value: string) => {
    setReplyInput(value)
  }

  const showComingSoon = () => {
    setToastMessage(COMING_SOON_MESSAGE)
  }

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const resolvedClassName = className ? `frame-elder-reply-panel ${className}` : 'frame-elder-reply-panel'

  return (
    <>
      <aside
        className={resolvedClassName}
        aria-label="老人回复方式"
        ref={ref}
        onScroll={onScroll}
        onTouchMove={onTouchMove}
        onWheel={onWheel}
      >
        <section className="frame-elder-send-section" aria-label="发送回应">
          <section className="frame-elder-sticker-section frame-elder-sticker-card" aria-label="贴纸回复">
            <h3>贴纸回复</h3>
            <div className="frame-elder-sticker-grid">
              {stickers.map((sticker, index) => {
                const shouldLoadStickerImage = index < visibleStickerImageCount

                return (
                  <button
                    className={selectedStickerId === sticker.id ? 'frame-elder-sticker frame-elder-sticker--selected' : 'frame-elder-sticker'}
                    key={sticker.id}
                    type="button"
                    aria-pressed={selectedStickerId === sticker.id}
                    aria-label={`用${sticker.label}贴纸回复`}
                    onClick={() => pickStickerReply(sticker.id)}
                  >
                    {shouldLoadStickerImage ? (
                      <img
                        src={sticker.src}
                        alt=""
                        aria-hidden="true"
                        loading={index < INITIAL_STICKER_IMAGE_COUNT ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ) : (
                      <i className="frame-elder-sticker__placeholder" aria-hidden="true" />
                    )}
                    <span>{sticker.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
          <div className="frame-elder-send-heading">
            <h2 className="frame-elder-section-title">发送回复</h2>
            <button
              className="frame-elder-ai-polish-button"
              type="button"
              aria-haspopup="dialog"
              onClick={() => setAiDialogOpen(true)}
            >
              AI建议
            </button>
          </div>
          {voiceDraft ? (
            <div className="thread-voice-draft elder-voice-draft" aria-label="已录制语音">
              <span className="thread-voice-draft__icon" aria-hidden="true">
                <Microphone size={20} weight="fill" />
              </span>
              <div>
                <strong>已录制语音</strong>
                <small>{voiceDraft.durationSeconds} 秒</small>
              </div>
              <button type="button" aria-label="播放语音" onClick={showComingSoon}>
                <Play size={12} weight="fill" aria-hidden="true" />
              </button>
              <button type="button" aria-label="删除语音" onClick={() => setVoiceDraft(null)}>
                <TrashSimple size={14} weight="regular" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className={selectedSticker ? 'frame-elder-reply-input frame-elder-reply-input--sticker-ready' : 'frame-elder-reply-input'}>
              {selectedSticker ? (
                <span className="frame-elder-reply-input__sticker" aria-label={`已选择${selectedSticker.label}贴纸`}>
                  <img src={selectedSticker.src} alt="" aria-hidden="true" loading="eager" decoding="async" />
                  <button type="button" aria-label="移除贴纸" onClick={() => setSelectedStickerId('')}>
                    <X size={18} weight="bold" aria-hidden="true" />
                  </button>
                </span>
              ) : null}
              <textarea
                rows={2}
                value={replyInput}
                placeholder={selectedSticker ? '也可以再补一句话' : '请输入要回复的内容'}
                onChange={(event) => handleReplyInputChange(event.target.value)}
              />
            </label>
          )}

          <div className={voiceDraft ? 'frame-elder-send-actions frame-elder-send-actions--voice-ready' : 'frame-elder-send-actions'}>
            {!voiceDraft ? (
              <button className="frame-elder-voice-entry" type="button" aria-label="语音回复" onClick={startVoiceRecording}>
                <Microphone size={22} weight="bold" aria-hidden="true" />
                点击说话
              </button>
            ) : null}
            <button className="frame-elder-send-button" type="button" disabled={!replyInput.trim() && !voiceDraft && !selectedSticker} onClick={showComingSoon}>
              <PaperPlaneTilt size={23} weight="fill" aria-hidden="true" />
              发送
            </button>
          </div>
        </section>
      </aside>

      {recording ? (
        <RecordingDialog
          recordingSeconds={recordingSeconds}
          onCancel={() => stopVoiceRecording(false)}
          onConfirm={() => stopVoiceRecording(true)}
        />
      ) : null}

      {aiDialogOpen ? (
        <div className="frame-elder-ai-dialog-backdrop" role="presentation" onClick={() => setAiDialogOpen(false)}>
          <section
            className="frame-elder-ai-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="AI建议"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="frame-elder-ai-dialog__heading">
              <MagicWand size={28} weight="duotone" aria-hidden="true" />
              <h2>AI建议</h2>
              <button type="button" aria-label="关闭AI建议" onClick={() => setAiDialogOpen(false)}>
                <X size={24} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="frame-elder-ai-dialog__list" aria-label="可选择的回复建议">
              {ELDER_AI_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => pickAiReply(reply)}
                >
                  <span>{reply}</span>
                  <CaretRight size={22} weight="bold" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {toastMessage ? <div className="frame-settings-toast" role="status" aria-live="polite">{toastMessage}</div> : null}
    </>
  )
})
