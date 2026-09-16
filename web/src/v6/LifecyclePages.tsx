import { useState } from 'react'
import { useDemo } from './context'
import { Button, Field, Note, Upload } from './ui'
import { PhotoImage } from './media'
import { Page, Photo, CaseId, cases, datasets, relationLabel } from './data'
import { WritingArea } from './WritingAssist'
import { Block } from './model'
export function Welcome({ go }: { go: (p: Page) => void }) {
  const { c, s, patch } = useDemo()
  return (
    <div className="welcome-page">
      <div className="welcome-portrait">
        <PhotoImage path={s.host.cover} alt={s.host.name} />
        <span>{c.category} · 共创邀请</span>
      </div>
      <div className="welcome-copy">
        <h2>
          把记得的时光，
          <br />
          一起送给{s.host.address}。
        </h2>
        <p>一张照片、一个故事或一句祝福，都能成为这份{c.category}里独属于你的心意。</p>
        <div className="welcome-cost">
          大约 10 分钟<small>不需要一次写完，可随时回来继续</small>
        </div>
        {s.host.role === 'organization' && (
          <div className="host-signature">
            {s.host.logo && <PhotoImage path={s.host.logo} alt="主办标识" />}
            {s.host.organizer} · 主办情景示例
          </div>
        )}
        {s.host.bio && (
          <details className="welcome-bio">
            <summary>认识一下{s.host.address}</summary>
            <p>{s.host.bio}</p>
          </details>
        )}
        <p className="deadline">共创截止 · {s.host.deadline}</p>
        <Button
          onClick={() => {
            patch({ contributionStarted: true })
            go(s.lastContributionPage || 'identity')
          }}
        >
          {s.contributionStarted && !s.submission ? '继续留下心意' : '开始留下心意'}
        </Button>
        <button className="text-button" onClick={() => go('people')}>
          稍后再来
        </button>
        <small className="tiny">参与内容用于本次礼物和仪式，不包含公开宣传。</small>
      </div>
    </div>
  )
}
export function Activate({ go }: { go: (p: Page) => void }) {
  const { s, patch } = useDemo()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const validPhone = () => /^\+?[\d\s-]{7,20}$/.test(phone)
  return (
    <div className="brand-activation">
      <div className="activation-brand">
        <PhotoImage path="favicon.svg" alt="拾光叙Logo" />
        <span>拾光叙</span>
      </div>
      <h1>
        把值得记得的时光，
        <br />
        留在身边。
      </h1>
      <p className="activation-intro">欢迎使用拾光叙相框。先绑定，再打开属于你的礼物。</p>
      {!s.activated ? (
        <div className="binding-methods">
          <section className="qr-binding">
            <div className="eyebrow">微信扫一扫</div>
            <PhotoImage path="images/binding-demo-qr.svg" alt="微信绑定演示二维码" />
            <h3>扫码绑定相框</h3>
            <p>使用微信扫一扫，连接你的相框。</p>
            <Button onClick={() => patch({ activated: true })}>扫码绑定成功（演示）</Button>
            <small>二维码打开本网站演示入口，不建立真实微信绑定。</small>
          </section>
          <section className="phone-binding">
            <div className="eyebrow">也可以用手机号</div>
            <h3>手机验证码绑定</h3>
            <Field label="手机号">
              <input
                type="tel"
                value={phone}
                placeholder="请输入手机号"
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="验证码">
              <div className="verification-code">
                <input
                  aria-label="验证码"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  placeholder="6位验证码"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  onClick={() => {
                    if (!validPhone()) return setError('请填写有效的手机号')
                    setSent(true)
                    setError('')
                  }}
                >
                  获取验证码
                </button>
              </div>
            </Field>
            {sent && <p className="demo-code">演示验证码：123456 · 不发送真实短信</p>}
            {error && <p className="error">{error}</p>}
            <Button
              onClick={() => {
                if (!validPhone()) return setError('请填写有效的手机号')
                if (!sent || code !== '123456') return setError('请获取并填写演示验证码')
                patch({ activated: true })
                setError('')
              }}
            >
              确认绑定
            </Button>
            <small>你的手机号仅用于相框连接，不公开展示。</small>
          </section>
        </div>
      ) : (
        <section className="binding-success">
          <div className="success-mark">✓</div>
          <h2>相框已连接。</h2>
          <p>
            {s.version
              ? '你的礼物已准备好，可以打开看看。'
              : '礼物还在准备中。准备好后，会来到这里。'}
          </p>
          <Button
            disabled={!s.version}
            onClick={() => {
              patch((old) => ({
                openedAt: old.openedAt || new Date().toISOString(),
                shareReady: old.notifyAfterOpen !== false,
              }))
              go('ceremony')
            }}
          >
            {s.openedAt ? '再次看看' : '打开看看'}
          </Button>
        </section>
      )}
      <div className="activation-showcase">
        <span>一份相框，可以留下很多种心意</span>
        <div>
          <article>
            <b>荣休礼</b>
            <p>把同事与学生的谢谢，郑重留下。</p>
          </article>
          <article>
            <b>生日礼</b>
            <p>让家人的祝福，常常在身边。</p>
          </article>
          <article>
            <b>相伴纪念</b>
            <p>把共同走过的日子，慢慢重看。</p>
          </article>
        </div>
      </div>
    </div>
  )
}
export function SendChoose({ go }: { go: (p: Page) => void }) {
  const { s, c, state, setState, notify } = useDemo()
  const user = datasets[c.id].authors.find((a) => a.id === s.draft.authorId)?.userId
  const related = cases.filter((x) => datasets[x.id].authors.some((a) => a.userId === user))
  const [step, setStep] = useState(0)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [recipients, setRecipients] = useState<CaseId[]>([])
  const [done, setDone] = useState(false)
  if (done)
    return (
      <div className="phone-body result-page">
        <div className="success-mark">✓</div>
        <h2>这份时光，已经送出。</h2>
        <p>
          送给{recipients.map((id) => state.cases[id].host.address).join('、')}
          的近况已加入各自相框的待接收列表。
        </p>
        <Note>网页演示，不发送真实消息。</Note>
        <Button onClick={() => go('people')}>回到我参与的人</Button>
      </div>
    )
  const next = () => {
    if (!photos.length && !body.trim()) return notify('选一张照片，或写一句想说的话。')
    setStep(1)
  }
  return (
    <div className="phone-body dm-compose">
      <div className="dm-step-header">
        <button className="text-button" onClick={() => (step ? setStep(step - 1) : go('people'))}>
          ← 返回
        </button>
        <span>送时光 · {step + 1}/2</span>
      </div>
      <h2>{step === 0 ? '分享画面，也说说近况。' : '这份时光，送给谁？'}</h2>
      {step === 0 && (
        <>
          <p className="helper">像分享一张生活照片那样，轻轻说一声想起你。</p>
          <Upload
            maxFiles={3 - photos.length}
            onPhoto={(p) => setPhotos((old) => [...old, p].slice(0, 3))}
          >
            ＋ 选择照片<small>最多3张</small>
          </Upload>
          <div className="dm-photo-picker">
            {datasets[c.id].photos.slice(-6).map((p) => (
              <button
                key={p.id}
                aria-label={'选择照片 ' + p.id}
                aria-pressed={photos.some((x) => x.id === p.id)}
                onClick={() =>
                  setPhotos((old) =>
                    old.some((x) => x.id === p.id)
                      ? old.filter((x) => x.id !== p.id)
                      : old.length < 3
                        ? [...old, p]
                        : old,
                  )
                }
              >
                <PhotoImage path={p.path} alt={p.caption} />
                <i>
                  {photos.findIndex((x) => x.id === p.id) >= 0
                    ? photos.findIndex((x) => x.id === p.id) + 1
                    : '＋'}
                </i>
              </button>
            ))}
          </div>
          <p className="helper">下方照片为案例素材，可直接选择演示。</p>
          <div className="dm-selected-photos">
            {photos.map((p) => (
              <PhotoImage key={p.id} path={p.path} alt={p.caption} />
            ))}
          </div>
          <Field label="带一句想说的话">
            <WritingArea
              aria-label="送时光短话"
              value={body}
              maxLength={100}
              onChange={(e) => setBody(e.target.value)}
              placeholder="我今天看到了……想和您分享。"
            />
          </Field>
          <p className="helper">{body.length}/100字 · 照片和文字都可以独立送出。</p>
          <Button onClick={next}>下一步 · 选择收件人</Button>
        </>
      )}
      {step === 1 && (
        <>
          <div className="dm-preview-summary">
            {photos[0] && <PhotoImage path={photos[0].path} alt="本次照片" />}
            <span>
              {body || '分享我的近况照片'}
              <small>
                {photos.length}张照片 · 已选{recipients.length}人
              </small>
            </span>
          </div>
          <p className="helper">可以同时选择多位参与过的人，分别送到各自相框。</p>
          <div className="dm-recipient-list">
            {related.map((x) => (
              <button
                className="dm-recipient"
                key={x.id}
                aria-pressed={recipients.includes(x.id)}
                onClick={() =>
                  setRecipients((old) =>
                    old.includes(x.id) ? old.filter((id) => id !== x.id) : [...old, x.id],
                  )
                }
              >
                <PhotoImage path={state.cases[x.id].host.cover} alt={x.address} />
                <span>
                  <b>{state.cases[x.id].host.address}</b>
                  <small>
                    {relationLabel(
                      datasets[x.id].authors.find((a) => a.userId === user)!.relationCodes[0],
                    )}
                  </small>
                </span>
                <i>{recipients.includes(x.id) ? '✓' : ''}</i>
              </button>
            ))}
          </div>
          <Button
            disabled={!recipients.length}
            onClick={() => {
              const blocked = recipients.filter((id) => !state.cases[id].receive)
              if (blocked.length)
                return notify(
                  blocked.map((id) => state.cases[id].host.address).join('、') +
                    '暂时关闭了接收，请取消选择后再发送。',
                )
              setState((old) => {
                const updated = { ...old.cases }
                for (const recipient of recipients) {
                  const cs = old.cases[recipient],
                    author = datasets[recipient].authors.find((a) => a.userId === user)!,
                    id = crypto.randomUUID()
                  const b: Block = {
                    id,
                    kind: 'wish',
                    authorId: author.id,
                    author: s.draft.name,
                    relation: relationLabel(author.relationCodes[0]),
                    title: '',
                    body,
                    photoIds: photos.map((p) => p.id),
                    tags: [],
                    sticker: '',
                    audio: '',
                    audioText: '',
                    scope: { gift: true, ceremony: false, keep: true },
                    source: 'greeting',
                    revision: 1,
                    groupId: id,
                  }
                  updated[recipient] = {
                    ...cs,
                    assets: [
                      ...cs.assets.filter((p) => !photos.some((x) => x.id === p.id)),
                      ...photos,
                    ],
                    blocks: [...cs.blocks, b],
                    delivery: 'waiting',
                    greetingSent: true,
                    lastSent: new Date().toISOString().slice(0, 10),
                  }
                }
                return { ...old, cases: updated }
              })
              setDone(true)
            }}
          >
            送给{recipients.length}位朋友 →
          </Button>
        </>
      )}
    </div>
  )
}
