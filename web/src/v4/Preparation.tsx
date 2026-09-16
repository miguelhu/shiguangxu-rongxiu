import { useState } from 'react'
import { ArrowRight, Check, UsersThree, Camera, BookOpen, Heart, Plus } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Page } from './data'
import { available, photosFor, Host } from './model'
import { Button, Field, Note, Toggle, Upload } from './ui'
import { PhotoImage } from './media'
import { BlockCard } from './Contributor'
export function Entry({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { c, s, patch, notify } = useDemo()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const h = s.host
  const set = (v: Partial<Host>) => patch((x) => ({ host: { ...x.host, ...v } }))
  if (page === 'entry')
    return (
      <div className="phone-body">
        <div className="eyebrow">从你开始，聚起大家的心意</div>
        <h2>
          想为谁，
          <br />
          留下一份纪念？
        </h2>
        <p className="prose">一场仪式，一份由许多人共同完成的礼物。</p>
        {(
          [
            ['organization', '代表单位或团队主办', '工会、人事、部门或团队代表'],
            ['personal', '我想为一个人张罗', '为家人、老师或同行的人'],
            ['self', '我想为自己留一份纪念', '把亲友记得的故事，收在一起'],
          ] as const
        ).map(([role, t, sub]) => (
          <button
            className="entry-card"
            key={role}
            onClick={() => {
              set({
                role,
                organizer:
                  role === 'organization' ? c.host : role === 'personal' ? '家人与朋友' : '',
                showLogo: role === 'organization',
                showInviteLogo: role === 'organization',
                showEndLogo: role === 'organization',
              })
              go('host')
            }}
          >
            <span>
              <h3>{t}</h3>
              <p>{sub}</p>
            </span>
            <ArrowRight size={23} />
          </button>
        ))}
        <button className="text-button" onClick={() => go('invite')}>
          我收到邀请来参与
        </button>
      </div>
    )
  const titles = [
    '这份礼物，由你开始',
    '先介绍一下受礼者',
    '把主办的心意，也留下',
    '选一个相聚的日子',
    '看看这份邀请',
  ]
  return (
    <div className="phone-body">
      <div className="eyebrow">
        发起一份{c.category} · {step + 1} / 5
      </div>
      <h2>{titles[step]}</h2>
      <div className="form-progress">
        {titles.map((_, i) => (
          <i key={i} className={i <= step ? 'active' : ''} />
        ))}
      </div>
      {step === 0 && (
        <>
          <Field label="我以什么身份来张罗">
            <select value={h.role} onChange={(e) => set({ role: e.target.value as Host['role'] })}>
              <option value="organization">代表单位或团队</option>
              <option value="personal">个人牵头</option>
              <option value="self">本人发起</option>
            </select>
          </Field>
          {h.role === 'organization' && (
            <Field label="我的经办角色">
              <select
                value={h.operatorRole}
                onChange={(e) => set({ operatorRole: e.target.value })}
              >
                {['工会／人事', '部门负责人', '行政经办', '团队代表', '其他经办'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}
          <Note>
            {h.role === 'self'
              ? '你填写自己的介绍，亲友再留下他们记得的片段。'
              : '主办不等于主创。可以有人精选，也可以交给系统整理。'}
          </Note>
        </>
      )}
      {step === 1 && (
        <>
          <Field label={h.role === 'self' ? '我的名字' : '受礼者姓名'}>
            <input value={h.name} maxLength={30} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          {c.id === 'anniversary' && (
            <Field label="另一位受礼者">
              <input
                value={h.secondName}
                maxLength={30}
                onChange={(e) => set({ secondName: e.target.value })}
              />
            </Field>
          )}
          <Field label="邀请中的称呼">
            <input
              value={h.address}
              maxLength={30}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Field>
          <Field label="一小段介绍">
            <textarea
              value={h.bio}
              maxLength={200}
              onChange={(e) => set({ bio: e.target.value })}
            />
          </Field>
          <PhotoImage path={h.cover} alt={h.name} className="host-cover" />
          <Upload onPhoto={(p) => set({ cover: p.path })}>
            <Camera size={21} />
            更换封面照片
          </Upload>
          <Upload onPhoto={(p) => set({ introPhotos: [...h.introPhotos, p.path].slice(0, 6) })}>
            <Plus size={20} />
            添加介绍照片（可选）
          </Upload>
          <div className="photo-strip">
            {h.introPhotos.map((path) => (
              <button
                key={path}
                onClick={() => set({ introPhotos: h.introPhotos.filter((x) => x !== path) })}
              >
                <PhotoImage path={path} alt="人物介绍照片" />
                <small>移除</small>
              </button>
            ))}
          </div>
          <Toggle
            label="向共创者展示人物介绍"
            checked={h.showBio}
            onChange={() => set({ showBio: !h.showBio })}
          />
          <Toggle
            label="向共创者展示介绍照片"
            checked={h.showPhoto}
            onChange={() => set({ showPhoto: !h.showPhoto })}
          />
          {c.id === 'birthday' && (
            <Toggle
              label="在生日主题中显示年龄"
              checked={h.showAge}
              onChange={() => set({ showAge: !h.showAge })}
            />
          )}
          {c.id==='birthday'&&h.showAge&&<Field label="生日年龄（可选）"><input inputMode="numeric" value={h.age||''} maxLength={3} onChange={e=>set({age:e.target.value.replace(/\D/g,'')})}/></Field>}
        </>
      )}
      {step === 2 && (
        <>
          <Field label={h.role === 'organization' ? '单位或团队名称' : '主办署名（可不填）'}>
            <input
              value={h.organizer}
              onChange={(e) => set({ organizer: e.target.value })}
              maxLength={40}
            />
          </Field>
          {h.logo && <PhotoImage path={h.logo} alt="主办Logo" className="logo-preview" />}
          <Upload onPhoto={(p) => set({ logo: p.path })}>
            <Camera size={20} />
            上传主办 Logo（可选）
          </Upload>
          <Toggle
            label="邀请页显示主办标识"
            checked={h.showInviteLogo}
            onChange={() => set({ showInviteLogo: !h.showInviteLogo })}
          />
          <Toggle
            label="仪式开场显示主办标识"
            checked={h.showLogo}
            onChange={() => set({ showLogo: !h.showLogo })}
          />
          <Toggle
            label="结束页显示主办署名"
            checked={h.showEndLogo}
            onChange={() => set({ showEndLogo: !h.showEndLogo })}
          />
        </>
      )}
      {step === 3 && (
        <>
          <Field label="仪式日期">
            <input type="date" value={h.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="本次征集截止">
            <input
              type="date"
              value={h.deadline}
              onChange={(e) => set({ deadline: e.target.value })}
            />
          </Field>
          <Toggle
            label="有人帮忙整理（可选主创）"
            checked={s.curator || s.curatorPending}
            onChange={() => patch({ curator: false, curatorPending: !s.curatorPending })}
          />
          {s.curatorPending ? (
            <Note>主创邀请尚未接受，系统仍会自动整理。可以在筹备页模拟接受。</Note>
          ) : (
            <Note>默认没有主创也能完成，仪式后仍然可以持续问候。</Note>
          )}
          <Toggle
            label="必须由主创确认后定稿"
            checked={h.strict}
            onChange={() => set({ strict: !h.strict })}
          />
          <Toggle
            label="聚会时再打开（惊喜模式）"
            checked={h.surprise}
            onChange={() => set({ surprise: !h.surprise })}
          />
        </>
      )}
      {step === 4 && (
        <>
          <PhotoImage path={h.cover} alt={h.name} className="host-cover" />
          <h3>
            {h.address}的{c.category}
          </h3>
          <p className="prose">{h.bio}</p>
          <div className="detail-list">
            <p>
              主办署名<span>{h.organizer || '不显示'}</span>
            </p>
            <p>
              相聚时间<span>{h.date}</span>
            </p>
            <p>
              内容整理
              <span>{s.curator ? '有人精选' : s.curatorPending ? '邀请待接受' : '自动整理'}</span>
            </p>
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <Button
        onClick={() => {
          if (
            step === 1 &&
            (!h.name.trim() ||
              !h.address.trim() ||
              (c.id === 'anniversary' && !h.secondName.trim()))
          ) {
            setError('请填写受礼者与展示称呼')
            return
          }
          if (step === 2 && h.role === 'organization' && !h.organizer.trim()) {
            setError('请填写主办单位或团队名称')
            return
          }
          if (step === 3 && (!h.date || h.deadline > h.date)) {
            setError('请检查日期，征集截止不能晚于仪式')
            return
          }
          setError('')
          if (step < 4) setStep(step + 1)
          else {
            set({ configured: true })
            notify('邀请已准备好，打开后即可参与。')
            go('invite')
          }
        }}
      >
        {step === 4 ? '确认并生成邀请' : '下一步'}
        <ArrowRight size={18} />
      </Button>
      {step > 0 && (
        <button className="text-button" onClick={() => setStep(step - 1)}>
          上一步
        </button>
      )}
    </div>
  )
}
export function Preparation({
  go,
  compact = false,
}: {
  go?: (p: Page) => void
  compact?: boolean
}) {
  const { c, s, patch, notify, modal, closeModal } = useDemo()
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('overview')
  const all = available(c.id, s)
  const blocks = all.filter(
    (b) => b.scope.ceremony && b.source !== 'greeting' && b.source !== 'onsite',
  )
  const authors = new Set(blocks.map((b) => b.authorId))
  const visible = blocks.filter(
    (b) => b.kind !== 'impression' && (filter === 'all' || b.kind === filter),
  )
  const stories = blocks.filter((b) => b.kind === 'story')
  const frozen = s.version
  function freeze() {
    if (!blocks.length) {
      notify('还没有允许仪式展示的内容')
      return
    }
    if (s.host.strict && !s.curator) {
      notify('严格人工模式尚未确认，请先接受主创邀请或切回自动整理')
      return
    }
    patch({
      previewing: false,
      version: {
        number: (frozen?.number || 0) + 1,
        blocks: JSON.parse(JSON.stringify(blocks)),
        photos: structuredClone(photosFor(c.id, s)),
        featured: s.featured,
        host: { ...s.host },
        at: new Date().toISOString(),
      },
    })
    notify('仪式版本已确认，后续投稿进入新的心意。')
  }
  return (
    <div className={`preparation ${compact ? 'inside-phone' : ''}`}>
      <div className="eyebrow">{s.curator ? '主创工作台' : '系统整理结果'}</div>
      <h2>
        把大家的心意，
        <br />
        整理成一份礼物。
      </h2>
      <p className="prose">
        {s.curator ? `${c.curator || c.operator} 正在帮忙精选。` : '没有主创，也可以安心完成。'}{' '}
        每一份内容都保留作者的署名。
      </p>
      <div className="stats-grid">
        {[
          [authors.size, '位参与者', UsersThree],
          [blocks.filter((b) => b.kind === 'photo').length, '张照片', Camera],
          [stories.length, '篇回忆', BookOpen],
          [blocks.filter((b) => b.kind === 'wish').length, '份祝福', Heart],
        ].map(([n, t, I]) => {
          const Icon = I as typeof Camera
          return (
            <div key={String(t)}>
              <Icon size={20} />
              <strong>{String(n)}</strong>
              <small>{String(t)}</small>
            </div>
          )
        })}
      </div>
      <div className="segmented">
        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
          大家的投稿
        </button>
        <button className={tab === 'curate' ? 'active' : ''} onClick={() => setTab('curate')}>
          重点讲述
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          筹备设置
        </button>
      </div>
      {tab === 'overview' && (
        <>
          <div className="chips">
            {[
              ['all', '全部'],
              ['photo', '照片'],
              ['story', '故事'],
              ['wish', '祝福'],
            ].map(([v, t]) => (
              <button
                key={v}
                className={filter === v ? 'selected' : ''}
                onClick={() => setFilter(v)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="preparation-list">
            {visible.map((b) => (
              <button
                key={b.id}
                className="preparation-row"
                onClick={() => modal(`${b.author}的心意`, <BlockCard block={b} />)}
              >
                <span className="type-icon">
                  {b.kind === 'story' ? <BookOpen /> : b.kind === 'photo' ? <Camera /> : <Heart />}
                </span>
                <div>
                  <strong>{b.title || b.body || '一份心意'}</strong>
                  <small>
                    {b.author} · {b.relation}
                  </small>
                </div>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
          {all.length > blocks.length && (
            <Note>{all.length - blocks.length}项私人或后续内容，未加入仪式预览。</Note>
          )}
        </>
      )}
      {tab === 'curate' && (
        <>
          <Note>
            {s.curator
              ? '选择本次重点展开的故事，其他内容仍在所有心意里。'
              : '系统已根据内容完整性整理重点故事。可以邀请主创再做精选。'}
          </Note>
          {stories.map((b) => (
            <label className="featured-choice" key={b.id}>
              <input
                type="checkbox"
                checked={s.featured.includes(b.id)}
                disabled={!s.curator}
                onChange={() => {
                  if (frozen) {
                    notify('修改会影响新预览，旧版保持不变')
                    patch({ previewing: true })
                  }
                  patch((x) => ({
                    featured: x.featured.includes(b.id)
                      ? x.featured.filter((id) => id !== b.id)
                      : [...x.featured, b.id].slice(-3),
                  }))
                }}
              />
              <span>
                <b>{b.title}</b>
                <small>
                  {b.author} · {b.relation}
                </small>
              </span>
            </label>
          ))}
        </>
      )}
      {tab === 'settings' && (
        <>
          <Toggle
            label="邀请一位主创帮忙整理"
            checked={s.curator || s.curatorPending}
            onChange={() => patch({ curatorPending: !s.curatorPending, curator: false })}
          />
          {s.curatorPending && (
            <Button
              secondary
              onClick={() => {
                patch({ curator: true, curatorPending: false })
                notify('主创已接受，可以精选和确认。')
              }}
            >
              模拟接受主创邀请
            </Button>
          )}
          {s.curator && (
            <Button
              secondary
              onClick={() =>
                modal(
                  '交回自动整理',
                  <>
                    <p className="prose">
                      主创任期结束后，原仪式版本保留。大家之后的心意仍可继续接收。
                    </p>
                    <Button
                      onClick={() => {
                        patch({ curator: false, curatorPending: false })
                        closeModal()
                        notify('已结束主创任期，自动整理继续。')
                      }}
                    >
                      确认卸任，交回自动整理
                    </Button>
                  </>,
                )
              }
            >
              主创卸任／交回自动整理
            </Button>
          )}
          <Toggle
            label="开启现场专用限时入口（可选）"
            checked={s.onsite}
            onChange={() => patch({ onsite: !s.onsite })}
          />
          <Toggle
            label="相框显示独立现场心意"
            checked={s.onsiteVisible}
            onChange={() => patch({ onsiteVisible: !s.onsiteVisible })}
          />
          <Button secondary onClick={() => go?.('host')}>
            修改人物和主办资料
          </Button>
          <Button secondary onClick={() => go?.('invite')}>
            模拟打开同一邀请
          </Button>
        </>
      )}
      <div className="freeze-box">
        <span>{frozen ? `已确认仪式版本 V${frozen.number}` : '这份礼物，还在预览中'}</span>
        <small>
          {frozen ? '后续投稿会独立留下，不改写这份作品。' : '检查内容后，就可以郑重送给对方。'}
        </small>
        <Button onClick={freeze}>
          {frozen ? '生成新的仪式版本' : '确认仪式版本'}
          <Check size={18} />
        </Button>
        {go && (
          <button className="text-button" onClick={() => go('ceremony')}>
            去相框看看 <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
