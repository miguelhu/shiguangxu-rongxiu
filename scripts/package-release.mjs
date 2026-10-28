import { execFileSync } from 'node:child_process'
import { mkdirSync, copyFileSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = process.argv[2]
if (!/^v\d{4}\.\d{2}\.\d{2}(?:[.-][\w.-]+)?$/.test(version || '')) throw new Error('Usage: node scripts/package-release.mjs v2026.10.28')
const out = resolve(root, 'packages', version)
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const groups = ['miniapp', 'web', 'elder-app', 'photoframe', 'frame', 'docs']
mkdirSync(out, { recursive: true })
const manifest = { version, revision, packages: [] }
for (const app of groups) {
  const name = `shiguangxu-${app === 'frame' ? 'legacy-frame' : app}-${version}`
  const stage = resolve(out, name)
  rmSync(stage, { recursive: true, force: true })
  const selected = files.filter(f => f.startsWith(app + '/') && !/(^|\/)(node_modules|dist|presentation|output|test-results|playwright-report|\.git)(\/|$)/.test(f) && !/\.(zip|log|pem)$|(^|\/)\.env/.test(f))
  selected.push('docs/RELEASE-HANDOFF.md')
  if (['miniapp', 'web'].includes(app)) selected.push('scripts/serve-frame.mjs')
  for (const f of new Set(selected)) {
    const target = resolve(stage, f)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(resolve(root, f), target)
  }
  writeFileSync(resolve(stage, 'START-HERE.md'), `# 拾光叙 ${app} ${version}\n\n源码提交：${revision}\n\n请先阅读 docs/RELEASE-HANDOFF.md。${app === 'docs' ? '此包仅包含产品及工程文档。' : `进入 ${app} 目录，使用 Node.js 22 LTS，执行 npm ci，再执行 npm run dev。构建执行 npm run build。`}\n\n保持解压后的目录结构。无需克隆整个仓库。此包不含其他端、Git 历史、node_modules 或私人评审文件。\n`)
  const archive = resolve(out, name + '.zip')
  rmSync(archive, { force: true })
  execFileSync('zip', ['-qr', archive, basename(stage)], { cwd: out })
  const bytes = readFileSync(archive)
  manifest.packages.push({ app, file: basename(archive), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  rmSync(stage, { recursive: true, force: true })
}
writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(resolve(out, 'SHA256SUMS.txt'), manifest.packages.map(p => `${p.sha256}  ${p.file}`).join('\n') + '\n')
copyFileSync(resolve(root, 'docs/RELEASE-HANDOFF.md'), resolve(out, 'RELEASE-HANDOFF.md'))
console.log(JSON.stringify(manifest, null, 2))
