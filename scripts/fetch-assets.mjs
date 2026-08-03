/**
 * Vendors the generated media from the Higgsfield CDN into public/assets/,
 * so the site is fully self-contained. Run on any machine with open egress:
 *
 *   npm run fetch-assets
 *
 * The site works without this step too — it falls back to the CDN URLs.
 */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { get } from 'node:https'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = (
  await import(join(root, 'src/assets.manifest.json'), { with: { type: 'json' } })
).default

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`${res.statusCode} for ${url}`))
        return
      }
      const out = createWriteStream(dest)
      res.pipe(out)
      out.on('finish', () => out.close(resolve))
      out.on('error', reject)
    }).on('error', reject)
  })

for (const [key, { local, remote }] of Object.entries(manifest)) {
  if (!remote) {
    console.log(`~ ${key}: no remote URL yet, skipped`)
    continue
  }
  const dest = join(root, 'public', local)
  mkdirSync(dirname(dest), { recursive: true })
  if (existsSync(dest)) {
    console.log(`= ${key}: already vendored (${local})`)
    continue
  }
  process.stdout.write(`↓ ${key} → public${local} … `)
  try {
    await download(remote, dest)
    console.log('ok')
  } catch (err) {
    console.log(`failed (${err.message}) — site will use the CDN URL`)
  }
}
