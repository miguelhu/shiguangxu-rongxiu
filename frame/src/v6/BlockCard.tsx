import { useDemo } from './context'
import { type Block, photosFor } from './model'
import { AudioPlayer, PhotoImage } from './media'
import { Avatar } from './ui'

export function BlockCard({ block, small = false }: { block: Block; small?: boolean }) {
  const { state } = useDemo()
  const media = Object.entries(state.cases).flatMap(([id, s]) =>
    photosFor(id as keyof typeof state.cases, s),
  )
  return <article className={`content-card ${small ? 'compact' : ''}`}>
    <div className="byline"><Avatar name={block.author} /><span><b>{block.author}</b><small>{block.relation} · {{ impression: '印象', photo: '时光碎片', story: '故事', wish: '祝福' }[block.kind]}</small></span></div>
    {block.title && <h3>{block.title}</h3>}
    {!!block.tags.length && <div className="chips">{block.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
    {block.kind !== 'story' && !!block.photoIds.length && <div className="attached-photos">{block.photoIds.map((id) => {
      const photo = media.find((item) => item.id === id)
      return photo && <div key={id}><PhotoImage path={photo.path} alt={photo.caption} />{photo.date && <small>{photo.date}</small>}</div>
    })}</div>}
    {block.body && <p className={small ? 'clamp' : ''}>{block.body}</p>}
    {block.audio && <AudioPlayer path={block.audio} text={block.audioText} />}
  </article>
}
