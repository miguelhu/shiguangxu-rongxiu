import {test,expect} from '@playwright/test'
test('personal QR has its own page and exports an image',async({page})=>{
 await page.goto('/')
 await page.getByRole('button',{name:'打开聊天历史'}).click()
 await expect(page.getByRole('button',{name:'新话题',exact:true})).toBeVisible()
 await expect(page.getByText('我的聊天',{exact:true})).toHaveCount(0)
 await page.getByRole('button',{name:'添加亲友',exact:true}).click()
 await page.getByRole('button',{name:/我的二维码/}).click()
 await expect(page.locator('.personal-qr svg')).toBeVisible()
 const download=page.waitForEvent('download')
 await page.getByRole('button',{name:'保存二维码'}).click()
 expect((await download).suggestedFilename()).toMatch(/亲友二维码.png$/)
 await page.getByRole('button',{name:'返回',exact:true}).click()
 await page.getByRole('button',{name:'新的朋友',exact:true}).click()
 await expect(page.getByText('还没有新的朋友申请')).toBeVisible()
})
test('voice composer stays in one row on both app routes',async({page})=>{
 for(const route of ['/','/app-plus/']){
  await page.goto(route)
  await expect(page.locator('.agent-input-tools')).toHaveCount(0)
  const row=page.locator('.chat-composer')
  await expect(row).toBeVisible()
  const bounds=await row.locator(':scope > button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return r.top+r.height/2}))
  expect(Math.max(...bounds)-Math.min(...bounds)).toBeLessThan(4)
 }
})
