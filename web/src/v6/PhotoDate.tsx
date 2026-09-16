import { Photo } from './data'
export function PhotoDate({
  photo,
  index,
  onChange,
}: {
  photo: Photo
  index: number
  onChange: (v: Partial<Photo>) => void
}) {
  const [year = '', month = '', day = ''] = photo.date.split('-')
  const current = new Date().getFullYear()
  const update = (y: string, m: string, d: string) =>
    onChange({
      date: y ? [y, m, d].filter(Boolean).join('-') : '',
      precision: !y ? 'unknown' : !m ? 'year' : !d ? 'month' : 'day',
    })
  const days = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31
  return (
    <div className="photo-date">
      <label>这大概是什么时候？</label>
      <div>
        <select
          aria-label={`照片${index}年份`}
          value={year}
          onChange={(e) => update(e.target.value, e.target.value ? month : '', '')}
        >
          <option value="">不记得年</option>
          {Array.from({ length: current - 1899 }, (_, i) => current - i).map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
        <select
          aria-label={`照片${index}月份`}
          disabled={!year}
          value={month}
          onChange={(e) => update(year, e.target.value, '')}
        >
          <option value="">不记得月</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
            <option key={m} value={m}>
              {Number(m)}月
            </option>
          ))}
        </select>
        <select
          aria-label={`照片${index}日期`}
          disabled={!year || !month}
          value={day}
          onChange={(e) => update(year, month, e.target.value)}
        >
          <option value="">不记得日</option>
          {Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
            <option key={d} value={d}>
              {Number(d)}日
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
