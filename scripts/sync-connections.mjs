import {mkdirSync,copyFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {resolve,dirname} from 'node:path'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
for(const app of ['elder-app','miniapp','web']){const dest=resolve(root,app,'src/shared');mkdirSync(dest,{recursive:true});for(const name of ['connections.ts','ConnectionPanel.tsx','connections.css'])copyFileSync(resolve(root,'shared',name),resolve(dest,name))}
