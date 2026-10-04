import { CaretLeft, Check, Image } from '@phosphor-icons/react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

type CaptureMode = 'snapshot' | 'digitize'
const ALBUM_PHOTO_DRAFT_KEY = 'shiguangxu:album-photo-draft'
const DEFAULT_ALBUM_DRAFT_PHOTO = '/frame-gallery/optimized/03-weekend-visit-grandma.jpg'
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function MemberCapturePage() {
  const navigate = useNavigate()
  const { mode } = useParams()
  const [searchParams] = useSearchParams()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const albumInputRef = useRef<HTMLInputElement>(null)
  const source = searchParams.get('source') === 'album' ? 'album' : 'camera'
  const [previewUrl, setPreviewUrl] = useState('')
  const [selectedSource, setSelectedSource] = useState<'camera' | 'album'>(source)
  const [saved, setSaved] = useState(false)
  const captureMode: CaptureMode = mode === 'digitize' ? 'digitize' : 'snapshot'
  const target = searchParams.get('target') === 'album' ? 'album' : 'frame'

  const copy = useMemo(() => {
    if (captureMode === 'digitize') {
      return {
        title: '照片电子化',
        hint: '把纸质照片放进框内',
        helper: '自动裁剪、校正角度并减少反光',
        saved: '已生成电子版照片',
      }
    }

    if (target === 'album') {
      return {
        title: '添加家庭照片',
        hint: '拍一张想放进家庭相册的照片',
        helper: '下一步可录一段照片备注',
        saved: '已选择照片，准备记录备注',
      }
    }

    return {
      title: '随手拍',
      hint: '对准想记录的这一刻',
      helper: '拍完可继续编辑并投送到相框',
      saved: '已放入新动态草稿',
    }
  }, [captureMode, target])

  const handlePhotoSelected = (selectedFrom: 'camera' | 'album', input: HTMLInputElement) => {
    if (!input.files?.length) return
    const file = input.files[0]
    void readFileAsDataUrl(file).then((url) => {
      if (target === 'album') {
        window.sessionStorage.setItem(
          ALBUM_PHOTO_DRAFT_KEY,
          JSON.stringify({
            previewUrl: url,
            source: selectedFrom,
            createdAt: new Date().toISOString(),
          }),
        )
        const params = new URLSearchParams({ mode: 'new', draft: '1' })
        input.value = ''
        navigate(`/member/gallery/photo-note?${params.toString()}`)
        return
      }
      setSelectedSource(selectedFrom)
      setPreviewUrl(url)
      setSaved(false)
      input.value = ''
    })
  }

  const continueWithDemoAlbumPhoto = (selectedFrom: 'camera' | 'album') => {
    window.sessionStorage.setItem(
      ALBUM_PHOTO_DRAFT_KEY,
      JSON.stringify({
        previewUrl: DEFAULT_ALBUM_DRAFT_PHOTO,
        source: selectedFrom,
        createdAt: new Date().toISOString(),
      }),
    )
    const params = new URLSearchParams({ mode: 'new', draft: '1' })
    navigate(`/member/gallery/photo-note?${params.toString()}`)
  }

  const openCamera = () => {
    if (target === 'album') {
      continueWithDemoAlbumPhoto('camera')
      return
    }
    cameraInputRef.current?.click()
  }

  const openAlbum = () => {
    if (target === 'album') {
      continueWithDemoAlbumPhoto('album')
      return
    }
    albumInputRef.current?.click()
  }

  const confirmCapture = () => {
    if (!previewUrl) {
      if (source === 'album') {
        openAlbum()
      } else {
        openCamera()
      }
      return
    }

    if (target === 'album') {
      window.sessionStorage.setItem(
        ALBUM_PHOTO_DRAFT_KEY,
        JSON.stringify({
          previewUrl,
          source: selectedSource,
          createdAt: new Date().toISOString(),
        }),
      )
      const params = new URLSearchParams({ mode: 'new', draft: '1' })
      navigate(`/member/gallery/photo-note?${params.toString()}`)
      return
    }

    setSaved(true)
  }

  const resetPreview = () => {
    setPreviewUrl('')
    setSaved(false)
  }

  return (
    <main className="member-camera-page" aria-label={copy.title}>
      <section className={captureMode === 'digitize' ? 'member-camera-stage member-camera-stage--scan' : 'member-camera-stage'} aria-label="拍摄取景">
        {previewUrl ? (
          <img className="member-camera-stage__preview" src={previewUrl} alt="已选择的照片预览" />
        ) : (
          <div className="member-camera-stage__feed" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}

        <header className="member-camera-topbar">
          <button type="button" aria-label={target === 'album' ? '返回家庭空间' : '返回近况'} onClick={() => navigate(target === 'album' ? '/member/treasure' : '/member/home')}>
            <CaretLeft size={24} weight="bold" aria-hidden="true" />
          </button>
          <div>
            <strong>{copy.title}</strong>
          </div>
          <span aria-hidden="true" />
        </header>

        {saved ? <p className="member-camera-toast">{copy.saved}</p> : null}

        <footer className="member-camera-controls" aria-label="拍摄操作">
          <button className="member-camera-album-button" type="button" onClick={openAlbum}>
            {previewUrl ? (
              <img src={previewUrl} alt="" aria-hidden="true" />
            ) : (
              <Image size={23} weight="bold" aria-hidden="true" />
            )}
            <span>相册</span>
          </button>

          <button className="member-camera-shutter" type="button" aria-label={previewUrl ? '重新拍摄' : '拍摄'} onClick={openCamera}>
            <span />
          </button>

          {previewUrl ? (
            <button className="member-camera-use-button" type="button" onClick={confirmCapture}>
              <Check size={22} weight="bold" aria-hidden="true" />
              <span>使用</span>
            </button>
          ) : (
            <span className="member-camera-control-spacer" aria-hidden="true" />
          )}
        </footer>

        {previewUrl ? (
          <button className="member-camera-retake-button" type="button" onClick={resetPreview}>
            取消重拍
          </button>
        ) : null}
      </section>

      <input
        ref={cameraInputRef}
        className="home-system-picker-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => handlePhotoSelected('camera', event.currentTarget)}
      />
      <input
        ref={albumInputRef}
        className="home-system-picker-input"
        type="file"
        accept="image/*"
        onChange={(event) => handlePhotoSelected('album', event.currentTarget)}
      />
    </main>
  )
}
