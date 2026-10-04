const pages = JSON.parse(document.getElementById('page-data').textContent)
const storageKey = 'sgx-screen-review-v1'
const groups = [...new Set(pages.map((page) => page.group))]
const byFile = Object.fromEntries(pages.map((page) => [page.file, page]))
const $ = (selector) => document.querySelector(selector)
const make = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}
const uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
const escapeXml = (s) => String(s).replace(/[&<>"']/g, (x) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[x])
let feedback = { reviewer: '', pages: {} }
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
  if (saved && typeof saved === 'object' && saved.pages) feedback = saved
} catch {}
let groupFilter = 'all'
let query = ''
let current = null
let tool = 'comment'
let draftMark = null
let editing = null
let toastTimer = null
const save = () => {
  localStorage.setItem(storageKey, JSON.stringify(feedback))
  renderCount()
  if (current) renderFeedback()
}
const pageFeedback = (file) => feedback.pages[file] ||= { notes: [], marks: [] }
const activePageCount = () => Object.values(feedback.pages).filter((p) => p.notes.length || p.marks.length).length
const toast = (message) => {
  const node = $('#toast')
  node.textContent = message
  node.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => node.classList.remove('show'), 3300)
}

function renderCount() {
  $('#review-count').textContent = activePageCount()
  document.querySelectorAll('.screen-card').forEach((card) => {
    const data = feedback.pages[card.dataset.file]
    const count = (data?.notes.length || 0) + (data?.marks.length || 0)
    const badge = card.querySelector('.feedback-badge')
    badge.textContent = count ? `${count} 条标记` : ''
    badge.hidden = !count
  })
}
function renderGallery() {
  const holder = $('#gallery')
  holder.replaceChildren()
  for (const group of groups) {
    const visible = pages.filter((page) => page.group === group && (groupFilter === 'all' || groupFilter === group) && (!query || `${page.name} ${page.page}`.toLowerCase().includes(query)))
    if (!visible.length) continue
    const section = make('section', 'group-section')
    const heading = make('div', 'group-head')
    heading.append(make('h2', '', group), make('small', '', `${visible.length} 张页面`))
    const grid = make('div', 'screen-grid')
    for (const page of visible) {
      const card = make('article', 'screen-card')
      card.dataset.file = page.file
      const head = make('div', 'card-head')
      const title = make('div')
      title.append(make('h3', '', page.name.replace(/^\d+_/, '').replaceAll('_', ' · ')), make('small', '', page.page))
      const badge = make('span', 'feedback-badge')
      head.append(title, badge)
      const imageButton = make('button', 'card-open')
      imageButton.type = 'button'
      imageButton.setAttribute('aria-label', `评审${page.name}`)
      const image = make('img')
      image.src = encodeURIComponent(page.file)
      image.loading = 'lazy'
      image.alt = page.name
      imageButton.append(image)
      imageButton.addEventListener('click', () => openReview(page.file))
      const foot = make('div', 'card-foot')
      foot.append(make('span', '', '完整长图 · 点击添加意见'))
      const open = make('button', '', '评审这页 →')
      open.addEventListener('click', () => openReview(page.file))
      foot.append(open)
      card.append(head, imageButton, foot)
      grid.append(card)
    }
    section.append(heading, grid)
    holder.append(section)
  }
  renderCount()
}

