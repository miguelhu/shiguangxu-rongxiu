import { useState, useRef, TextareaHTMLAttributes, ChangeEvent } from 'react'
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
  const ref = useRef<HTMLTextAreaElement>(null)
  const value = String(props.value ?? '')
  const limit = props.maxLength && props.maxLength > 0 ? props.maxLength : 3000
  const label = props['aria-label'] || props.placeholder || '这段文字'
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
      <textarea {...props} ref={ref} />
      <div className="writing-inline-tools" aria-label="文字辅助工具">
        <button type="button" aria-label="语音转文字" title="语音转文字" onClick={() => ref.current?.focus()}>🎙</button>
        <button type="button" aria-label="AI优化" title="AI优化" onClick={start}>✦</button>
        <button type="button" aria-label="撤销" title="撤销" disabled={previous === null} onClick={() => {
          if (previous !== null) { write(previous); setPrevious(null) }
        }}>↶</button>
      </div>
      <div className="xiaoxu-perch">
        <button
          type="button"
          className="xiaoxu-invite"
          aria-label={`小叙帮我优化：${label}`}
          aria-expanded={open}
          onClick={start}
        >
          <img src={resource('images/xiaoxu-helper.png')} alt="小叙" />
          <span>
            <b>AI 小叙</b>
            <small>{value.trim() ? '需要帮忙优化吗？' : '不知道怎么写？我陪你。'}</small>
          </span>
        </button>
        {previous !== null && value === applied && (
          <button
            type="button"
            className="xiaoxu-undo"
            onClick={() => {
              write(previous)
              setPrevious(null)
            }}
          >
            撤销优化
          </button>
        )}
      </div>
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
