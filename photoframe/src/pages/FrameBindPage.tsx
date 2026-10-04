import { CloudCheck, Microphone, MonitorPlay, WarningCircle } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { withScenario } from '../content/scenarioStore'
import { getMockFamilySpace, getMockFrameDeviceStatus } from '../mock'
import { FramePageShell, useFrameDisplayMode } from '../components/FrameShell'

export function FrameBindPage() {
  const navigate = useNavigate()
  const familySpace = getMockFamilySpace()
  const device = getMockFrameDeviceStatus()
  const { mode } = useFrameDisplayMode()
  const [code, setCode] = useState(familySpace.bindingCode)
  const [hasTried, setHasTried] = useState(false)
  const isValid = code.trim() === familySpace.bindingCode
  const statusText = useMemo(() => {
    if (!hasTried) return '输入 6 位绑定码后，这台平板就会变成家里的 AI 相框。'
    if (isValid) return `已找到 ${familySpace.name}，可以进入相框。`
    return '绑定码不对，请让家人打开子女端“我的”查看绑定码。'
  }, [familySpace.name, hasTried, isValid])

  return (
    <FramePageShell className="frame-bind" mode={mode}>
      <div className="frame-bind__panel">
        <header className="frame-bind__header">
          <div>
            <span>Frame 相框端</span>
            <h1>绑定家庭相框</h1>
            <p>{statusText}</p>
          </div>
        </header>

        <section className="frame-bind__code-card" aria-label="绑定码">
          <label htmlFor="frame-bind-code">6 位绑定码</label>
          <input
            id="frame-bind-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {hasTried && !isValid ? (
            <p className="frame-bind__error">
              <WarningCircle size={24} weight="fill" aria-hidden="true" />
              绑定码不对，请重新输入。
            </p>
          ) : null}
          <button
            className="frame-primary-button"
            type="button"
            onClick={() => {
              setHasTried(true)
              if (isValid) navigate(withScenario('/frame'))
            }}
          >
            绑定并进入相框
          </button>
        </section>

        <section className="frame-bind__steps" aria-label="绑定后会完成">
          <article>
            <Microphone size={30} weight="duotone" aria-hidden="true" />
            <strong>麦克风</strong>
            <span>{device.microphoneStatus === 'granted' ? '已授权，可直接聊天' : '未授权时仍可看照片'}</span>
          </article>
          <article>
            <CloudCheck size={30} weight="duotone" aria-hidden="true" />
            <strong>照片缓存</strong>
            <span>绑定后自动同步家庭图库</span>
          </article>
          <article>
            <MonitorPlay size={30} weight="duotone" aria-hidden="true" />
            <strong>桌面入口</strong>
            <span>添加后可长期常驻播放</span>
          </article>
        </section>
      </div>
    </FramePageShell>
  )
}
