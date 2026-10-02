import { useDemo } from './context'
import { datasets } from './data'
import { available } from './model'

export function WritingExample() {
  const { c, s } = useDemo()
  const shared = s.host.boardMode === 'open'
    ? available(c.id, s).find(b => b.kind === 'story' && b.peerPreviewAllowed === true && b.body && b.authorId !== s.draft.authorId && !['greeting', 'onsite'].includes(b.source))
    : undefined
  const demo = datasets[c.id].stories[0]
  const author = shared?.author || datasets[c.id].authors.find(a => a.id === demo?.authorId)?.name
  const text = shared?.body || demo?.body
  if (!text) return null
  return <aside className="before-writing-example">
    <b>{shared ? `${author}这样写过` : `${author}的写法 · 示例`}</b>
    <p>{text.length > 100 ? text.slice(0, 100) + '…' : text}</p>
  </aside>
}
