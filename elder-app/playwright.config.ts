import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'./tests',use:{baseURL:'http://127.0.0.1:5230',viewport:{width:390,height:844},permissions:['microphone'],launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}},webServer:{command:'npm run dev',url:'http://127.0.0.1:5230',reuseExistingServer:true}})
