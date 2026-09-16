import { test, expect, Page } from '@playwright/test'
import {
  initial,
  STORAGE,
  newCase,
  available,
  ceremonyBlocks,
  orderedPhotos,
} from '../src/v6/model'
import { cases, datasets } from '../src/v6/data'
import {
  freezeVersion,
  generateLetter,
  stageEnabled,
  lifecycle,
  canFreeze,
} from '../src/v6/workflow'
const phone = (p: Page) => p.locator('.phone')
async function visit(p: Page, page = 'invite', role = 'contributor') {
  await p.goto(`/?case=teacher&role=${role}&page=${page}&mode=experience`)
}
async function state(p: Page) {
  return p.evaluate((k) => JSON.parse(localStorage.getItem(k)!), STORAGE)
}
async function example(p: Page) {
  await phone(p).getByRole('button', { name: '示例 ?', exact: true }).click()
  await phone(p)
    .getByRole('button', { name: /使用.+的这一步示例/ })
    .click()
}
function prepared() {
  const s = initial(),
    cs = s.cases.teacher
  cs.review = { photos: true, stories: true, wishes: true, previewed: true }
  cs.letter = generateLetter('teacher', cs)
  cs.letter.confirmed = true
  cs.version = freezeVersion('teacher', cs)
  cs.previewing = false
  return s
}
async function seed(p: Page, s = prepared()) {
  await p.addInitScript(({ s, k }) => localStorage.setItem(k, JSON.stringify(s)), { s, k: STORAGE })
}
test('14 fixed stages with contributor preview, coordinator confirmation and unbound activation', () => {
  const s = newCase('teacher')
  expect(lifecycle).toHaveLength(14)
  expect(lifecycle.some((n) => n.label === 'AI祝福信')).toBe(false)
  expect(stageEnabled(6, 'contributor', s)).toBe(true)
  expect(stageEnabled(7, 'contributor', s)).toBe(false)
  expect(stageEnabled(8, 'recipient', s)).toBe(true)
  expect(stageEnabled(9, 'recipient', s)).toBe(false)
})
test('welcome shows meaning, time, deadline and host; starts identity', async ({ page }) => {
  await visit(page)
  await expect(phone(page)).toContainText('大约 10 分钟')
  await expect(phone(page)).toContainText('共创截止 ·')
  await expect(phone(page)).toContainText('清华大学')
  await phone(page)
    .getByRole('button', { name: /^(开始|继续)留下心意$/, exact: true })
    .click()
  await expect(phone(page).getByLabel('主要关系', { exact: true })).toHaveValue('student')
  await expect(
    page.getByRole('navigation', { name: '礼物生命周期' }).getByRole('button'),
  ).toHaveCount(14)
})
test('three bottom actions, top messages and personal gift entry', async ({ page }) => {
  await visit(page, 'me')
  await expect(phone(page).locator('.phone-tabs button')).toHaveText([
    '我参与的人',
    '送时光',
    '我的',
  ])
  await expect(phone(page).locator('.embedded-gifts')).toHaveCount(0)
  await expect(phone(page).getByRole('button', { name: '设置', exact: true })).toBeVisible()
  await phone(page).getByRole('button', { name: '消息', exact: true }).click()
  await expect(phone(page).locator('.notification-card').first()).toBeVisible()
  await expect(phone(page)).not.toContainText('服务号示意')
  await expect(phone(page).getByRole('switch')).toHaveCount(0)
})
test('five-step initiation removes repeated fields and switches', async ({ page }) => {
  await visit(page, 'entry')
  await phone(page)
    .getByRole('button', { name: /代表单位或团队主办/ })
    .click()
  await expect(phone(page)).not.toContainText('我以什么身份来张罗')
  await expect(phone(page).getByLabel('我的经办角色')).toBeVisible()
  await phone(page).getByRole('button', { name: '下一步', exact: true }).click()
  await expect(phone(page).getByLabel('人物介绍（用于共创欢迎页）', { exact: true })).toBeVisible()
  await expect(phone(page)).not.toContainText('添加介绍照片')
  await expect(phone(page).getByRole('switch')).toHaveCount(0)
  await phone(page).getByRole('button', { name: '下一步', exact: true }).click()
  await expect(phone(page).getByLabel('单位或团队名称')).toBeVisible()
  await expect(phone(page).getByRole('switch')).toHaveCount(0)
  await phone(page).getByRole('button', { name: '下一步', exact: true }).click()
  await expect(phone(page)).not.toContainText('相聚时再打开惊喜')
  await phone(page).getByRole('button', { name: '下一步', exact: true }).click()
  await phone(page).getByRole('button', { name: '确认并生成邀请' }).click()
  expect((await state(page)).cases.teacher.host.configured).toBe(true)
})
test('photo date hierarchy, ten limit and dictation is text only', async ({ page }) => {
  await visit(page, 'photos')
  await example(page)
  await phone(page).getByLabel('照片1年份', { exact: true }).selectOption('2016')
  await phone(page).getByLabel('照片1月份', { exact: true }).selectOption('05')
  await phone(page).getByLabel('照片1日期', { exact: true }).selectOption('')
  await phone(page).locator('.dictation').first().getByRole('button').click()
  await phone(page).getByRole('button', { name: '模拟一次口述识别' }).click()
  await phone(page).getByRole('button', { name: '确认文字，再请小叙整理' }).click()
  await expect(phone(page).getByLabel('照片1说明', { exact: true })).toContainText('站在一起')
  expect((await state(page)).cases.teacher.assets[0].date).toBe('2016-05')
  await expect(phone(page).locator('audio')).toHaveCount(0)
  await expect(phone(page).locator('select[aria-label*=时间精度]')).toHaveCount(0)
})
test('illustrated topic cards create one story then reopen it; Xiaoxu preserved', async ({
  page,
}) => {
  await visit(page, 'stories')
  await expect(phone(page).locator('.topic-gallery img')).toHaveCount(3)
  await phone(page).locator('.topic-gallery button').first().click()
  await expect(phone(page).locator('.story-editor')).toHaveCount(1)
  await phone(page).locator('.topic-gallery button').first().click()
  await expect(phone(page).locator('.story-editor')).toHaveCount(1)
  await expect(phone(page).locator('.story-editor .xiaoxu-invite')).toHaveCount(2)
  await expect(phone(page).locator('input[type=file]')).toHaveCount(0)
})
test('wishes three presets, rotate, replace with custom, recorder simplified', async ({ page }) => {
  await visit(page, 'wishes')
  await expect(phone(page).locator('.wish-presets button')).toHaveCount(3)
  const t = await phone(page).locator('.wish-presets button').first().innerText()
  await phone(page).getByRole('button', { name: '换一批 ↻' }).click()
  expect(await phone(page).locator('.wish-presets button').first().innerText()).not.toBe(t)
  await phone(page).getByRole('button', { name: '自己写一句' }).click()
  await expect(phone(page).locator('.wish-presets')).toHaveCount(0)
  await expect(phone(page).getByLabel('自定义祝福', { exact: true })).toBeVisible()
  await expect(phone(page).getByRole('button', { name: /开始录音/ })).toBeVisible()
  await expect(phone(page)).not.toContainText('上传一段声音')
  await expect(phone(page)).not.toContainText('使用可试听的演示声音')
})
test('four-step submission and unfinished person resumes current step', async ({ page }) => {
  await visit(page)
  await phone(page)
    .getByRole('button', { name: /^(开始|继续)留下心意$/, exact: true })
    .click()
  await phone(page)
    .getByRole('button', { name: /^(开始|继续)留下心意$/, exact: true })
    .click()
  await example(page)
  await phone(page).getByRole('button', { name: '下一步', exact: true }).click()
  await phone(page).locator('.phone-tabs').getByRole('button', { name: '我参与的人' }).click()
  await phone(page).getByRole('button', { name: '未完成', exact: true }).click()
  await phone(page).locator('.person-card').filter({ hasText: '陈老师' }).click()
  await expect(page).toHaveURL(/page=welcome/)
  await phone(page).getByRole('button', { name: '继续留下心意', exact: true }).click()
  await expect(page).toHaveURL(/page=photos/)
  for (const p of ['photos', 'stories', 'wishes']) {
    await example(page)
    await phone(page)
      .getByRole('button', { name: p === 'wishes' ? '预览这份心意' : '下一步', exact: true })
      .click()
  }
  await phone(page).getByRole('button', { name: '确认送出', exact: true }).click()
  expect((await state(page)).cases.teacher.submission).toBe(1)
})
test('direct review pages, no priority controls, drag sorting', async ({ page }) => {
  await visit(page, 'review_photos', 'coordinator')
  await expect(phone(page).locator('.segmented')).toHaveCount(0)
  await expect(phone(page)).not.toContainText('设为重点')
  const rows = phone(page).locator('.reorder-item')
  const first = await rows.first().getAttribute('data-order-id')
  await rows.first().locator('.drag-handle').dragTo(rows.nth(1))
  expect((await state(page)).cases.teacher.photoOrder[1]).toBe(first)
  await phone(page).getByRole('button', { name: '照片检查完成，去看故事' }).click()
  await expect(phone(page)).not.toContainText('设为重点')
  const firstStory = await rows.first().getAttribute('data-order-id')
  await rows.first().locator('.drag-handle').focus()
  await page.keyboard.press('ArrowDown')
  expect((await state(page)).cases.teacher.storyOrder[1]).toBe(firstStory)
})
test('full coordinator pipeline, version confirmed then recipient opens and notifies', async ({
  page,
}) => {
  await visit(page, 'review_photos', 'coordinator')
  await phone(page).getByRole('button', { name: '照片检查完成，去看故事' }).click()
  await phone(page).getByRole('button', { name: '故事已确认，去看祝福' }).click()
  await phone(page).getByRole('button', { name: '祝福检查完成，整理总信' }).click()
  await phone(page).getByRole('button', { name: /小叙整理第一版/ }).click()
  const editor = phone(page).getByLabel('大家写给你的一封信', { exact: true })
  await editor.fill((await editor.inputValue()) + '\n\n我们会常常来看您。')
  await phone(page).getByRole('button', { name: '确认这封信', exact: true }).click()
  await phone(page).getByRole('button', { name: '预览相框成品', exact: true }).click()
  await phone(page).getByRole('button', { name: '打开相框成品预览' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '我已检查完整成品' }).click()
  await phone(page).getByRole('button', { name: '进入版本确认' }).click()
  await phone(page).getByRole('button', { name: '确认仪式版本', exact: true }).click()
  expect((await state(page)).cases.teacher.shareReady).toBe(false)
  await page.getByRole('button', { name: '长者体验', exact: true }).click()
  await expect(page.locator('.brand-activation')).toBeVisible()
  await page.getByRole('button', { name: '扫码绑定成功（演示）' }).click()
  await page.getByRole('button', { name: '打开看看', exact: true }).click()
  expect((await state(page)).cases.teacher.shareReady).toBe(true)
  await page.getByRole('button', { name: '大家写给你的一封信', exact: true }).click()
  await expect(page.locator('.letter-paper')).toContainText('我们会常常来看您。')
  await expect(page.locator('.frame-screen')).toBeVisible()
})
test('frozen version unchanged by onsite and wish exclusions affect next version only', () => {
  const s = prepared().cases.teacher
  const before = ceremonyBlocks('teacher', s).length
  const b = available('teacher', s).find((b) => b.kind === 'wish')!
  s.excludedWishes = [b.id]
  s.blocks.push({ ...b, id: 'onsite', source: 'onsite' })
  expect(ceremonyBlocks('teacher', s)).toHaveLength(before)
  expect(s.version?.blocks.some((x) => x.id === 'onsite')).toBe(false)
  expect(orderedPhotos('teacher', s, ceremonyBlocks('teacher', s)).length).toBe(18)
})
test('no prior-attendance question at onsite; known participant skips identity', async ({
  page,
}) => {
  const s = initial()
  s.cases.teacher.submission = 1
  await seed(page, s)
  await visit(page, 'guest')
  await expect(page).toHaveURL(/page=onsite/)
  await expect(phone(page)).not.toContainText('我第一次参与')
  await expect(phone(page)).not.toContainText('我之前参与过')
})
test('all five cases, modes and mobile remain usable', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  for (const c of cases) {
    await page.goto(`/?case=${c.id}&page=invite&role=contributor`)
    await expect(phone(page)).toContainText('大约 10 分钟')
  }
  await page.getByRole('button', { name: '多端对照', exact: true }).click()
  await expect(page.locator('.comparison-grid')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '角色体验', exact: true }).click()
  await expect(phone(page)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  )
  expect(errors).toEqual([])
})

