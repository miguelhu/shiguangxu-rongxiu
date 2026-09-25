import { WritingArea } from './WritingAssist'
import { Review } from './Review'
import { useState } from 'react'
import { ArrowRight, Check, Gift } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, cases } from './data'
import { Host } from './model'
import { Button, Field, Note, Toggle, Upload } from './ui'
import { PhotoImage } from './media'
import Frame from './Frame'
import {
  collected,
  generateLetter,
  letterCurrent,
  canFreeze,
  freezeVersion,
  isManager,
  reviewsDone,
  deadlineText,
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
        <div className="eyebrow">这份礼物，从你开始</div>
        <h2>
          这次，想为谁
          <br />
          准备一份礼物？
        </h2>
        <p className="prose">先告诉我们，这份礼物送给谁，为什么准备。</p>
        {(
          [
            ['organization', '单位 / 团队来发起', '适合工会、人事、部门负责人等'],
            ['personal', '我来为一个人张罗', '适合家人、老师、前辈、朋友'],
            ['self', '我也想为自己留一份纪念', '邀请熟悉我的人，一起留下照片和故事'],
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
          <Field label="人物介绍（用于共创欢迎页）">
            <WritingArea
              placeholder="可以简单写写TA的经历、性格、兴趣、重要时间节点，让参与的人更快想起和TA有关的故事。"
              value={h.bio}
              maxLength={200}
              onChange={(e) => update({ bio: e.target.value })}
            />
          </Field>
          <PhotoImage path={h.cover} alt={h.name} className="host-cover" />
          <Upload onPhoto={(p) => update({ cover: p.path })} maxFiles={1}>
            更换封面照片
          </Upload>
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
            update({
              configured: true,
              showBio: true,
              showPhoto: false,
              showLogo: !!h.logo && h.role === 'organization',
              showInviteLogo: !!h.logo && h.role === 'organization',
              showEndLogo: !!h.organizer,
            })
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
export function Gifts({ go, embedded = false }: { go: (p: Page) => void; embedded?: boolean }) {
  const { state, c, switchCase, setRole } = useDemo()
  const [filter, setFilter] = useState('active')
  const list = cases.filter((x) => {
    const s = state.cases[x.id]
    const mine = x.category === '荣休礼' && isManager(s)
    return mine && (embedded || (filter === 'done' ? !!s.version : !s.version))
  })

  return (
    <div className={embedded ? 'embedded-gifts' : 'phone-body'}>
      {!embedded && <div className="eyebrow">从这里，继续把心意整理成礼</div>}
      <h2>我的礼物</h2>
      {embedded && (
        <div className="my-gift-statistics">
          <span>把大家的心意，整理成礼</span>
          <div className="stats-primary">
            <strong>{list.length}</strong>
            <span>份礼物由我统筹</span>
          </div>
          <div className="stats-grid">
            <div>
              <b>{list.filter((x) => !state.cases[x.id].version).length}</b>
              <span>统筹中</span>
            </div>
            <div>
              <b>{list.filter((x) => !!state.cases[x.id].version).length}</b>
              <span>已完成</span>
            </div>
            <div>
              <b>
                {list.reduce(
                  (n, x) =>
                    n + new Set(collected(x.id, state.cases[x.id]).map((b) => b.authorId)).size,
                  0,
                )}
              </b>
              <span>共同参与人次</span>
            </div>
          </div>
        </div>
      )}
      {!embedded && (
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
      )}
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
                  ? '统筹中'
                  : cs.version
                    ? '已完成'
                    : cs.letter.confirmed
                      ? '统筹中 · 待确认'
                      : '统筹中'}
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
  const [transfer, setTransfer] = useState('')
  const blocks = collected(c.id, s)
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
          已有{count}位参与者 · {deadlineText(s)}
        </p>
        <div className="invitation-code">
          <Gift size={50} />
          <b>共创邀请</b>
          <small>演示入口 · 无需真实扫码</small>
        </div>
        <Button
          onClick={() =>
            modal(
              '生成的共创邀请卡',
              <div className="share-postcard">
                <PhotoImage path={s.host.cover} alt={s.host.name} />
                <h2>
                  一起为{s.host.address}
                  <br />
                  留下心意。
                </h2>
                <p>一张照片、一个故事或一句祝福，都可以。</p>
                <PhotoImage
                  path={`images/invite-qr-${c.id}.svg`}
                  alt="共创邀请二维码"
                  className="invite-qr"
                />
                <InvitationActions />
                <small>
                  统筹者 {s.coordinatorName} · {s.host.deadline}前
                </small>
              </div>,
            )
          }
        >
          生成邀请卡
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
      </div>
    )
  if (page === 'letter' && !reviewsDone(s))
    return (
      <div className="phone-body">
        <h2>先把大家的心意检查一遍。</h2>
        <Note>照片、故事、祝福全部检查完成后，小叙再整理总信。</Note>
        <Button onClick={() => go('review_photos')}>开始检查内容</Button>
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
        {s.letter.text && !eligible && <Note>内容或整理顺序有变化，请重新整理后确认。</Note>}
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
  if (page === 'product' || page === 'freeze')
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
            ['故事已确认', s.review.stories],
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
          大屏端成品预览
        </Button>
        <Toggle
          label="确认后，在长者拆封时推送全员"
          checked={s.notifyAfterOpen !== false}
          onChange={() => patch({ notifyAfterOpen: s.notifyAfterOpen === false })}
        />
        {page === 'product' && (
          <Button secondary disabled={!s.review.previewed} onClick={() => go('freeze')}>
            进入版本确认
          </Button>
        )}
        {page === 'freeze' && (
          <Button
            disabled={!ready}
            onClick={() => {
              try {
                const v = freezeVersion(c.id, s)
                patch({
                  version: v,
                  previewing: false,
                  stage: 7,
                  shareReady: false,
                  collectionEnded: true,
                })
                notify(`仪式版本 V${v.number} 已确认，长者现在可以收到礼物。`)
              } catch (e) {
                notify((e as Error).message)
              }
            }}
          >
            {s.version ? '确认新的仪式版本' : '确认仪式版本'}
            <Check />
          </Button>
        )}
        {!ready && <Note>请先完成照片、故事、祝福、总信与预览检查，再确认交付。</Note>}
        {s.version && (
          <Button secondary onClick={() => go('share')}>
            查看项目完成卡
          </Button>
        )}
        <button className="text-button" onClick={() => go('review_photos')}>
          返回修改
        </button>
      </div>
    )
  if (['organize', 'review_photos', 'review_stories', 'review_wishes'].includes(page))
    return <Review page={page} go={go} />

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
          <em> / {s.targetCount}人</em>
        </strong>
        <div className="progress-track">
          <i style={{ width: `${Math.min(100, (count / s.targetCount) * 100)}%` }} />
        </div>
        <p>
          {deadlineText(s)} · 还可邀请{Math.max(0, s.targetCount - count)}人
        </p>
        <button onClick={() => go('invite_manage')}>继续邀请 →</button>
        <button onClick={() => go('board_manage')}>查看共创看板 →</button>
      </section>
      <Toggle
        label="现场继续共创（可选）"
        checked={s.onsite}
        onChange={() => patch({ onsite: !s.onsite })}
      />
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
              disabled={i === 4 && !reviewsDone(s)}
              onClick={() => {
                go(
                  (
                    [
                      'workspace',
                      'review_photos',
                      'review_stories',
                      'review_wishes',
                      'letter',
                      'product',
                      'freeze',
                    ] as Page[]
                  )[i],
                )
              }}
            >
              <i className={done ? 'done' : ''}>{done ? '✓' : String(i + 1).padStart(2, '0')}</i>
              <span>
                {t}
                <small>{done ? '已完成' : '待检查'}</small>
              </span>
              <ArrowRight size={18} />
            </button>
          )
        })}
      </div>
      <Button onClick={() => go('review_photos')}>
        继续整理成品
        <ArrowRight />
      </Button>
      {s.version && (
        <Note>仪式版本 V{s.version.number} 已保留。后来的投稿不会自动改写这份作品。</Note>
      )}
    </div>
  )
}
export function ShareCard() {
  const { c, s, role, modal, notify } = useDemo()
  return (
    <div className="phone-body">
      <div className="eyebrow">一起完成的一份礼物</div>
      {s.version && (role === 'coordinator' || s.openedAt) ? (
        <div className="share-postcard">
          <PhotoImage path={s.host.cover} alt={s.host.name} />
          <small>我们一起，为你留下</small>
          <h2>
            {s.host.address}的<br />
            {c.category}
          </h2>
          <p>{new Set(s.version.blocks.map((b) => b.authorId)).size}位朋友 · 许多值得记住的瞬间</p>
          <p>故事留在这里，问候还会继续。</p>
          <small>项目完成卡 · 不公开联系方式</small>
          <PhotoImage path="images/binding-demo-qr.svg" alt="项目完成卡二维码" className="completion-qr" />
          {s.openedAt && (
            <Button onClick={() => modal('大家共同完成的礼物', <Frame compact />)}>
              查看最终成品
            </Button>
          )}
          <div className="completion-card-actions">
            <Button secondary onClick={() => notify('项目完成卡已准备为图片，可长按保存（演示）。')}>点击保存</Button>
            <Button onClick={async () => {
              const url = location.href
              try {
                if (navigator.share) await navigator.share({ title: `${s.host.address}的${c.category}`, url })
                else { await navigator.clipboard.writeText(url); notify('分享链接已复制。') }
              } catch { notify('暂未分享，可稍后重试。') }
            }}>一键分享</Button>
          </div>
        </div>
      ) : (
        <Note>礼物准备好后，等长者正式拆封，我们会再告诉你。</Note>
      )}
    </div>
  )
}

