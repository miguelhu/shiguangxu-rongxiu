import { test, expect } from '@playwright/test'

test('fresh shared link selects the requested case and survives reload', async ({ page }) => {
  await page.goto('?case=nurse&role=contributor&page=welcome')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sgx-rongxiu-miniapp-extract-v1')!).caseId)).toBe('nurse')
  await page.reload()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sgx-rongxiu-miniapp-extract-v1')!).caseId)).toBe('nurse')
})

test('subdirectory build serves its own photos without main-site assets', async ({ page }) => {
  await page.route('**/images/**', route => route.request().url().includes('/mini-program-showcase/images/') ? route.continue() : route.abort())
  await page.goto('?case=teacher&role=contributor&page=welcome')
  const images = page.locator('img')
  expect(await images.count()).toBeGreaterThan(0)
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    expect(await image.getAttribute('src')).not.toMatch(/^https?:\/\/[^/]+\/images\//)
  }
})

test('contributor and coordinator pages render without runtime or resource errors', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', e => failures.push(e.message))
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`) })
  for (const name of ['welcome', 'identity', 'impressions', 'photos', 'stories', 'wishes', 'preview', 'board', 'people', 'messages', 'send', 'greeting', 'entry', 'host', 'gifts', 'workspace', 'board_manage', 'invite_manage', 'review_photos', 'review_stories', 'review_wishes', 'letter', 'handover', 'me']) {
    await page.goto(`?case=teacher&page=${name}`)
    await expect(page.locator('body')).not.toBeEmpty()
    await expect(page.locator('.phone')).toBeVisible()
  }
  expect(failures).toEqual([])
})
