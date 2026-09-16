import { WritingArea } from './WritingAssist'
import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  BookOpen,
  Camera,
  Heart,
  UserCircle,
  UsersThree,
  Trash,
  Gear,
  FrameCorners,
} from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page, CaseId, cases, datasets, relationLabel } from './data'
import { available, Block, photosFor } from './model'
import { Avatar, Button, Field, Note, Toggle, Upload } from './ui'
import { PhotoImage } from './media'
import { RelationChooser, BlockCard } from './Contributor'
import { Gifts } from './Preparation'
import Frame from './Frame'
import { birthdays } from './workflow'
export function Account({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, state, setState, patch, switchCase, modal, closeModal, notify } = useDemo()
  const [query, setQuery] = useState('')
  const [completion, setCompletion] = useState('completed')
  const [personFilter, setPersonFilter] = useState('all')
  const [kind, setKind] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<CaseId | null>(null)
  const actor =
    datasets[c.id].authors.find((a) => a.id === s.draft.authorId) || datasets[c.id].authors[0]
  const isLin = actor.userId === 'user-linyue'
  const profile =
    state.profiles?.[actor.userId] ||
    (isLin
      ? state.profile
      : { name: s.draft.name, bio: '留下回忆，也带来新的心意', phone: s.draft.phone, avatar: '' })
  const [form, setForm] = useState(profile)
  const related = cases.filter((x) => datasets[x.id].authors.some((a) => a.userId === actor.userId))
  const ownRecords = related.flatMap((x) => {
    const owner = datasets[x.id].authors.find((a) => a.userId === actor.userId)!
    return available(x.id, state.cases[x.id])
      .filter((b) => b.authorId === owner.id)
      .map((b) => ({ ...b, caseId: x.id, recipient: state.cases[x.id].host.address }))
  })
  function personCard(x: (typeof cases)[number]) {
    const cs = state.cases[x.id]
    const a = datasets[x.id].authors.find((a) => a.userId === actor.userId)!
    const rel = cs.connections[a.id]
    return (
      <button
        className="person-card"
        key={x.id}
        onClick={() => {
          switchCase(x.id)
          go(cs.contributionStarted && !cs.submission ? 'welcome' : 'person')
        }}
      >
        <PhotoImage path={cs.host.cover} alt={x.name} />
        <div>
          <small>
            {x.category} · {cs.contributionStarted && !cs.submission ? '未完成' : '已完成'}
          </small>
          <h3>{cs.host.address}</h3>
          <p>{relationLabel(rel?.primary || a.relationCodes[0])}</p>
          <span>
            {cs.contributionStarted && !cs.submission
              ? '继续填写 → · 截止 ' + cs.host.deadline
              : '生日 · ' + birthdays[x.id]}
          </span>
          <small>
            {cs.host.date} · {x.category}
          </small>
          <small>最近送出 · {cs.lastSent || '参与过这份礼物'}</small>
        </div>
        <ArrowRight size={20} />
      </button>
    )
  }
  if (page === 'people')
    return (
      <div className="phone-body">
        <div className="eyebrow">从一次共创，到下一次问候</div>
        <h2>
          有些人，
          <br />
          值得一直惦记。
        </h2>
        <div className="segmented completion-tabs">
          {[
            ['completed', '已完成'],
            ['unfinished', '未完成'],
          ].map(([v, t]) => (
            <button
              key={v}
              className={completion === v ? 'active' : ''}
              aria-pressed={completion === v}
              onClick={() => setCompletion(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="people-list">
          {related
            .filter((x) => {
              const cs = state.cases[x.id]
              const unfinished = cs.contributionStarted && !cs.submission
              return completion === 'unfinished' ? unfinished : !unfinished
            })
            .map(personCard)}
        </div>
        {!related.some((x) =>
          completion === 'unfinished'
            ? state.cases[x.id].contributionStarted && !state.cases[x.id].submission
            : !(state.cases[x.id].contributionStarted && !state.cases[x.id].submission),
        ) && (
          <Note>
            {completion === 'unfinished' ? '没有待完成的共创邀请。' : '还没有已完成的共创。'}
          </Note>
        )}
        <Note>按人物记住你的参与。仪式结束后，也能从这里送去新的心意。</Note>
      </div>
    )
  if (page === 'person')
    return (
      <div className="phone-body">
        <PhotoImage path={s.host.cover} alt={s.host.name} className="person-hero" />
        <div className="eyebrow">我参与过的人</div>
        <h2>{s.host.address}</h2>

        <div className="detail-list">
          <p>
            我们的关系
            <span>{relationLabel(s.connections[actor.id]?.primary || actor.relationCodes[0])}</span>
          </p>
          <p>
            参加过的礼物
            <span>
              {c.category} · {s.host.date}
            </span>
          </p>
          <p>
            生日
            <span>{birthdays[c.id]}</span>
          </p>
        </div>
        <p className="helper">上次送心意：{s.lastSent || s.host.date}</p>
        <Button onClick={() => go('greeting')}>
          发一张近况照片
          <Heart size={18} />
        </Button>
        <Button secondary onClick={() => go('invite')}>
          打开原来的共创邀请
        </Button>
        <button className="text-button" onClick={() => go('records')}>
          查看我的投稿
        </button>
        <Toggle
          label="重要日子提醒我"
          checked={s.remind}
          onChange={() => patch({ remind: !s.remind })}
        />
        <Toggle
          label="演示受礼者允许接收问候"
          checked={s.receive}
          onChange={() => patch({ receive: !s.receive })}
        />
      </div>
    )
  if (page === 'me')
    return (
      <div className="phone-body me-home">
        <button className="settings-entry" aria-label="设置" onClick={() => go('settings')}>
          <Gear size={25} />
          <span>设置</span>
        </button>
        <div className="profile-header">
          <Avatar
            name={state.role === 'coordinator' ? s.coordinatorViewer : profile.name}
            path={state.role === 'coordinator' ? '' : profile.avatar}
            size="large"
          />
          <h2>{state.role === 'coordinator' ? s.coordinatorViewer : profile.name}</h2>
          <p>{state.role === 'coordinator' ? '把大家的心意，郑重整理成礼。' : profile.bio}</p>
        </div>
        <button className="start-gift-card" onClick={() => go('entry')}>
          <span className="create-frame-icon">
            <FrameCorners size={38} />
            <i>＋</i>
          </span>
          <b>为重要的人，准备一份大家共同完成的礼物。</b>
          <span>看看拾光叙可以怎么送 →</span>
        </button>
        <Gifts go={go} embedded />
      </div>
    )
  if (page === 'settings')
    return (
      <div className="phone-body">
        <div className="eyebrow">我的设置</div>
        <h2>把自己的信息，安心收好。</h2>
        <div className="account-menu">
          {(
            [
              ['profile', '个人资料', UserCircle],
              ['relations', '与我参与过的人的关系', UsersThree],
              ['records', '我的共创记录', BookOpen],
              ['preferences', '重要日子与提醒', Bell],
            ] as const
          ).map(([p, t, I]) => (
            <button key={p} onClick={() => go(p)}>
              <I size={23} />
              <span>{t}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        <Note>每一段关系、每一次提醒，都可以按人调整。</Note>
      </div>
    )
  if (page === 'profile')
    return (
      <div className="phone-body">
        <div className="eyebrow">我的资料</div>
        <h2>
          把自己的样子，
          <br />
          留在每份心意里。
        </h2>
        <Avatar name={form.name} path={form.avatar} size="large" />
        <Upload onPhoto={(p) => setForm({ ...form, avatar: p.path })}>
          <Camera size={20} />
          修改头像
        </Upload>
        <Field label="我的署名">
          <input
            value={form.name}
            maxLength={20}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="一句介绍">
          <WritingArea
            value={form.bio}
            maxLength={100}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <Field label="联系电话（可选）">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Button
          onClick={() => {
            if (form.name.trim().length < 2) {
              notify('请填写至少2个字的署名')
              return
            }
            setState((old) => ({
              ...old,
              profiles: { ...old.profiles, [actor.userId]: form },
              profile: isLin ? form : old.profile,
              cases: Object.fromEntries(
                cases.map((x) => [
                  x.id,
                  {
                    ...old.cases[x.id],
                    draft:
                      datasets[x.id].authors.find((a) => a.id === old.cases[x.id].draft.authorId)
                        ?.userId === actor.userId
                        ? { ...old.cases[x.id].draft, name: form.name, phone: form.phone }
                        : old.cases[x.id].draft,
                  },
                ]),
              ) as typeof old.cases,
            }))
            notify('个人资料已保存；以前的投稿署名保留当时版本。')
            go('me')
          }}
        >
          保存资料
        </Button>
        <button className="text-button" onClick={() => go('me')}>
          取消
        </button>
      </div>
    )
  if (page === 'relations') {
    const target = editing && cases.find((x) => x.id === editing)
    const ta = target && datasets[target.id].authors.find((a) => a.userId === actor.userId)
    const cs = target && state.cases[target.id]
    const rel = ta && cs && cs.connections[ta.id]
    const setRel = (v: Partial<NonNullable<typeof rel>>) => {
      if (!target || !ta || !rel) return
      setState((old) => ({
        ...old,
        cases: {
          ...old.cases,
          [target.id]: {
            ...old.cases[target.id],
            draft:
              old.cases[target.id].draft.authorId === ta.id
                ? { ...old.cases[target.id].draft, ...v }
                : old.cases[target.id].draft,
            connections: {
              ...old.cases[target.id].connections,
              [ta.id]: { ...old.cases[target.id].connections[ta.id], ...v },
            },
          },
        },
      }))
    }
    return (
      <div className="phone-body">
        <div className="eyebrow">每一个人，每一段关系</div>
        <h2>我与他们的关系</h2>
        {target && rel ? (
          <>
            <h3>我是{target.address}的什么人？</h3>
            <RelationChooser
              codes={rel.codes}
              primary={rel.primary}
              onChange={(codes) => setRel({ codes })}
              onPrimary={(primary) => setRel({ primary })}
            />
            {target.id === 'anniversary' && (
              <>
                <h3>我是苏文澜的什么人？</h3>
                <RelationChooser
                  codes={rel.secondaryCodes || cs.draft.secondaryCodes}
                  primary={(rel.secondaryCodes || cs.draft.secondaryCodes)[0] || ''}
                  onChange={(secondaryCodes) => setRel({ secondaryCodes })}
                  onPrimary={(p) =>
                    setRel({
                      secondaryCodes: [
                        p,
                        ...(rel.secondaryCodes || cs.draft.secondaryCodes).filter((x) => x !== p),
                      ],
                    })
                  }
                />
              </>
            )}
            <Button
              onClick={() => {
                notify('这段关系已保存')
                setEditing(null)
              }}
            >
              完成
            </Button>
          </>
        ) : (
          <>
            <input
              className="search-input"
              placeholder="搜索参与过的人"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {related
              .filter((x) => (x.name + x.address).includes(query))
              .map((x) => {
                const author = datasets[x.id].authors.find((a) => a.userId === actor.userId)!
                const relation = state.cases[x.id].connections[author.id]
                return (
                  <button className="relationship-row" key={x.id} onClick={() => setEditing(x.id)}>
                    <Avatar name={x.name} path={state.cases[x.id].host.cover} />
                    <span>
                      <b>{state.cases[x.id].host.address}</b>
                      <small>{relation.codes.map(relationLabel).join(' · ')}</small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                )
              })}
          </>
        )}
        <Note>主要关系用于署名和话题推荐，不会自动改写以前的投稿。</Note>
      </div>
    )
  }
  if (page === 'records') {
    const list = ownRecords.filter(
      (b) =>
        (personFilter === 'all' || b.caseId === personFilter) &&
        (kind === 'all' || b.kind === kind) &&
        (b.body + b.title + b.recipient).includes(query),
    )
    const withdraw = (items: typeof list) =>
      modal(
        `撤回这${items.length}项内容`,
        <>
          <p className="prose">
            {items
              .slice(0, 3)
              .map((b) => `${b.recipient} · ${b.title || b.body.slice(0, 20) || '印象标签'}`)
              .join('；')}
            。撤回后，后续在线展示不再使用这些内容。
          </p>
          <Button
            onClick={() => {
              setState((old) => {
                const updated = { ...old.cases }
                for (const id of new Set(items.map((b) => b.caseId))) {
                  updated[id] = {
                    ...updated[id],
                    withdrawn: [
                      ...new Set([
                        ...updated[id].withdrawn,
                        ...items.filter((b) => b.caseId === id).map((b) => b.id),
                      ]),
                    ],
                  }
                }
                return { ...old, cases: updated }
              })
              setSelected([])
              closeModal()
              notify('所选内容已撤回')
            }}
          >
            确认撤回
          </Button>
        </>,
      )
    return (
      <div className="phone-body">
        <div className="eyebrow">我留下过的每一份心意</div>
        <h2>我的共创记录</h2>
        <p className="helper">跨人物、跨礼物查看，也可以选择多项管理。</p>
        <div className="filter-row">
          <select
            aria-label="按人物筛选"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          >
            <option value="all">所有人物</option>
            {related.map((x) => (
              <option key={x.id} value={x.id}>
                {x.address}
              </option>
            ))}
          </select>
          <select
            aria-label="按内容类型筛选"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">全部内容</option>
            <option value="story">故事</option>
            <option value="photo">照片</option>
            <option value="wish">祝福</option>
            <option value="impression">印象</option>
          </select>
        </div>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索我的记录"
        />
        {selected.length > 0 && (
          <Button
            secondary
            onClick={() => withdraw(ownRecords.filter((b) => selected.includes(b.id)))}
          >
            <Trash size={17} />
            撤回所选 {selected.length} 项
          </Button>
        )}
        <div className="record-list">
          {list.map((b) => (
            <div className="record-item" key={b.id}>
              <label>
                <input
                  type="checkbox"
                  aria-label={`选择 ${b.id}`}
                  checked={selected.includes(b.id)}
                  onChange={() =>
                    setSelected((v) =>
                      v.includes(b.id) ? v.filter((x) => x !== b.id) : [...v, b.id],
                    )
                  }
                />
              </label>
              <button
                className="record-copy"
                onClick={() =>
                  modal(
                    `${b.recipient} · 我的投稿`,
                    <>
                      <BlockCard block={b} />
                      <Button
                        onClick={() =>
                          modal('编辑这项投稿', <RecordEditor block={b} caseId={b.caseId} />)
                        }
                      >
                        编辑内容与用途
                      </Button>
                      <Button secondary onClick={() => withdraw([b])}>
                        撤回这项内容
                      </Button>
                    </>,
                  )
                }
              >
                <small>
                  {b.recipient} ·{' '}
                  {b.kind === 'story'
                    ? '回忆'
                    : b.kind === 'photo'
                      ? '照片'
                      : b.kind === 'wish'
                        ? '祝福'
                        : '印象'}
                </small>
                <strong>{b.title || b.body || b.tags.join('、')}</strong>
                <span>已提交 · {b.scope.ceremony ? '允许仪式展示' : '私人心意'}</span>
              </button>
              <button aria-label={`撤回 ${b.id}`} onClick={() => withdraw([b])}>
                <Trash size={17} />
              </button>
            </div>
          ))}
        </div>
        {!list.length && <Note>这里还没有对应的记录。清除筛选，或再留下一份心意。</Note>}
      </div>
    )
  }
  if (page === 'preferences')
    return (
      <div className="phone-body">
        <div className="eyebrow">你选择记得的人</div>
        <h2>
          重要的日子，
          <br />
          轻轻提醒一下。
        </h2>
        {related.map((x) => {
          const cs = state.cases[x.id]
          const p = (v: Partial<typeof cs>) =>
            setState((old) => ({
              ...old,
              cases: { ...old.cases, [x.id]: { ...old.cases[x.id], ...v } },
            }))
          return (
            <div className="preference-card" key={x.id}>
              <h3>{x.address}</h3>
              <p>
                {x.event} · {x.eventDate}
              </p>
              <Toggle
                label={`提醒我问候${x.address}`}
                checked={cs.remind}
                onChange={() => p({ remind: !cs.remind })}
              />
              <Toggle
                label="提前3天提醒"
                checked={cs.advance}
                onChange={() => p({ advance: !cs.advance })}
              />
              <Toggle
                label="也希望通过服务号收到提醒"
                checked={cs.channel}
                onChange={() => p({ channel: !cs.channel })}
              />
              <small>服务号为演示渠道，实际发送能力未接入。</small>
            </div>
          )
        })}
      </div>
    )
  return null
}
function RecordEditor({ block, caseId }: { block: Block; caseId: CaseId }) {
  const { setState, notify, closeModal } = useDemo()
  const [edited, setEdited] = useState({ ...block, scope: { ...block.scope } })
  return (
    <div className="record-editor">
      {block.kind === 'story' && (
        <Field label="回忆标题">
          <WritingArea
            rows={1}
            value={edited.title}
            maxLength={40}
            onChange={(e) => setEdited({ ...edited, title: e.target.value })}
          />
        </Field>
      )}
      {block.kind === 'impression' ? (
        <Field label="印象标签，用顿号分开">
          <WritingArea
            rows={1}
            value={edited.tags.join('、')}
            onChange={(e) =>
              setEdited({ ...edited, tags: e.target.value.split('、').filter(Boolean).slice(0, 8) })
            }
          />
        </Field>
      ) : (
        <Field label={block.kind === 'photo' ? '照片说明' : '我的内容'}>
          <WritingArea
            rows={8}
            maxLength={block.kind === 'story' ? 2000 : 300}
            value={edited.body}
            onChange={(e) => setEdited({ ...edited, body: e.target.value })}
          />
        </Field>
      )}
      <Toggle
        label="允许在仪式中展示"
        checked={edited.scope.ceremony}
        onChange={() =>
          setEdited({ ...edited, scope: { ...edited.scope, ceremony: !edited.scope.ceremony } })
        }
      />
      <Toggle
        label="允许仪式后保留"
        checked={edited.scope.keep}
        onChange={() =>
          setEdited({ ...edited, scope: { ...edited.scope, keep: !edited.scope.keep } })
        }
      />
      <Note>修改生成新修订；已确认的仪式保留原文。撤回或收紧展示范围会立即停止后续在线展示。</Note>
      <Button
        onClick={() => {
          if (edited.kind === 'story' && !edited.body.trim()) {
            notify('请留下故事正文')
            return
          }
          setState((old) => {
            const current = old.cases[caseId]
            return {
              ...old,
              cases: {
                ...old.cases,
                [caseId]: {
                  ...current,
                  blocks: [
                    ...current.blocks.filter((b) => b.id !== block.id),
                    { ...edited, revision: block.revision + 1 },
                  ],
                  assets:
                    edited.kind === 'photo'
                      ? photosFor(caseId, current)
                          .filter((p) => edited.photoIds.includes(p.id))
                          .map((p) => ({ ...p, caption: edited.body }))
                          .concat(current.assets.filter((p) => !edited.photoIds.includes(p.id)))
                      : current.assets,
                },
              },
            }
          })
          closeModal()
          notify('投稿已更新')
        }}
      >
        保存修改
      </Button>
    </div>
  )
}
export function Messages({ go }: { go: (p: Page) => void }) {
  const { c, s, patch, modal } = useDemo()
  return (
    <div className="phone-body">
      <div className="eyebrow">重要日子，再问候</div>
      <h2>
        值得记得的人，
        <br />
        有了新的问候理由。
      </h2>
      <button
        className="notification-card collection-notice"
        onClick={() => {
          modal(
            '收集完成 · 相框内容预览',
            <div className="product-preview">
              <Frame compact />
              <p className="helper">这是整理稿预览，最终展示以统筹者确认的仪式版本为准。</p>
            </div>,
          )
        }}
      >
        <span>礼物进展 · 收集完成通知</span>
        <h3>{s.host.address}的心意，已收集完毕。</h3>
        <p>
          {s.collectionEnded || s.version
            ? '统筹者已结束收集，看看大家的心意将如何出现在相框里。'
            : '展示示例：统筹者结束收集后，你会在这里收到通知。'}
        </p>
        <b>查看相框内容 →</b>
      </button>
      {s.openedAt && s.shareReady && (
        <button
          className="notification-card"
          onClick={() => {
            patch({ notificationRead: true })
            go('share')
          }}
        >
          <span>成品消息 · 新的提醒</span>
          <h3>{s.host.address}已经打开大家一起准备的礼物</h3>
          <p>谢谢你的参与，一起看看最终成品。</p>
          <b>查看最终成品 →</b>
        </button>
      )}
      <button
        className="notification-card"
        onClick={() => {
          patch({ notificationRead: true })
          go('greeting')
        }}
      >
        <span>
          {c.eventDate} · {s.notificationRead ? '已查看' : '新的提醒'}
        </span>
        <h3>
          {c.event}，给{s.host.address}说句话吧。
        </h3>
        <PhotoImage path={s.host.cover} alt={s.host.name} />
        <p>
          你曾为{s.host.address}的{c.category}留下心意。今天，再把近况说给对方听吧。
        </p>
        <b>
          送一份祝福 <ArrowRight size={18} />
        </b>
      </button>
    </div>
  )
}
