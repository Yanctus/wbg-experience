/**
 * Every remote asset the site uses, in one place.
 *
 * The generated media lives on the Higgsfield CDN. Each entry can be
 * vendored into public/assets/ with `npm run fetch-assets`; the site always
 * prefers the local copy and falls back to the CDN URL, so the page works
 * both before and after vendoring. hero-placeholder.jpg is committed to the
 * repo and needs no network at all.
 */

import manifest from './assets.manifest.json'

export interface RemoteAsset {
  /** Path under public/ when vendored locally. */
  local: string
  /** Canonical CDN source. */
  remote: string
}

export const ASSETS: Record<string, RemoteAsset> = manifest

/**
 * Resolve an asset to a usable URL: the local copy if the dev server / host
 * actually serves it, otherwise the CDN original. Decode-probing (not HEAD)
 * because dev servers answer missing public files with an HTML fallback.
 */
export function resolveImage(key: keyof typeof ASSETS): Promise<string> {
  const { local, remote } = ASSETS[key]
  return new Promise((resolve) => {
    const probe = new Image()
    probe.onload = () => resolve(probe.naturalWidth > 0 ? local : remote)
    probe.onerror = () => resolve(remote)
    probe.src = local
  })
}

/**
 * Resolve a video asset: try the local file first via a ranged fetch (cheap,
 * no full download), fall back to the CDN.
 */
export async function resolveVideo(key: keyof typeof ASSETS): Promise<string> {
  const { local, remote } = ASSETS[key]
  try {
    const res = await fetch(local, { headers: { Range: 'bytes=0-1' } })
    const type = res.headers.get('content-type') ?? ''
    if (res.ok && !type.includes('text/html')) return local
  } catch {
    /* fall through to CDN */
  }
  return remote
}
