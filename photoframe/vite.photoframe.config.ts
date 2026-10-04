import { readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Keep public/ media inside the /photoframe deployment directory, including
// URLs assembled from template strings in the prototype source.
function publicMediaBase(): Plugin {
  let base = '/'
  const names = readdirSync(new URL('./public', import.meta.url))
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const assetPath = new RegExp(`(['"\\x60(])/(${names.join('|')})(?=[/?!'"\\x60)])`, 'g')
  return {
    name: 'public-media-base',
    enforce: 'pre',
    configResolved(config) { base = config.base },
    transform(code, id) {
      if (!id.includes('/src/') || !/\.(tsx?|css)$/.test(id)) return null
      return { code: code.replace(assetPath, (_match, quote, name) => `${quote}${base}${name}`), map: null }
    },
  }
}

export default defineConfig({
  base: '/photoframe/',
  plugins: [publicMediaBase(), react()],
  server: { host: true },
})
