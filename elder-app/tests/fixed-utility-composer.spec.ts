import {test,expect} from '@playwright/test'
test('utility input stays at bottom on both routes and viewport sizes',async({page})=>{
 for(const height of [844,600]){await page.setViewportSize({width:390,height})
 for(const route of ['/','/app-plus/']){await page.goto(route)
 await page.evaluate(()=>localStorage.setItem('sgx-reminders-v1',JSON.stringify(Array.from({length:9},(_,i)=>({id:String(i),title:'提醒事项'+i,time:'08:00',date:'',daily:true,paused:false,done:false})))))
 for(const name of ['我的提醒','帮我看看']){await page.getByRole('button',{name:'打开聊天历史'}).click();await page.locator('.drawer-shortcuts').getByRole('button',{name,exact:true}).click()
 const bar=page.locator('.utility-composer');await expect(bar).toBeVisible()
 for(const y of [0,9999]){await page.evaluate(y=>window.scrollTo(0,y),y);const box=await bar.boundingBox();expect(Math.abs(box!.y+box!.height-height)).toBeLessThan(2)}
 }}}
})
