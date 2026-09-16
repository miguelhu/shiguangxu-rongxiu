import { test, expect, Page } from '@playwright/test'
import { datasets, relations, cases } from '../src/v4/data'
import {
  newCase,
  available,
  ceremonyBlocks,
  orderedPhotos,
  sampleDraft,
  draftBlocks,
  allScope,
} from '../src/v4/model'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

async function visit(page: Page, p = 'invite', cid = 'teacher') {
  await page.goto(`/?case=${cid}&page=${p}&mode=experience`)
}
async function phone(page: Page) {
  return page.locator('.phone')
}
test('five independent case packages: counts, unique assets, relation direction and integrity', () => {
  expect(relations).toHaveLength(31)
  expect(new Set(relations.map((x) => x.code)).size).toBe(31)
  let photos = 0,
    stories = 0,
    voices = 0,
    authors = 0
  for (const c of cases) {
    const d = datasets[c.id]
    const s = newCase(c.id)
    photos += d.photos.length
    stories += d.stories.length
    voices += d.voices.length
    authors += d.authors.length
    const ids = new Set(d.photos.map((p) => p.id))
    expect(ids.size).toBe(d.photos.length)
    expect(d.shots.flatMap((x) => x.photoIds).sort()).toEqual([...ids].sort())
    expect(orderedPhotos(c.id, s, ceremonyBlocks(c.id, s))).toHaveLength(d.photos.length)
    for (const x of d.stories) for (const id of x.photoIds) expect(ids.has(id)).toBe(true)
    for (const a of d.authors)
      for (const code of a.relationCodes) expect(relations.some((r) => r.code === code)).toBe(true)
  }
  expect([authors, photos, stories, voices]).toEqual([44, 66, 22, 11])
})
test('private content, amended copies, withdrawals and ceremony version boundaries', () => {
  const s = newCase('teacher')
  s.version = {
    number: 1,
    blocks: structuredClone(available('teacher', s, 'ceremony')),
    featured: s.featured,
    host: s.host,
    at: '2026-09-13',
  }
  const original = s.version.blocks.find((b) => b.kind === 'story')!
  const text = original.body
  s.blocks.push({ ...original, body: 'new revision', revision: 2 })
  expect(available('teacher', s).filter((b) => b.id === original.id)).toHaveLength(1)
  expect(ceremonyBlocks('teacher', s).find((b) => b.id === original.id)?.body).toBe(text)
  s.blocks[0].scope = { gift: true, ceremony: false, keep: true }
  expect(ceremonyBlocks('teacher', s).some((b) => b.id === original.id)).toBe(false)
  const photo = s.version.blocks.find((b) => b.kind === 'photo')!
  s.withdrawn.push(photo.id)
  expect(ceremonyBlocks('teacher', s).some((b) => b.photoIds.includes(photo.photoIds[0]))).toBe(
    false,
  )
  s.blocks.push({ ...original, id: 'later', source: 'greeting', scope: { ...allScope } })
  expect(ceremonyBlocks('teacher', s).some((b) => b.id === 'later')).toBe(false)
  s.previewing = true
  expect(ceremonyBlocks('teacher', s).some((b) => b.id === 'later')).toBe(false)
})
test('four-step draft creates actual scoped records', () => {
  const s = newCase('teacher')
  for (const step of ['impressions', 'photos', 'stories', 'wishes'])
    s.draft = sampleDraft('teacher', s, step)
  expect(draftBlocks('teacher', s)).toHaveLength(5)
  expect(draftBlocks('teacher', s).every((b) => !b.scope.ceremony)).toBe(true)
  s.draft.scope = { ...allScope }
  expect(draftBlocks('teacher', s).every((b) => b.scope.ceremony)).toBe(true)
  s.draft.wishMode = 'photo'
  s.draft.wishPhotos = [s.draft.photos[0]]
  expect(draftBlocks('teacher', s).find((b) => b.kind === 'wish')?.body).toBe('')
})
test('identity and all four steps remain editable and submit once', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await visit(page)
  await page.getByRole('button', { name: '留下我的一份心意', exact: true }).click()
  await page
    .getByRole('button', { name: '更多关系 · 工作 / 学习 / 家庭 / 生活', exact: true })
    .click()
  await expect(page.getByRole('button', { name: '同事', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '朋友', exact: true }).click()
  await page.getByRole('button', { name: '开始留下心意', exact: true }).click()
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: '使用林悦的这一步示例', exact: true }).click()
    if (i === 0) await expect(page.getByRole('button', { name: '第4步 祝福' })).toBeDisabled()
    if (i === 2) {
      await page
        .getByRole('textbox', { name: '故事1标题', exact: true })
        .fill('那天下午，我一直记得')
    }
    if (i === 3) {
      await page.getByRole('button', { name: '预览这份心意', exact: true }).click()
    } else await (await phone(page)).getByRole('button', { name: '下一步', exact: true }).click()
  }
  await expect(page.getByText('那天下午，我一直记得', { exact: true })).toBeVisible()
  await page.getByRole('checkbox', { name: '送给受礼者', exact: true }).check()
  await page.getByRole('checkbox', { name: '在仪式中展示', exact: true }).check()
  await page.getByRole('button', { name: '确认提交这份心意', exact: true }).click()
  await expect(page.getByText('重要日子，提醒我问候', { exact: true })).toBeVisible()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sgx-demo-v4')!))
  expect(stored.cases.teacher.submission).toBe(1)
  expect(stored.cases.teacher.blocks).toHaveLength(5)
  await page.reload()
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher.submission,
    ),
  ).toBe(1)
  expect(errors).toEqual([])
})
test('photo-only wish has no text field; stickers and audio appear in preview', async ({
  page,
}) => {
  await visit(page, 'wishes')
  await page.getByRole('button', { name: '使用林悦的这一步示例', exact: true }).click()
  await page.getByRole('button', { name: '只放照片', exact: true }).click()
  await expect(page.locator('.wish-editor')).toHaveCount(0)
  await page.getByRole('button', { name: '预览这份心意', exact: true }).click()
  await expect(page.locator('.attached-sticker')).toHaveCount(1)
  await expect(page.locator('audio')).toHaveCount(0)
})
test('my records cover several recipients, edit and withdrawal work', async ({ page }) => {
  await visit(page, 'records')
  const filter = page.getByRole('combobox', { name: '按人物筛选' })
  expect(await filter.locator('option').count()).toBe(4)
  await filter.selectOption('leader')
  await page.getByRole('combobox', { name: '按内容类型筛选' }).selectOption('story')
  await page.locator('.record-copy').first().click()
  await page.getByRole('button', { name: '编辑内容与用途', exact: true }).click()
  await page.getByRole('textbox', { name: '回忆标题', exact: true }).fill('改过标题的共同回忆')
  await page.getByRole('button', { name: '保存修改', exact: true }).click()
  await expect(page.getByText('改过标题的共同回忆', { exact: true })).toBeVisible()
  await page.locator('.record-copy').first().click()
  await page.getByRole('button', { name: '撤回这项内容', exact: true }).click()
  await page.getByRole('button', { name: '确认撤回', exact: true }).click()
  await expect(page.getByText('改过标题的共同回忆', { exact: true })).toHaveCount(0)
})
test('individual relationships and profile editing are available', async ({ page }) => {
  await visit(page, 'relations')
  await expect(page.locator('.relationship-row')).toHaveCount(3)
  await page.locator('.relationship-row').first().click()
  await page.getByRole('button', { name: '朋友', exact: true }).click()
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await visit(page, 'profile')
  await page.getByRole('textbox', { name: '我的署名', exact: true }).fill('林悦悦')
  await page.getByRole('button', { name: '保存资料', exact: true }).click()
  await expect(page.locator('.profile-header h2')).toHaveText('林悦悦')
})
test('frame defaults to manual, has six chapters, photos, featured stories and readable bubbles', async ({
  page,
}) => {
  await visit(page, 'ceremony')
  await expect(page.getByRole('button', { name: '播放整份礼物', exact: true })).toBeVisible()
  await expect(page.locator('.chapter-nav button')).toHaveCount(6)
  await page.getByRole('button', { name: '一起走过的片段', exact: true }).click()
  await expect(page.locator('.montage')).toBeVisible()
  const first = await page.locator('.montage img').first().getAttribute('src')
  await page.getByRole('button', { name: '相框下一个片段', exact: true }).click()
  expect(await page.locator('.montage img').first().getAttribute('src')).not.toBe(first)
  await page.getByRole('button', { name: '查看全部照片', exact: true }).click()
  await expect(page.locator('.gallery-grid > div')).toHaveCount(18)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '有几句话，想认真说', exact: true }).click()
  await expect(page.locator('.featured-people button')).toHaveCount(3)
  await page.getByRole('button', { name: '这些心意，都给你', exact: true }).click()
  await expect(page.locator('.blessing-bubble')).toHaveCount(6)
  await page.locator('.blessing-bubble').filter({ hasText: '陈晓禾' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('audio')).toHaveCount(1)
})
test('reminder to new wish to actual frame delivery keeps original ceremony', async ({ page }) => {
  await visit(page, 'prepare')
  await page.getByRole('button', { name: '确认仪式版本', exact: true }).click()
  const version = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher.version,
  )
  await visit(page, 'messages')
  await page.getByRole('switch', { name: '提醒我问候陈老师', exact: true }).click()
  await page.getByRole('button', { name: '演示来到 2026-09-10 · 教师节', exact: true }).click()
  await page.locator('.notification-card').click()
  await page
    .getByRole('textbox', { name: '新的祝福', exact: true })
    .fill('陈老师，教师节快乐。最近又想起您的话。')
  await page.reload()
  await expect(page.getByRole('textbox', { name: '新的祝福', exact: true })).toHaveValue(
    '陈老师，教师节快乐。最近又想起您的话。',
  )
  await page.getByRole('button', { name: '加入可试听的演示声音', exact: true }).click()
  await page.getByRole('checkbox', { name: '把这份心意送给对方', exact: true }).check()
  await page.getByRole('button', { name: '送出这份心意', exact: true }).click()
  await page.getByRole('button', { name: '演示相框收到心意', exact: true }).click()
  await page.locator('.received-list button').click()
  await expect(page.locator('audio')).toHaveCount(1)
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher.delivery,
    ),
  ).toBe('read')
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher.version,
    ),
  ).toEqual(version)
})
test('overview and three panels can switch scenes without duplicate clients', async ({ page }) => {
  await visit(page)
  await page.getByRole('button', { name: '链路总览', exact: true }).click()
  await expect(page.locator('.flow-lane')).toHaveCount(3)
  await page.getByRole('button', { name: '多端对照', exact: true }).click()
  await expect(page.locator('.phone')).toHaveCount(1)
  await expect(page.locator('.frame-screen')).toHaveCount(1)
  await page.getByRole('button', { name: '提醒与再次问候', exact: true }).click()
  await expect(page.getByText('服务号消息与设备回执为演示操作。', { exact: true })).toBeVisible()
})
test('all media paths exist and can be loaded by the browser', async ({ request }) => {
  for (const c of cases)
    for (const asset of [
      c.cover,
      ...datasets[c.id].photos.map((p) => p.path),
      ...datasets[c.id].voices.map((v) => v.path),
      `audio/cases/${c.id}/greeting.m4a`,
    ]) {
      expect(existsSync(resolve('public', asset)), asset).toBe(true)
      expect((await request.get('/' + asset)).status(), asset).toBe(200)
    }
})
test('390px mobile experience stays within viewport and bubbles remain accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await visit(page, 'invite')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391)
  await visit(page, 'ceremony')
  await page.getByRole('button', { name: '这些心意，都给你', exact: true }).click()
  await expect(page.locator('.blessing-bubble')).toHaveCount(4)
  await page.getByRole('button', { name: '再看看其他人', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391)
})
test('self-organized birthday invitation supports empty organizer and no curator', async ({
  page,
}) => {
  await visit(page, 'entry', 'birthday')
  await page.getByRole('button', { name: /我想为自己留一份纪念/ }).click()
  const p = page.locator('.phone')
  await p.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('textbox', { name: '我的名字', exact: true }).fill('顾雅琴')
  await p.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('textbox', { name: '主办署名（可不填）', exact: true }).fill('')
  await p.getByRole('button', { name: '下一步', exact: true }).click()
  await expect(page.getByRole('switch', { name: '有人帮忙整理（可选主创）' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await p.getByRole('button', { name: '下一步', exact: true }).click()
  await p.getByRole('button', { name: '确认并生成邀请', exact: true }).click()
  const h = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.birthday.host,
  )
  expect(h.configured).toBe(true)
  expect(h.role).toBe('self')
  expect(h.organizer).toBe('')
})
test('anniversary relationships are independent for both recipients', async ({ page }) => {
  await visit(page, 'identity', 'anniversary')
  await page.getByRole('button', { name: '讲解备注', exact: true }).click()
  await page.getByRole('combobox', { name: '切换演示共创者', exact: true }).selectOption('A-U02')
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.anniversary.draft,
  )
  expect(stored.codes).toEqual(['relative'])
  expect(stored.secondaryCodes).toEqual(['sibling'])
  await expect(page.locator('.relationship-picker')).toHaveCount(2)
})
test('uploaded photo persists locally after refresh', async ({ page }) => {
  await visit(page, 'photos')
  await page
    .locator('input[type=file]')
    .setInputFiles(resolve('public/images/cases/teacher/t-p02.jpg'))
  await expect(page.locator('.photo-edit img')).toHaveCount(1)
  await page.getByRole('textbox', { name: '照片1说明', exact: true }).fill('我上传的那天下午')
  await page.reload()
  await expect(page.getByRole('textbox', { name: '照片1说明', exact: true })).toHaveValue(
    '我上传的那天下午',
  )
  await expect(page.locator('.photo-edit img')).toHaveAttribute('src', /^blob:/)
})
test('the original invitation accepts late contributions without changing the frozen gift',async({page})=>{
  await visit(page,'prepare');await page.getByRole('button',{name:'确认仪式版本',exact:true}).click()
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher.version)
  await visit(page,'invite');await page.getByRole('button',{name:'再添一份心意',exact:true}).click()
  await page.getByRole('textbox',{name:'现场祝福',exact:true}).fill('今天再添一句，谢谢陈老师！')
  await page.getByRole('checkbox',{name:'把这份心意送给对方',exact:true}).check()
  await page.getByRole('button',{name:'送出这份心意',exact:true}).click()
  await expect(page.getByRole('button',{name:'演示相框收到心意',exact:true})).toBeVisible()
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('sgx-demo-v4')!).cases.teacher)
  expect(after.version).toEqual(before);expect(after.onsite).toBe(false);expect(after.blocks.some((b:{source:string})=>b.source==='onsite')).toBe(true)
})
test('voice playback has actual duration and stops when navigating away',async({page})=>{
  await visit(page,'greeting');await page.getByRole('button',{name:'加入可试听的演示声音',exact:true}).click()
  const audio=page.locator('audio')
  await expect.poll(()=>audio.evaluate((a:HTMLAudioElement)=>a.duration)).toBeGreaterThan(1)
  await audio.evaluate((a:HTMLAudioElement)=>a.play())
  await expect.poll(()=>audio.evaluate((a:HTMLAudioElement)=>a.paused)).toBe(false)
  await page.getByRole('button',{name:'讲解备注',exact:true}).click()
  await page.getByRole('button',{name:'关闭讲解备注',exact:true}).click()
  await visit(page,'ceremony');expect(await page.locator('audio').count()).toBe(0)
})
test('portable single HTML contains its media and works without a web server',async({page})=>{
  const external:string[]=[];page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())})
  await page.goto(pathToFileURL(resolve('presentation/拾光叙-荣休礼互动演示.html')).href)
  await expect(page.getByRole('combobox',{name:'选择案例',exact:true})).toBeVisible()
  await page.getByRole('combobox',{name:'选择案例',exact:true}).selectOption('anniversary')
  await expect(page.locator('.phone img').first()).toHaveAttribute('src',/^data:image\/jpeg;base64,/)
  expect(external).toEqual([])
})
