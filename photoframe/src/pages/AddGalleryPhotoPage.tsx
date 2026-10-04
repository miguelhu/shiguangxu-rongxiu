import { ArrowLeft, Image, Plus, WarningCircle } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMockGalleryPhotos, getMockUploadDrafts } from '../mock'

const MAX_GALLERY_PHOTO_COUNT = 20

export function AddGalleryPhotoPage() {
  const navigate = useNavigate()
  const galleryPhotos = getMockGalleryPhotos()
  const [drafts, setDrafts] = useState(() => getMockUploadDrafts())
  const currentCount = Math.min(galleryPhotos.length, MAX_GALLERY_PHOTO_COUNT)
  const remainingCount = Math.max(0, MAX_GALLERY_PHOTO_COUNT - currentCount)
  const reachedLimit = remainingCount <= 0
  const successCount = useMemo(() => drafts.filter((draft) => draft.status === 'success').length, [drafts])

  const retryFailed = () => {
    setDrafts((current) =>
      current.map((draft) => (draft.status === 'failed' ? { ...draft, status: 'uploading', progress: 54 } : draft)),
    )
  }

  return (
    <main className="proto-page proto-page--upload" aria-label="添加照片">
      <header className="proto-topbar-static">
        <button type="button" aria-label="返回图库" onClick={() => navigate('/member/gallery')}>
          <ArrowLeft size={21} weight="bold" aria-hidden="true" />
        </button>
        <h1>上传照片</h1>
        <span aria-hidden="true" />
      </header>

      <section className={reachedLimit ? 'upload-picker upload-picker--disabled' : 'upload-picker'}>
        <div className="upload-picker__icon" aria-hidden="true">
          <Image size={30} weight="duotone" />
        </div>
        <h2>{reachedLimit ? '当前图库已满' : '把手机照片同步到相框'}</h2>
        <p>
          {reachedLimit
            ? `当前图库已达上限，最多上传 ${MAX_GALLERY_PHOTO_COUNT} 张`
            : `还可以上传 ${remainingCount} 张，支持从系统相册多选图片。`}
        </p>
        <button className="proto-primary-button" type="button" disabled={reachedLimit}>
          <Plus size={18} weight="bold" aria-hidden="true" />
          选择照片
        </button>
      </section>

      {!reachedLimit ? (
        <section className="upload-progress-section" aria-label="上传进度">
          <div className="proto-section-heading">
            <h2>本次上传</h2>
            <span>{successCount}/{drafts.length}</span>
          </div>
          {drafts.map((draft) => (
            <article className="upload-row" key={draft.id}>
              <img src={draft.previewUrl} alt="" aria-hidden="true" />
              <div>
                <strong>{draft.fileName}</strong>
                <span>
                  {draft.status === 'success'
                    ? '已同步到相框'
                    : draft.status === 'failed'
                      ? '上传失败'
                      : `正在上传 ${draft.progress}%`}
                </span>
                <i style={{ ['--progress' as string]: `${draft.progress}%` }} />
              </div>
            </article>
          ))}
          {drafts.some((draft) => draft.status === 'failed') ? (
            <button className="upload-retry-button" type="button" onClick={retryFailed}>
              <WarningCircle size={18} weight="bold" aria-hidden="true" />
              有照片上传失败，重新上传
            </button>
          ) : null}
        </section>
      ) : null}
    </main>
  )
}
