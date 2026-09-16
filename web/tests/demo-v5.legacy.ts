import { test, expect, Page } from '@playwright/test'
import { cases, datasets, relations } from '../src/v5/data'
import {
  initial,
  newCase,
  STORAGE,
  available,
  ceremonyBlocks,
  photosFor,
  sampleDraft,
  draftBlocks,
} from '../src/v5/model'
import {
  lifecycle,
  stageEnabled,
  generateLetter,
  canFreeze,
  freezeVersion,
  letterCurrent,
  validPhotoDate,
} from '../src/v5/workflow'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const ph = (p: Page) => p.locator('.phone')
async function visit(p: Page, page = 'invite', role = 'contributor', cid = 'teacher') {
  await p.goto(`/?case=${cid}&page=${page}&role=${role}`)
}
function prepared() {
  const s = initial()
  const c = s.cases.teacher
  c.review = { photos: true, stories: true, wishes: true, previewed: true }
  c.letter = generateLetter('teacher', c)
  c.letter.confirmed = true
  c.version = freezeVersion('teacher', c)
  c.previewing = false
  return s
}
async function seed(p: Page, s = prepared()) {
  await p.addInitScript(({ s, k }) => localStorage.setItem(k, JSON.stringify(s)), { s, k: STORAGE })
}
async function state(p: Page) {
  return p.evaluate((k) => JSON.parse(localStorage.getItem(k)!), STORAGE)
}
async function example(p: Page) {
  await ph(p).getByRole('button', { name: '示例 ?', exact: true }).click()
  await ph(p)
    .getByRole('button', { name: /使用.+的这一步示例/ })
    .click()
}
test('data integrity, independent cases and stripped story media', () => {
  expect(lifecycle).toHaveLength(13)
  expect(relations).toHaveLength(31)
  expect(cases.reduce((n, c) => n + datasets[c.id].photos.length, 0)).toBe(66)
  for (const c of cases) {
    const s = newCase(c.id)
    expect(s.coordinatorName).toBeTruthy()
    for (const b of available(c.id, s).filter((b) => b.kind === 'story')) {
      expect(b.photoIds).toEqual([])
      expect(b.audio).toBe('')
    }
    for (const p of datasets[c.id].photos)
      expect(existsSync(resolve('public', p.path))).toBeTruthy()
  }
})
test('real date validation respects leap years and precision', () => {
  for (const [d, p, result] of [
    ['2024-02-29', 'day', true],
    ['2025-02-29', 'day', false],
    ['2026-04-31', 'day', false],
    ['2026-13', 'month', false],
    ['2026', 'year', true],
    ['', 'unknown', true],
  ] as const)
    expect(validPhotoDate(d, p)).toBe(result)
})
test('letter generation, stale inputs, freeze and later submissions stay isolated', () => {
  const s = newCase('teacher')
  expect(canFreeze('teacher', s)).toBe(false)
  s.letter = generateLetter('teacher', s)
  expect(s.letter.text.length).toBeGreaterThan(350)
  expect(s.letter.sources.length).toBeGreaterThan(10)
  s.letter.confirmed = true
  s.review = { photos: true, stories: true, wishes: true, previewed: true }
  s.version = freezeVersion('teacher', s)
  const text = s.version.letter!.text
  const old = ceremonyBlocks('teacher', s).length
  s.blocks.push({
    ...available('teacher', s)[0],
    id: 'guest-new',
    source: 'onsite',
    kind: 'wish',
    body: '今天的祝福',
  })
  expect(letterCurrent('teacher', s)).toBe(true)
  expect(ceremonyBlocks('teacher', s)).toHaveLength(old)
  expect(s.version.letter!.text).toBe(text)
  s.heroPhotos = [photosFor('teacher', s)[0].id]
  expect(letterCurrent('teacher', s)).toBe(false)
  expect(canFreeze('teacher', s)).toBe(false)
})
test('fixed lifecycle and role gating before delivery', async ({ page }) => {
  await visit(page)
  expect(
    await page.getByRole('navigation', { name: '礼物生命周期' }).getByRole('button').count(),
  ).toBe(13)
  await expect(page.getByRole('button', { name: '05 整理内容', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '长者体验', exact: true }).click()
  await expect(page.locator('.waiting-view')).toBeVisible()
  await expect(page.locator('.frame-device')).toHaveCount(0)
  await visit(page, 'letter', 'contributor')
  await expect(ph(page)).toContainText('这一步由统筹者负责')
})
test('five persistent bottom entrances and default coordinator role', async ({ page }) => {
  await visit(page, 'identity')
  const nav = ph(page).locator('.phone-tabs')
  await expect(nav.getByRole('button')).toHaveCount(5)
  await nav.getByRole('button', { name: '我的礼物', exact: true }).click()
  await expect(ph(page)).toContainText('进行中')
  await page.getByRole('button', { name: '统筹者体验', exact: true }).click()
  await expect(ph(page)).toContainText('统筹者：周宁')
  await nav.getByRole('button', { name: '消息', exact: true }).click()
  await expect(ph(page)).toContainText('等待确认')
})
test('primary relation plus secondary, phone validation and state persistence', async ({
  page,
}) => {
  await visit(page, 'identity')
  await ph(page).getByLabel('主要关系', { exact: true }).selectOption('colleague')
  await ph(page)
    .getByRole('button', { name: /你们还有其他关系吗/ })
    .click()
  await ph(page).getByRole('button', { name: '朋友', exact: true }).click()
  await ph(page).getByPlaceholder('留下一个可以联系到你的号码').fill('abc')
  await ph(page).getByRole('button', { name: '开始留下心意' }).click()
  await expect(ph(page)).toContainText('请检查联系电话格式')
  await ph(page).getByPlaceholder('留下一个可以联系到你的号码').fill('')
  await ph(page).getByRole('button', { name: '开始留下心意' }).click()
  await page.reload()
  expect((await state(page)).cases.teacher.draft.primary).toBe('colleague')
  expect((await state(page)).cases.teacher.draft.codes).toContain('friend')
})
test('four steps, rich examples, simple preview and idempotent send', async ({ page }) => {
  await visit(page, 'identity')
  await ph(page).getByRole('button', { name: '开始留下心意' }).click()
  for (const step of ['impressions', 'photos', 'stories', 'wishes']) {
    await example(page)
    if (step === 'stories') {
      await expect(ph(page).locator('input[type=file]')).toHaveCount(0)
      await expect(ph(page).getByLabel('故事1正文', { exact: true })).not.toBeEmpty()
    }
    await ph(page)
      .getByRole('button', { name: step === 'wishes' ? '预览这份心意' : '下一步', exact: true })
      .click()
  }
  await expect(ph(page).locator('input[type=checkbox]')).toHaveCount(0)
  await expect(ph(page)).toContainText('不含公开宣传')
  await ph(page).getByRole('button', { name: '确认送出', exact: true }).click()
  const before = (await state(page)).cases.teacher.blocks.length
  await visit(page, 'preview')
  await ph(page).getByRole('button', { name: '确认送出', exact: true }).click()
  expect((await state(page)).cases.teacher.blocks.length).toBe(before)
})
test('upload capped at ten and persists through reload', async ({ page }) => {
  await visit(page, 'photos')
  const file = resolve('public', datasets.teacher.photos[0].path)
  await ph(page).locator('input[type=file]').setInputFiles(Array(11).fill(file))
  await expect(ph(page).getByLabel('照片10说明', { exact: true })).toBeVisible()
  await expect(ph(page).getByLabel('照片11说明', { exact: true })).toHaveCount(0)
  await page.reload()
  expect((await state(page)).cases.teacher.draft.photos).toHaveLength(10)
})
test('story-only payload never includes photo or voice', () => {
  const s = newCase('teacher')
  s.draft = sampleDraft('teacher', s, 'stories')
  s.draft.stories[0].photoIds = ['bogus']
  s.draft.stories[0].audio = 'bogus'
  const b = draftBlocks('teacher', s)[0]
  expect(b.photoIds).toEqual([])
  expect(b.audio).toBe('')
})
test('coordinator reviews everything then freezes, recipient sees seven chapters', async ({
  page,
}) => {
  await visit(page, 'workspace', 'coordinator')
  await ph(page).getByRole('button', { name: '继续整理成品' }).click()
  await ph(page).getByRole('button', { name: '照片检查完成，去看故事' }).click()
  await ph(page).getByRole('button', { name: '故事已确认，去看祝福' }).click()
  await ph(page).getByRole('button', { name: '祝福检查完成，整理总信' }).click()
  await ph(page).getByRole('button', { name: '小叙整理第一版' }).click()
  await expect(ph(page).getByLabel('大家写给你的一封信', { exact: true })).not.toBeEmpty()
  await ph(page).getByRole('button', { name: '确认这封信', exact: true }).click()
  await ph(page).getByRole('button', { name: '预览相框成品', exact: true }).click()
  await expect(ph(page).getByRole('button', { name: '确认仪式版本', exact: true })).toBeDisabled()
  await ph(page).getByRole('button', { name: '打开相框成品预览' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '我已检查完整成品' }).click()
  await ph(page).getByRole('button', { name: '确认仪式版本', exact: true }).click()
  expect((await state(page)).cases.teacher.version.number).toBe(1)
  await page.getByRole('button', { name: '长者体验', exact: true }).click()
  await expect(page.getByRole('button', { name: '大家写给你的一封信', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '大家写给你的一封信', exact: true }).click()
  await expect(page.locator('.letter-paper')).toBeVisible()
})
test('review task opens selected tab and restores removed photos', async ({ page }) => {
  await visit(page, 'workspace', 'coordinator')
  await ph(page)
    .locator('.task-list')
    .getByRole('button', { name: /看祝福/ })
    .click()
  await expect(ph(page).getByRole('button', { name: '祝福检查完成，整理总信' })).toBeVisible()
  await ph(page).getByRole('button', { name: '看照片', exact: true }).click()
  const n = await ph(page).locator('.manage-photo').count()
  await ph(page).getByRole('button', { name: '从成品移除', exact: true }).first().click()
  await expect(ph(page).locator('.manage-photo')).toHaveCount(n - 1)
  await ph(page)
    .getByRole('button', { name: /恢复移除的/ })
    .click()
  await expect(ph(page).locator('.manage-photo')).toHaveCount(n)
})
test('transfer waits for accept then removes previous management rights', async ({ page }) => {
  await visit(page, 'handover', 'coordinator')
  await ph(page).getByLabel('新的统筹者姓名', { exact: true }).fill('陆谨')
  await ph(page).getByRole('button', { name: '发送统筹邀请（演示）' }).click()
  expect((await state(page)).cases.teacher.coordinatorName).toBe('周宁')
  await ph(page).getByRole('button', { name: '演示对方接受' }).click()
  await expect(ph(page)).toContainText('统筹已交给')
  await expect(page.getByRole('button', { name: '06 生成祝福信', exact: true })).toBeDisabled()
})
test('first onsite guest sends without original four steps, frozen letter survives', async ({
  page,
}) => {
  await seed(page)
  await visit(page, 'guest')
  await ph(page).getByLabel('现场署名', { exact: true }).fill('现场来宾')
  await ph(page).getByRole('button', { name: '留下现场心意', exact: true }).click()
  await ph(page).getByLabel('现场祝福', { exact: true }).fill('愿老师天天开心')
  await ph(page).getByRole('button', { name: '送出这份心意' }).click()
  const s = (await state(page)).cases.teacher
  expect(s.blocks.at(-1).author).toBe('现场来宾')
  expect(s.version.blocks.some((b: any) => b.author === '现场来宾')).toBe(false)
  await expect(ph(page)).toContainText('已经送出')
})
test('photo-first greeting, optional text-only path and received image', async ({ page }) => {
  await seed(page)
  await visit(page, 'greeting')
  await ph(page).getByLabel('近况短话', { exact: true }).fill('今天想起了您')
  await ph(page).getByRole('button', { name: '送出这份心意' }).click()
  await expect(page.getByRole('status')).toContainText('先放一张照片')
  await ph(page).getByRole('button', { name: '放入一张演示照片' }).click()
  await ph(page).getByRole('button', { name: '送出这份心意' }).click()
  await page.getByRole('button', { name: '长者体验', exact: true }).click()
  await page.getByRole('button', { name: '13 相框收到新心意', exact: true }).click()
  await page.getByRole('button', { name: /演示相框收到新心意/ }).click()
  await expect(page.locator('.received-photo')).toBeVisible()
  await expect(page.locator('.received-list')).toContainText('今天想起了您')
})
test('profile and all-person records have working persistent edits', async ({ page }) => {
  await visit(page, 'profile')
  await ph(page).getByLabel('我的署名', { exact: true }).fill('林悦测试')
  await ph(page).getByLabel('一句介绍', { exact: true }).fill('愿每次想起都有回音')
  await ph(page).getByRole('button', { name: '保存资料' }).click()
  await page.reload()
  await expect(ph(page)).toContainText('林悦测试')
  await ph(page).getByRole('button', { name: '我的共创记录', exact: true }).click()
  await expect(ph(page)).toContainText('陈老师')
  await expect(ph(page)).toContainText('周老师')
})
test('all cases and modes render without exceptions or horizontal overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const c of cases) {
    await visit(page, 'invite', 'contributor', c.id)
    await expect(ph(page)).toContainText(c.host)
  }
  await page.getByRole('button', { name: '链路总览', exact: true }).click()
  await expect(page.locator('.overview-v5')).toBeVisible()
  await page.getByRole('button', { name: '多端对照', exact: true }).click()
  await expect(page.locator('.comparison-grid')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '角色体验', exact: true }).click()
  await expect(ph(page)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  )
  expect(
    await page.locator('.role-strip').evaluate((e) => e.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(115)
  expect(errors).toEqual([])
})
test('offline standalone boots without external assets', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('presentation/拾光叙-荣休礼互动演示.html')).href)
  await expect(page.getByText('DEMO 05 · 09·13更新', { exact: true })).toBeVisible()
  await expect(page.locator('.phone img').first()).toBeVisible()
  expect(
    await page
      .locator('.phone img')
      .first()
      .evaluate((i: HTMLImageElement) => i.naturalWidth),
  ).toBeGreaterThan(0)
})

