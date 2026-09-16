import { Microphone, X } from '@phosphor-icons/react'
import { asset } from './data'

export const stickers = [
  ['sticker-thanks.png', '谢谢'],
  ['sticker-respect.png', '致敬'],
  ['sticker-happy.png', '开心每一天'],
  ['sticker-peace.png', '岁岁平安'],
  ['sticker-health.png', '福寿安康'],
  ['sticker-miss.png', '想你'],
]
export const voiceText = '谢谢您把耐心留给我们。愿您往后的日子从容、有趣，有空回来看看我们。'
export function StickerPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <section className="sticker-picker">
      <h4>用一张表情，送出祝福</h4>
      <p>来自拾光叙相框的祝福贴纸，也可以只送表情。</p>
      <div className="sticker-grid">
        {stickers.map(([file, label]) => (
          <button
            key={file}
            aria-label={`选择${label}表情`}
            aria-pressed={value === file}
            className={value === file ? 'active' : ''}
            onClick={() => onChange(value === file ? '' : file)}
          >
            <img src={asset(file)} alt={label} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {value && (
        <button className="text-link" onClick={() => onChange('')}>
          <X size={12} />
          移除表情
        </button>
      )}
    </section>
  )
}
export function VoiceCard({
  voice,
  caption = '一段想说给您听的话',
  onPlay,
}: {
  voice: string
  caption?: string
  onPlay?: () => void
}) {
  if (!voice) return null
  return (
    <div className="voice-card">
      <strong>
        <Microphone size={18} />
        {caption}
      </strong>
      <audio controls preload="metadata" src={asset(voice)} onPlay={onPlay} />
      <small>演示配音 · 点击可听见这段祝福</small>
    </div>
  )
}
