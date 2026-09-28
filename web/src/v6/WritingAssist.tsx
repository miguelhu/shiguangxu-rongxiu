import { useState, useRef, useLayoutEffect, TextareaHTMLAttributes, ChangeEvent } from 'react'
import { Microphone, Sparkle, ArrowCounterClockwise } from '@phosphor-icons/react'
import { resource } from './data'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>
export function polishWriting(text: string, mode: string, limit: number) {
  let out = text
    .trim()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([，。！？])\1+/g, '$1')
    .replace(/,\s*/g, '，')
    .replace(/!+/g, '！')
    .replace(/\?+/g, '？')
  if (mode === 'concise')
    out = out
      .replace(/其实呢|就是说|然后呢|怎么说呢|那个那个/g, '')
      .replace(/非常非常/g, '非常')
      .replace(/真的真的/g, '真的')
  if (mode === 'readable') out = out.replace(/([。！？])(?=[^\n”])/g, '$1\n')
  if (out && !/[。！？…：；」”]$/.test(out) && limit > 40) out += '。'
  return out.slice(0, limit)
}
export function WritingArea(props: Props) {
  const [open, setOpen] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [baseline, setBaseline] = useState('')
  const [previous, setPrevious] = useState<string | null>(null)
  const [applied, setApplied] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [spoken, setSpoken] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const value = String(props.value ?? '')
  const limit = props.maxLength && props.maxLength > 0 ? props.maxLength : 3000
  const label = props['aria-label'] || props.placeholder || '这段文字'
  useLayoutEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${Math.max(46, ref.current.scrollHeight)}px`
  }, [value])
  const write = (text: string) => {
    props.onChange?.({
      target: { value: text },
      currentTarget: { value: text },
    } as ChangeEvent<HTMLTextAreaElement>)
    ref.current?.focus()
  }
  const start = () => {
    setBaseline(value)
    setSuggestion(polishWriting(value, 'natural', limit))
    setOpen(!open)
  }
  return (
    <div className="writing-assist">
      <textarea {...props} rows={props.rows ?? 1} ref={ref} />
      <div className="writing-toolbar" aria-label="文字辅助工具">
        <button
          type="button"
          className="xiaoxu-invite"
          aria-label={`小叙帮我优化：${label}`}
          aria-expanded={open}
          onClick={start}
        >
          <img src={resource('images/xiaoxu-helper.png')} alt="小叙" />
          <span>AI 小叙</span>
        </button>
        <div className="writing-toolbar-actions">
          <button type="button" aria-label="语音转文字" title="语音转文字" aria-expanded={voiceOpen} onClick={() => setVoiceOpen(!voiceOpen)}><Microphone size={18} /></button>
          <button type="button" aria-label="AI优化" title="AI优化" onClick={start}><Sparkle size={18} /></button>
          <button type="button" aria-label="撤销优化" title="撤销优化" disabled={previous === null || value !== applied} onClick={() => {
            if (previous !== null) { write(previous); setPrevious(null) }
          }}><ArrowCounterClockwise size={18} /></button>
        </div>
      </div>
      {voiceOpen && (
        <section className="xiaoxu-panel writing-voice-panel" aria-label={`语音转文字：${label}`}>
          <div className="xiaoxu-panel-head"><b>口述成文 · 演示</b><button type="button" aria-label="收起口述成文" onClick={() => setVoiceOpen(false)}>×</button></div>
          <p className="xiaoxu-disclaimer">在这里模拟语音识别。确认后文字会放入上方输入框。</p>
          <textarea aria-label="口述识别文字" value={spoken} onChange={(e) => setSpoken(e.target.value)} placeholder="说出你想留下的话……" />
          <div className="writing-voice-actions">
            <button type="button" onClick={() => setSpoken('那天您耐心听我讲完，我一直记得这份温暖。')}>模拟口述</button>
            <button type="button" disabled={!spoken.trim()} onClick={() => { write(((value ? value + '\n' : '') + spoken.trim()).slice(0, limit)); setSpoken(''); setVoiceOpen(false) }}>放入文字</button>
          </div>
        </section>
      )}
      {open && (
        <section className="xiaoxu-panel" aria-label={`小叙建议：${label}`}>
          <div className="xiaoxu-panel-head">
            <b>保留你的心意，帮你理顺表达</b>
            <button type="button" aria-label="收起小叙建议" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <p className="xiaoxu-disclaimer">演示模式 · 本机整理，不调用线上AI，不会自动替换原文。</p>
          {!baseline.trim() ? (
            <p className="xiaoxu-prompt">
              {String(label).includes('照片')
                ? '可以先写：照片里有谁？那天有什么值得记住的小事？'
                : /祝福|短话/.test(String(label))
                  ? '可以先写一句最想说的话：谢谢您…… / 最近我…… / 希望您……'
                  : '先写下真实想到的一两句话，不必完整，我再帮你整理。'}
            </p>
          ) : (
            <>
              <div className="xiaoxu-modes">
                {[
                  ['natural', '顺一顺语句'],
                  ['concise', '更简洁'],
                  ['readable', '更好读'],
                ].map(([mode, title]) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setSuggestion(polishWriting(baseline, mode, limit))}
                  >
                    {title}
                  </button>
                ))}
              </div>
              <label className="xiaoxu-original">
                你的原文<p>{baseline}</p>
              </label>
              <label className="xiaoxu-result">
                建议文字
                <textarea
                  aria-label="小叙建议文字"
                  value={suggestion}
                  maxLength={limit}
                  onChange={(e) => setSuggestion(e.target.value)}
                />
              </label>
              {value !== baseline && (
                <p className="error">原文已修改，请收起后重新打开，保留你刚写的内容。</p>
              )}
              {suggestion === baseline && (
                <p className="xiaoxu-disclaimer">
                  这段话已经很自然，可以保留原文，也可以调整上面的建议。
                </p>
              )}
              <button
                type="button"
                className="btn xiaoxu-apply"
                disabled={!suggestion.trim() || value !== baseline || suggestion === value}
                onClick={() => {
                  setPrevious(value)
                  setApplied(suggestion)
                  write(suggestion)
                  setOpen(false)
                }}
              >
                采用这版文字
              </button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
