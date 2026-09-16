import { useState } from 'react'
export function Dictation({ onText, label }: { onText: (s: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [words, setWords] = useState('')
  return (
    <div className="dictation">
      <button type="button" className="text-button" onClick={() => setOpen(!open)}>
        🎙 {label.includes('故事') ? '口述故事' : '说一说'} · 口述成文
      </button>
      {open && (
        <div className="xiaoxu-panel">
          <b>口述成文 · 演示</b>
          <p className="helper">
            此处演示语音识别后的文字。确认后只保留文字，不把口述音频放入相框。
          </p>
          <label>
            识别文字
            <textarea
              aria-label="口述识别文字"
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="在这里模拟口述识别出的原话"
            />
          </label>
          <button
            className="text-button"
            onClick={() =>
              setWords(
                label.includes('照片')
                  ? '那天我们站在一起拍下这张照片，现在想起仍然觉得温暖。'
                  : '那次我遇到了困难，您耐心听我说完，陪我一点一点找到办法。',
              )
            }
          >
            模拟一次口述识别
          </button>
          <button
            className="btn"
            disabled={!words.trim()}
            onClick={() => {
              onText(words)
              setOpen(false)
            }}
          >
            确认文字，再请小叙整理
          </button>
        </div>
      )}
    </div>
  )
}
