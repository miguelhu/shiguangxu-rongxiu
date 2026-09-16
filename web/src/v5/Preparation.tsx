import { WritingArea } from './WritingAssist'
import { useState } from 'react'
import { ArrowRight, Check, Gift, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, cases } from './data'
import { Host, photosFor } from './model'
import { Button, Field, Note, Toggle, Upload } from './ui'
import { PhotoImage } from './media'
import { BlockCard } from './Contributor'
import Frame from './Frame'
import {
  collected,
  generateLetter,
  letterCurrent,
  canFreeze,
  freezeVersion,
  isManager,
} from './workflow'
const tasks = [
  '看整体',
  '看照片',
  '看故事',
  '看祝福',
  '大家写给你的一封信',
  '预览相框成品',
  '确认仪式版本',
]
export function Entry({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, patch, setRole, notify } = useDemo()
  const h = s.host,
    step = s.formStep
  const [error, setError] = useState('')
  const update = (v: Partial<Host>) =>
    patch((old) => ({ host: { ...old.host, ...v }, review: { ...old.review, previewed: false } }))
  if (page === 'entry')
    return (
      <div className="phone-body">
        <div className="eyebrow">一份礼物，从你开始</div>
        <h2>
          想为谁，
          <br />
          留下一份纪念？
        </h2>
        <p className="prose">选择一种发起方式，先介绍人物和这次相聚。</p>
        {(
          [
            ['organization', '代表单位或团队主办', '工会、人事、部门或团队代表'],
            ['personal', '我想为一个人张罗', '为家人、老师或同行的人'],
            ['self', '我想为自己留一份纪念', '邀请亲友，一起留住记得的片段'],
          ] as const
        ).map(([role, title, sub]) => (
          <button
            key={role}
            className="entry-card"
            onClick={() => {
              update({
                role,
                configured: false,
                organizer:
                  role === 'organization' ? c.host : role === 'personal' ? '家人与朋友' : '',
                showLogo: role === 'organization',
                showInviteLogo: role === 'organization',
              })
              patch({ formStep: 0, owned: true })
              go('host')
            }}
          >
            <span>
              <h3>{title}</h3>
              <p>{sub}</p>
            </span>
            <ArrowRight />
          </button>
        ))}
        <button className="text-button" onClick={() => go('invite')}>
          我收到邀请来参与
        </button>
      </div>
    )
  const titles = [
    '谁来张罗这份礼物',
    '先介绍受礼者',
    '主办的心意，也留下',
    '选一个相聚的日子',
    '确认这份邀请',
  ]
  return (
    <div className="phone-body">
      <div className="eyebrow">
        发起{c.category} · {step + 1}/5
      </div>
      <h2>{titles[step]}</h2>
      <div className="form-progress">
        {titles.map((t, i) => (
          <i key={t} className={i <= step ? 'active' : ''} />
        ))}
      </div>
      {step === 0 && (
        <>
          <Field label="我以什么身份来张罗">
            <select
              value={h.role}
              onChange={(e) => update({ role: e.target.value as Host['role'] })}
            >
              <option value="organization">代表单位或团队</option>
              <option value="personal">个人牵头</option>
              <option value="self">本人发起</option>
            </select>
          </Field>
          {h.role === 'organization' && (
            <Field label="我的经办角色">
              <select
                value={h.operatorRole}
                onChange={(e) => update({ operatorRole: e.target.value })}
              >
                {['团队代表', '工会／人事', '部门负责人', '行政经办', '其他经办'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="统筹者姓名">
            <input
              value={s.coordinatorName}
              onChange={(e) =>
                patch({ coordinatorName: e.target.value, coordinatorViewer: e.target.value })
              }
            />
          </Field>
          <Note>
            发起人默认负责统筹。小叙帮助整理，最终成品由统筹者确认；之后可以移交给更适合的人。
          </Note>
        </>
      )}
      {step === 1 && (
        <>
          <Field label={h.role === 'self' ? '我的名字' : '受礼者姓名'}>
            <input
              value={h.name}
              maxLength={30}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          {c.id === 'anniversary' && (
            <Field label="另一位受礼者">
              <input
                value={h.secondName}
                onChange={(e) => update({ secondName: e.target.value })}
              />
            </Field>
          )}
          <Field label="邀请中的称呼">
            <input
              value={h.address}
              maxLength={30}
              onChange={(e) => update({ address: e.target.value })}
            />
          </Field>
          <Field label="一小段人物介绍">
            <WritingArea
              value={h.bio}
              maxLength={200}
              onChange={(e) => update({ bio: e.target.value })}
            />
          </Field>
          <PhotoImage path={h.cover} alt={h.name} className="host-cover" />
          <Upload onPhoto={(p) => update({ cover: p.path })} maxFiles={1}>
            更换封面照片
          </Upload>
          <Upload
            onPhoto={(p) =>
              patch((old) => ({
                host: { ...old.host, introPhotos: [...old.host.introPhotos, p.path].slice(0, 6) },
              }))
            }
            maxFiles={6 - h.introPhotos.length}
          >
            添加介绍照片（可选）
          </Upload>
          <div className="photo-strip">
            {h.introPhotos.map((path) => (
              <button
                key={path}
                onClick={() => update({ introPhotos: h.introPhotos.filter((p) => p !== path) })}
              >
                <PhotoImage path={path} alt="人物介绍照片" />
                <small>移除</small>
              </button>
            ))}
          </div>
          <Toggle
            label="向共创者展示人物介绍"
            checked={h.showBio}
            onChange={() => update({ showBio: !h.showBio })}
          />
          <Toggle
            label="向共创者展示介绍照片"
            checked={h.showPhoto}
            onChange={() => update({ showPhoto: !h.showPhoto })}
          />
        </>
      )}
      {step === 2 && (
        <>
          <Field label={h.role === 'organization' ? '单位或团队名称' : '主办署名（可不填）'}>
            <input
              value={h.organizer}
              maxLength={40}
              onChange={(e) => update({ organizer: e.target.value })}
            />
          </Field>
          {h.logo && <PhotoImage path={h.logo} alt="主办标识" className="logo-preview" />}
          <Upload onPhoto={(p) => update({ logo: p.path })} maxFiles={1}>
            上传主办 Logo（可选）
          </Upload>
          <Toggle
            label="邀请显示主办标识"
            checked={h.showInviteLogo}
            onChange={() => update({ showInviteLogo: !h.showInviteLogo })}
          />
          <Toggle
            label="仪式显示主办标识"
            checked={h.showLogo}
            onChange={() => update({ showLogo: !h.showLogo })}
          />
          <Toggle
            label="结束页显示主办署名"
            checked={h.showEndLogo}
            onChange={() => update({ showEndLogo: !h.showEndLogo })}
          />
        </>
      )}
      {step === 3 && (
        <>
          <Field label="仪式日期">
            <input type="date" value={h.date} onChange={(e) => update({ date: e.target.value })} />
          </Field>
          <Field label="共创截止日期">
            <input
              type="date"
              value={h.deadline}
              onChange={(e) => update({ deadline: e.target.value })}
            />
          </Field>
          <Field label="预计邀请人数">
            <input
              type="number"
              min={1}
              max={999}
              value={s.targetCount}
              onChange={(e) =>
                patch({ targetCount: Math.min(999, Math.max(1, Number(e.target.value))) })
              }
            />
          </Field>
          <Toggle
            label="相聚时再打开惊喜"
            checked={h.surprise}
            onChange={() => update({ surprise: !h.surprise })}
          />
        </>
      )}
      {step === 4 && (
        <>
          <PhotoImage path={h.cover} alt={h.name} className="host-cover" />
          <h3>
            {h.address}的{c.category}
          </h3>
          <p>{h.bio}</p>
          <div className="detail-list">
            <p>
              统筹者<span>{s.coordinatorName}</span>
            </p>
            <p>
              主办<span>{h.organizer || '亲友相聚'}</span>
            </p>
            <p>
              仪式日期<span>{h.date}</span>
            </p>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <Button
        onClick={() => {
          if (
            (step === 0 && !s.coordinatorName.trim()) ||
            (step === 1 &&
              (!h.name.trim() ||
                !h.address.trim() ||
                (c.id === 'anniversary' && !h.secondName.trim()))) ||
            (step === 2 && h.role === 'organization' && !h.organizer.trim())
          ) {
            setError('请把这一步的基本信息填写完整。')
            return
          }
          if (step === 3 && (!h.date || !h.deadline || h.deadline > h.date)) {
            setError('请检查日期，截止时间不能晚于仪式。')
            return
          }
          setError('')
          if (step < 4) patch({ formStep: step + 1 })
          else {
            update({ configured: true })
            patch({ owned: true, stage: Math.max(1, s.stage) })
            setRole('coordinator')
            go('invite_manage')
            notify('邀请已准备好，可以从礼物工作台继续统筹。')
          }
        }}
      >
        {step === 4 ? '确认并生成邀请' : '下一步'}
        <ArrowRight />
      </Button>
      {step > 0 && (
        <button className="text-button" onClick={() => patch({ formStep: step - 1 })}>
          上一步
        </button>
      )}
    </div>
  )
}
export function Gifts({ go }: { go: (p: Page) => void }) {
  const { role, state, c, switchCase, setRole } = useDemo()
  const [filter, setFilter] = useState('active')
  const list = cases.filter((x) => {
    const s = state.cases[x.id]
    const mine = isManager(s) && (role === 'coordinator' || s.owned)
    return mine && (filter === 'done' ? !!s.version : !s.version)
  })

  return (
    <div className="phone-body">
      <div className="eyebrow">从这里，继续把心意整理成礼</div>
      <h2>我的礼物</h2>
      <div className="segmented">
        {[
          ['active', '进行中'],
          ['done', '已完成'],
        ].map(([v, t]) => (
          <button key={v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>
            {t}
          </button>
        ))}
      </div>
      {!list.length && (
        <Note>
          {filter === 'active'
            ? '这里会显示你发起并统筹的礼物。发起一份礼物，或接受统筹邀请后，可以在这里继续。'
            : '还没有已完成的礼物。'}
        </Note>
      )}
      {list.map((x) => {
        const cs = state.cases[x.id]
        return (
          <button
            className="gift-project"
            key={x.id}
            onClick={() => {
              if (x.id !== c.id) switchCase(x.id)
              setRole('coordinator')
              go(
                !cs.host.configured && cs.owned
                  ? 'host'
                  : cs.version
                    ? 'product'
                    : cs.letter.confirmed
                      ? 'product'
                      : 'workspace',
              )
            }}
          >
            <PhotoImage path={cs.host.cover} alt={cs.host.name} />
            <div>
              <small>
                {cs.owned && !cs.host.configured
                  ? '进行中'
                  : cs.version
                    ? '已完成'
                    : cs.letter.confirmed
                      ? '待预览确认'
                      : '共创中'}
              </small>
              <h3>
                {cs.host.address}的{x.category}
              </h3>
              <p>统筹者 {cs.coordinatorName}</p>
              <strong>
                {cs.owned && !cs.host.configured
                  ? '继续填写'
                  : cs.version
                    ? '查看成品'
                    : cs.letter.confirmed
                      ? '预览成品'
                      : '继续整理'}{' '}
                →
              </strong>
            </div>
          </button>
        )
      })}
    </div>
  )
}
export function Preparation({
  go,
  page = 'workspace',
}: {
  go: (p: Page) => void
  page?: Page
  compact?: boolean
}) {
  const { c, s, patch, notify, modal, closeModal } = useDemo()
  const tab = s.organizeTab ?? 1
  const setTab = (organizeTab: number) => patch({ organizeTab })
  const [transfer, setTransfer] = useState('')
  const blocks = collected(c.id, s)
  const media = photosFor(c.id, s)
  const photos = blocks.filter((b) => b.kind === 'photo')
  const stories = blocks.filter((b) => b.kind === 'story')
  const wishes = blocks.filter((b) => b.kind === 'wish')
  const count = new Set(blocks.map((b) => b.authorId)).size
  const stats = [
    ['印象', blocks.filter((b) => b.kind === 'impression').length],
    ['照片', photos.length],
    ['故事', stories.length],
    ['祝福', wishes.length],
    ['语音', blocks.filter((b) => b.audio).length],
  ]
  const review = (key: 'photos' | 'stories' | 'wishes') =>
    patch((old) => ({ review: { ...old.review, [key]: true, previewed: false } }))
  const mutate = (v: Partial<typeof s>) =>
    patch((old) => ({
      ...v,
      previewing: true,
      review: { ...old.review, previewed: false },
      letter: { ...old.letter, confirmed: false },
    }))
  const eligible = letterCurrent(c.id, s)
  const ready = canFreeze(c.id, s)
  if (!isManager(s))
    return (
      <div className="phone-body">
        <Gift size={40} />
        <h2>
          统筹已交给
          <br />
          {s.coordinatorName}。
        </h2>
        <Note>你仍可以参与共创。后续整理和确认由新统筹者负责。</Note>
        <Button onClick={() => go('gifts')}>返回我的礼物</Button>
      </div>
    )
  if (page === 'invite_manage')
    return (
      <div className="phone-body">
        <div className="eyebrow">邀请共创</div>
        <h2>
          把邀请，
          <br />
          送给记得的人。
        </h2>
        <PhotoImage path={s.host.cover} alt={s.host.name} className="host-cover" />
        <h3>
          {s.host.address}的{c.category}
        </h3>
        <p className="prose">
          已有{count}位参与者 · 共创截止 {s.host.deadline}
        </p>
        <div className="invitation-code">
          <Gift size={50} />
          <b>共创邀请</b>
          <small>演示入口 · 无需真实扫码</small>
        </div>
        <Button
          onClick={() =>
            modal(
              '共创邀请卡',
              <div className="share-postcard">
                <PhotoImage path={s.host.cover} alt={s.host.name} />
                <h2>
                  一起为{s.host.address}
                  <br />
                  留下心意。
                </h2>
                <p>一张照片、一个故事或一句祝福，都可以。</p>
                <small>
                  统筹者 {s.coordinatorName} · {s.host.deadline}前
                </small>
              </div>,
            )
          }
        >
          查看邀请卡
        </Button>
        <Button secondary onClick={() => go('workspace')}>
          进入礼物工作台
        </Button>
      </div>
    )
  if (page === 'handover')
    return (
      <div className="phone-body">
        <div className="eyebrow">项目管理</div>
        <h2>
          让合适的人，
          <br />
          继续照顾这份礼物。
        </h2>
        <p className="prose">当前统筹者：{s.coordinatorName}</p>
        <Field label="新的统筹者姓名">
          <input value={transfer} maxLength={20} onChange={(e) => setTransfer(e.target.value)} />
        </Field>
        <Button
          disabled={!transfer.trim() || transfer.trim() === s.coordinatorName}
          onClick={() => patch({ transferTo: transfer.trim() })}
        >
          发送统筹邀请（演示）
        </Button>
        {s.transferTo && (
          <div className="task-card">
            <h3>等待{s.transferTo}接受</h3>
            <p>接受前仍由你负责，确认后的仪式不会变化。</p>
            <Button
              onClick={() => {
                patch({ coordinatorName: s.transferTo, transferTo: '' })
                notify('对方已接受，原统筹者不再拥有整理与确认入口。')
              }}
            >
              演示对方接受
            </Button>
            <button className="text-button" onClick={() => patch({ transferTo: '' })}>
              取消移交
            </button>
          </div>
        )}
        <Toggle
          label="现场专用入口（可选）"
          checked={s.onsite}
          onChange={() => patch({ onsite: !s.onsite })}
        />
        <Note>没有专用入口，也能使用原共创邀请。此前没有参与的人同样可以加入。</Note>
      </div>
    )
  if (page === 'letter')
    return (
      <div className="phone-body coordinator-letter">
        <div className="eyebrow">整理成品 · 05</div>
        <h2>
          大家写给你的
          <br />
          一封信。
        </h2>
        <p className="prose">把多人记得的片段，整理成一份共同的感谢。</p>
        <div className="letter-inputs">
          {count}位参与者 · {stories.length}篇故事 · {photos.length}张照片 · {wishes.length}份祝福
        </div>
        {s.letter.text && !eligible && <Note>内容或精选有变化，请重新整理后确认。</Note>}
        <Button
          secondary
          onClick={() => {
            patch({ letter: generateLetter(c.id, s), review: { ...s.review, previewed: false } })
          }}
        >
          <SparkleIcon />
          {s.letter.text ? '重新整理一版' : '小叙整理第一版'}
        </Button>
        {s.letter.text && (
          <>
            <Field label="大家写给你的一封信">
              <WritingArea
                className="letter-editor"
                aria-label="大家写给你的一封信"
                value={s.letter.text}
                maxLength={3000}
                onChange={(e) =>
                  patch({
                    letter: { ...s.letter, text: e.target.value, confirmed: false },
                    review: { ...s.review, previewed: false },
                  })
                }
              />
            </Field>
            <small className="helper">
              基于当前投稿的示例整理稿 · 第{s.letter.revision}版，可轻度修改。
            </small>
            <Button
              disabled={!eligible || !s.letter.text.trim()}
              onClick={() => {
                patch({ letter: { ...s.letter, confirmed: true } })
                notify('这封信已确认，将随仪式版本一起保留。')
              }}
            >
              {s.letter.confirmed && eligible ? '这封信已确认' : '确认这封信'}
              <Check />
            </Button>
            <Button
              secondary
              disabled={!s.letter.confirmed || !eligible}
              onClick={() => go('product')}
            >
              预览相框成品
              <ArrowRight />
            </Button>
          </>
        )}
      </div>
    )
  if (page === 'product')
    return (
      <div className="phone-body">
        <div className="eyebrow">整理成品 · 06—07</div>
        <h2>
          最后看一遍，
          <br />
          再郑重送出去。
        </h2>
        <p className="helper">按长者最终看到的顺序预览。调整稿与已确认版本分开保留。</p>
        <div className="review-checklist">
          {[
            ['照片已检查', s.review.photos],
            ['重点故事已确认', s.review.stories],
            ['祝福已检查', s.review.wishes],
            ['总信已确认', s.letter.confirmed && eligible],
            ['成品已预览', s.review.previewed],
          ].map(([label, done]) => (
            <p key={String(label)}>
              <span>{done ? '✓' : '○'}</span>
              {label}
            </p>
          ))}
        </div>
        <Button
          onClick={() => {
            patch({ previewing: true })
            modal(
              '相框成品预览',
              <div className="product-preview">
                <Frame compact />
                <Button
                  onClick={() => {
                    patch((old) => ({ review: { ...old.review, previewed: true } }))
                    closeModal()
                  }}
                >
                  我已检查完整成品
                </Button>
              </div>,
            )
          }}
        >
          打开相框成品预览
        </Button>
        <Button
          disabled={!ready}
          onClick={() => {
            try {
              const v = freezeVersion(c.id, s)
              patch({ version: v, previewing: false, stage: 7, shareReady: true })
              notify(`仪式版本 V${v.number} 已确认，长者现在可以收到礼物。`)
            } catch (e) {
              notify((e as Error).message)
            }
          }}
        >
          {s.version ? '确认新的仪式版本' : '确认仪式版本'}
          <Check />
        </Button>
        {!ready && <Note>请先完成照片、故事、祝福、总信与预览检查，再确认交付。</Note>}
        {s.version && (
          <Button secondary onClick={() => go('share')}>
            查看项目完成卡
          </Button>
        )}
        <button className="text-button" onClick={() => go('organize')}>
          返回整理内容
        </button>
      </div>
    )
  if (page === 'organize')
    return (
      <div className="phone-body">
        <div className="eyebrow">整理成品 · 一步一步来</div>
        <h2>
          把零散的记得，
          <br />
          放到恰好的位置。
        </h2>
        <div className="segmented">
          {[1, 2, 3].map((i) => (
            <button key={i} className={tab === i ? 'active' : ''} onClick={() => setTab(i)}>
              {tasks[i]}
            </button>
          ))}
        </div>
        {tab === 1 && (
          <>
            <p className="helper">
              移除仅影响本次成品，作者原投稿仍保留。照片可前移、后移，或设为重点。
            </p>
            {[...photos]
              .sort((a, b) => {
                const ai = s.photoOrder.indexOf(a.photoIds[0]),
                  bi = s.photoOrder.indexOf(b.photoIds[0])
                return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi)
              })
              .map((b, i, arr) => {
                const p = media.find((p) => p.id === b.photoIds[0])
                if (!p) return null
                const move = (delta: number) => {
                  const ids = arr.map((x) => x.photoIds[0])
                  ;[ids[i], ids[i + delta]] = [ids[i + delta], ids[i]]
                  mutate({ photoOrder: ids })
                }
                return (
                  <div key={b.id} className="manage-photo">
                    <PhotoImage path={p.path} alt={p.caption} />
                    <p>{p.caption}</p>
                    <small>
                      {b.author} · {p.date || '时间未记录'}
                    </small>
                    <div className="manage-actions">
                      <button disabled={!i} aria-label={`前移 ${p.id}`} onClick={() => move(-1)}>
                        <ArrowUp />
                      </button>
                      <button
                        disabled={i === arr.length - 1}
                        aria-label={`后移 ${p.id}`}
                        onClick={() => move(1)}
                      >
                        <ArrowDown />
                      </button>
                      <button
                        className={s.heroPhotos.includes(p.id) ? 'selected' : ''}
                        onClick={() =>
                          mutate({
                            heroPhotos: s.heroPhotos.includes(p.id)
                              ? s.heroPhotos.filter((x) => x !== p.id)
                              : [...s.heroPhotos, p.id],
                          })
                        }
                      >
                        {s.heroPhotos.includes(p.id) ? '已设重点' : '设为重点'}
                      </button>
                      <button
                        onClick={() => mutate({ excludedPhotos: [...s.excludedPhotos, b.id] })}
                      >
                        从成品移除
                      </button>
                    </div>
                  </div>
                )
              })}
            {!!s.excludedPhotos.length && (
              <button className="text-button" onClick={() => mutate({ excludedPhotos: [] })}>
                恢复移除的{s.excludedPhotos.length}张照片
              </button>
            )}
            <Button
              onClick={() => {
                review('photos')
                setTab(2)
              }}
            >
              照片检查完成，去看故事
            </Button>
          </>
        )}
        {tab === 2 && (
          <>
            <Note>小叙已推荐内容较完整的故事。最多精选3篇，其他故事仍可在“所有心意”中阅读。</Note>
            {stories.map((b) => (
              <div className="task-card" key={b.id}>
                <label className="featured-choice">
                  <input
                    type="checkbox"
                    checked={s.featured.includes(b.id)}
                    onChange={() => {
                      if (!s.featured.includes(b.id) && s.featured.length >= 3) {
                        notify('最多精选3篇，请先取消一篇。')
                        return
                      }
                      mutate({
                        featured: s.featured.includes(b.id)
                          ? s.featured.filter((x) => x !== b.id)
                          : [...s.featured, b.id],
                      })
                    }}
                  />
                  <span>
                    <b>{b.title}</b>
                    <small>
                      {b.author} · {b.relation}
                    </small>
                  </span>
                </label>
                <button
                  className="text-button"
                  onClick={() => modal(b.title, <BlockCard block={b} />)}
                >
                  阅读全文
                </button>
                {s.featured.indexOf(b.id) > 0 && (
                  <button
                    className="text-button"
                    onClick={() => {
                      const ids = [...s.featured],
                        i = ids.indexOf(b.id)
                      ;[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]
                      mutate({ featured: ids })
                    }}
                  >
                    重点故事前移
                  </button>
                )}
              </div>
            ))}
            <Button
              onClick={() => {
                review('stories')
                setTab(3)
              }}
            >
              故事已确认，去看祝福
            </Button>
          </>
        )}
        {tab === 3 && (
          <>
            <p className="helper">
              {wishes.length}份文字祝福，{wishes.filter((b) => b.audio).length}
              份语音祝福。保留每个人自己的署名。
            </p>
            {wishes.map((b) => (
              <BlockCard block={b} small key={b.id} />
            ))}
            <Button
              onClick={() => {
                review('wishes')
                go('letter')
              }}
            >
              祝福检查完成，整理总信
            </Button>
          </>
        )}
      </div>
    )
  return (
    <div className="phone-body workspace">
      <div className="eyebrow">我正在统筹的礼物</div>
      <h2>
        {s.host.address}的{c.category}
      </h2>
      <div className="workspace-owner">
        统筹者：{s.coordinatorName}
        <button onClick={() => go('handover')}>移交统筹 →</button>
      </div>
      <section className="workspace-progress">
        <small>共创进度</small>
        <strong>
          {count}
          <em> / {Math.max(count, s.targetCount)}人</em>
        </strong>
        <div className="progress-track">
          <i style={{ width: `${Math.min(100, (count / s.targetCount) * 100)}%` }} />
        </div>
        <p>
          收集截止 {s.host.deadline} · 还可邀请{Math.max(0, s.targetCount - count)}人
        </p>
        <button onClick={() => go('invite_manage')}>继续邀请 →</button>
      </section>
      <div className="stats-grid five-stats">
        {stats.map(([t, n]) => (
          <div key={t}>
            <strong>{n}</strong>
            <small>{t}</small>
          </div>
        ))}
      </div>
      <div className="missing-note">
        {photos.length < 3
          ? '还可以补充几张重要照片。'
          : stories.length < 2
            ? '还可以邀请熟悉的人讲一个完整故事。'
            : '照片和故事已经齐备，可以继续整理成品。'}{' '}
        {!wishes.some((b) => b.audio) && '有一段亲口说出的祝福，会更有温度。'}
      </div>
      <h3>成品准备</h3>
      <div className="task-list">
        {tasks.map((t, i) => {
          const done = [
            !!blocks.length,
            s.review.photos,
            s.review.stories,
            s.review.wishes,
            s.letter.confirmed && eligible,
            s.review.previewed,
            !!s.version,
          ][i]
          return (
            <button
              key={t}
              onClick={() => {
                if (i >= 1 && i <= 3) setTab(i)
                go(i === 0 ? 'workspace' : i < 4 ? 'organize' : i === 4 ? 'letter' : 'product')
              }}
            >
              <i className={done ? 'done' : ''}>{done ? '✓' : String(i + 1).padStart(2, '0')}</i>
              <span>
                {t}
                <small>
                  {done ? '已完成' : i === 4 && s.letter.text ? '小叙已整理 · 待确认' : '待检查'}
                </small>
              </span>
              <ArrowRight size={18} />
            </button>
          )
        })}
      </div>
      <Button onClick={() => go('organize')}>
        继续整理成品
        <ArrowRight />
      </Button>
      {s.version && (
        <Note>仪式版本 V{s.version.number} 已保留。后来的投稿不会自动改写这份作品。</Note>
      )}
    </div>
  )
}
function SparkleIcon() {
  return <span>✧</span>
}
export function ShareCard() {
  const { c, s } = useDemo()
  return (
    <div className="phone-body">
      <div className="eyebrow">一起完成的一份礼物</div>
      {s.version ? (
        <div className="share-postcard">
          <PhotoImage path={s.host.cover} alt={s.host.name} />
          <small>我们一起，为你留下</small>
          <h2>
            {s.host.address}的<br />
            {c.category}
          </h2>
          <p>{new Set(s.version.blocks.map((b) => b.authorId)).size}位朋友 · 许多值得记住的瞬间</p>
          <p>故事留在这里，问候还会继续。</p>
          <small>项目完成卡 · 不公开个人投稿和联系方式</small>
        </div>
      ) : (
        <Note>礼物还在准备中，统筹者确认成品后，这里会生成一张项目完成卡。</Note>
      )}
    </div>
  )
}
