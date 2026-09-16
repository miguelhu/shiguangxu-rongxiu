import { useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  Heart,
  Microphone,
  Plus,
  Sparkle,
  Trash,
  Image,
  BookOpen,
} from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, relations, relationLabel, datasets, topics, coSteps, Photo, resource } from './data'
import { draftBlocks, photosFor, sampleDraft, Block, newDraft } from './model'
import {
  Button,
  Field,
  Note,
  Progress,
  StepActions,
  StickerPicker,
  Upload,
  Toggle,
  Avatar,
} from './ui'
import { PhotoImage, AudioPlayer } from './media'
export function RelationChooser({
  codes,
  primary,
  onChange,
  onPrimary,
}: {
  codes: string[]
  primary: string
  onChange: (v: string[]) => void
  onPrimary: (s: string) => void
}) {
  const [more, setMore] = useState(false)
  const { notify } = useDemo()
  const toggle = (code: string) => {
    if (code === 'unspecified') {
      onChange(['unspecified'])
      onPrimary('unspecified')
      return
    }
    const current = codes.filter((x) => x !== 'unspecified')
    const list = current.includes(code) ? current.filter((x) => x !== code) : [...current, code]
    if (list.length > 3) {
      notify('最多选择3项关系，再选一项作为主要关系')
      return
    }
    onChange(list)
    if (!list.includes(primary)) onPrimary(list[0] || '')
  }
  const visible = more
    ? relations
    : relations.filter(
        (r) =>
          codes.includes(r.code) ||
          [
            'student',
            'colleague',
            'subordinate',
            'friend',
            'child',
            'mentee',
            'spouse',
            'neighbor',
          ].includes(r.code),
      )
  return (
    <div className="relationship-picker">
      <div className="chips">
        {visible.map((r) => (
          <button
            key={r.code}
            className={codes.includes(r.code) ? 'selected' : ''}
            onClick={() => toggle(r.code)}
            title={r.explain}
          >
            {r.label}
            {codes.includes(r.code) && <Check size={13} />}
          </button>
        ))}
      </div>
      <button className="text-button" onClick={() => setMore(!more)}>
        {more ? '收起关系' : '更多关系 · 工作 / 学习 / 家庭 / 生活'}
      </button>
      {codes.length > 0 && (
        <div className="primary-relations">
          {codes.map((code) => (
            <button
              key={code}
              onClick={() => onPrimary(code)}
              className={primary === code ? 'active' : ''}
            >
              {primary === code ? '主要关系 · ' : '设为主要 · '}
              {relationLabel(code)}
            </button>
          ))}
        </div>
      )}
      {primary && <p className="helper">{relations.find((r) => r.code === primary)?.explain}</p>}
    </div>
  )
}
export function BlockCard({
  block,
  onOpen,
  small = false,
}: {
  block: Block
  onOpen?: () => void
  small?: boolean
}) {
  const { state } = useDemo()
  const media = (Object.keys(state.cases) as (keyof typeof state.cases)[]).flatMap((id) =>
    photosFor(id, state.cases[id]),
  )
  return (
    <article className={`content-card ${small ? 'compact' : ''}`} onClick={onOpen}>
      <div className="byline">
        <Avatar name={block.author} />
        <span>
          <b>{block.author}</b>
          <small>
            {block.relation} ·{' '}
            {{ impression: '印象', photo: '照片', story: '回忆', wish: '祝福' }[block.kind]}
          </small>
        </span>
      </div>
      {block.title && <h3>{block.title}</h3>}
      {block.tags.length > 0 && (
        <div className="chips">
          {block.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
      {block.body && <p className={small ? 'clamp' : ''}>{block.body}</p>}
      {block.photoIds.length > 0 && (
        <div className="attached-photos">
          {block.photoIds.slice(0, 3).map((id) => {
            const p = media.find((p) => p.id === id)
            return p && <PhotoImage key={id} path={p.path} alt={p.caption} />
          })}
        </div>
      )}
      {block.sticker && (
        <img
          className="attached-sticker"
          src={resource(`images/sticker-${block.sticker}.png`)}
          alt="祝福贴纸"
        />
      )}
      {block.audio &&
        (small ? (
          <span className="audio-pill">♫ 有一段声音</span>
        ) : (
          <AudioPlayer path={block.audio} text={block.audioText} />
        ))}
      {!block.scope.ceremony && <small className="private-label">仅送给受礼者</small>}
    </article>
  )
}
export function Contributor({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, patch, notify, modal, closeModal } = useDemo()
  const d = s.draft
  const data = datasets[c.id]
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [custom, setCustom] = useState('')
  const [topicRound, setTopicRound] = useState(0)
  const change = (v: Partial<typeof d>) => patch((x) => ({ draft: { ...x.draft, ...v } }))
  const assets = photosFor(c.id, s)
  const actor = data.authors.find((a) => a.id === d.authorId)!
  const addPhoto = (p: Photo, forWish = false) =>
    patch((old) => ({
      assets: [...old.assets, p],
      draft: {
        ...old.draft,
        [forWish ? 'wishPhotos' : 'photos']: [
          ...old.draft[forWish ? 'wishPhotos' : 'photos'],
          p.id,
        ].slice(0, forWish ? 3 : 9),
      },
    }))
  const useSample = () => {
    patch((x) => ({ draft: sampleDraft(c.id, x, page) }))
    notify('已放入这一步的示例，可以继续修改。')
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
          {c.id==='birthday'&&s.host.showAge&&s.host.age&&<div className="eyebrow">{s.host.age}岁 · 又一段喜欢的日子</div>}
          <h2>{c.subtitle}</h2>
          {s.host.showBio && <p className="prose">{s.host.bio}</p>}
          <div className="host-signature">
            {s.host.showInviteLogo && s.host.logo && (
              <PhotoImage path={s.host.logo} alt="主办标识" />
            )}
            <span>
              {s.host.organizer || '亲友一起相聚'}
              <small>
                {s.host.date} · {s.curator ? '有人帮忙整理' : '系统自动整理，无需主创'}
              </small>
            </span>
          </div>
          {c.id === 'teacher' && <p className="tiny">虚构人物与活动示例 · 非学校实际主办活动</p>}
          {s.host.showPhoto && s.host.introPhotos.length > 0 && (
            <div className="photo-strip">
              {s.host.introPhotos.map((path) => (
                <PhotoImage key={path} path={path} alt="人物介绍照片" />
              ))}
            </div>
          )}
          {s.version&&<Note>仪式作品已经准备好。同一个入口，仍然可以继续留下新的照片和心意。</Note>}
          {s.host.surprise&&<Note>这份礼物会在相聚时送给对方。先把惊喜留在这里。</Note>}
          <Button onClick={() => go(s.version?'onsite':'identity')}>
            {s.version?'再添一份心意':'留下我的一份心意'}
            <ArrowRight />
          </Button>
          <button
            className="text-button"
            onClick={() => {
              patch((x) => ({
                hiddenSeed: [...new Set([...x.hiddenSeed, d.authorId])],
                draft: newDraft(c.id,d.authorId),
              }))
              go('identity')
              notify('已开启从头参与，示例投稿不会代替你的确认。')
            }}
          >
            从空白开始参与
          </button>
          <Note>一句话、一张照片或一件小事，都可以。没有合适的内容，也可以跳过。</Note>
          <button className="text-button" onClick={() => go('entry')}>
            我也想发起一份礼物
          </button>
        </div>
      </>
    )
  if (page === 'identity')
    return (
      <div className="phone-body">
        <div className="eyebrow">先认识一下</div>
        <h2>
          让对方知道，
          <br />
          这份心意来自谁。
        </h2>
        <Field label="我的署名">
          <input value={d.name} maxLength={20} onChange={(e) => change({ name: e.target.value })} />
        </Field>
        <Field label={`我是${s.host.name}的什么人？`}>
          <RelationChooser
            codes={d.codes}
            primary={d.primary}
            onChange={(codes) => change({ codes })}
            onPrimary={(primary) => change({ primary })}
          />
        </Field>
        {c.id === 'anniversary' && (
          <Field label={`我是${s.host.secondName}的什么人？`}>
            <RelationChooser
              codes={d.secondaryCodes}
              primary={d.secondaryCodes[0] || ''}
              onChange={(secondaryCodes) => change({ secondaryCodes })}
              onPrimary={(p) =>
                change({ secondaryCodes: [p, ...d.secondaryCodes.filter((x) => x !== p)] })
              }
            />
            <button
              className="text-button"
              onClick={() => change({ secondaryCodes: [...d.codes] })}
            >
              对两位关系相同
            </button>
          </Field>
        )}
        <Field label="这段关系">
          <select value={d.period} onChange={(e) => change({ period: e.target.value })}>
            <option value="former">曾经</option>
            <option value="current">现在</option>
            <option value="unspecified">不特别说明</option>
          </select>
        </Field>
        <Field label="补充称呼（可选）">
          <input
            value={d.note}
            maxLength={30}
            onChange={(e) => change({ note: e.target.value })}
            placeholder="例如：2004届学生"
          />
        </Field>
        <Field label="联系电话（可稍后补充）" hint="仅用于联系资料问题与找回，不展示给其他共创者。">
          <input
            type="tel"
            value={d.phone}
            onChange={(e) => change({ phone: e.target.value })}
            placeholder="可选 · 请输入联系电话"
          />
        </Field>
        {error && <p className="error">{error}</p>}
        <Button
          onClick={() => {
            if (d.name.trim().length < 2) {
              setError('请填写至少2个字的署名')
              return
            }
            if (d.phone && !/^\+?[\d\s-]{7,20}$/.test(d.phone)) {
              setError('请检查联系电话格式，或暂时留空')
              return
            }
            if (!d.codes.length || (c.id === 'anniversary' && !d.secondaryCodes.length)) {
              setError('请为受礼者选择关系，也可以选暂不填写')
              return
            }
            patch((x) => ({
              connections: {
                ...x.connections,
                [d.authorId]: {
                  codes: d.codes,
                  secondaryCodes: d.secondaryCodes,
                  primary: d.primary,
                  note: d.note,
                  period: d.period,
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
  if (page === 'success')
    return (
      <div className="phone-body result-page">
        <div className="success-mark">
          <Check size={36} />
        </div>
        <div className="eyebrow">这一份，已经收好</div>
        <h2>
          谢谢你，
          <br />
          {d.name}。
        </h2>
        <p className="prose">
          你的照片、回忆和祝福，都保留自己的署名。以后想起什么，也可以再来补充。
        </p>
        <Note>
          {d.scope.ceremony
            ? '允许仪式展示的内容，已进入礼物整理。'
            : '这份心意只送给对方，不在仪式中展示。'}
        </Note>
        <Button onClick={() => go('records')}>查看我的投稿</Button>
        <Button
          secondary
          onClick={() => {
            change({ ...newDraft(c.id, d.authorId), name: d.name })
            go('impressions')
          }}
        >
          再补充一点
        </Button>
        <button className="text-button" onClick={() => go('people')}>
          我参与的人
        </button>
        <Toggle
          label="重要日子，提醒我问候"
          checked={s.remind}
          onChange={() => patch({ remind: !s.remind })}
        />
      </div>
    )
  if (page === 'preview') {
    const blocks = draftBlocks(c.id, s)
    return (
      <div className="phone-body">
        <div className="eyebrow">最后确认一下</div>
        <h2>
          一份心意，
          <br />
          保留你的样子。
        </h2>
        <p className="prose">
          送给 {s.host.address} · {blocks.length} 项内容
        </p>
        {blocks.map((b) => (
          <div key={b.id}>
            <BlockCard block={b} />
            <div className="scope-inline">
              <label>
                <input
                  type="checkbox"
                  checked={b.scope.ceremony}
                  onChange={(e) =>
                    change({
                      blockScopes: {
                        ...d.blockScopes,
                        [b.id]: { ...b.scope, ceremony: e.target.checked },
                      },
                    })
                  }
                />
                这项可在仪式展示
              </label>
            </div>
          </div>
        ))}
        {!blocks.length && (
          <Note>还没有留下内容。返回任一步，选一个印象、放张照片或写句话吧。</Note>
        )}
        <div className="consent-box">
          <h3>这份心意，可以放在哪里？</h3>
          {(
            [
              ['gift', '送给受礼者'],
              ['ceremony', '在仪式中展示'],
              ['keep', '仪式后长期保留'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={d.scope[key]}
                onChange={(e) =>
                  change({ scope: { ...d.scope, [key]: e.target.checked }, blockScopes: {} })
                }
              />
              <span>{label}</span>
            </label>
          ))}
          <small>用途分别选择，不包含公开网络宣传。</small>
        </div>
        {error && <p className="error">{error}</p>}
        <Button
          disabled={busy}
          onClick={() => {
            if (!blocks.length) {
              setError('请至少留下一项内容')
              return
            }
            if (!d.scope.gift) {
              setError('请确认将这份内容送给受礼者')
              return
            }
            setBusy(true)
            setTimeout(() => {
              patch((old) => ({
                hiddenSeed: [...new Set([...old.hiddenSeed, d.authorId])],
                blocks: [...old.blocks, ...blocks],
                submission: old.submission + 1,
                featured: old.featured.map((id) => {
                  const previous = data.stories.find((story) => story.id === id)
                  return previous?.authorId === d.authorId
                    ? blocks.find((b) => b.kind === 'story')?.id || id
                    : id
                }),
              }))
              setBusy(false)
              go('success')
            }, 500)
          }}
        >
          {busy ? '正在收好…' : '确认提交这份心意'}
          <Heart size={18} />
        </Button>
        <button className="text-button" onClick={() => go('impressions')}>
          返回修改
        </button>
      </div>
    )
  }
  return (
    <>
      <Progress page={page} go={go} />
      <div className="phone-body contributor-body">
        <div className="eyebrow">
          给 {s.host.address} · {coSteps.indexOf(page) + 1} / 4
        </div>
        <h2>
          {
            {
              impressions: '说起对方，\n你先想到什么？',
              photos: '把你留下的那一刻，\n也放进来。',
              stories: '不用写完一生，\n记得一件事就好。',
              wishes: '送一句，\n现在最想说的话。',
            }[page as 'impressions' | 'photos' | 'stories' | 'wishes']
          }
        </h2>
        <button className="sample-button" onClick={useSample}>
          <Sparkle size={17} />
          使用{actor.name}的这一步示例
        </button>
        {page === 'impressions' && (
          <>
            {c.id === 'anniversary' && (
              <Field label="这些印象是关于">
                <select value={d.target} onChange={(e) => change({ target: e.target.value })}>
                  <option value="pair">两个人相处的样子</option>
                  <option value="first">{s.host.name}</option>
                  <option value="second">{s.host.secondName}</option>
                </select>
              </Field>
            )}
            <p className="helper">选1—5个词，都是你眼中的他（她）。</p>
            <div className="impression-chips">
              {[...new Set([...data.authors.flatMap((a) => a.impressions), ...d.tags])].map((t) => (
                <button
                  key={t}
                  className={d.tags.includes(t) ? 'selected' : ''}
                  onClick={() => {
                    if (d.tags.includes(t)) change({ tags: d.tags.filter((x) => x !== t) })
                    else if (d.tags.length < 5) change({ tags: [...d.tags, t] })
                    else notify('最多选择5个印象词')
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="inline-input">
              <input
                placeholder="写一个自己的词"
                value={custom}
                maxLength={8}
                onChange={(e) => setCustom(e.target.value)}
              />
              <button
                onClick={() => {
                  if (custom.trim().length >= 2 && d.tags.length < 5) {
                    change({ tags: [...new Set([...d.tags, custom.trim()])] })
                    setCustom('')
                  }
                }}
              >
                <Plus size={20} />
              </button>
            </div>
            <Field label="为什么想到这个词？（可选）">
              <textarea
                value={d.tagNote}
                maxLength={100}
                onChange={(e) => change({ tagNote: e.target.value })}
                placeholder="一句简单的解释，也很动人。"
              />
            </Field>
          </>
        )}
        {page === 'photos' && (
          <>
            <p className="helper">有日期就记下来，不记得也没有关系。最多9张。</p>
            <div className="uploaded-grid">
              {d.photos.map((id, i) => {
                const p = assets.find((p) => p.id === id)
                return (
                  p && (
                    <div className="photo-edit" key={id}>
                      <PhotoImage path={p.path} alt={p.caption} />
                      <button
                        className="remove-photo"
                        aria-label={`删除照片${i + 1}`}
                        onClick={() => change({ photos: d.photos.filter((x) => x !== id) })}
                      >
                        <Trash size={16} />
                      </button>
                      <input
                        aria-label={`照片${i + 1}说明`}
                        value={p.caption}
                        maxLength={120}
                        onChange={(e) =>
                          patch((old) => ({
                            assets: [
                              ...old.assets.filter((x) => x.id !== id),
                              { ...p, caption: e.target.value },
                            ],
                          }))
                        }
                      />
                      <select
                        aria-label={`照片${i + 1}时间精度`}
                        value={p.precision}
                        onChange={(e) =>
                          patch((old) => ({
                            assets: [
                              ...old.assets.filter((x) => x.id !== id),
                              {
                                ...p,
                                precision: e.target.value,
                                date: e.target.value === 'unknown' ? '' : p.date || '2026',
                              },
                            ],
                          }))
                        }
                      >
                        <option value="unknown">不记得时间</option>
                        <option value="year">年份</option>
                        <option value="month">年月</option>
                        <option value="day">年月日</option>
                      </select>
                      {p.precision !== 'unknown' && (
                        <input
                          aria-label={`照片${i + 1}时间`}
                          value={p.date}
                          placeholder="例如2026-09"
                          onChange={(e) =>
                            patch((old) => ({
                              assets: [
                                ...old.assets.filter((x) => x.id !== id),
                                { ...p, date: e.target.value },
                              ],
                            }))
                          }
                        />
                      )}
                      <div className="photo-reorder">
                        <button
                          disabled={i === 0}
                          onClick={() => {
                            const v = [...d.photos]
                            ;[v[i - 1], v[i]] = [v[i], v[i - 1]]
                            change({ photos: v })
                          }}
                        >
                          前移
                        </button>
                        <small>{p.source}</small>
                      </div>
                    </div>
                  )
                )
              })}
            </div>
            <Upload onPhoto={(p) => addPhoto(p)}>
              <Camera size={25} />
              <span>
                上传照片<small>保存在本机，可重新选择</small>
              </span>
              <Plus size={20} />
            </Upload>
          </>
        )}
        {page === 'stories' && (
          <>
            <div className="topic-cards">
              {(topicRound % 2
                ? topics(d.codes.slice().reverse()).slice().reverse()
                : topics(d.codes)
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (d.stories.length < 3)
                      change({
                        stories: [
                          ...d.stories,
                          {
                            id: crypto.randomUUID(),
                            title: t,
                            body: '',
                            original: '',
                            photoIds: [],
                            audio: '',
                            audioText: '',
                          },
                        ],
                      })
                    else notify('一份心意最多3篇故事')
                  }}
                >
                  <BookOpen size={18} />
                  <span>{t}</span>
                  <Plus size={15} />
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setTopicRound((x) => x + 1)}>
              换一组话题
            </button>
            {d.stories.map((story, i) => (
              <div className="story-editor" key={story.id}>
                <input
                  aria-label={`故事${i + 1}标题`}
                  value={story.title}
                  maxLength={40}
                  onChange={(e) =>
                    change({
                      stories: d.stories.map((x, k) =>
                        k === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`故事${i + 1}正文`}
                  value={story.body}
                  maxLength={2000}
                  placeholder="从那个你记得的瞬间开始…"
                  onChange={(e) =>
                    change({
                      stories: d.stories.map((x, k) =>
                        k === i ? { ...x, body: e.target.value } : x,
                      ),
                    })
                  }
                />
                <div className="editor-meta">
                  <span>{story.body.length} / 2000</span>
                  <span>
                    <Check size={13} />
                    草稿在本机
                  </span>
                </div>
                {!!d.photos.length && (
                  <div className="story-photo-choices">
                    <small>给这段故事配一张照片</small>
                    <div className="photo-strip">
                      {d.photos.map((pid) => {
                        const p = assets.find((p) => p.id === pid)
                        return (
                          p && (
                            <button
                              key={pid}
                              aria-label={`故事${i + 1}配图 ${p.caption}`}
                              className={story.photoIds.includes(pid) ? 'selected' : ''}
                              onClick={() =>
                                change({
                                  stories: d.stories.map((x, k) =>
                                    k === i
                                      ? {
                                          ...x,
                                          photoIds: x.photoIds.includes(pid)
                                            ? x.photoIds.filter((id) => id !== pid)
                                            : [...x.photoIds, pid].slice(-3),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            >
                              <PhotoImage path={p.path} alt={p.caption} />
                              {story.photoIds.includes(pid) && <Check size={17} />}
                            </button>
                          )
                        )
                      })}
                    </div>
                  </div>
                )}
                <button
                  className="ai-button"
                  onClick={() => {
                    const candidate =
                      data.polished[story.id] &&
                      story.original === data.stories.find((x) => x.id === story.id)?.body
                        ? data.polished[story.id]
                        : story.body
                            .trim()
                            .replace(/[ \t]+/g, ' ')
                            .replace(/\n{3,}/g, '\n\n')
                    modal(
                      '小叙帮你整理一下',
                      <div className="polish-compare">
                        <small>
                          {data.polished[story.id]
                            ? '示例整理 · 保留你的意思'
                            : '本机格式整理 · 保留原意'}
                        </small>
                        <h3>你的原文</h3>
                        <p>{story.body}</p>
                        <h3>整理后的表达</h3>
                        <p>{candidate}</p>
                        <Button
                          onClick={() => {
                            change({
                              stories: d.stories.map((x, k) =>
                                k === i ? { ...x, original: x.body, body: candidate } : x,
                              ),
                            })
                            closeModal()
                          }}
                        >
                          采用这一版
                        </Button>
                        <Button secondary onClick={closeModal}>
                          保留原文
                        </Button>
                      </div>,
                    )
                  }}
                >
                  <Sparkle size={22} />
                  <span>
                    小叙帮我整理一下<small>保留你的意思，让表达更顺</small>
                  </span>
                  <ArrowRight size={20} />
                </button>
                {story.original && story.original !== story.body && (
                  <button
                    className="text-button"
                    onClick={() =>
                      change({
                        stories: d.stories.map((x, k) =>
                          k === i ? { ...x, body: x.original } : x,
                        ),
                      })
                    }
                  >
                    撤销整理，恢复原文
                  </button>
                )}
                {story.audio && <AudioPlayer path={story.audio} text={story.audioText} />}
                <Upload
                  onAudio={(path) =>
                    change({
                      stories: d.stories.map((x, k) =>
                        k === i ? { ...x, audio: path, audioText: '' } : x,
                      ),
                    })
                  }
                >
                  <Microphone size={19} />
                  为这段故事附上声音
                </Upload>
                <button
                  className="text-button danger"
                  onClick={() => change({ stories: d.stories.filter((_, k) => k !== i) })}
                >
                  删除这篇草稿
                </button>
              </div>
            ))}
            {!d.stories.length && (
              <Note>先选一个话题，也可以使用示例。不用写得很长，一件小事就好。</Note>
            )}
          </>
        )}
        {page === 'wishes' && (
          <>
            <div className="segmented">
              <button
                className={d.wishMode === 'text' ? 'active' : ''}
                onClick={() => change({ wishMode: 'text' })}
              >
                写句话
              </button>
              <button
                className={d.wishMode === 'photo' ? 'active' : ''}
                onClick={() => change({ wishMode: 'photo' })}
              >
                只放照片
              </button>
            </div>
            {d.wishMode === 'text' && (
              <textarea
                className="wish-editor"
                aria-label="祝福内容"
                value={d.wish}
                maxLength={300}
                placeholder="想把现在的这份心情，送给对方…"
                onChange={(e) => change({ wish: e.target.value })}
              />
            )}
            <div className="photo-strip">
              {d.wishPhotos.map((id) => {
                const p = assets.find((p) => p.id === id)
                return (
                  p && (
                    <button
                      key={id}
                      onClick={() => change({ wishPhotos: d.wishPhotos.filter((x) => x !== id) })}
                    >
                      <PhotoImage path={p.path} alt={p.caption} />
                      <small>点击移除</small>
                    </button>
                  )
                )
              })}
            </div>
            <Upload onPhoto={(p) => addPhoto(p, true)}>
              <Image size={22} />
              放一张照片
            </Upload>
            <h3 className="section-label">把熟悉的祝福，也送给对方</h3>
            <StickerPicker value={d.sticker} onChange={(sticker) => change({ sticker })} />
            <button
              className="sample-button"
              onClick={() => {
                const v = data.voices[0]
                change({ audio: v.path, audioText: v.text })
                notify('已加入演示配音，可试听或删除')
              }}
            >
              <Microphone size={18} />
              试试用声音说
            </button>
            <Upload onAudio={(audio) => change({ audio, audioText: '' })}>
              <Microphone size={20} />
              上传自己的声音（≤60秒）
            </Upload>
            {d.audio && (
              <>
                <AudioPlayer path={d.audio} text={d.audioText} />
                <button
                  className="text-button"
                  onClick={() => change({ audio: '', audioText: '' })}
                >
                  移除声音
                </button>
              </>
            )}
          </>
        )}
        <StepActions page={page} go={go} />
      </div>
    </>
  )
}