test('send moment has two steps and independent multi-recipient delivery', async ({ page }) => {
  await visit(page, 'send')
  await phone(page).locator('.dm-photo-picker button').first().click()
  await phone(page).getByLabel('送时光短话', { exact: true }).fill('今天看到一棵树，想和您分享。')
  await phone(page).getByRole('button', { name: '下一步 · 选择收件人' }).click()
  await phone(page).locator('.dm-recipient').nth(0).click()
  await phone(page).locator('.dm-recipient').nth(1).click()
  await phone(page).getByRole('button', { name: '送给2位朋友 →' }).click()
  await expect(phone(page)).toContainText('这份时光，已经送出')
  const s = await state(page)
  for (const id of ['teacher', 'leader']) {
    expect(s.cases[id].blocks.at(-1).body).toBe('今天看到一棵树，想和您分享。')
    expect(s.cases[id].blocks.at(-1).photoIds).toHaveLength(1)
    expect(s.cases[id].delivery).toBe('waiting')
  }
  expect(s.cases.teacher.blocks.at(-1).id).not.toBe(s.cases.leader.blocks.at(-1).id)
})
test('selected lifecycle stage survives refreshing shared workspace page', async ({ page }) => {
  await page.goto('/?case=teacher&role=coordinator&page=workspace&stage=2')
  await expect(page.locator('.sidebar button.active')).toContainText('共创欢迎')
  await page.reload()
  await expect(page.locator('.sidebar button.active')).toContainText('共创欢迎')
})