function InvitationActions() {
  const { c, s, notify } = useDemo()
  const url = `${location.origin}/?case=${c.id}&role=contributor&page=invite&mode=experience`
  const saveCard = async () => {
    try {
      const cover = document.querySelector<HTMLImageElement>('.share-postcard > img')
      const qr = document.querySelector<HTMLImageElement>('.share-postcard .invite-qr')
      if (!cover || !qr) throw Error('images')
      await Promise.all([cover.decode(), qr.decode()])
      const canvas = document.createElement('canvas')
      canvas.width = 720
      canvas.height = 1040
      const x = canvas.getContext('2d')!
      x.fillStyle = '#fbf5eb'
      x.fillRect(0, 0, 720, 1040)
      const ratio = Math.max(640 / cover.naturalWidth, 360 / cover.naturalHeight)
      x.save()
      x.beginPath()
      x.rect(40, 40, 640, 360)
      x.clip()
      x.drawImage(
        cover,
        40 + (640 - cover.naturalWidth * ratio) / 2,
        40 + (360 - cover.naturalHeight * ratio) / 2,
        cover.naturalWidth * ratio,
        cover.naturalHeight * ratio,
      )
      x.restore()
      x.fillStyle = '#426452'
      x.font = '32px serif'
      x.textAlign = 'center'
      x.fillText('拾光叙 · 共创邀请', 360, 458)
      x.font = '34px serif'
      x.fillText('一起为' + s.host.address + '准备' + c.category, 360, 524, 640)
      x.fillStyle = '#889579'
      x.font = '20px sans-serif'
      x.fillText('一张照片、一个故事或一句祝福，都可以。', 360, 572, 640)
      x.drawImage(qr, 240, 605, 240, 240)
      x.fillText('微信扫一扫，留下你的心意', 360, 884)
      x.font = '18px sans-serif'
      x.fillText('统筹者 ' + s.coordinatorName + ' · ' + s.host.deadline + '前', 360, 940, 640)
      x.fillText('案例与二维码为展示用途', 360, 986)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(Error('image'))), 'image/png'),
      )
      const href = URL.createObjectURL(blob),
        a = document.createElement('a')
      a.href = href
      a.download = '拾光叙-' + s.host.address + '-邀请卡.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(href), 1000)
      notify('邀请卡图片已生成，可保存后在微信转发。')
    } catch {
      notify('图片暂时未生成，可先复制邀请链接。')
    }
  }
  return (
    <div className="invitation-actions">
      <Button secondary onClick={saveCard}>
        保存邀请卡图片
      </Button>
      <Button
        onClick={async () => {
          try {
            if (navigator.share)
              await navigator.share({
                title: `一起为${s.host.address}准备${c.category}`,
                text: '一张照片、一个故事或一句祝福，都可以。',
                url,
              })
            else {
              await navigator.clipboard.writeText(url)
              notify('邀请链接已复制，可粘贴到微信转发。')
            }
          } catch (e) {
            if ((e as Error).name !== 'AbortError') notify('分享未完成，可复制邀请链接。')
          }
        }}
      >
        转发邀请卡
      </Button>
      <button
        className="text-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            notify('邀请链接已复制，可转发给共创者。')
          } catch {
            notify('复制未成功，请手动复制下方链接。')
          }
        }}
      >
        复制邀请链接
      </button>
      <input aria-label="邀请链接" readOnly value={url} />
    </div>
  )
}

function SparkleIcon() {
  return <span>✧</span>
}
