import {test,expect} from '@playwright/test'
test('direct sharing remains reachable above the dock',async({page})=>{
 await page.goto('/app-plus/')
 await page.getByRole('button',{name:'打开创作菜单'}).click()
 await page.getByRole('dialog').getByRole('button',{name:/发个日常/}).click()
 await page.locator('.daily-camera input[type=file]').setInputFiles('public/images/t-p03.jpg')
 await page.getByRole('button',{name:'下一步，选择收件人'}).click()
 await page.getByRole('button',{name:/陈晓禾/}).click()
 await expect(page.getByRole('button',{name:'确认发送（演示）'})).toHaveCount(0)
 await page.getByRole('button',{name:'发送',exact:true}).click()
 await expect(page.getByText('已发送')).toBeVisible()
})
test('history keeps its topic and allows continued chat',async({page})=>{
 await page.goto('/app-plus/')
 await page.getByRole('button',{name:'打开聊天历史'}).click()
 await page.locator('.history-item').first().click()
 await expect(page.locator('.active-chat-topic')).toHaveText('老照片，慢慢聊')
 await page.getByRole('button',{name:'切换打字'}).click()
 await page.getByRole('textbox',{name:'给小叙留言'}).fill('那天我们还一起吃了饭')
 await page.getByRole('button',{name:'发送问题'}).click()
 await expect(page.locator('.agent-message.user').last()).toContainText('一起吃了饭')
 for(const width of [360,390,500]){
  await page.setViewportSize({width,height:844})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(await page.locator('.plus-top').evaluate(e=>e.getBoundingClientRect().y)).toBe(0)
 }
})