test('people completion tabs welcome gate, settings and one photo per row', async ({ page }) => {
  const s = initial()
  s.cases.teacher.contributionStarted = true
  s.cases.teacher.lastContributionPage = 'photos'
  await seed(page, s)
  await visit(page, 'people')
  await expect(phone(page).locator('.completion-tabs button')).toHaveText(['已完成', '未完成'])
  await phone(page).getByRole('button', { name: '未完成', exact: true }).click()
  await expect(phone(page).getByPlaceholder('找一位参与过的人')).toHaveCount(0)
  await expect(phone(page).locator('.people-list .person-card')).toHaveCount(1)
  await phone(page).locator('.people-list .person-card').click()
  await expect(page).toHaveURL(/page=welcome/)
  await phone(page).getByRole('button', { name: '继续留下心意', exact: true }).click()
  await example(page)
  const cards = phone(page).locator('.photo-edit')
  expect(await cards.count()).toBeGreaterThan(1)
  const a = await cards.nth(0).boundingBox(),
    b = await cards.nth(1).boundingBox()
  expect(Math.abs(a!.x - b!.x)).toBeLessThan(2)
  expect(b!.y).toBeGreaterThan(a!.y + a!.height)
  await phone(page)
    .locator('.phone-tabs')
    .getByRole('button', { name: '我的', exact: true })
    .click()
  await expect(phone(page).locator('.embedded-gifts .gift-project')).toHaveCount(0)
  await expect(phone(page).getByRole('button', { name: '个人资料', exact: true })).toHaveCount(0)
  await phone(page).getByRole('button', { name: '设置', exact: true }).click()
  await phone(page).getByRole('button', { name: '个人资料', exact: true }).click()
  await expect(page).toHaveURL(/page=profile/)
  await phone(page).getByRole('button', { name: '返回', exact: true }).click()
  await expect(page).toHaveURL(/page=settings/)
})

