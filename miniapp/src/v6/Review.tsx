import { ReactNode, useRef } from 'react'
import { useDemo } from './context'
import { Page } from './data'
import { collected } from './workflow'
import { orderedPhotos, orderedStories } from './model'
import { Button, Note } from './ui'
import { PhotoImage } from './media'
import { BlockCard } from './Contributor'
export function ReorderItem({
  id,
  ids,
  onOrder,
  children,
}: {
  id: string
  ids: string[]
  onOrder: (ids: string[]) => void
  children: ReactNode
}) {
  const start = useRef(0)
  const move = (target: string) => {
    const a = ids.indexOf(id),
      b = ids.indexOf(target)
    if (a < 0 || b < 0 || a === b) return
    const out = [...ids]
    out.splice(a, 1)
    out.splice(b, 0, id)
    onOrder(out)
  }
  return (
    <article
      className="reorder-item"
      data-order-id={id}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const from = e.dataTransfer.getData('text/plain')
        const a = ids.indexOf(from),
          b = ids.indexOf(id)
        if (a >= 0 && a !== b) {
          const out = [...ids]
          out.splice(a, 1)
          out.splice(b, 0, from)
          onOrder(out)
        }
      }}
    >
      <button
        className="drag-handle"
        draggable={false}
        aria-label={`拖动排序 ${id}`}
        onPointerDown={(e) => {
          e.preventDefault()
          start.current = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          {
            const target = document
              .elementFromPoint(e.clientX, e.clientY)
              ?.closest('[data-order-id]')
              ?.getAttribute('data-order-id')
            if (target) move(target)
            else if (Math.abs(e.clientY - start.current) > 30)
              move(ids[ids.indexOf(id) + (e.clientY > start.current ? 1 : -1)])
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            move(ids[ids.indexOf(id) + (e.key === 'ArrowUp' ? -1 : 1)])
          }
        }}
      >
        ⠿ <span>拖动排序</span>
      </button>
      {children}
    </article>
  )
}
export function Review({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, patch, modal } = useDemo()
  const type =
    page === 'review_stories' ? 'stories' : page === 'review_wishes' ? 'wishes' : 'photos'
  const blocks = collected(c.id, s)
  const photos = orderedPhotos(c.id, { ...s, previewing: true }, blocks)
  const stories = orderedStories(c.id, { ...s, previewing: true }, blocks)
  const mutate = (v: Partial<typeof s>) =>
    patch((old) => ({
      ...v,
      letter: { ...old.letter, confirmed: false },
      review: { ...old.review, [type]: false, previewed: false },
    }))
  return (
    <div className="phone-body">
      <div className="eyebrow">
        整理成礼 · {type === 'photos' ? '照片' : type === 'stories' ? '故事' : '祝福'}
      </div>
      <h2>
        {type === 'photos'
          ? '让照片，顺着时光长河铺开。'
          : type === 'stories'
            ? '每个故事，都值得被听见。'
            : '把每一句祝福，认真留下。'}
      </h2>
      {type !== 'wishes' && (
        <p className="helper">
          这些内容已经按时间初步排好了。不确定日期的放在后面，你也可以拖动调整。
        </p>
      )}
      {type === 'photos' &&
        photos.map((p) => (
          <ReorderItem
            key={p.id}
            id={p.id}
            ids={photos.map((p) => p.id)}
            onOrder={(photoOrder) => mutate({ photoOrder })}
          >
            <PhotoImage
              path={p.path}
              alt={p.caption}
              className="review-photo"
              onClick={() => modal(p.caption, <PhotoImage path={p.path} alt={p.caption} />)}
            />
            <p>{p.caption}</p>
            <small>{p.date || '时间未记录'}</small>
            <button
              className="text-button exclude-control"
              onClick={() =>
                mutate({
                  excludedPhotos: [
                    ...s.excludedPhotos,
                    ...blocks.filter((b) => b.photoIds.includes(p.id)).map((b) => b.id),
                  ],
                })
              }
            >
              这张先不放进成品
            </button>
          </ReorderItem>
        ))}
      {type === 'photos' && !!s.excludedPhotos.length && (
        <button className="text-button" onClick={() => mutate({ excludedPhotos: [] })}>
          恢复移除的照片
        </button>
      )}
      {type === 'stories' &&
        stories.map((b) => (
          <ReorderItem
            key={b.id}
            id={b.id}
            ids={stories.map((b) => b.id)}
            onOrder={(storyOrder) => mutate({ storyOrder })}
          >
            <BlockCard block={b} />
            <button className="text-button exclude-control" onClick={() => mutate({ excludedStories: [...(s.excludedStories || []), b.id] })}>
              这篇先不放进成品
            </button>
          </ReorderItem>
        ))}
      {type === 'stories' && !!s.excludedStories?.length && (
        <button className="text-button" onClick={() => mutate({ excludedStories: [] })}>恢复移除的故事</button>
      )}
      {type === 'wishes' && (
        <>
          <h3>文字与语音祝福</h3>
          {blocks
            .filter((b) => b.kind === 'wish')
            .map((b) => (
              <div className="task-card" key={b.id}>
                <BlockCard block={b} />
                <button
                  className="text-button"
                  onClick={() => mutate({ excludedWishes: [...(s.excludedWishes || []), b.id] })}
                >
                  从成品排除
                </button>
              </div>
            ))}
          {!!s.excludedWishes?.length && (
            <button className="text-button" onClick={() => mutate({ excludedWishes: [] })}>
              恢复排除的祝福
            </button>
          )}
        </>
      )}
      <Note>这里只调整最终送出的内容，原投稿会继续保留。</Note>
      <Button
        onClick={() => {
          patch((old) => ({ review: { ...old.review, [type]: true, previewed: false } }))
          go(
            type === 'photos' ? 'review_stories' : type === 'stories' ? 'review_wishes' : 'letter',
          )
        }}
      >
        {type === 'photos'
          ? '照片检查完成，去看故事'
          : type === 'stories'
            ? '故事已确认，去看祝福'
            : '祝福检查完成，整理总信'}
      </Button>
      <button className="text-button" onClick={() => go('workspace')}>
        返回成品准备
      </button>
    </div>
  )
}
