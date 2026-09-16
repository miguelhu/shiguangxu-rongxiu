import { useState } from 'react'
import {
  ArrowRight,
  Buildings,
  Heart,
  User,
  UsersThree,
  Camera,
  CaretLeft,
} from '@phosphor-icons/react'
import { asset } from './data'
import type { HostConfig } from './store'

export async function readLocalImage(file?: File): Promise<string> {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('请选择 PNG、JPG 或 WebP 图片')
  if (file.size > 2 * 1024 * 1024) throw new Error('演示版请选择2 MB以内的图片')
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('图片读取失败'))
    r.readAsDataURL(file)
  })
}
export function mediaSrc(value: string) {
  return value.startsWith('data:') ? value : asset(value)
}
export function HostBadge({ host }: { host: HostConfig }) {
  if (!host.configured) return null
  return (
    <div className="host-badge">
      {host.role === 'organization' && host.showLogo && host.logo && (
        <span className={`host-logo ${host.logo === 'tsinghua-logo.jpg' ? 'tsinghua' : ''}`}>
          <img src={mediaSrc(host.logo)} alt={`${host.organizer}主办标识`} />
        </span>
      )}
      <span>
        <strong>{host.role === 'self' ? '我为自己发起' : host.organizer || '个人牵头'}</strong>
        <small>
          {host.role === 'organization'
            ? '主办单位 · 情景示例'
            : host.role === 'self'
              ? '公开邀请，一起记录'
              : '发起人 · 共同筹备'}
        </small>
      </span>
    </div>
  )
}
export default function EntryFlow({
  view,
  host,
  curator,
  selfName,
  onView,
  onPatch,
  onCurator,
  onFinish,
}: {
  view: 'choice' | 'host' | 'recipient'
  host: HostConfig
  curator: boolean
  selfName: string
  onView: (v: 'choice' | 'host' | 'recipient' | 'invitation') => void
  onPatch: (p: Partial<HostConfig>) => void
  onCurator: (v: boolean) => void
  onFinish: () => void
}) {
  const [error, setError] = useState('')
  const pick = async (file: File | undefined, field: 'photo' | 'logo') => {
    try {
      onPatch({ [field]: await readLocalImage(file) })
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const start = (role: HostConfig['role']) => {
    onPatch({
      role,
      organizer: role === 'self' ? selfName : host.organizer,
      operatorRole: role === 'self' ? '本人' : host.operatorRole,
      ...(role === 'self'
        ? {
            recipientName: selfName,
            address: selfName,
            profession: '这场相聚的主人',
            photo: 'campus.png',
            bio: '想邀请你们一起，留住这些年相伴的故事。',
          }
        : {}),
      logo: role === 'self' ? '' : host.logo,
      surprise: role !== 'self',
      eventType: role === 'self' ? 'birthday' : 'retirement',
      title: role === 'self' ? `${selfName}的生日相聚` : `${host.recipientName}荣休礼`,
    })
    onView('host')
  }
  if (view === 'choice')
    return (
      <div className="phone-pad entry-start">
        <span className="entry-emblem">
          <Heart size={38} weight="light" />
        </span>
        <p className="eyebrow green">A GIFT BEGINS WITH YOU</p>
        <h2>
          今天，你想怎样
          <br />
          留下一份心意？
        </h2>
        <p>
          可以加入大家，也可以成为
          <br />
          让这场相聚开始的人。
        </p>
        <button className="entry-option" onClick={() => onView('invitation')}>
          <UsersThree size={27} />
          <span>
            <strong>我来参与共创</strong>
            <small>已有邀请，为熟悉的人留份心意</small>
          </span>
          <ArrowRight />
        </button>
        <button className="entry-option" onClick={() => start('organization')}>
          <Buildings size={27} />
          <span>
            <strong>我想为别人发起</strong>
            <small>单位主办、团队或个人牵头都可以</small>
          </span>
          <ArrowRight />
        </button>
        <button className="entry-option" onClick={() => start('self')}>
          <User size={27} />
          <span>
            <strong>我想为自己发起</strong>
            <small>生日、荣休，邀请大家一起留下回忆</small>
          </span>
          <ArrowRight />
        </button>
        <p className="fine">
          发起人负责开始这件事，主创负责内容精选。
          <br />
          两者可以是同一个人，主创也可以不设置。
        </p>
      </div>
    )
  return (
    <form
      className="phone-pad host-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (view === 'host') {
          if (!host.organizer.trim() && host.role !== 'self') {
            setError('请填写主办单位或发起人名称')
            return
          }
          onView('recipient')
        } else {
          if (!host.recipientName.trim() || !host.address.trim() || !host.date) {
            setError('请填写人物姓名、称呼和活动日期')
            return
          }
          onFinish()
        }
        setError('')
      }}
    >
      <button
        type="button"
        className="text-link"
        onClick={() => onView(view === 'host' ? 'choice' : 'host')}
      >
        <CaretLeft />
        上一步
      </button>
      <p className="eyebrow green">{view === 'host' ? '01 / 谁来发起' : '02 / 这份礼物关于谁'}</p>
      <h2>
        {view === 'host'
          ? '先认识这场相聚的发起人'
          : host.role === 'self'
            ? '让朋友们更了解你'
            : '把对方介绍给共创的人'}
      </h2>
      {view === 'host' ? (
        <>
          <label>
            你以什么身份发起？
            <select
              value={host.role}
              onChange={(e) =>
                onPatch({
                  role: e.target.value as HostConfig['role'],
                  surprise: e.target.value === 'self' ? false : host.surprise,
                  logo: e.target.value === 'organization' ? host.logo : '',
                  organizer: e.target.value === 'organization' ? host.organizer : '',
                })
              }
            >
              <option value="organization">单位／机构主办</option>
              <option value="personal">家人／朋友／同事牵头</option>
              <option value="self">我就是受礼者，为自己发起</option>
            </select>
          </label>
          <label>
            活动类型
            <select
              value={host.eventType}
              onChange={(e) =>
                onPatch({
                  eventType: e.target.value as HostConfig['eventType'],
                  title: `${host.recipientName}${e.target.value === 'birthday' ? '生日相聚' : '荣休礼'}`,
                })
              }
            >
              <option value="retirement">荣休礼</option>
              <option value="birthday">生日／大寿</option>
            </select>
          </label>
          <label>
            {host.role === 'organization' ? '主办单位名称' : '发起人署名'}
            <input
              value={host.organizer}
              onChange={(e) => onPatch({ organizer: e.target.value })}
              placeholder={
                host.role === 'self' ? '可不填写，使用本人姓名' : '例如：清华大学／林悦与同学们'
              }
            />
          </label>
          <label>
            你在活动中的角色
            <input
              value={host.operatorRole}
              onChange={(e) => onPatch({ operatorRole: e.target.value })}
              placeholder="例如：工会经办人、同学代表、本人"
            />
          </label>
          <label>
            活动名称
            <input value={host.title} onChange={(e) => onPatch({ title: e.target.value })} />
          </label>
          {host.role === 'organization' && (
            <div className="host-logo-field">
              <HostBadge host={{ ...host, configured: true }} />
              <label className="upload-control">
                <Camera size={17} />
                上传／替换主办Logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => pick(e.target.files?.[0], 'logo')}
                />
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={host.showLogo}
                  onChange={(e) => onPatch({ showLogo: e.target.checked })}
                />
                在邀请页与仪式中展示标识
              </label>
            </div>
          )}
          <label className="check-row">
            <input
              type="checkbox"
              checked={curator}
              onChange={(e) => onCurator(e.target.checked)}
            />
            由我兼任主创，负责人工精选（可选）
          </label>
          <p className="fine">
            不勾选主创，系统仍按内容用途整理。
            <br />
            清华大学仅作为展示场景，不代表真实主办或背书。
          </p>
        </>
      ) : (
        <>
          <label>
            {host.role === 'self' ? '你的姓名' : '受礼者姓名'}
            <input
              value={host.recipientName}
              onChange={(e) => onPatch({ recipientName: e.target.value })}
            />
          </label>
          <label>
            邀请页上的称呼
            <input
              value={host.address}
              onChange={(e) => onPatch({ address: e.target.value })}
              placeholder="陈老师／爸爸／我的名字"
            />
          </label>
          <label>
            身份／职业
            <input
              value={host.profession}
              onChange={(e) => onPatch({ profession: e.target.value })}
            />
          </label>
          <label>
            活动日期
            <input
              type="date"
              value={host.date}
              onChange={(e) => onPatch({ date: e.target.value })}
            />
          </label>
          <label>
            给共创者看的简介
            <textarea
              value={host.bio}
              onChange={(e) => onPatch({ bio: e.target.value })}
              rows={4}
              placeholder="介绍一下这个人，以及希望大家一起留下什么"
            />
          </label>
          <img className="setup-person-photo" src={mediaSrc(host.photo)} alt="人物资料预览" />
          <label className="upload-control">
            <Camera size={17} />
            上传／替换人物照片
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => pick(e.target.files?.[0], 'photo')}
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={host.shareBio}
              onChange={(e) => onPatch({ shareBio: e.target.checked })}
            />
            共创者可看人物简介
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={host.sharePhoto}
              onChange={(e) => onPatch({ sharePhoto: e.target.checked })}
            />
            共创者可看人物照片
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={host.surprise}
              disabled={host.role === 'self'}
              onChange={(e) => onPatch({ surprise: e.target.checked })}
            />
            惊喜筹备，受礼者暂不参与收集
          </label>
          {host.role === 'self' && <p className="fine">为自己发起采用公开邀请，不开启惊喜模式。</p>}
          <p className="fine">共创者只会看到你选择开放的基础资料，不会看到私人联系方式。</p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit">
        {view === 'host' ? '下一步 · 人物资料' : '保存并预览共创邀请'}
        <ArrowRight size={17} />
      </button>
    </form>
  )
}