test('initiator draft resumes, validates dates, and finalizes with default coordinator', async ({
  page,
}) => {
  await visit(page, 'entry')
  await ph(page)
    .getByRole('button', { name: /代表单位或团队主办/ })
    .click()
  await ph(page).getByLabel('统筹者姓名', { exact: true }).fill('测试统筹')
  await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
  await ph(page)
    .locator('.phone-tabs')
    .getByRole('button', { name: '我的礼物', exact: true })
    .click()
  await ph(page).getByRole('button', { name: '进行中', exact: true }).click()
  await ph(page).locator('.gift-project').click()
  await expect(ph(page)).toContainText('先介绍受礼者')
  await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
  await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
  await ph(page).getByLabel('共创截止日期', { exact: true }).fill('2026-12-30')
  await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
  await expect(ph(page)).toContainText('截止时间不能晚于仪式')
  await ph(page).getByLabel('共创截止日期', { exact: true }).fill('2026-07-10')
  await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
  await ph(page).getByRole('button', { name: '确认并生成邀请', exact: true }).click()
  expect((await state(page)).cases.teacher.host.configured).toBe(true)
  expect((await state(page)).role).toBe('coordinator')
})
test('voice opens optionally, plays a real file and stops on page change', async ({ page }) => {
  await visit(page, 'wishes')
  await expect(ph(page).locator('audio')).toHaveCount(0)
  await ph(page)
    .getByRole('button', { name: /送一段语音祝福/ })
    .click()
  await expect(ph(page).getByRole('button', { name: /开始录音/ })).toBeVisible()
  await ph(page).getByRole('button', { name: '使用可试听的演示声音' }).click()
  const a = ph(page).locator('audio')
  await expect.poll(() => a.evaluate((x: HTMLAudioElement) => x.readyState)).toBeGreaterThan(0)
  await a.evaluate((x: HTMLAudioElement) => x.play())
  await expect.poll(() => a.evaluate((x: HTMLAudioElement) => x.currentTime)).toBeGreaterThan(0)
  await ph(page).locator('.phone-tabs').getByRole('button', { name: '我的', exact: true }).click()
  await expect(page.locator('audio')).toHaveCount(0)
})
test('reminders respect person and service-channel opt-in', async ({ page }) => {
  await visit(page, 'messages')
  await ph(page).getByRole('switch', { name: '提醒我问候陈老师' }).click()
  await ph(page)
    .getByRole('button', { name: /演示来到/ })
    .click()
  await expect(ph(page).locator('.notification-card')).toBeVisible()
  await ph(page).getByRole('button', { name: '服务号示意' }).click()
  await expect(ph(page).locator('.notification-card')).toHaveCount(0)
  await ph(page).getByRole('switch', { name: '通过服务号收到提醒', exact: true }).click()
  await expect(ph(page).locator('.notification-card')).toBeVisible()
  await ph(page).locator('.notification-card').click()
  await expect(ph(page)).toContainText('放一张最近的照片')
})
test('author draft switching preserves each writer and case selection is isolated', async ({
  page,
}) => {
  await visit(page, 'identity')
  await ph(page).getByLabel('我的署名', { exact: true }).fill('林悦的草稿')
  await page.getByRole('button', { name: '讲解备注', exact: true }).click()
  const select = page.getByLabel('切换演示共创者', { exact: true })
  await select.selectOption(datasets.teacher.authors[1].id)
  await ph(page).getByLabel('我的署名', { exact: true }).fill('另一位的草稿')
  await select.selectOption(datasets.teacher.authors[0].id)
  await expect(ph(page).getByLabel('我的署名', { exact: true })).toHaveValue('林悦的草稿')
  await page.getByRole('button', { name: '关闭讲解备注' }).click()
  await page.getByLabel('选择案例', { exact: true }).selectOption('leader')
  expect((await state(page)).cases.teacher.draft.name).toBe('林悦的草稿')
  expect((await state(page)).cases.leader.draft.name).not.toBe('林悦的草稿')
})
test('text-only later greeting is available through explicit fallback', async ({ page }) => {
  await visit(page, 'greeting')
  await ph(page).getByLabel('近况短话', { exact: true }).fill('祝您生日快乐')
  await ph(page).getByRole('button', { name: '暂时没有照片，只说一句话' }).click()
  await ph(page).getByRole('button', { name: '送出这份心意' }).click()
  await expect(ph(page)).toContainText('已经送出')
  expect((await state(page)).cases.teacher.blocks.at(-1).photoIds).toEqual([])
})

