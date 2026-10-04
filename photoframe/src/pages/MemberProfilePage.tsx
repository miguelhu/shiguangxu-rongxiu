import { CaretLeft, CaretRight, HouseLine, IdentificationCard, LinkSimple, UserCircle, X } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMockFamilySpace } from '../mock'
import { getPrototypeFamilySpaceName, setPrototypeFamilySpaceName } from '../utils/prototypeSession'

export function MemberProfilePage() {
  const navigate = useNavigate()
  const familySpace = getMockFamilySpace()
  const [familyName, setFamilyName] = useState(() => getPrototypeFamilySpaceName(familySpace.name))
  const [familyNameDraft, setFamilyNameDraft] = useState(() => getPrototypeFamilySpaceName(familySpace.name))
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [dialogTop, setDialogTop] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const nameDialogRef = useRef<HTMLElement>(null)

  const trimmedFamilyName = familyNameDraft.trim()
  const canSaveFamilyName = trimmedFamilyName.length > 0 && trimmedFamilyName !== familyName

  useEffect(() => {
    if (!toastMessage) return

    const timer = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (!isNameDialogOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNameDialogOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isNameDialogOpen])

  useEffect(() => {
    if (!isNameDialogOpen) {
      setDialogTop(null)
      return
    }

    const updateDialogTop = () => {
      const visualViewport = window.visualViewport
      const dialogHeight = nameDialogRef.current?.offsetHeight ?? 190
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
  }, [isNameDialogOpen])

  const openNameDialog = () => {
    setFamilyNameDraft(familyName)
    setIsNameDialogOpen(true)
  }

  const copyTextWithFallback = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        // Prototype fallback: some mobile/in-app browsers expose Clipboard API but deny it.
      }
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    let copied = false
    try {
      copied = document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }

    return copied
  }

  const copyBindingCode = async () => {
    const code = familySpace.bindingCode

    const copied = await copyTextWithFallback(code)
    setToastMessage(copied ? '绑定码已复制' : '复制失败，请长按绑定码复制')
  }

  const saveFamilyName = () => {
    if (!canSaveFamilyName) return

    setFamilyName(trimmedFamilyName)
    setPrototypeFamilySpaceName(trimmedFamilyName)
    setIsNameDialogOpen(false)
    setToastMessage('家庭空间已更新')
  }

  return (
    <main className="proto-page proto-page--settings" aria-label="我的">
      <div className="settings-page__inner">
        <header className="proto-topbar-static">
          <button className="home-icon-button home-icon-button--left" type="button" aria-label="返回近况" onClick={() => navigate('/member/home')}>
            <CaretLeft size={22} weight="bold" aria-hidden="true" />
          </button>
          <h1>我的</h1>
          <span aria-hidden="true" />
        </header>

        <section className="home-content-stack" aria-label="我的内容">
          <section className="home-memory-view" aria-label="往事">
            <section className="home-memory-feature-card" aria-label="往事提示">
              <div>
                <h2>拾光叙</h2>
                <p>让心意浮现，帮家人看见 ❤️</p>
              </div>
              <img
                className="home-memory-feature-card__art"
                src="/past-memories-tab-clock-transparent.png"
                alt=""
                aria-hidden="true"
              />
            </section>
          </section>
        </section>

        <section className="settings-menu-group settings-menu-group--plain" aria-label="家庭空间设置">
          <button className="settings-menu-row settings-menu-row--plain" type="button" onClick={openNameDialog}>
            <span className="settings-menu-row__icon" aria-hidden="true">
              <HouseLine size={20} weight="bold" />
            </span>
            <span className="settings-menu-row__label">家庭空间</span>
            <span className="settings-menu-row__value">{familyName}</span>
            <CaretRight className="settings-menu-row__chevron" size={17} weight="bold" aria-hidden="true" />
          </button>
          <button className="settings-menu-row settings-menu-row--plain" type="button" onClick={copyBindingCode}>
            <span className="settings-menu-row__icon" aria-hidden="true">
              <IdentificationCard size={20} weight="bold" />
            </span>
            <span className="settings-menu-row__label">绑定码</span>
            <span className="settings-menu-row__value settings-menu-row__value--code">{familySpace.bindingCode}</span>
            <CaretRight className="settings-menu-row__chevron" size={17} weight="bold" aria-hidden="true" />
          </button>
        </section>

        <section className="settings-menu-group settings-menu-group--plain settings-menu-group--spaced" aria-label="家庭成员设置">
          <button className="settings-menu-row settings-menu-row--plain" type="button" onClick={() => navigate('/member/onboarding/elder?from=profile')}>
            <span className="settings-menu-row__icon" aria-hidden="true">
              <UserCircle size={20} weight="bold" />
            </span>
            <span className="settings-menu-row__label">老人信息</span>
            <CaretRight className="settings-menu-row__chevron" size={17} weight="bold" aria-hidden="true" />
          </button>
          <button className="settings-menu-row settings-menu-row--plain" type="button" onClick={() => navigate('/member/entry?from=profile')}>
            <span className="settings-menu-row__icon" aria-hidden="true">
              <LinkSimple size={20} weight="bold" />
            </span>
            <span className="settings-menu-row__label">切换家庭空间</span>
            <CaretRight className="settings-menu-row__chevron" size={17} weight="bold" aria-hidden="true" />
          </button>
        </section>
      </div>

      {isNameDialogOpen ? (
        <div
          className="home-dialog-backdrop home-dialog-backdrop--settings"
          role="presentation"
          style={dialogTop === null ? undefined : ({ '--dialog-top': `${dialogTop}px` } as CSSProperties)}
          onClick={() => setIsNameDialogOpen(false)}
        >
          <section
            className="settings-dialog"
            ref={nameDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-name-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="settings-dialog__header">
              <h2 id="family-name-dialog-title">家庭空间名</h2>
              <button className="settings-dialog__close" type="button" aria-label="关闭弹窗" onClick={() => setIsNameDialogOpen(false)}>
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </header>

            <div className="settings-dialog__field">
              <input
                autoFocus
                autoComplete="off"
                aria-label="家庭空间名"
                maxLength={12}
                enterKeyHint="done"
                value={familyNameDraft}
                onChange={(event) => setFamilyNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    saveFamilyName()
                  }
                }}
              />
            </div>

            <div className="settings-dialog__actions">
              <button type="button" disabled={!canSaveFamilyName} onClick={saveFamilyName}>
                保存
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="home-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

    </main>
  )
}
