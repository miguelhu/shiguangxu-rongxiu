import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowsOut,
  CaretLeft,
  CaretRight,
  Pause,
  Play,
  GridFour,
  Heart,
  SpeakerHigh,
} from '@phosphor-icons/react'
import { useDemo } from './context'
import { datasets, resource, Shot } from './data'
import { available, ceremonyBlocks, orderedPhotos, photosFor, Block } from './model'
import { PhotoImage, stopMedia } from './media'
import { Avatar } from './ui'
import { BlockCard } from './Contributor'
const chapters = [
  '今天，为你相聚',
  '大家眼中的你',
  '一起走过的片段',
  '有几句话，想认真说',
  '这些心意，都给你',
  '下一程，也有人惦记',
]
export default function Frame({
  compact = false,
  received = false,
}: {
  compact?: boolean
  received?: boolean
}) {
  const { c, s, patch, modal } = useDemo()
  const [chapter, setChapter] = useState(0)
  const [index, setIndex] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)
  const [bubblePage, setBubblePage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [whole, setWhole] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const blocks = ceremonyBlocks(c.id, s)
  const photoList = orderedPhotos(c.id, s, blocks)
  const media = (!s.previewing && s.version?.photos) || photosFor(c.id, s)
  const [narrow, setNarrow] = useState(() => window.innerWidth < 700)
  useEffect(() => {
    const update = () => setNarrow(window.innerWidth < 700)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const count = compact || narrow ? 4 : 6
  const stories = blocks.filter((b) => b.kind === 'story')
  const ids = (!s.previewing && s.version?.featured) || s.featured
  const selected = ids.map((id) => stories.find((b) => b.id === id)).filter((b): b is Block => !!b)
  const featured = s.curator
    ? selected
    : selected.length
      ? selected
      : stories.slice(0, c.id === 'teacher' ? 3 : 2)
  const story = featured[storyIndex % Math.max(featured.length, 1)]
  const regular = blocks.filter((b) => b.kind === 'wish')
  const live = available(c.id, s, 'ceremony').filter((b) => b.source === 'onsite')
  const wishPool = s.onsiteVisible ? live : regular
  const wishes = [...new Map(wishPool.map((b) => [b.authorId, b])).values()]
  const visibleWishes = Array.from(
    { length: Math.min(count, wishes.length) },
    (_, i) => wishes[(bubblePage * count + i) % wishes.length],
  )
  const newItems = available(c.id, s, 'gift').filter(
    (b) => b.source === 'greeting' || b.source === 'onsite',
  )
  const host = (!s.previewing && s.version?.host) || s.host
  const shots = useMemo<Shot[]>(() => {
    const original = datasets[c.id].shots
    const expected = original.flatMap((s) => s.photoIds)
    if (expected.length === photoList.length && expected.every((id, i) => id === photoList[i].id))
      return original
    const out: Shot[] = []
    let n = 0
    while (n < photoList.length) {
      const size = Math.min(n % 3 === 0 ? 1 : 2, photoList.length - n)
      out.push({
        id: 'live-' + n,
        layout: size === 1 ? 'hero' : 'diptych',
        photoIds: photoList.slice(n, n + size).map((p) => p.id),
        seconds: size === 1 ? 6 : 7,
        caption: photoList[n].caption,
      })
      n += size
    }
    return out
  }, [c.id, photoList.map((p) => p.id + ':' + p.date).join('|')])
  const shot = shots[index % Math.max(shots.length, 1)]
  const tags = new Map<string, Set<string>>()
  blocks
    .filter((b) => b.kind === 'impression')
    .forEach((b) =>
      b.tags.forEach((t) => {
        if (!tags.has(t)) tags.set(t, new Set())
        tags.get(t)!.add(b.author)
      }),
    )
  const tagList = [...tags].sort((a, b) => b[1].size - a[1].size).slice(0, 8)
  const reset = () => {
    setChapter(0)
    setIndex(0)
    setPlaying(false)
    setWhole(false)
    setStoryIndex(0)
    setBubblePage(0)
    stopMedia()
  }
  useEffect(() => {
    reset()
  }, [c.id, received])
  useEffect(() => {
    const stop = () => setPlaying(false)
    window.addEventListener('sgx-stop-media', stop)
    const visible = () => {
      if (document.hidden) {
        setPlaying(false)
        stopMedia()
      }
    }
    document.addEventListener('visibilitychange', visible)
    return () => {
      window.removeEventListener('sgx-stop-media', stop)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])
  function selectChapter(n: number) {
    setChapter(n)
    setIndex(0)
    setStoryIndex(0)
    setPlaying(false)
    stopMedia()
  }
  function move(delta: number) {
    setPlaying(false)
    if (chapter === 2 && shots.length) {
      setIndex((i) => (i + delta + shots.length) % shots.length)
    } else selectChapter((chapter + delta + 6) % 6)
  }
  useEffect(() => {
    if (!playing) return
    const duration =
      chapter === 2
        ? (shot?.seconds || 6) * 1000
        : chapter === 3
          ? 12000
          : chapter === 4
            ? 20000
            : chapter === 1
              ? 8000
              : 6000
    const t = setTimeout(() => {
      if (chapter === 2 && index < shots.length - 1) {
        setIndex((i) => i + 1)
        return
      }
      if (chapter === 3 && storyIndex < featured.length - 1) {
        setStoryIndex((i) => i + 1)
        return
      }
      if (whole && chapter < 5) {
        setChapter((x) => x + 1)
        setIndex(0)
        setStoryIndex(0)
      } else setPlaying(false)
    }, duration)
    return () => clearTimeout(t)
  }, [playing, chapter, index, storyIndex, whole, shots.length, featured.length, shot?.seconds])
  useEffect(() => {
    if (!playing || chapter !== 4) return
    const t = setInterval(() => setBubblePage((x) => x + 1), 6000)
    return () => clearInterval(t)
  }, [playing, chapter])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector('[role="dialog"]') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      )
        return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        move(1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        move(-1)
      }
      if (e.code === 'Space' && !received) {
        e.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [chapter, index, shots.length, received])
  const openBlock = (b: Block) => {
    setPlaying(false)
    stopMedia()
    modal(`${b.author}的${b.kind === 'story' ? '回忆' : '心意'}`, <BlockCard block={b} />)
  }
  const allHearts = () => {
    setPlaying(false)
    stopMedia()
    modal('大家留下的心意', <AllHearts blocks={blocks} open={openBlock} />)
  }
  return (
    <div className={`frame-wrap ${compact ? 'compact' : ''}`}>
      <div className="role-label">
        <i />
        相框 · {host.address}
        <span>
          {received
            ? '新的心意'
            : s.version
              ? s.previewing
                ? '调整后的预览 · 尚未定稿'
                : `仪式版本 V${s.version.number}`
              : '预置案例 · 未定稿预览'}
        </span>
      </div>
      <div className="physical-frame" ref={ref}>
        <div className={`frame-screen chapter-${chapter} ${playing ? 'is-playing' : ''}`}>
          <div className="frame-brand">
            <span>⌑ 拾光叙 · {c.category}</span>
            <small>{received ? 'A LITTLE THOUGHT, AGAIN' : 'THE MOMENTS WE SHARE'}</small>
            <button
              aria-label="全屏相框"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen()
                else ref.current?.requestFullscreen()
              }}
            >
              <ArrowsOut size={18} />
            </button>
          </div>
          {received ? (
            <div className="received-frame">
              <div>
                <div className="eyebrow">新心意，来到身边</div>
                <h2>
                  又有人，
                  <br />
                  想起了你。
                </h2>
                <p>原来的礼物还在，新的问候也来了。</p>
              </div>
              <div className="received-list">
                {s.delivery === 'waiting' ? (
                  <div className="empty-card">这份心意正在等待接收</div>
                ) : newItems.length ? (
                  newItems.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        patch({ delivery: 'read' })
                        openBlock(b)
                      }}
                    >
                      <Avatar name={b.author} />
                      <span>
                        <b>{b.author}</b>
                        <p>{b.body || '送来一份新的心意'}</p>
                        {b.audio && <small>♫ 点击听声音</small>}
                      </span>
                      <Heart size={18} />
                    </button>
                  ))
                ) : (
                  <div className="empty-card">
                    把今天的近况，送给熟悉的人。<small>从小程序发送后，新心意会出现在这里。</small>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {chapter === 0 && (
                <div className="ceremony-cover">
                  <PhotoImage path={host.cover} alt={host.name} />
                  <div className="cover-shade" />
                  <div className="cover-copy">
                    <div className="eyebrow">一份礼物 · 许多人的心意</div>
                    <h2>
                      {c.id === 'anniversary'
                        ? '四十年，相伴如常。'
                        : `${host.address}，\n今天，为你相聚。`}
                    </h2>
                  <p>{c.subtitle}</p>
                  {c.id==='birthday'&&host.showAge&&host.age&&<p>{host.age}岁 · 新的喜欢，慢慢开始</p>}
                    <div className="frame-host">
                      {host.showLogo && host.logo && <PhotoImage path={host.logo} alt="主办标识" />}
                      <span>
                        {host.organizer}
                        <small>{host.date}</small>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {chapter === 1 && (
                <div className="impressions-frame">
                  <div className="impression-portrait">
                    <PhotoImage path={host.cover} alt={host.name} />
                  </div>
                  <div>
                    <div className="eyebrow">在大家眼中，你是这样的</div>
                    <h2>
                      有些印象，
                      <br />
                      一直很清晰。
                    </h2>
                    <div className="tag-cloud">
                      {tagList.map(([tag, names], i) => (
                        <button
                          style={{ fontSize: `${compact ? 15 + (i % 3) * 2 : 22 + (i % 3) * 4}px` }}
                          key={tag}
                          onClick={() => {
                            setPlaying(false)
                            modal(
                              `“${tag}” · 大家眼中的你`,
                              <div className="people-source">
                                {[...names].map((name) => (
                                  <p key={name}>
                                    <Avatar name={name} />
                                    {name}，这样形容你。
                                  </p>
                                ))}
                              </div>,
                            )
                          }}
                        >
                          {tag}
                          <small>{names.size}</small>
                        </button>
                      ))}
                    </div>
                    <p className="frame-helper">点一个词，看看是谁这样记得你。</p>
                  </div>
                </div>
              )}
              {chapter === 2 && (
                <div className="memory-stage">
                  {shot ? (
                    <>
                      <div
                        key={shot.id}
                        className={`montage ${shot.layout}`}
                        style={{ '--duration': `${shot.seconds}s` } as React.CSSProperties}
                      >
                        {shot.photoIds.map((id, i) => {
                          const p = media.find((p) => p.id === id)
                          return (
                            p && (
                              <button
                                className="memory-photo"
                                key={id}
                                style={{ '--order': i } as React.CSSProperties}
                                onClick={() => {
                                  setPlaying(false)
                                  modal(
                                    p.caption || '一起走过的片段',
                                    <div className="photo-detail">
                                      <PhotoImage path={p.path} alt={p.caption} />
                                      <p>{p.caption}</p>
                                      <small>
                                        {p.date || '没有记下日期'} · {p.source} ·{' '}
                                        {datasets[c.id].authors.find((a) => a.id === p.authorId)
                                          ?.name || s.draft.name}{' '}
                                        提供
                                      </small>
                                    </div>,
                                  )
                                }}
                              >
                                <PhotoImage path={p.path} alt={p.caption} />
                                {shot.photoIds.length > 1 && <span>{p.caption}</span>}
                              </button>
                            )
                          )
                        })}
                      </div>
                      <div className="montage-caption">
                        <span>
                          {shot.caption || media.find((p) => p.id === shot.photoIds[0])?.caption}
                        </span>
                        <small>
                          {index + 1} / {shots.length} · {photoList.length} 张照片
                        </small>
                      </div>
                    </>
                  ) : (
                    <div className="frame-empty">
                      <h2>还没有照片</h2>
                      <p>每一张后来补进来的照片，都能成为新的片段。</p>
                    </div>
                  )}
                </div>
              )}
              {chapter === 3 && (
                <div className="featured-stage">
                  {story ? (
                    <>
                      <div className="featured-photo">
                        <PhotoImage
                          path={media.find((p) => p.id === story.photoIds[0])?.path || host.cover}
                          alt={story.title}
                        />
                      </div>
                      <div className="featured-copy">
                        <div className="eyebrow">有几句话，想认真说</div>
                        <div className="byline">
                          <Avatar name={story.author} />
                          <span>
                            <b>{story.author}</b>
                            <small>{story.relation}</small>
                          </span>
                        </div>
                        <h2>{story.title}</h2>
                        <p>{story.body}</p>
                        <button onClick={() => openBlock(story)}>
                          读完这段回忆 <CaretRight size={17} />
                        </button>
                        {story.audio && (
                          <button className="voice-link" onClick={() => openBlock(story)}>
                            <SpeakerHigh size={18} />
                            听听这段声音
                          </button>
                        )}
                        <div className="featured-people">
                          {featured.map((b, i) => (
                            <button
                              key={b.id}
                              className={storyIndex === i ? 'active' : ''}
                              onClick={() => {
                                setStoryIndex(i)
                                setPlaying(false)
                                stopMedia()
                              }}
                            >
                              {b.author}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="frame-empty">
                      <h2>每一份心意，都值得读。</h2>
                      <p>还没有重点故事，可以先看看大家的祝福。</p>
                      <button onClick={() => selectChapter(4)}>去看祝福 →</button>
                    </div>
                  )}
                </div>
              )}
              {chapter === 4 && (
                <div className="blessing-stage">
                  <div className="blessing-center">
                    <small>{s.onsiteVisible ? '此刻的心意' : '很多人，记得同一个你'}</small>
                    <h2>
                      {host.address}，<br />
                      这些心意，都给你。
                    </h2>
                    <span>{wishes.length} 位参与者 · 每一份都能点开</span>
                  </div>
                  <div className="blessing-cloud">
                    {visibleWishes.map((b, i) => (
                      <button
                        key={b.id + '-' + bubblePage}
                        className={`blessing-bubble slot-${i}`}
                        style={{ '--order': i } as React.CSSProperties}
                        onClick={() => openBlock(b)}
                      >
                        <div>
                          <Avatar name={b.author} />
                          <span>
                            <b>{b.author}</b>
                            <small>{b.relation}</small>
                          </span>
                          {b.audio && <SpeakerHigh size={17} />}
                        </div>
                        {b.sticker && (
                          <img src={resource(`images/sticker-${b.sticker}.png`)} alt="祝福贴纸" />
                        )}
                        <p>{b.body || '送来一份温暖的心意'}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bubble-actions">
                    <button
                      onClick={() => {
                        setPlaying(false)
                        setBubblePage((x) => x + 1)
                      }}
                    >
                      再看看其他人
                    </button>
                    <button onClick={allHearts}>所有心意</button>
                    {s.onsiteVisible && (
                      <button onClick={() => patch({ onsiteVisible: false })}>返回仪式祝福</button>
                    )}
                  </div>
                </div>
              )}
              {chapter === 5 && (
                <div className="ending-stage">
                  <div className="ending-photo">
                    <PhotoImage path={host.cover} alt={host.name} />
                  </div>
                  <div className="eyebrow">THE STORY CONTINUES</div>
                  <h2>{c.phrase}</h2>
                  <div className="names-ribbon">
                    {[...new Set(blocks.map((b) => b.author))].map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                  {host.showEndLogo && <small>{host.organizer} · 一起留下这份礼物</small>}
                  <button onClick={reset}>再看一遍</button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="frame-engraving">S H I G U A N G X U</div>
      </div>
      {!received && (
        <>
          <div className="frame-controls">
            <button aria-label="相框上一个片段" onClick={() => move(-1)}>
              <CaretLeft size={21} />
            </button>
            <button
              className="play-memory"
              onClick={() => {
                setWhole(chapter === 0)
                setPlaying((p) => !p)
              }}
            >
              {playing ? <Pause size={19} /> : <Play size={19} />}
              <span>
                {playing
                  ? '暂停'
                  : chapter === 0
                    ? '播放整份礼物'
                    : chapter === 2
                      ? '播放这段回忆'
                      : '播放这一章'}
              </span>
            </button>
            <button aria-label="相框下一个片段" onClick={() => move(1)}>
              <CaretRight size={21} />
            </button>
            <button
              aria-label="查看全部照片"
              onClick={() => {
                setPlaying(false)
                modal(
                  '一起走过的片段',
                  <div className="gallery-grid">
                    {photoList.map((p) => (
                      <div key={p.id}>
                        <PhotoImage path={p.path} alt={p.caption} />
                        <p>{p.caption}</p>
                        <small>{p.date || '日期未记录'}</small>
                      </div>
                    ))}
                  </div>,
                )
              }}
            >
              <GridFour size={20} />
            </button>
            <span className="manual-hint">
              {playing ? '正在播放' : '手动浏览 · 点一下，慢慢看'}
            </span>
          </div>
          <nav className="chapter-nav">
            {chapters.map((t, i) => (
              <button
                key={i}
                aria-label={t}
                className={chapter === i ? 'active' : ''}
                onClick={() => selectChapter(i)}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                {t}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  )
}
function AllHearts({ blocks, open }: { blocks: Block[]; open: (b: Block) => void }) {
  const [filter, setFilter] = useState('all')
  return (
    <>
      <div className="chips">
        {[
          ['all', '全部'],
          ['story', '故事'],
          ['wish', '祝福'],
          ['photo', '照片'],
          ['audio', '声音'],
        ].map(([v, t]) => (
          <button key={v} className={filter === v ? 'selected' : ''} onClick={() => setFilter(v)}>
            {t}
          </button>
        ))}
      </div>
      <div className="all-hearts">
        {blocks
          .filter(
            (b) =>
              b.kind !== 'impression' &&
              (filter === 'all' || filter === 'audio'
                ? filter === 'all' || !!b.audio
                : b.kind === filter),
          )
          .map((b) => (
            <button className="heart-row" key={b.id} onClick={() => open(b)}>
              <Avatar name={b.author} />
              <div>
                <strong>
                  {b.author} · {b.relation}
                </strong>
                <p>{b.title || b.body || '一份心意'}</p>
              </div>
              <CaretRight />
            </button>
          ))}
      </div>
    </>
  )
}