function setTool(next) {
  tool = next
  document.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('selected', button.dataset.tool === next))
  $('#image-stage').classList.toggle('drawing', ['pen','highlight','rect'].includes(next))
  $('#image-stage').classList.toggle('pinning', next === 'comment')
}
async function openReview(file) {
  current = file
  editing = null
  const page = byFile[file]
  $('#review-group').textContent = page.group
  $('#review-title').textContent = page.name.replace(/^\d+_/, '').replaceAll('_', ' · ')
  const image = $('#review-image')
  image.src = encodeURIComponent(file)
  await image.decode().catch(() => {})
  $('#mark-layer').setAttribute('viewBox', `0 0 ${image.naturalWidth} ${image.naturalHeight}`)
  $('#image-scroll').scrollTop = 0
  $('#review-dialog').hidden = false
  document.body.classList.add('dialog-open')
  setTool('comment')
  renderMarks()
  renderPins()
  renderFeedback()
}
function closeReview() {
  $('#review-dialog').hidden = true
  document.body.classList.remove('dialog-open')
  current = null
  renderCount()
}
function pointFromEvent(event) {
  const box = $('#mark-layer').getBoundingClientRect()
  const image = $('#review-image')
  return {
    x: Math.max(0, Math.min(image.naturalWidth, (event.clientX - box.left) / box.width * image.naturalWidth)),
    y: Math.max(0, Math.min(image.naturalHeight, (event.clientY - box.top) / box.height * image.naturalHeight)),
  }
}
function svgNode(type, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', type)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}
function drawMarkSvg(mark, layer) {
  if (mark.kind === 'rect') {
    const x = Math.min(mark.start.x, mark.end.x), y = Math.min(mark.start.y, mark.end.y)
    layer.append(svgNode('rect', {x,y,width:Math.abs(mark.end.x-mark.start.x),height:Math.abs(mark.end.y-mark.start.y),fill:'none',stroke:'#b55b4b','stroke-width':4}))
  } else if (mark.points.length > 1) {
    const d = mark.points.map((p,i) => `${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    layer.append(svgNode('path', {d,fill:'none',stroke:mark.kind==='highlight'?'#edc84b':'#bc6252','stroke-width':mark.kind==='highlight'?23:4,'stroke-opacity':mark.kind==='highlight'?.48:.95,'stroke-linecap':'round','stroke-linejoin':'round'}))
  }
}
function renderMarks() {
  const layer = $('#mark-layer')
  layer.replaceChildren()
  if (!current) return
  for (const mark of pageFeedback(current).marks) drawMarkSvg(mark, layer)
  if (draftMark) drawMarkSvg(draftMark, layer)
}
function renderPins() {
  const layer = $('#pin-layer')
  layer.replaceChildren()
  if (!current) return
  const { naturalWidth: width, naturalHeight: height } = $('#review-image')
  pageFeedback(current).notes.filter((note) => note.point).forEach((note, i) => {
    const pin = make('button', 'pin', String(i+1))
    pin.type = 'button'
    pin.style.left = `${note.point.x/width*100}%`
    pin.style.top = `${note.point.y/height*100}%`
    pin.title = note.text || '待填写评论'
    pin.addEventListener('click', (event) => {
      event.stopPropagation()
      editing = note.id
      renderFeedback()
      document.querySelector(`[data-feedback-id="${note.id}"]`)?.scrollIntoView({block:'nearest',behavior:'smooth'})
    })
    layer.append(pin)
  })
}
function itemEditor(item, type) {
  const wrap = make('div', 'comment-editor')
  const textarea = make('textarea')
  textarea.placeholder = type === 'mark' ? '说明这处需要怎么修改……' : '写下这处的修改意见……'
  textarea.value = item.text || ''
  textarea.rows = 3
  const actions = make('div', 'actions')
  const saveButton = make('button', 'primary', '保存意见')
  saveButton.addEventListener('click', () => {
    item.text = textarea.value.trim()
    if (!item.text && type === 'note') {
      toast('请写下具体意见，或删除这个标记')
      return
    }
    editing = null
    save()
    renderPins()
    toast('意见已保存')
  })
  const cancel = make('button', '', '取消')
  cancel.addEventListener('click', () => { editing = null; renderFeedback() })
  actions.append(saveButton,cancel)
  wrap.append(textarea,actions)
  setTimeout(() => textarea.focus(),0)
  return wrap
}
function renderFeedback() {
  const list = $('#feedback-list')
  list.replaceChildren()
  if (!current) return
  const data = pageFeedback(current)
  const items = [...data.notes.map((item) => ({item,type:'note'})), ...data.marks.map((item) => ({item,type:'mark'}))]
  if (!items.length) list.append(make('p', 'save-tip', '还没有意见。点击截图上的位置，就可以开始评论。'))
  for (const {item,type} of items) {
    const row = make('div', 'feedback-item')
    row.dataset.feedbackId = item.id
    const head = make('div', 'feedback-item-head')
    const kind = type === 'mark' ? ({pen:'画笔',highlight:'荧光笔',rect:'框选'}[item.kind] || '勾画') : item.point ? '图片定位评论' : '整体意见'
    head.append(make('b', '', kind))
    const remove = make('button', '', '删除')
    remove.addEventListener('click', () => {
      data[type === 'note' ? 'notes' : 'marks'] = data[type === 'note' ? 'notes' : 'marks'].filter((entry) => entry.id !== item.id)
      editing = null
      save(); renderMarks(); renderPins()
    })
    head.append(remove)
    row.append(head)
    if (editing === item.id) row.append(itemEditor(item,type))
    else {
      if (item.text) row.append(make('p', '', item.text))
      const edit = make('button', 'jump', item.text ? '修改意见 →' : '补充说明 →')
      edit.addEventListener('click', () => { editing = item.id; renderFeedback() })
      row.append(edit)
      if (item.point) {
        const jump = make('button', 'jump', ' · 在图中定位')
        jump.addEventListener('click', () => {
          const image = $('#review-image')
          const ratio = image.getBoundingClientRect().width / image.naturalWidth
          $('#image-scroll').scrollTo({top:Math.max(0,item.point.y*ratio-140),behavior:'smooth'})
        })
        row.append(jump)
      }
    }
    list.append(row)
  }
}

$('#pin-layer').addEventListener('click', (event) => {
  if (tool !== 'comment' || !current || event.target.closest('.pin')) return
  const point = pointFromEvent(event)
  const item = { id: uuid(), point, text: '', at: new Date().toISOString() }
  pageFeedback(current).notes.push(item)
  editing = item.id
  save(); renderPins()
})
const layer = $('#mark-layer')
layer.addEventListener('pointerdown', (event) => {
  if (!current || !['pen','highlight','rect'].includes(tool)) return
  event.preventDefault()
  const point = pointFromEvent(event)
  draftMark = tool === 'rect' ? { id:uuid(),kind:tool,start:point,end:point,text:'' } : { id:uuid(),kind:tool,points:[point],text:'' }
  layer.setPointerCapture(event.pointerId)
})
layer.addEventListener('pointermove', (event) => {
  if (!draftMark) return
  const point = pointFromEvent(event)
  if (draftMark.kind === 'rect') draftMark.end = point
  else draftMark.points.push(point)
  renderMarks()
})
layer.addEventListener('pointerup', () => {
  if (!draftMark || !current) return
  if (draftMark.kind === 'rect' || draftMark.points.length > 1) {
    pageFeedback(current).marks.push(draftMark)
    editing = draftMark.id
    save()
  }
  draftMark = null
  renderMarks()
})
document.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)))
$('#undo-mark').addEventListener('click', () => {
  if (!current) return
  const item = pageFeedback(current).marks.pop()
  if (!item) return toast('没有可撤销的勾画')
  editing = null; save(); renderMarks(); toast('已撤销上一处勾画')
})
$('#general-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const textarea = $('#general-note')
  const text = textarea.value.trim()
  if (!text) return toast('请先写下整体意见')
  pageFeedback(current).notes.push({id:uuid(),point:null,text,at:new Date().toISOString()})
  textarea.value = ''
  save(); toast('意见已保存')
})
$('#close-dialog').addEventListener('click', closeReview)
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && current) closeReview() })
$('#reviewer-name').value = feedback.reviewer || ''
$('#reviewer-name').addEventListener('input', (event) => { feedback.reviewer = event.target.value; save() })
document.querySelectorAll('[data-group]').forEach((button) => button.addEventListener('click', () => {
  groupFilter = button.dataset.group
  document.querySelectorAll('[data-group]').forEach((x) => x.classList.toggle('active', x === button))
  renderGallery()
}))
$('#search').addEventListener('input', (event) => { query = event.target.value.trim().toLowerCase(); renderGallery() })

const encoder = new TextEncoder()
const crcTable = Array.from({length:256},(_,n) => {
  let c=n
  for(let i=0;i<8;i++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1)
  return c>>>0
})
function crc32(data) {
  let crc=0xffffffff
  for(const byte of data) crc=crcTable[(crc^byte)&255]^(crc>>>8)
  return (crc^0xffffffff)>>>0
}
function zipStore(files) {
  const parts=[], central=[]
  let offset=0
  for(const {name,data} of files) {
    const label=encoder.encode(name), bytes=data instanceof Uint8Array?data:encoder.encode(data)
    const crc=crc32(bytes)
    const local=new Uint8Array(30+label.length), l=new DataView(local.buffer)
    l.setUint32(0,0x04034b50,true); l.setUint16(4,20,true); l.setUint16(6,0x800,true)
    l.setUint32(14,crc,true); l.setUint32(18,bytes.length,true); l.setUint32(22,bytes.length,true)
    l.setUint16(26,label.length,true); local.set(label,30)
    const entry=new Uint8Array(46+label.length), c=new DataView(entry.buffer)
    c.setUint32(0,0x02014b50,true); c.setUint16(4,20,true); c.setUint16(6,20,true); c.setUint16(8,0x800,true)
    c.setUint32(16,crc,true); c.setUint32(20,bytes.length,true); c.setUint32(24,bytes.length,true)
    c.setUint16(28,label.length,true); c.setUint32(42,offset,true); entry.set(label,46)
    parts.push(local,bytes); central.push(entry); offset+=local.length+bytes.length
  }
  const size=central.reduce((n,p)=>n+p.length,0), end=new Uint8Array(22), view=new DataView(end.buffer)
  view.setUint32(0,0x06054b50,true); view.setUint16(8,files.length,true); view.setUint16(10,files.length,true)
  view.setUint32(12,size,true); view.setUint32(16,offset,true)
  return new Blob([...parts,...central,end],{type:'application/zip'})
}
function pageSvg(file,data,width,height) {
  const marks=data.marks.map((mark) => {
    if(mark.kind==='rect') return `<rect x="${Math.min(mark.start.x,mark.end.x)}" y="${Math.min(mark.start.y,mark.end.y)}" width="${Math.abs(mark.end.x-mark.start.x)}" height="${Math.abs(mark.end.y-mark.start.y)}" fill="none" stroke="#b55b4b" stroke-width="4"/>`
    return `<polyline points="${mark.points.map((p)=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="${mark.kind==='highlight'?'#edc84b':'#bc6252'}" stroke-width="${mark.kind==='highlight'?23:4}" opacity="${mark.kind==='highlight'?.48:.95}" stroke-linecap="round" stroke-linejoin="round"/>`
  }).join('')
  const pins=data.notes.filter((note)=>note.point).map((note,i)=>`<g><circle cx="${note.point.x}" cy="${note.point.y}" r="13" fill="#b45f4c" stroke="white" stroke-width="3"/><text x="${note.point.x}" y="${note.point.y+4}" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">${i+1}</text></g>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><title>${escapeXml(byFile[file].name)}标注</title>${marks}${pins}</svg>`
}
async function markedPng(file,data) {
  const image=new Image(); image.src=encodeURIComponent(file); await image.decode()
  const canvas=document.createElement('canvas'); canvas.width=image.naturalWidth; canvas.height=image.naturalHeight
  const ctx=canvas.getContext('2d'); ctx.drawImage(image,0,0)
  const svg=pageSvg(file,data,image.naturalWidth,image.naturalHeight)
  const overlay=new Image(); overlay.src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}))
  await overlay.decode(); ctx.drawImage(overlay,0,0); URL.revokeObjectURL(overlay.src)
  return {svg,bytes:new Uint8Array(await (await new Promise((resolve)=>canvas.toBlob(resolve,'image/png'))).arrayBuffer())}
}
$('#export-button').addEventListener('click', async () => {
  const reviewer=feedback.reviewer.trim()
  if(!reviewer){$('#reviewer-name').focus();return toast('请先填写评审人名字')}
  const modified=pages.filter((page)=>{
    const data=feedback.pages[page.file]
    return data && (data.notes.length || data.marks.length)
  })
  if(!modified.length) return toast('请先给至少一张页面留下意见')
  const button=$('#export-button');button.disabled=true;button.textContent='正在整理反馈包…'
  try{
    const created=new Date().toISOString()
    const exportData={version:1,reviewer,created,pages:Object.fromEntries(modified.map((page)=>[page.file,{page:page.name,group:page.group,...feedback.pages[page.file]}]))}
    const files=[
      {name:'README.md',data:`# 拾光叙小程序评审反馈\n\n评审人：${reviewer}\n导出时间：${created}\n已评审页面：${modified.length} 张。\n\n请把整个 ZIP 发给项目负责人。review.json 是可汇总的结构化数据；pages/ 是逐页文字意见；marked/ 是圈画后的页面截图；annotations/ 是可单独叠加的 SVG 标记。\n`},
      {name:'review.json',data:JSON.stringify(exportData,null,2)},
    ]
    const summary=[`# ${reviewer}的小程序评审意见`,'']
    for(const page of modified){
      const data=feedback.pages[page.file]
      const title=page.name.replace(/^\d+_/, '').replaceAll('_',' · ')
      const lines=[`# ${title}`,'',`页面文件：${page.file}`,'',...data.notes.map((n,i)=>`${i+1}. ${n.point?'图片定位':'整体意见'}：${n.text}${n.point?`（位置 ${Math.round(n.point.x)}, ${Math.round(n.point.y)}）`:''}`),...data.marks.map((m,i)=>`${i+1}. ${m.kind} 勾画：${m.text||'未补充文字说明'}`),'']
      summary.push(`## ${title}`,...lines.slice(4))
      const stem=page.file.replace(/\.png$/,'')
      files.push({name:`pages/${stem}.md`,data:lines.join('\n')})
      const output=await markedPng(page.file,data)
      files.push({name:`annotations/${stem}.svg`,data:output.svg})
      files.push({name:`marked/${stem}.png`,data:output.bytes})
    }
    files.push({name:'汇总意见.md',data:summary.join('\n')})
    const blob=zipStore(files),url=URL.createObjectURL(blob),link=make('a')
    link.href=url;link.download=`拾光叙小程序评审_${reviewer}_${new Date().toISOString().slice(0,10)}.zip`
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)
    toast(`已导出 ${modified.length} 张页面的反馈包`)
  }catch(error){console.error(error);toast('导出失败，请重试')}
  finally{button.disabled=false;button.textContent='导出我的反馈包'}
})
renderGallery()
