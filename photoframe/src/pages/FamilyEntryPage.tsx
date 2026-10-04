import { ArrowLeft, CaretRight, Heart, Sparkle, UsersThree, X } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getMockFamilySpace } from '../mock'

const ENTRY_FEATURES = [
  {
    title: 'AI 陪伴',
    description: '越聊越懂老人',
    icon: Heart,
  },
  {
    title: '家人轻互动',
    description: 'AI润色情感补全',
    icon: UsersThree,
  },
  {
    title: '往事回忆录',
    description: 'AI 整理成故事',
    icon: Sparkle,
  },
]

export function FamilyEntryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const familySpace = getMockFamilySpace()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [bindDialogOpen, setBindDialogOpen] = useState(false)
  const [dialogTop, setDialogTop] = useState<number | null>(null)
  const bindDialogRef = useRef<HTMLElement>(null)
  const canGoBack = searchParams.get('from') === 'profile'

  const enterFamily = () => {
    const normalizedCode = code.replace(/\D/g, '')
    if (normalizedCode.length !== 6) {
      setError('请输入 6 位数字绑定码')
      return
    }
    if (normalizedCode !== familySpace.bindingCode.replace(/\D/g, '')) {
      setError('绑定码不对，请看一下相框或家人发来的 6 位数字')
      return
    }
    navigate('/member/home')
  }

  const openBindDialog = () => {
    setCode('')
    setError('')
    setBindDialogOpen(true)
  }

  useEffect(() => {
    if (!bindDialogOpen) {
      setDialogTop(null)
      return
    }

    const updateDialogTop = () => {
      const visualViewport = window.visualViewport
      const dialogHeight = bindDialogRef.current?.offsetHeight ?? 260
      const safeTop = 20

      if (!visualViewport) {
        setDialogTop(Math.max(safeTop, Math.round((window.innerHeight - dialogHeight) / 2)))
        return
      }

      const top = visualViewport.offsetTop + (visualViewport.height - dialogHeight) / 2
      setDialogTop(Math.max(safeTop, Math.round(top)))
    }

    updateDialogTop()
    const frame = window.requestAnimationFrame(updateDialogTop)
    window.visualViewport?.addEventListener('resize', updateDialogTop)
    window.visualViewport?.addEventListener('scroll', updateDialogTop)
    window.addEventListener('resize', updateDialogTop)

    return () => {
      window.cancelAnimationFrame(frame)
      window.visualViewport?.removeEventListener('resize', updateDialogTop)
      window.visualViewport?.removeEventListener('scroll', updateDialogTop)
      window.removeEventListener('resize', updateDialogTop)
    }
  }, [bindDialogOpen])

  return (
    <main className="proto-page proto-page--entry" aria-label="家庭空间入口">
      <section className="entry-landing">
        {canGoBack ? (
          <button className="entry-back-button" type="button" aria-label="返回我的" onClick={() => navigate('/member/profile')}>
            <ArrowLeft size={21} weight="bold" aria-hidden="true" />
          </button>
        ) : null}

        <img
          className="entry-landing__photo"
          src="/chinese-elder-background-photo-v1.png"
          alt=""
          aria-hidden="true"
        />

        <div className="entry-landing__copy">
          <h2>
            让心意浮现
            <span>帮家人看见</span>
          </h2>
          <p>
            面向银发的桌面AI陪伴助手
            <span>家庭关系的沟通翻译官</span>
          </p>
        </div>
      </section>

      <section className="entry-feature-grid" aria-label="产品亮点">
        {ENTRY_FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <article className="entry-feature-tile" key={feature.title}>
              <span aria-hidden="true">
                <Icon size={24} weight="duotone" />
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </article>
          )
        })}
      </section>

      <section className="entry-actions" aria-label="开始使用">
        <button className="proto-primary-button entry-start-button" type="button" onClick={() => navigate('/member/onboarding/elder')}>
          创建新家庭
        </button>
        <button className="entry-bind-button" type="button" onClick={openBindDialog}>
          绑定已有家庭
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </button>
      </section>

      {bindDialogOpen ? (
        <div
          className="home-dialog-backdrop home-dialog-backdrop--settings"
          role="presentation"
          style={dialogTop === null ? undefined : ({ '--dialog-top': `${dialogTop}px` } as CSSProperties)}
          onClick={() => setBindDialogOpen(false)}
        >
          <section
            className="settings-dialog entry-bind-dialog"
            ref={bindDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bind-family-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="settings-dialog__header">
              <h2 id="bind-family-dialog-title">绑定已有家庭</h2>
              <button className="settings-dialog__close" type="button" aria-label="关闭弹窗" onClick={() => setBindDialogOpen(false)}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </header>

            <div className="settings-dialog__field">
              <input
                autoFocus
                autoComplete="one-time-code"
                aria-label="6 位数字绑定码"
                enterKeyHint="done"
                inputMode="numeric"
                maxLength={6}
                placeholder="请输入 6 位绑定码"
                value={code}
                onChange={(event) => {
                  setError('')
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    enterFamily()
                  }
                }}
              />
              {error ? <p className="proto-field-error">{error}</p> : null}
            </div>

            <div className="settings-dialog__actions">
              <button type="button" disabled={code.length !== 6} onClick={enterFamily}>
                绑定家庭
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
