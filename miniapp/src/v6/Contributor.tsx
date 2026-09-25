import { PhotoDate } from './PhotoDate'
import { Dictation } from './Dictation'
import { WritingArea } from './WritingAssist'
import { validPhotoDate } from './workflow'
import { useRef, useState } from 'react'
import { ArrowRight, Check, Camera, Plus, Sparkle, Trash } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, relations, relationLabel, datasets, topics, coSteps, coLabels, Photo } from './data'
import {
  Block,
  Draft,
  available,
  draftBlocks,
  photosFor,
  newDraft,
  sampleDraft,
  allScope,
} from './model'
import { Button, Field, Note, Upload, Avatar } from './ui'
import { PhotoImage, AudioPlayer } from './media'
import { VoiceInput } from './VoiceInput'
export function RelationChooser({
  codes,
  primary,
  onChange,
  onPrimary,
}: {
  codes: string[]
  primary: string
  onChange: (v: string[]) => void
  onPrimary: (v: string) => void
}) {
  const [other, setOther] = useState(codes.filter((c) => c !== primary).length > 0)
  return (
    <div className="relationship-picker">
      <Field label="你与 TA 最主要的关系是什么？">
        <select
          aria-label="主要关系"
          value={primary}
          onChange={(e) => {
            const p = e.target.value
            onChange([p, ...codes.filter((x) => x !== p && x !== primary)])
            onPrimary(p)
          }}
        >
          <option value="" disabled>
            请选择主要关系
          </option>
          {relations.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <p className="helper">{relations.find((r) => r.code === primary)?.explain}</p>
      <button className="text-button" onClick={() => setOther(!other)} aria-expanded={other}>
        你们还有其他关系吗？{other ? '收起' : '（可选）'}
      </button>
      {other && (
        <div className="chips other-relations">
          {relations
            .filter((r) => r.code !== primary && r.code !== 'unspecified')
            .map((r) => (
              <button
                key={r.code}
                aria-pressed={codes.includes(r.code)}
                className={codes.includes(r.code) ? 'selected' : ''}
                onClick={() =>
                  onChange(
                    codes.includes(r.code) ? codes.filter((x) => x !== r.code) : [...codes, r.code],
                  )
                }
              >
                {r.label}
                {codes.includes(r.code) && <Check size={13} />}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
export function BlockCard({ block, small = false }: { block: Block; small?: boolean }) {
  const { state } = useDemo()
  const media = Object.entries(state.cases).flatMap(([id, s]) =>
    photosFor(id as keyof typeof state.cases, s),
  )
  return (
    <article className={`content-card ${small ? 'compact' : ''}`}>
      <div className="byline">
        <Avatar name={block.author} />
        <span>
          <b>{block.author}</b>
          <small>
            {block.relation} ·{' '}
            {{ impression: '印象', photo: '时光碎片', story: '故事', wish: '祝福' }[block.kind]}
          </small>
        </span>
      </div>
      {block.title && <h3>{block.title}</h3>}
      {!!block.tags.length && (
        <div className="chips">
          {block.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
      {block.kind !== 'story' && !!block.photoIds.length && (
        <div className="attached-photos">
          {block.photoIds.map((id) => {
            const p = media.find((p) => p.id === id)
            return (
              p && (
                <div key={id}>
                  <PhotoImage path={p.path} alt={p.caption} />
                  {p.date && <small>{p.date}</small>}
                </div>
              )
            )
          })}
        </div>
      )}
      {block.body && <p className={small ? 'clamp' : ''}>{block.body}</p>}
      {block.audio && <AudioPlayer path={block.audio} text={block.audioText} />}
    </article>
  )
}
export const wishSuggestions = [
  '愿往后的日子从容自在，慢慢做喜欢的事。',
  '谢谢您曾经的陪伴，愿我们常常相见。',
  '愿您身体安康，每天都有值得开心的小事。',
  '新的一程，愿您有书可读、有景可看、有人相伴。',
]
export function Contributor({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, patch, modal, closeModal, notify } = useDemo()
  const d = s.draft
  const data = datasets[c.id]
  const actor = data.authors.find((a) => a.id === d.authorId) || data.authors[0]
  const media = photosFor(c.id, s)
  const [error, setError] = useState('')
  const [examples, setExamples] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [customWish, setCustomWish] = useState(!!d.wish && !wishSuggestions.includes(d.wish))
  const [wishBatch, setWishBatch] = useState(0)
  const [round, setRound] = useState(0)
  const submitting = useRef(false)
  const change = (v: Partial<Draft>) => patch((old) => ({ draft: { ...old.draft, ...v } }))
  const sample = () => {
    change(sampleDraft(c.id, s, page))
    notify('示例已放入，可以继续改成自己的话。')
  }
  const count = new Set(available(c.id, s).map((b) => b.authorId)).size
  function next(skip = false) {
    setError('')
    if (page === 'photos' && !skip) {
      for (const p of media.filter((p) => d.photos.includes(p.id))) {
        if (!validPhotoDate(p.date, p.precision)) {
          setError('请按选定的精度填写照片时间，或选择“不记得时间”。')
          return
        }
      }
    }
    const i = coSteps.indexOf(page)
    const has =
      page === 'impressions'
        ? d.tags.length
        : page === 'photos'
          ? d.photos.length
          : page === 'stories'
            ? d.stories.some((x) => x.body.trim())
            : d.wish.trim() || d.audio
    patch((old) => ({
      draft: {
        ...old.draft,
        visited: [...new Set([...old.draft.visited, page, ...(i < 3 ? [coSteps[i + 1]] : [])])],
        skipped:
          skip && !has
            ? [...new Set([...old.draft.skipped, page])]
            : old.draft.skipped.filter((x) => x !== page),
      },
    }))
    go(i === 3 ? 'preview' : coSteps[i + 1])
  }
  function addPhoto(p: Photo) {
    patch((old) =>
      old.draft.photos.length >= 10
        ? {}
        : {
            assets: [...old.assets, p],
            draft: { ...old.draft, photos: [...old.draft.photos, p.id] },
          },
    )
  }
  if (page === 'invite')
    return (
      <>
        <div className="invitation-cover">
          <PhotoImage path={s.host.cover} alt={s.host.name} />
          <span className="photo-wash" />
          <div className="invitation-title">
            <small>A GIFT WE MAKE TOGETHER</small>
            <h1>{s.host.configured ? `把记得的瞬间，\n送给${s.host.address}。` : c.title}</h1>
          </div>
        </div>
        <div className="phone-body">
          <div className="eyebrow">{c.category} · 共创邀请</div>
          <h2>{c.subtitle}</h2>
          {s.host.showBio && <p className="prose">{s.host.bio}</p>}
          <div className="host-signature">
            {s.host.showInviteLogo && s.host.logo && (
              <PhotoImage path={s.host.logo} alt="主办标识" />
            )}
            <span>
              {s.host.organizer || '亲友一起相聚'}
              <small>
                统筹者 {s.coordinatorName} · {s.host.date}
              </small>
            </span>
          </div>
          {c.id === 'teacher' && <p className="tiny">虚构人物与活动示例 · 非学校实际主办活动</p>}
          {s.host.showPhoto && (
            <div className="photo-strip">
              {s.host.introPhotos.map((path) => (
                <PhotoImage key={path} path={path} alt="人物介绍照片" />
              ))}
            </div>
          )}
          <Button onClick={() => go(s.version ? 'guest' : 'identity')}>
            {s.version ? '现场也想留一份心意？' : '留下我的一份心意'}
            <ArrowRight />
          </Button>
          <Note>
            一句话、一张照片或一个故事，都可以。参与内容将用于这份礼物及对应仪式，不包含公开宣传。
          </Note>
        </div>
      </>
    )
  if (page === 'identity')
    return (
      <div className="phone-body">
        <div className="eyebrow">先认识一下</div>
        <h2>
          这份心意，
          <br />
          让对方知道来自谁。
        </h2>
        <Field label="我的署名">
          <input value={d.name} maxLength={20} onChange={(e) => change({ name: e.target.value })} />
        </Field>
        {c.id === 'anniversary' && <h3>与{s.host.name}的关系</h3>}
        <RelationChooser
          codes={d.codes}
          primary={d.primary}
          onChange={(codes) => change({ codes })}
          onPrimary={(primary) => change({ primary })}
        />
        {c.id === 'anniversary' && (
          <>
            <h3>与{s.host.secondName}的关系</h3>
            <RelationChooser
              codes={d.secondaryCodes}
              primary={d.secondaryCodes[0] || ''}
              onChange={(secondaryCodes) => change({ secondaryCodes })}
              onPrimary={(p) =>
                change({ secondaryCodes: [p, ...d.secondaryCodes.filter((x) => x !== p)] })
              }
            />
          </>
        )}
        <Field
          label="留下联系方式"
          hint="用于帮助你以后还能找到曾经关怀过的人，不会公开展示给其他共创者。"
        >
          <input
            type="tel"
            value={d.phone}
            placeholder="留下一个可以联系到你的号码"
            onChange={(e) => change({ phone: e.target.value })}
          />
        </Field>
        <small className="tiny">演示页面不发送验证码。</small>
        {error && <p className="error">{error}</p>}
        <Button
          onClick={() => {
            if (
              !d.name.trim() ||
              !d.primary ||
              (c.id === 'anniversary' && !d.secondaryCodes.length)
            ) {
              setError('请填写署名并选择主要关系。')
              return
            }
            if (d.phone && !/^\+?[\d\s-]{7,20}$/.test(d.phone)) {
              setError('请检查联系电话格式。')
              return
            }
            patch((old) => ({
              connections: {
                ...old.connections,
                [d.authorId]: {
                  codes: d.codes,
                  primary: d.primary,
                  secondaryCodes: d.secondaryCodes,
                  note: '',
                  period: '',
                },
              },
            }))
            go('impressions')
          }}
        >
          开始留下心意
          <ArrowRight />
        </Button>
      </div>
    )
  if (page === 'success' || page === 'progress')
    return (
      <div className="phone-body result-page">
        <div className="success-mark">
          <Check size={36} />
        </div>
        <div className="eyebrow">每一份心意，都让礼物更完整</div>
        <h2>{s.submission ? '你的心意，\n已经收到了。' : '大家的心意，\n正在慢慢相聚。'}</h2>
        <p className="prose">
          已经有 <strong>{count}</strong> 位朋友和你一起，为{s.host.address}留下了心意。
        </p>
        <div className="mini-people">
          {data.authors.slice(0, 5).map((a) => (
            <Avatar key={a.id} name={a.name} />
          ))}
        </div>
        <Note>
          {s.version
            ? '这份礼物已准备好。等长者正式打开后，我们会再告诉你。'
            : `统筹者${s.coordinatorName}正在把大家的心意整理成礼物。成品准备好后，会邀请你回来看看。`}
        </Note>
        <button className="board-entry-card" onClick={() => go('board')}>
          <span>
            <b>看看共创看板</b>
            <small>看见大家从哪些方向留下心意，也看看还有哪一块空白。</small>
          </span>
          <ArrowRight />
        </button>
        <Button onClick={() => go('people')}>返回我参与过的人</Button>
        {s.openedAt && (
          <Button secondary onClick={() => go('share')}>
            看看我们完成的礼物
          </Button>
        )}
        <button
          className="text-button"
          onClick={() => {
            const fresh = newDraft(c.id, d.authorId)
            change({
              ...fresh,
              name: d.name,
              phone: d.phone,
              codes: d.codes,
              primary: d.primary,
              secondaryCodes: d.secondaryCodes,
            })
            go('impressions')
          }}
        >
          再补充一点
        </button>
      </div>
    )
  if (page === 'preview') {
    const blocks = draftBlocks(c.id, s)
    const sections = [
      ['impression', 'impressions', '印象'],
      ['photo', 'photos', '时光碎片'],
      ['story', 'stories', '故事'],
      ['wish', 'wishes', '祝福'],
    ] as const
    return (
      <div className="phone-body preview-body">
        <div className="eyebrow">最后看一眼</div>
        <h2>看看这份心意。</h2>
        <div className="preview-identity">
          <b>
            {d.name} · {relationLabel(d.primary)}
          </b>
          <small>
            联系电话：{d.phone ? d.phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2') : '未填写'} ·
            仅本人可见
          </small>
          <button className="text-button" onClick={() => go('identity')}>
            修改个人信息
          </button>
        </div>
        {sections.map(([kind, p, label]) => (
          <section key={kind} className="preview-section">
            <header>
              <h3>{label}</h3>
              <button onClick={() => go(p)}>修改</button>
            </header>
            {blocks.filter((b) => b.kind === kind).length ? (
              blocks.filter((b) => b.kind === kind).map((b) => <BlockCard block={b} key={b.id} />)
            ) : (
              <p className="helper">这一步暂时没有内容</p>
            )}
          </section>
        ))}
        <div className="submit-sticky">
          <p className="tiny">
            确认送出即同意用于本次礼物和对应仪式，不含公开宣传。之后仍可管理或撤回自己的内容。
          </p>
          {error && <p className="error">{error}</p>}
          <Button
            onClick={() => {
              if (submitting.current) return
              if (!blocks.length) {
                setError('请至少留下一项心意。')
                return
              }
              const signature = JSON.stringify([
                d.name,
                d.primary,
                d.tags,
                d.photos,
                d.stories,
                d.wish,
                d.audio,
                media.filter((p) => d.photos.includes(p.id)),
              ])
              if (signature === s.submittedDraftSignature) {
                go('success')
                return
              }
              submitting.current = true
              patch((old) => ({
                hiddenSeed: [...new Set([...old.hiddenSeed, d.authorId])],
                blocks: [...old.blocks, ...blocks.map((b) => ({ ...b, scope: { ...allScope } }))],
                submission: old.submission + 1,
                submittedDraftSignature: signature,
                stage: Math.max(old.stage, 3),
                lastSent: new Date().toISOString().slice(0, 10),
                review: { ...old.review, previewed: false },
                featured: old.featured.map((id) =>
                  data.stories.find((x) => x.id === id)?.authorId === d.authorId
                    ? blocks.find((b) => b.kind === 'story')?.id || id
                    : id,
                ),
              }))
              go('success')
            }}
          >
            确认送出
            <ArrowRight />
          </Button>
        </div>
      </div>
    )
  }
  return (
    <>
      <nav className="progress">
        {coSteps.map((p, i) => (
          <button
            key={p}
            disabled={!d.visited.includes(p) && p !== page}
            className={p === page ? 'current' : ''}
            onClick={() => go(p)}
            aria-label={`第${i + 1}步 ${coLabels[i]}`}
          >
            <i>{i + 1}</i>
            <span>{coLabels[i]}</span>
          </button>
        ))}
      </nav>
      <div className="phone-body contributor-body">
        <div className="step-heading">
          <small>
            给{s.host.address} · {coSteps.indexOf(page) + 1}/4
          </small>
          <button
            className="example-toggle"
            aria-expanded={examples}
            onClick={() => setExamples(!examples)}
          >
            示例 ?
          </button>
        </div>
        <h2>
          {
            {
              impressions: '说起对方，\n你先想到什么？',
              photos: '留下一张，\n值得记住的照片。',
              stories: '不用配图，\n认真讲一件事就好。',
              wishes: '有些祝福，\n简单说也很动人。',
            }[page as 'impressions']
          }
        </h2>
        {examples && (
          <div className="example-panel">
            <p>可以参考{actor.name}的表达，再改成属于你的心意。</p>
            <button className="text-button" onClick={sample}>
              使用{actor.name}的这一步示例
            </button>
          </div>
        )}
        {page === 'impressions' && (
          <>
            <div className="chips tag-options">
              {[...new Set([...data.authors.flatMap((a) => a.impressions), ...d.tags])]
                .slice(0, 28)
                .map((t) => (
                  <button
                    className={d.tags.includes(t) ? 'selected' : ''}
                    key={t}
                    onClick={() => {
                      if (!d.tags.includes(t) && d.tags.length >= 5) {
                        notify('选最有感触的8个就好')
                        return
                      }
                      change({
                        tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t],
                      })
                    }}
                  >
                    {t}
                  </button>
                ))}
            </div>
            <Field label="再添一个你想到的词">
              <WritingArea
                rows={1}
                value={customTag}
                maxLength={12}
                placeholder="可选"
                onChange={(e) => setCustomTag(e.target.value)}
              />
            </Field>
            <button
              className="text-button"
              onClick={() => {
                if (customTag.trim() && d.tags.length < 5)
                  change({ tags: [...new Set([...d.tags, customTag.trim()])] })
                setCustomTag('')
              }}
            >
              加入这个词
            </button>
          </>
        )}
        {page === 'photos' && (
          <>
            <p className="helper">推荐选1—2张照片，最多10张。给每张照片留一两句话，100字以内。</p>
            {d.photos.length > 3 && (
              <Note>照片已经很丰富了，精选最想留下的几张，故事会更清楚。</Note>
            )}
            <div className="uploaded-grid">
              {d.photos.map((id, i) => {
                const p = media.find((p) => p.id === id)
                if (!p) return null
                const update = (v: Partial<Photo>) =>
                  patch((old) => ({
                    assets: [...old.assets.filter((x) => x.id !== id), { ...p, ...v }],
                  }))
                return (
                  <div className="photo-edit" key={id}>
                    <PhotoImage path={p.path} alt={p.caption} />
                    <button
                      className="remove-photo"
                      aria-label={`删除照片${i + 1}`}
                      onClick={() => change({ photos: d.photos.filter((x) => x !== id) })}
                    >
                      <Trash size={16} />
                    </button>
                    <div className="photo-card-label">
                      <span>时光碎片 · {String(i + 1).padStart(2, '0')}</span>
                      <span>给画面留一句话</span>
                    </div>
                    <WritingArea
                      aria-label={`照片${i + 1}说明`}
                      maxLength={100}
                      value={p.caption}
                      placeholder="给这张照片留一句话"
                      onChange={(e) => update({ caption: e.target.value })}
                    />
                    <small>{p.caption.length}/100</small>
                    <PhotoDate photo={p} index={i + 1} onChange={update} />
                    <Dictation
                      label="照片说明"
                      onText={(caption) => update({ caption: caption.slice(0, 100) })}
                    />
                    <button
                      className="text-button"
                      disabled={!i}
                      onClick={() => {
                        const ids = [...d.photos]
                        ;[ids[i], ids[i - 1]] = [ids[i - 1], ids[i]]
                        change({ photos: ids })
                      }}
                    >
                      前移
                    </button>
                  </div>
                )
              })}
            </div>
            {d.photos.length < 10 ? (
              <Upload onPhoto={addPhoto} maxFiles={10 - d.photos.length}>
                <Camera />
                <span>
                  上传照片<small>{d.photos.length}/10 张 · 推荐1—2张</small>
                </span>
                <Plus />
              </Upload>
            ) : (
              <Note>已达到10张上限，可以先移除一张再替换。</Note>
            )}
          </>
        )}
        {page === 'stories' && (
          <>
            <div className="topic-cards topic-gallery">
              {(round % 2 ? topics([d.primary]).slice().reverse() : topics([d.primary])).map(
                (t, idx) => {
                  const existing = d.stories.find((st) => st.title === t)
                  return (
                    <button
                      key={t}
                      className={existing ? 'has-story' : ''}
                      disabled={!existing && d.stories.length >= 3}
                      onClick={() => {
                        if (existing) {
                          document
                            .getElementById('story-' + existing.id)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          return
                        }
                        const id = crypto.randomUUID()
                        change({
                          stories: [
                            ...d.stories,
                            {
                              id,
                              title: t,
                              body: '',
                              original: '',
                              photoIds: [],
                              audio: '',
                              audioText: '',
                            },
                          ],
                        })
                        requestAnimationFrame(() =>
                          document
                            .getElementById('story-' + id)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
                        )
                      }}
                    >
                      <PhotoImage
                        path={data.photos[(idx + round * 3) % data.photos.length].path}
                        alt="话题配图"
                      />
                      <h3>{t}</h3>
                      <span>{existing ? '查看故事' : '开始聊'}</span>
                    </button>
                  )
                },
              )}
            </div>
            <button className="text-button" onClick={() => setRound((x) => x + 1)}>
              换一组话题
            </button>
            {d.stories.map((story, i) => {
              const update = (v: Partial<typeof story>) =>
                change({ stories: d.stories.map((x, k) => (k === i ? { ...x, ...v } : x)) })
              return (
                <div className="story-editor" id={'story-' + story.id} key={story.id}>
                  <WritingArea
                    rows={1}
                    aria-label={`故事${i + 1}标题`}
                    value={story.title}
                    maxLength={40}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                  <WritingArea
                    aria-label={`故事${i + 1}正文`}
                    value={story.body}
                    maxLength={2000}
                    placeholder="从你真正记得的那件事说起…"
                    onChange={(e) => update({ body: e.target.value })}
                  />
                  <Dictation
                    label="故事"
                    onText={(body) => update({ body: body.slice(0, 2000) })}
                  />
                  <div className="editor-meta">
                    <span>{story.body.length}/2000</span>
                    <small>草稿保存在本机</small>
                  </div>
                  <button
                    className="ai-button"
                    disabled={!story.body.trim()}
                    onClick={() => {
                      const exact = data.stories.find((x) => x.id === story.id)?.body === story.body
                      const text =
                        exact && data.polished[story.id]
                          ? data.polished[story.id]
                          : story.body
                              .trim()
                              .replace(/[ \t]+/g, ' ')
                              .replace(/\n{3,}/g, '\n\n')
                      modal(
                        '小叙帮我把这段话理顺',
                        <div className="polish-compare">
                          <small>{exact ? '示例整理稿' : '本机格式整理 · 保留你的原意'}</small>
                          <h3>你的原文</h3>
                          <p>{story.body}</p>
                          <h3>整理后</h3>
                          <p>{text}</p>
                          <Button
                            onClick={() => {
                              update({ original: story.body, body: text })
                              closeModal()
                            }}
                          >
                            使用整理后的文字
                          </Button>
                        </div>,
                      )
                    }}
                  >
                    <Sparkle size={21} />
                    <span>
                      小叙帮我整理<small>保留原意，整理后由你确认</small>
                    </span>
                    <ArrowRight />
                  </button>
                  {story.original && story.original !== story.body && (
                    <button
                      className="text-button"
                      onClick={() => update({ body: story.original })}
                    >
                      恢复原文
                    </button>
                  )}
                  <button
                    className="text-button"
                    onClick={() => change({ stories: d.stories.filter((x) => x.id !== story.id) })}
                  >
                    移除这篇故事
                  </button>
                </div>
              )
            })}
            <small className="helper">最多3篇，没有照片也能讲一个完整故事。</small>
          </>
        )}
        {page === 'wishes' && (
          <>
            <h3>方式一 · 写一句祝福</h3>
            {!customWish && (
              <div className="wish-presets">
                {Array.from(
                  { length: 3 },
                  (_, i) => wishSuggestions[(wishBatch + i) % wishSuggestions.length],
                ).map((t) => (
                  <button
                    key={t}
                    className={d.wish === t ? 'selected' : ''}
                    onClick={() => {
                      change({ wish: d.wish === t ? '' : t })
                      setCustomWish(false)
                    }}
                  >
                    {t}
                    {d.wish === t && <Check size={18} />}
                  </button>
                ))}
              </div>
            )}
            {!customWish && (
              <button className="text-button" onClick={() => setWishBatch((x) => x + 1)}>
                换一批 ↻
              </button>
            )}
            <button className="text-button" onClick={() => setCustomWish(!customWish)}>
              {customWish ? '看看参考祝福' : '自己写一句'}
            </button>
            {customWish && (
              <WritingArea
                className="wish-editor"
                aria-label="自定义祝福"
                maxLength={300}
                value={d.wish}
                onChange={(e) => change({ wish: e.target.value })}
              />
            )}
            <h3>方式二 · 留一段声音</h3>
            <div>
              <VoiceInput
                path={d.audio}
                text={d.audioText}
                onChange={(audio, audioText) => change({ audio, audioText })}
              />
            </div>
            <p className="helper">一句文字和一段声音可以一起送出，也可以只选一种。</p>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <div className="step-actions">
          <Button onClick={() => next()}>
            {page === 'wishes' ? '预览这份心意' : '下一步'}
            <ArrowRight />
          </Button>
          <button className="text-button" onClick={() => next(true)}>
            暂时没有，跳过
          </button>
        </div>
      </div>
    </>
  )
}
