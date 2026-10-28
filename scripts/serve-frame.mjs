import { createReadStream, existsSync, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = process.env.SGX_FRAME_DIST || fileURLToPath(new URL('../photoframe/dist/', import.meta.url))
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.mp4':'video/mp4', '.m4a':'audio/mp4', '.wav':'audio/wav' }
export default function framePreview() {
  return { name:'local-photoframe', configureServer(server) {
    server.middlewares.use('/photoframe', (req,res,next) => {
      let name
      try { name = decodeURIComponent((req.url || '/').split('?')[0]) } catch {res.statusCode=400;res.end();return}
      const path = resolve(root, '.' + (name === '/' ? '/index.html' : name))
      if (!path.startsWith(resolve(root) + sep)) {res.statusCode=403;res.end();return}
      if (!existsSync(path) || !statSync(path).isFile()) {res.statusCode=404;res.end('Build the current photoframe with npm run build:photoframe, or set SGX_FRAME_DIST to its dist directory.');return}
      res.setHeader('Content-Type', types[path.slice(path.lastIndexOf('.'))] || 'application/octet-stream')
      createReadStream(path).pipe(res)
    })
  } }
}
