import { WritingArea } from './WritingAssist'
import { useEffect, useRef, useState } from 'react'
import { Camera, Check, ArrowRight, Plus } from '@phosphor-icons/react'
import { useDemo } from './context'
import { Photo, Page, datasets, relationLabel, relations } from './data'
import { Block, photosFor } from './model'
import { Button, Field, Note, Upload, Avatar } from './ui'
import { PhotoImage } from './media'
export function Guest({ go }: { go: (p: Page) => void }) {
  const { c, s, patch } = useDemo()
  return (
    <div className="phone-body">
      <div className="eyebrow">来到现场的人，也可以一起留下心意</div>
      <h2>
        现场也想
        <br />
        留一份心意？
      </h2>
      <p className="prose">
        约10分钟即可完成；有的内容可以跳过，也可以稍后继续。现场入口复用完整共创流程，让此刻的视角也进入礼物。
      </p>
      <PhotoImage path={s.host.cover} alt={s.host.name} className="host-cover" />
      <Field label="现场署名">
        <input
          value={s.guestName}
          onChange={(e) => patch({ guestName: e.target.value })}
          maxLength={20}
        />
      </Field>
      <Field label="我是对方的什么人">
        <select value={s.guestRelation} onChange={(e) => patch({ guestRelation: e.target.value })}>
          {relations.map((r) => (
            <option value={r.code} key={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      <Button disabled={!s.guestName.trim() && !s.draft.name.trim()} onClick={() => {
        patch((old) => ({ draft: { ...old.draft, name: old.guestName || old.draft.name, primary: old.guestRelation || old.draft.primary, codes: [old.guestRelation || old.draft.primary] } }))
        go('impressions')
      }}>
        开始完整共创
        <ArrowRight />
      </Button>
      <Note>{c.category} · 同一个共创邀请，在现场仍然可用。</Note>
    </div>
  )
}
export function Greeting({ onsite = false, go }: { onsite?: boolean; go: (p: Page) => void }) {
  const { c, s, patch, notify } = useDemo()
  const key = onsite ? 'onsite' : 'greeting'
  const saved = s.greetingDrafts?.[key]
  const [body, setBody] = useState(saved?.body || '')
  const [images, setImages] = useState<string[]>(saved?.imageIds || [])
  const [textOnly, setTextOnly] = useState(saved?.photoOnly || false)
  const [done, setDone] = useState(false)
  const lock = useRef(false)
  const media = photosFor(c.id, s)
  useEffect(() => {
    if (done) return
    patch((old) => ({
      greetingDrafts: {
        ...old.greetingDrafts,
        [key]: {
          body,
          imageIds: images,
          photoOnly: textOnly,
          sticker: '',
          audio: '',
          audioText: '',
          gift: true,
          ceremony: onsite,
        },
      },
    }))
  }, [body, images, textOnly, done])
  const add = (p: Photo) => {
    patch((old) => ({ assets: [...old.assets, p] }))
    setImages((old) => [...old, p.id].slice(0, onsite ? 10 : 6))
  }
  if (done)
    return (
      <div className="phone-body result-page">
        <div className="success-mark">
          <Check size={36} />
        </div>
        <h2>
          新的心意，
          <br />
          已经送出。
        </h2>
        <p className="prose">相框收到后，对方就能看到你这次想分享的画面。</p>
        <Note>
          {onsite ? '现场心意独立保留，不改写已经确认的仪式与总信。' : '这份关系，又多了一次想起。'}
        </Note>
        <Button onClick={() => go('people')}>回到我参与的人</Button>
        <button
          className="text-button"
          onClick={() => {
            lock.current = false
            setDone(false)
            setBody('')
            setImages([])
            setTextOnly(false)
          }}
        >
          再分享一份
        </button>
        <small className="helper">在网页顶部切到“长者体验”，可演示相框接收。</small>
      </div>
    )
  return (
    <div className="phone-body">
      <div className="eyebrow">{onsite ? '来到现场的人，都可以参与' : `${c.event} · 想起了你`}</div>
      <h2>{onsite ? '留住此刻，\n也留一句祝福。' : '发一张近况照片，\n带一句想说的话。'}</h2>
      <div className="greeting-recipient">
        <Avatar name={s.host.name} path={s.host.cover} />
        <span>
          <b>{s.host.address}</b>
          <small>{onsite ? `来自 ${s.guestName || s.draft.name}` : '让问候，更像真的在身边'}</small>
        </span>
      </div>
      <p className="prose">
        {onsite
          ? '之前没参与过也没有关系，一张现场照片或一句话就很好。'
          : '拍一张你此刻看到的风景，带 TA 看看你的近况。照片不必和节日有关。'}
      </p>
      <Upload onPhoto={add} maxFiles={(onsite ? 10 : 6) - images.length}>
        <Camera size={30} />
        <span>
          {onsite ? '留一张现场照片' : '放一张最近的照片'}
          <small>{onsite ? '最多10张' : '同一段近况最多6张'} · 让对方看看你此刻的生活</small>
        </span>
        <Plus />
      </Upload>
      <div className="photo-strip">
        {images.map((id) => {
          const p = media.find((p) => p.id === id)
          return (
            p && (
              <button key={id} onClick={() => setImages(images.filter((x) => x !== id))}>
                <PhotoImage path={p.path} alt={p.caption} />
                <small>移除</small>
              </button>
            )
          )
        })}
      </div>
      <button
        className="text-button"
        onClick={() => setImages([datasets[c.id].photos[datasets[c.id].photos.length - 1].id])}
      >
        放入一张演示照片
      </button>
      <Field label={onsite ? '现场祝福' : '带一句想说的话'}>
        <WritingArea
          aria-label={onsite ? '现场祝福' : '近况短话'}
          value={body}
          maxLength={1000}
          placeholder={
            onsite ? '今天在这里，最想对您说……' : '我现在在……今天看到这个画面，又想起您。'
          }
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <small className="helper">照片和文字都可以独立送出。</small>
      <button
        className="text-button"
        onClick={() =>
          setBody(
            onsite
              ? `今天和大家相聚，愿${s.host.address}往后的日子从容自在，我们常常相见。`
              : `${s.host.address}，今天路过熟悉的风景，又想起您。把此刻看到的画面，也分享给您。`,
          )
        }
      >
        参考一句话
      </button>
      {!onsite && !images.length && (
        <button
          className="text-button weak-link"
          aria-pressed={textOnly}
          onClick={() => setTextOnly(!textOnly)}
        >
          {textOnly ? '已选择只说一句话' : '暂时没有照片，只说一句话'}
        </button>
      )}
      {!s.receive && !onsite && <Note>对方暂时关闭了接收。草稿留在这里，下次再来。</Note>}
      <Button
        disabled={!onsite && !s.receive}
        onClick={() => {
          if (lock.current) return
          if (!images.length && !body.trim()) {
            notify('留一张照片或一句话，再送出吧。')
            return
          }
          if (!onsite && !images.length && !textOnly) {
            notify('先放一张照片，或选择“暂时没有照片，只说一句话”。')
            return
          }
          lock.current = true
          const id = `${c.id}-${key}-${crypto.randomUUID()}`
          const b: Block = {
            id,
            kind: 'wish',
            authorId:
              onsite && s.guestName && s.guestName !== s.draft.name
                ? 'guest-' + s.guestName
                : s.draft.authorId,
            author: onsite ? s.guestName || s.draft.name : s.draft.name,
            relation: relationLabel(onsite ? s.guestRelation : s.draft.primary),
            title: '',
            body,
            photoIds: images,
            tags: [],
            sticker: '',
            audio: '',
            audioText: '',
            scope: { gift: true, ceremony: onsite, keep: true },
            source: onsite ? 'onsite' : 'greeting',
            revision: 1,
            groupId: id,
          }
          patch((old) => ({
            blocks: [...old.blocks, b],
            delivery: 'waiting',
            greetingSent: !onsite || old.greetingSent,
            lastSent: new Date().toISOString().slice(0, 10),
            greetingDrafts: {
              ...old.greetingDrafts,
              [key]: {
                body: '',
                imageIds: [],
                photoOnly: false,
                sticker: '',
                audio: '',
                audioText: '',
                gift: true,
                ceremony: onsite,
              },
            },
          }))
          setDone(true)
        }}
      >
        送出这份心意
        <ArrowRight />
      </Button>
      <p className="tiny">送出即用于这份礼物的问候，不包含公开宣传。可在“我的共创记录”中管理。</p>
    </div>
  )
}
