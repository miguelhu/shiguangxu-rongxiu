import { ReactNode, useEffect, useRef, isValidElement } from 'react'
import {
  ArrowRight,
  Leaf,
  X,
  ArrowLeft,
  UsersThree,
  Bell,
  UserCircle,
  WifiHigh,
  BatteryFull,
} from '@phosphor-icons/react'
import { Page, coSteps, coLabels, Photo, stickers, resource } from './data'
import { PhotoImage, saveMedia } from './media'
import { useDemo } from './context'
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  secondary?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`btn ${secondary ? 'secondary' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  const Tag =
    isValidElement(children) &&
    typeof children.type === 'string' &&
    ['input', 'textarea', 'select'].includes(children.type)
      ? 'label'
      : 'div'
  return (
    <Tag className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </Tag>
  )
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      className="toggle-row"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span>{label}</span>
      <i className={checked ? 'switch on' : 'switch'}>
        <b />
      </i>
    </button>
  )
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <Leaf size={19} />
      <span>{children}</span>
    </div>
  )
}
export function Avatar({ name, path, size = '' }: { name: string; path?: string; size?: string }) {
  return path ? (
    <PhotoImage path={path} alt={name} className={`avatar ${size}`} />
  ) : (
    <span className={`avatar initials ${size}`}>{name.slice(-2, -1) || name[0]}</span>
  )
}
export function Progress({ page, go }: { page: Page; go: (p: Page) => void }) {
  const { s } = useDemo()
  return (
    <div className="progress">
      {coSteps.map((p, i) => (
        <button
          key={p}
          className={`${page === p ? 'current' : ''} ${s.draft.skipped.includes(p) ? 'skipped' : ''}`}
          onClick={() => go(p)}
          disabled={!s.draft.visited.includes(p) && page !== p}
          aria-label={`第${i + 1}步 ${coLabels[i]}`}
        >
          <i>{s.draft.skipped.includes(p) ? '—' : i + 1}</i>
          <span>{coLabels[i]}</span>
        </button>
      ))}
    </div>
  )
}
export function Phone({
  children,
  page,
  go,
  title,
  role,
}: {
  children: ReactNode
  page: Page
  go: (p: Page) => void
  title?: string
  role?: string
}) {
  const scroll = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroll.current?.scrollTo(0, 0)
  }, [page])
  return (
    <div className="device-column">
      {role && (
        <div className="role-label">
          <i />
          {role}
        </div>
      )}
      <div className="phone">
        <div className="statusbar">
          <b>9:41</b>
          <span className="island" />
          <span>
            <WifiHigh size={17} />
            <BatteryFull size={21} />
          </span>
        </div>
        <div className="phone-header">
          <button
            onClick={() => {
              const i = coSteps.indexOf(page)
              go(
                i > 0
                  ? coSteps[i - 1]
                  : page === 'invite'
                    ? 'people'
                    : page === 'identity'
                      ? 'invite'
                      : 'invite',
              )
            }}
            aria-label="返回"
          >
            <ArrowLeft size={21} />
          </button>
          <strong>{title || '拾光叙'}</strong>
          <span className="wechat-menu">
            ··· <i>⊙</i>
          </span>
        </div>
        <div className="phone-scroll" ref={scroll}>
          {children}
        </div>
        {[
          'people',
          'person',
          'me',
          'profile',
          'relations',
          'records',
          'preferences',
          'messages',
        ].includes(page) && (
          <nav className="phone-tabs">
            {(
              [
                ['people', '我参与的人', UsersThree],
                ['messages', '消息', Bell],
                ['me', '我的', UserCircle],
              ] as const
            ).map(([p, t, I]) => (
              <button className={page === p ? 'active' : ''} key={p} onClick={() => go(p)}>
                <I size={22} />
                <span>{t}</span>
              </button>
            ))}
          </nav>
        )}
        <div className="home-indicator">
          <span />
        </div>
      </div>
    </div>
  )
}
export function StepActions({
  page,
  go,
  onNext,
}: {
  page: Page
  go: (p: Page) => void
  onNext?: () => boolean
}) {
  const { patch } = useDemo()
  const next = () => {
    if (onNext && !onNext()) return
    const i = coSteps.indexOf(page)
    patch((s) => ({
      draft: {
        ...s.draft,
        skipped: s.draft.skipped.filter((p) => p !== page),
        visited: [...new Set([...s.draft.visited, page, ...(i < 3 ? [coSteps[i + 1]] : [])])],
      },
    }))
    go(i === 3 ? 'preview' : coSteps[i + 1])
  }
  return (
    <div className="step-actions">
      <Button onClick={next}>
        {page === 'wishes' ? '预览这份心意' : '下一步'}
        <ArrowRight size={19} />
      </Button>
      <button
        className="text-button"
        onClick={() => {
          patch((s) => ({
            draft: {
              ...s.draft,
              visited: [
                ...new Set([
                  ...s.draft.visited,
                  page,
                  ...(coSteps.indexOf(page) < 3 ? [coSteps[coSteps.indexOf(page) + 1]] : []),
                ]),
              ],
              skipped: [...new Set([...s.draft.skipped, page])],
            },
          }))
          go(coSteps.indexOf(page) === 3 ? 'preview' : coSteps[coSteps.indexOf(page) + 1])
        }}
      >
        暂时没有，跳过
      </button>
    </div>
  )
}
export function StickerPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (s: string) => void
}) {
  return (
    <div className="sticker-grid">
      {stickers.map(([id, label]) => (
        <button
          key={id}
          aria-label={`贴纸 ${label}`}
          className={value === id ? 'selected' : ''}
          onClick={() => onChange(value === id ? '' : id)}
        >
          <img src={resource(`images/sticker-${id}.png`)} alt={label} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
export function Upload({
  onPhoto,
  onAudio,
  children,
}: {
  onPhoto?: (p: Photo) => void
  onAudio?: (path: string) => void
  children: ReactNode
}) {
  const { c, notify, s } = useDemo()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <button className="upload" onClick={() => input.current?.click()}>
        {children}
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept={onAudio ? 'audio/*' : 'image/jpeg,image/png,image/webp'}
        multiple={!onAudio}
        onChange={async (e) => {
          const files = Array.from(e.target.files || [])
          for (const file of files) {
            if (file.size > (onAudio ? 10 : 15) * 1024 * 1024) {
              notify(`${file.name} 超过文件大小限制`)
              continue
            }
            if (!onAudio && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
              notify('请上传 JPEG、PNG 或 WebP 图片')
              continue
            }
            try {
              if (onAudio) {
                const duration = await new Promise<number>((resolve, reject) => {
                  const au = new Audio()
                  const url = URL.createObjectURL(file)
                  au.onloadedmetadata = () => {
                    URL.revokeObjectURL(url)
                    resolve(au.duration)
                  }
                  au.onerror = () => {
                    URL.revokeObjectURL(url)
                    reject(new Error())
                  }
                  au.src = url
                })
                if (!Number.isFinite(duration) || duration > 60) {
                  notify('声音最长60秒，请选择较短的音频')
                  continue
                }
              }
              const path = await saveMedia(file)
              if (onAudio) onAudio(path)
              else
                onPhoto?.({
                  id: `${c.id}-upload-${crypto.randomUUID()}`,
                  authorId: s.draft.authorId,
                  date: '',
                  precision: 'unknown',
                  scene: '本机上传',
                  caption: file.name.replace(/\.[^.]+$/, ''),
                  path,
                  source: '本机上传',
                })
            } catch {
              notify('文件未能保存在本机，请重试。原来的草稿还在。')
            }
          }
          e.target.value = ''
        }}
      />
    </>
  )
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string
  children: ReactNode
  close: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement
    ref.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const list = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button,input,textarea,select,a[href],[tabindex="0"]',
          ) || [],
        ).filter((el) => !el.hasAttribute('disabled'))
        const first = list[0],
          last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      prev?.focus()
      window.removeEventListener('keydown', handler)
    }
  }, [])
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button aria-label="关闭" onClick={close}>
            <X size={23} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