test('coordinator gifts only and collected content preview notification', async ({ page }) => {
  await visit(page, 'me', 'coordinator')
  await expect(phone(page).locator('.embedded-gifts .gift-project')).toHaveCount(5)
  await expect(phone(page)).not.toContainText('共创中')
  await visit(page, 'messages')
  await phone(page).locator('.collection-notice').click()
  await expect(page.getByRole('dialog')).toContainText('收集完成')
  await expect(page.getByRole('dialog').locator('.frame-screen')).toBeVisible()
  await visit(page, 'wishes')
  await expect(phone(page).locator('.xiaoxu-voice-template')).toContainText('你也可以这么说')
  await expect(phone(page)).not.toContainText('不知道说什么？')
})

test('brand activation reveals no recipient before binding and requires demo verification code', async ({
  page,
}) => {
  await visit(page, 'activate', 'recipient')
  const panel = page.locator('.brand-activation')
  await expect(panel).not.toContainText('陈老师')
  await expect(panel).not.toContainText('清华')
  await expect(panel.locator('.binding-methods')).toBeVisible()
  await panel.getByRole('button', { name: '确认绑定', exact: true }).click()
  await expect(panel).toContainText('请填写有效的手机号')
  await panel.getByLabel('手机号', { exact: true }).fill('13800138000')
  await panel.getByRole('button', { name: '获取验证码' }).click()
  await panel.getByLabel('验证码', { exact: true }).fill('123456')
  await panel.getByRole('button', { name: '确认绑定', exact: true }).click()
  await expect(panel).toContainText('相框已连接')
  await expect(panel.getByRole('button', { name: '打开看看' })).toBeDisabled()
})
test('generated invitation has QR and forwarding controls; coordinator account has statistics', async ({
  page,
}) => {
  await visit(page, 'invite_manage', 'coordinator')
  await phone(page).getByRole('button', { name: '生成邀请卡', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.invite-qr')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '转发邀请卡', exact: true })).toBeVisible()
  await expect(dialog.getByLabel('邀请链接')).toHaveValue(/case=teacher/)
  await visit(page, 'me', 'coordinator')
  await expect(phone(page).locator('.stats-primary strong')).toHaveText('5')
  await expect(phone(page).locator('.stats-grid')).toContainText('已完成')
})

test('invitation card exports a real PNG for forwarding', async ({ page }) => {
  await visit(page, 'invite_manage', 'coordinator')
  await phone(page).getByRole('button', { name: '生成邀请卡', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('dialog').getByRole('button', { name: '保存邀请卡图片' }).click()
  const d = await download
  expect(d.suggestedFilename()).toMatch(/\.png$/)
  const stream = await d.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk)
  const bytes = Buffer.concat(chunks)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(bytes.length).toBeGreaterThan(50000)
})
