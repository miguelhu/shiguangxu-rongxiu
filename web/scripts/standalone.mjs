import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
let html = await readFile(resolve(dist, 'index.html'), 'utf8')
const jsTag = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)
const cssTag = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
if (!jsTag || !cssTag) throw new Error('Missing built JavaScript or CSS bundle')
const js = await readFile(resolve(dist, jsTag[1].replace(/^\.\//, '')), 'utf8')
const css = await readFile(resolve(dist, cssTag[1].replace(/^\.\//, '')), 'utf8')
const images = {}
async function embed(directory) {
  for (const item of await readdir(resolve(dist, directory), { withFileTypes: true })) {
    const name = `${directory}/${item.name}`
    if (item.isDirectory()) {
      await embed(name)
      continue
    }
    const mime = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.svg': 'image/svg+xml',
    }[name.slice(name.lastIndexOf('.'))]
    if (mime)
      images[name] =
        `data:${mime};base64,${(await readFile(resolve(dist, name))).toString('base64')}`
  }
}
await embed('images')
await embed('audio')
html = html.replace(cssTag[0], () => `<style>${css}</style>`)
html = html.replace(
  jsTag[0],
  () =>
    `<script>window.__DEMO_MEDIA__=${JSON.stringify(images)};</script><script type="module">${js.replaceAll('</script', '<\\/script')}</script>`,
)
const favicon = await readFile(resolve(dist, 'favicon.svg'))
html = html.replace(
  'href="./favicon.svg"',
  `href="data:image/svg+xml;base64,${favicon.toString('base64')}"`,
)
const destination = resolve(root, 'presentation')
await mkdir(destination, { recursive: true })
const file = resolve(destination, '拾光叙-荣休礼互动演示.html')
await writeFile(file, html)
console.log(`Standalone demo: ${file} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`)
