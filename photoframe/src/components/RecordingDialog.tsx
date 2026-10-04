import { Microphone } from '@phosphor-icons/react'

export const MIN_RECORDING_SECONDS = 3
export const MAX_RECORDING_SECONDS = 60

export function RecordingDialog({
  recordingSeconds,
  onCancel,
  onConfirm,
}: {
  recordingSeconds: number
  onCancel: () => void
  onConfirm: () => void
}) {
  const canConfirm = recordingSeconds >= MIN_RECORDING_SECONDS

  return (
    <div className="compose-recording-modal" role="dialog" aria-modal="true" aria-label="正在说话">
      <section className="compose-recording-dialog">
        <h2>正在说话中 最长{MAX_RECORDING_SECONDS}秒</h2>
        <span className="compose-recording-dialog__icon" aria-hidden="true">
          <Microphone size={26} weight="fill" />
        </span>
        <strong>
          {recordingSeconds}
          <span>秒</span>
        </strong>
        <div className="compose-recording-dialog__actions">
          <button type="button" onClick={onCancel}>
            取消
          </button>
          <button type="button" disabled={!canConfirm} onClick={onConfirm}>
            确认
          </button>
        </div>
      </section>
    </div>
  )
}
