import { useState } from 'react'
import { useDemo } from './context'
import { Button, Field } from './ui'
import { PhotoImage } from './media'
import { Page } from './data'
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
            <small>二维码打开当前前端预览入口，不建立真实微信绑定。</small>
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
