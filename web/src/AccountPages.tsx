import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  Bell,
  BookOpen,
  CaretLeft,
  CaretRight,
  User,
  UsersThree,
  PencilSimple,
  Trash,
  Plus,
  Camera,
} from '@phosphor-icons/react'
import { cases, type CaseId, asset } from './data'
import type { DemoState } from './store'
import { readLocalImage, mediaSrc } from './EntryFlow'

export default function AccountPages({
  state,
  setState,
  onStart,
}: {
  state: DemoState
  setState: Dispatch<SetStateAction<DemoState>>
  onStart: () => void
}) {
  const [view, setView] = useState<'home' | 'profile' | 'relations' | 'records' | 'reminders'>(
    'home',
  )
  const [edit, setEdit] = useState<CaseId | null>(null)
  const [relation, setRelation] = useState('')
  const [profile, setProfile] = useState(state.profile)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const [detail, setDetail] = useState<string | null>(null)
  const records = cases.flatMap((c) => {
    const s = state.cases[c.id]
    const list = [
      {
        key: 'memory',
        title: s.title,
        body: s.body,
        image: s.photo,
        kind: '礼前共创',
        voice: s.voice,
        sticker: s.sticker,
      },
      ...(s.onsiteSent
        ? [
            {
              key: 'onsite',
              title: '把今天，也留下来',
              body: s.onsiteBody,
              image: s.onsitePhoto,
              kind: '现场补充',
              voice: '',
              sticker: '',
            },
          ]
        : []),
      ...(s.delivery !== 'none'
        ? [
            {
              key: 'greeting',
              title: `${c.event}心意`,
              body: s.greeting,
              image: s.greetingPhoto,
              kind: '礼后问候',
              voice: s.greetingVoice,
              sticker: s.greetingSticker,
            },
          ]
        : []),
      ...s.greetingHistory.map((g, i) => ({
        key: `past-${i}`,
        title: `${c.event}心意 · ${i + 1}`,
        body: g.body,
        image: g.photo,
        kind: '礼后问候',
        voice: g.voice || '',
        sticker: g.sticker || '',
      })),
    ]
    return list
      .filter((r) => !s.deletedRecords.includes(r.key))
      .map((r) => ({
        ...r,
        id: `${c.id}:${r.key}`,
        person: s.host.configured ? s.host.recipientName : c.name,
        caseId: c.id,
      }))
  })
  const current = records.find((r) => r.id === detail)
  function remove() {
    setState((old) => {
      const next = { ...old, cases: { ...old.cases } }
      for (const id of selected) {
        const [caseId, key] = id.split(':') as [CaseId, string]
        next.cases[caseId] = {
          ...next.cases[caseId],
          deletedRecords: [...new Set([...next.cases[caseId].deletedRecords, key])],
        }
      }
      return next
    })
    setSelected([])
    setConfirm(false)
    setDetail(null)
    setNotice('已从我的记录列表删除。已定稿的仪式版本保留。')
  }
  return (
    <div className="phone-pad account-page">
      {view !== 'home' && (
        <button
          className="text-link"
          onClick={() => {
            setView('home')
            setDetail(null)
            setEdit(null)
            setNotice('')
          }}
        >
          <CaretLeft />
          返回我的
        </button>
      )}
      {view === 'home' ? (
        <>
          <button
            className="profile-heading editable-profile"
            onClick={() => {
              setProfile(state.profile)
              setView('profile')
            }}
          >
            {state.profile.avatar ? (
              <img className="my-avatar" src={mediaSrc(state.profile.avatar)} alt="我的头像" />
            ) : (
              <span className="my-avatar">{state.profile.name.slice(-1)}</span>
            )}
            <h2>{state.profile.name}</h2>
            <p>{state.profile.bio}</p>
            <small>
              编辑个人资料 <PencilSimple size={13} />
            </small>
          </button>
          {[
            { v: 'profile', label: '个人信息', icon: User },
            { v: 'reminders', label: '重要日子与提醒', icon: Bell },
            { v: 'relations', label: '我与参与过的人的关系', icon: UsersThree },
            { v: 'records', label: '我的共创记录', icon: BookOpen },
          ].map(({ v, label, icon: Icon }) => (
            <button
              className="list-button"
              key={v}
              onClick={() => {
                setView(v as typeof view)
                setProfile(state.profile)
              }}
            >
              <Icon size={20} />
              {label}
              <CaretRight />
            </button>
          ))}
          <button className="list-button" onClick={onStart}>
            <Plus size={20} />
            发起一场新活动
            <CaretRight />
          </button>
          <div className="notice">
            <p>人物关系按每个人分别设置，个人资料用于今后的署名。这里可以统一管理所有共创记录。</p>
          </div>
        </>
      ) : view === 'profile' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!profile.name.trim()) {
              setNotice('请填写昵称')
              return
            }
            setState((old) => ({
              ...old,
              profile,
              cases: Object.fromEntries(
                Object.entries(old.cases).map(([id, s]) => [id, { ...s, author: profile.name }]),
              ) as DemoState['cases'],
            }))
            setNotice('个人资料已保存，历史定稿署名不变。')
          }}
        >
          <h2>个人信息</h2>
          {profile.avatar ? (
            <img className="my-avatar" src={mediaSrc(profile.avatar)} alt="个人头像" />
          ) : (
            <span className="my-avatar">{profile.name.slice(-1)}</span>
          )}
          <label className="upload-control">
            <Camera />
            更换头像
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                try {
                  setProfile({ ...profile, avatar: await readLocalImage(e.target.files?.[0]) })
                } catch (err) {
                  setNotice((err as Error).message)
                }
              }}
            />
          </label>
          <label className="field-label">
            昵称／默认署名
            <input
              value={profile.name}
              maxLength={20}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label className="field-label">
            个人简介
            <input
              value={profile.bio}
              maxLength={100}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </label>
          <label className="field-label">
            所在城市（选填）
            <input
              value={profile.city}
              maxLength={30}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
            />
          </label>
          <button className="button" type="submit">
            保存个人信息
          </button>
        </form>
      ) : view === 'relations' ? (
        <>
          <h2>我与参与过的人的关系</h2>
          <p className="muted">每一段关系，都可以单独调整。</p>
          {cases.map((c) => (
            <div className="relation-card" key={c.id}>
              <div className="person-line">
                <img className="avatar small" src={asset(c.image)} alt={c.name} />
                <div>
                  <strong>
                    {state.cases[c.id].host.configured
                      ? state.cases[c.id].host.recipientName
                      : c.name}
                  </strong>
                  <span className="muted">{state.cases[c.id].relation}</span>
                </div>
                <button
                  className="text-link"
                  onClick={() => {
                    setEdit(c.id)
                    setRelation(state.cases[c.id].relation)
                  }}
                >
                  调整关系
                  <PencilSimple />
                </button>
              </div>
              {edit === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!relation.trim()) return
                    setState((old) => ({
                      ...old,
                      cases: { ...old.cases, [c.id]: { ...old.cases[c.id], relation } },
                    }))
                    setEdit(null)
                    setNotice(`已更新与${c.name}的关系`)
                  }}
                >
                  <label className="field-label">
                    我与{c.name}的关系
                    <input
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      maxLength={40}
                    />
                  </label>
                  <button className="button" type="submit">
                    保存这段关系
                  </button>
                </form>
              )}
            </div>
          ))}
        </>
      ) : view === 'reminders' ? (
        <>
          <h2>重要日子与提醒</h2>
          <p className="muted">下面是你参与过的每个人。</p>
          {cases.map((c) => (
            <div className="relation-card setting-line" key={c.id}>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.event} · {c.eventDate}
                </small>
              </span>
              <button
                className={`toggle ${state.cases[c.id].eventEnabled ? 'on' : ''}`}
                role="switch"
                aria-label={`${c.name}${c.event}提醒`}
                aria-checked={state.cases[c.id].eventEnabled}
                onClick={() =>
                  setState((old) => ({
                    ...old,
                    cases: {
                      ...old.cases,
                      [c.id]: { ...old.cases[c.id], eventEnabled: !old.cases[c.id].eventEnabled },
                    },
                  }))
                }
              >
                <span />
              </button>
            </div>
          ))}
        </>
      ) : (
        <>
          <h2>我的共创记录</h2>
          <p className="muted">全部人物的故事、照片与心意，共 {records.length} 份。</p>
          <select
            aria-label="按人物筛选记录"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setSelected([])
            }}
          >
            <option value="all">全部参与过的人</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {current ? (
            <article className="record-detail">
              <button className="text-link" onClick={() => setDetail(null)}>
                <CaretLeft />
                返回记录列表
              </button>
              <h3>{current.title}</h3>
              <p className="muted">
                送给{current.person} · {current.kind}
              </p>
              {current.image && <img src={mediaSrc(current.image)} alt="共创照片" />}
              {current.sticker && (
                <img className="selected-sticker" src={asset(current.sticker)} alt="祝福表情" />
              )}
              <p>{current.body}</p>
              {current.voice && <audio controls src={asset(current.voice)} />}
              <button
                className="text-link danger"
                onClick={() => {
                  setSelected([current.id])
                  setConfirm(true)
                }}
              >
                <Trash />
                删除这条记录
              </button>
            </article>
          ) : (
            <>
              {records
                .filter((r) => filter === 'all' || r.caseId === filter)
                .map((r) => (
                  <div className="record-row" key={r.id}>
                    <input
                      type="checkbox"
                      aria-label={`选择${r.person}的${r.title}`}
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, r.id]
                            : selected.filter((id) => id !== r.id),
                        )
                      }
                    />
                    <button onClick={() => setDetail(r.id)}>
                      <strong>{r.title}</strong>
                      <small>
                        送给{r.person} · {r.kind}
                      </small>
                    </button>
                    <button
                      aria-label={`删除${r.person}的${r.title}`}
                      onClick={() => {
                        setSelected([r.id])
                        setConfirm(true)
                      }}
                    >
                      <Trash size={17} />
                    </button>
                  </div>
                ))}
              {!records.length && <p className="empty-state">这里还没有记录。</p>}
              <button
                className="button secondary"
                disabled={!selected.length}
                onClick={() => setConfirm(true)}
              >
                删除选中的 {selected.length} 条记录
              </button>
            </>
          )}
          {confirm && (
            <div className="delete-confirm" role="alertdialog" aria-label="确认删除记录">
              <strong>删除这 {selected.length} 条记录？</strong>
              <p>
                从你的共创列表移除，其他人的记录不受影响。已定稿仪式不会被改写；正式撤回需下游同步，本页为演示。
              </p>
              <button className="button" onClick={remove}>
                确认删除
              </button>
              <button className="text-link full" onClick={() => setConfirm(false)}>
                暂不删除
              </button>
            </div>
          )}
        </>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </div>
  )
}