test('my gifts combines initiation and coordination without draft categories', async ({ page }) => {
  const s = prepared()
  s.cases.leader.owned = true
  s.role = 'coordinator'
  await seed(page, s)
  await visit(page, 'gifts', 'coordinator')
  await expect(ph(page).locator('.segmented button')).toHaveText(['进行中', '已完成'])
  await expect(ph(page)).not.toContainText('草稿')
  await expect(ph(page)).not.toContainText('我发起的')
  await expect(ph(page)).not.toContainText('我统筹的')
  await expect(ph(page).locator('.gift-project')).toHaveCount(4)
  await ph(page).getByRole('button', { name: '已完成', exact: true }).click()
  await expect(ph(page).locator('.gift-project')).toHaveCount(1)
  await ph(page).locator('.gift-project').click()
  await expect(ph(page)).toContainText('最后看一遍')
  await expect(page).toHaveURL(/page=product/)
})
test('owned gift opens management even from contributor view, no empty completion card', async ({
  page,
}) => {
  const s = initial()
  s.cases.nurse.owned = true
  s.cases.nurse.host.configured = true
  await seed(page, s)
  await visit(page, 'gifts')
  await ph(page).locator('.gift-project').click()
  await expect(page).toHaveURL(/case=nurse&role=coordinator&page=workspace/)
  await expect(ph(page)).toContainText('统筹者：唐薇')
})
test('confirmed ceremony never accidentally shows the editable preview', async ({ page }) => {
  const s = prepared()
  s.cases.teacher.previewing = true
  s.cases.teacher.host.name = '尚未确认的改名'
  s.cases.teacher.host.address = '尚未确认的称呼'
  await seed(page, s)
  await visit(page, 'ceremony', 'coordinator')
  await expect(page.locator('.frame-wrap')).toContainText('仪式版本 V1')
  await expect(page.locator('.frame-wrap')).not.toContainText('尚未确认的称呼')
})
test('person card, relation editing and records open the intended recipient', async ({ page }) => {
  await visit(page, 'people')
  await ph(page).locator('.person-card').filter({ hasText: '周老师' }).click()
  await expect(page).toHaveURL(/case=leader.*page=person/)
  await expect(ph(page)).toContainText('周老师')
  await ph(page).locator('.phone-tabs').getByRole('button', { name: '我的', exact: true }).click()
  await ph(page).getByRole('button', { name: '与我参与过的人的关系', exact: true }).click()
  await ph(page).locator('.relationship-row').filter({ hasText: '陈老师' }).click()
  await ph(page).getByLabel('主要关系', { exact: true }).selectOption('friend')
  await ph(page).getByRole('button', { name: '完成', exact: true }).click()
  expect(
    (await state(page)).cases.teacher.connections[datasets.teacher.authors[0].id].primary,
  ).toBe('friend')
  expect((await state(page)).cases.leader.draft.primary).not.toBe('friend')
})
test('record editing and withdrawal dialogs save to the selected item', async ({ page }) => {
  await visit(page, 'records')
  await ph(page).getByLabel('按内容类型筛选', { exact: true }).selectOption('story')
  const cards = ph(page).locator('.record-copy')
  await cards.first().click()
  await page.getByRole('dialog').getByRole('button', { name: '编辑内容与用途' }).click()
  await page
    .getByRole('dialog')
    .getByRole('textbox', { name: '我的内容' })
    .fill('核实修改后的故事正文。')
  await page.getByRole('dialog').getByRole('button', { name: '保存修改' }).click()
  await cards.first().click()
  await expect(page.getByRole('dialog')).toContainText('核实修改后的故事正文。')
  await page.getByRole('dialog').getByRole('button', { name: '撤回这项内容' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '确认撤回' }).click()
  await expect(ph(page)).not.toContainText('核实修改后的故事正文。')
})
test('photo sorting, AI story apply and undo, browser back remain consistent', async ({ page }) => {
  await visit(page, 'organize', 'coordinator')
  const first = ph(page).locator('.manage-photo').first()
  const text = await first.locator('p').innerText()
  await first.getByRole('button', { name: /后移/ }).click()
  await expect(ph(page).locator('.manage-photo').nth(1)).toContainText(text)
  await visit(page, 'stories')
  await example(page)
  const body = ph(page).getByLabel('故事1正文', { exact: true })
  const original = await body.inputValue()
  await ph(page).locator('.ai-button').first().click()
  await page.getByRole('dialog').getByRole('button', { name: '使用整理后的文字' }).click()
  await expect(body).not.toHaveValue(original)
  await ph(page)
    .getByRole('button', { name: /恢复原文|还原原文|撤销整理/ })
    .click()
  await expect(body).toHaveValue(original)
  await ph(page)
    .locator('.phone-tabs')
    .getByRole('button', { name: '我的礼物', exact: true })
    .click()
  await page.goBack()
  await expect(page).toHaveURL(/page=stories/)
  await expect(body).toHaveValue(original)
})

