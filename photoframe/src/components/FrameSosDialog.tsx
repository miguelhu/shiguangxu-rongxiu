import { CheckCircle, MapPin, PhoneCall, ShieldCheck, UserCircle, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

const SOS_COUNTDOWN_SECONDS = 5

type FrameSosDialogProps = {
  contactName?: string
  onClose: () => void
}

export function FrameSosDialog({ contactName = '知夏', onClose }: FrameSosDialogProps) {
  const [isSent, setIsSent] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(SOS_COUNTDOWN_SECONDS)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsSent(true)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="frame-sos-dialog-backdrop" role="presentation" onClick={onClose}>
      <section className="frame-sos-dialog" role="dialog" aria-modal="true" aria-labelledby="frame-sos-dialog-title" onClick={(event) => event.stopPropagation()}>
        <button className="frame-sos-dialog__close" type="button" aria-label="关闭SOS弹窗" onClick={onClose}>
          <X size={36} weight="bold" aria-hidden="true" />
        </button>

        <div className={isSent ? 'frame-sos-dialog__hero is-sent' : 'frame-sos-dialog__hero'}>
          <span className="frame-sos-dialog__pulse" aria-hidden="true" />
          {isSent ? <CheckCircle size={78} weight="fill" aria-hidden="true" /> : <PhoneCall size={78} weight="fill" aria-hidden="true" />}
        </div>

        <div className="frame-sos-dialog__copy">
          <h2 id="frame-sos-dialog-title">
            {isSent ? `已通知${contactName}` : `${remainingSeconds}秒后自动通知${contactName}`}
          </h2>
        </div>

        {isSent ? (
          <div className="frame-sos-dialog__steps" aria-label="SOS处理状态">
            <article className="is-active">
              <UserCircle size={36} weight="duotone" aria-hidden="true" />
              <span>已联系{contactName}</span>
            </article>
            <article className="is-active">
              <MapPin size={36} weight="duotone" aria-hidden="true" />
              <span>位置已告知</span>
            </article>
            <article className="is-active">
              <ShieldCheck size={36} weight="duotone" aria-hidden="true" />
              <span>手机已通知</span>
            </article>
          </div>
        ) : null}

        <div className="frame-sos-dialog__actions">
          {isSent ? (
            <button className="frame-sos-dialog__primary" type="button" onClick={onClose}>
              我知道了
            </button>
          ) : (
            <button className="frame-sos-dialog__secondary frame-sos-dialog__cancel" type="button" onClick={onClose}>
              取消误触
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
