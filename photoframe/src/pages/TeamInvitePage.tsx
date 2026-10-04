import { ArrowClockwise, Copy, LinkSimple } from '@phosphor-icons/react'
import { useState } from 'react'

type InviteTarget = {
  id: string
  label: string
  hash: string
}

const INVITE_TARGETS: InviteTarget[] = [
  {
    id: 'frame',
    label: '相框端',
    hash: '/#/frame?menu=1&scenario=ama-letter&demo=tablet&device=frame-11',
  },
  {
    id: 'member',
    label: '子女端',
    hash: '/#/member/home?scenario=ama-letter',
  },
]

const PUBLIC_INVITE_ORIGIN = 'https://sgx.wizardwu.top'

function getShanghaiDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '2026'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

function createLocalToken(dateKey: string, seed = 'daily') {
  const source = `${dateKey}:${seed}:shiguangxu`
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index)
    hash |= 0
  }
  const normalized = Math.abs(hash).toString(36).padStart(8, '0')
  return `sgx${normalized.slice(0, 8)}`
}

function getCurrentStoredToken(dateKey: string) {
  const storageKey = `sgx:team-invite:${dateKey}`
  const stored = window.localStorage.getItem(storageKey)
  if (stored) return stored
  const token = createLocalToken(dateKey)
  window.localStorage.setItem(storageKey, token)
  return token
}

function createRotatedToken(dateKey: string) {
  const token = createLocalToken(dateKey, `${Date.now()}:${Math.random()}`)
  window.localStorage.setItem(`sgx:team-invite:${dateKey}`, token)
  return token
}

export function TeamInvitePage() {
  const [selectedTargetId, setSelectedTargetId] = useState(INVITE_TARGETS[0].id)
  const [dateKey] = useState(() => getShanghaiDateKey())
  const [token, setToken] = useState(() => getCurrentStoredToken(getShanghaiDateKey()))
  const [toast, setToast] = useState('')

  const selectedTarget = INVITE_TARGETS.find((target) => target.id === selectedTargetId) || INVITE_TARGETS[0]
  const inviteUrl = `${PUBLIC_INVITE_ORIGIN}/invite/${token}?target=${selectedTarget.id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setToast('链接已复制')
    } catch {
      setToast('复制失败，请手动长按复制')
    }
  }

  const refreshTodayLink = () => {
    setToken(createRotatedToken(dateKey))
    setToast('最新链接已重新生成，旧链接会失效')
  }

  return (
    <main className="team-invite-page">
      <section className="team-invite-shell" aria-label="团队演示链接">
        <header className="team-invite-hero">
          <h1>最新演示链接</h1>
          <p>每天一个公共链接，当天 24 点自动失效。需要提前作废时，重新生成最新链接即可。</p>
        </header>

        <section className="team-invite-card" aria-label="生成最新链接">
          <div className="team-invite-targets" aria-label="选择演示入口">
            {INVITE_TARGETS.map((target) => (
              <button
                className={selectedTargetId === target.id ? 'team-invite-target is-active' : 'team-invite-target'}
                key={target.id}
                type="button"
                onClick={() => setSelectedTargetId(target.id)}
              >
                <strong>{target.label}</strong>
              </button>
            ))}
          </div>

          <div className="team-invite-link-box">
            <div className="team-invite-link-box__label">
              <LinkSimple />
              可直接发给外部体验者
            </div>
            <p>{inviteUrl}</p>
          </div>
        </section>

        <div className="team-invite-actions" aria-label="链接操作">
          <button className="team-invite-actions__primary" type="button" onClick={copyLink}>
            <Copy weight="bold" />
            复制链接
          </button>
          <button className="team-invite-actions__secondary" type="button" onClick={refreshTodayLink}>
            <ArrowClockwise weight="bold" />
            重新生成最新链接（当前链接将失效）
          </button>
        </div>
      </section>
      {toast ? <div className="team-invite-toast" role="status">{toast}</div> : null}
    </main>
  )
}