test('Xiaoxu offers per-field suggestions without overwriting and supports undo', async ({
  page,
}) => {
  await visit(page, 'greeting')
  const field = ph(page).getByLabel('近况短话', { exact: true })
  await field.fill('其实呢今天    看到了花')
  await ph(page).getByRole('button', { name: '小叙帮我优化：近况短话', exact: true }).click()
  await expect(field).toHaveValue('其实呢今天    看到了花')
  await ph(page).getByRole('button', { name: '更简洁', exact: true }).click()
  await expect(ph(page).getByLabel('小叙建议文字', { exact: true })).toHaveValue('今天 看到了花。')
  await ph(page).getByRole('button', { name: '采用这版文字', exact: true }).click()
  await expect(field).toHaveValue('今天 看到了花。')
  await ph(page).getByRole('button', { name: '撤销优化', exact: true }).click()
  await expect(field).toHaveValue('其实呢今天    看到了花')
})
test('Xiaoxu handles empty writing, stale suggestions and each photo independently', async ({
  page,
}) => {
  await visit(page, 'greeting')
  await ph(page).getByRole('button', { name: '小叙帮我优化：近况短话', exact: true }).click()
  await expect(ph(page)).toContainText('可以先写一句最想说的话')
  await expect(ph(page).getByRole('button', { name: '采用这版文字' })).toHaveCount(0)
  await visit(page, 'photos')
  await example(page)
  const first = ph(page).getByLabel('照片1说明', { exact: true })
  const second = ph(page).getByLabel('照片2说明', { exact: true })
  const original = await second.inputValue()
  await first.fill('那天下午    我们在一起')
  await ph(page).getByRole('button', { name: '小叙帮我优化：照片1说明', exact: true }).click()
  await first.fill('我又加了一句')
  await expect(ph(page).getByRole('button', { name: '采用这版文字', exact: true })).toBeDisabled()
  await expect(second).toHaveValue(original)
})
test('Xiaoxu accompanies profile, stories, organizer bio, letter and record editors', async ({
  page,
}) => {
  for (const p of ['profile', 'stories', 'wishes', 'host', 'letter', 'records']) {
    await visit(page, p, ['host', 'letter'].includes(p) ? 'coordinator' : 'contributor')
    if (p === 'stories') await example(page)
    if (p === 'wishes')
      await ph(page).getByRole('button', { name: '自己写一句', exact: true }).click()
    if (p === 'host') await ph(page).getByRole('button', { name: '下一步', exact: true }).click()
    if (p === 'letter') await ph(page).getByRole('button', { name: '小叙整理第一版' }).click()
    if (p === 'records') {
      await ph(page).locator('.record-copy').first().click()
      await page.getByRole('dialog').getByRole('button', { name: '编辑内容与用途' }).click()
      await expect(page.getByRole('dialog').locator('.xiaoxu-invite')).toHaveCount(1)
    } else expect(await ph(page).locator('.xiaoxu-invite').count()).toBeGreaterThan(0)
  }
})
